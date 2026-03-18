-- MIGRATION: 03_user_profiles.sql (v2)
-- User Profile System — OPTIMIZED & SECURED
-- STATUS: Depends on 02_assessments.sql (v2)
--
-- CHANGES FROM v1:
-- • Added columns to profiles table: display_name, avatar_url, bio, preferred_industry,
--   assessment_count (denormalised counter), last_assessment_at.
-- • Added increment_profile_assessment_count() trigger on assessments INSERT to keep
--   assessment_count in sync automatically.
-- • Added decrement_profile_assessment_count() trigger on assessments DELETE.
-- • Updated assessments.user_id FK to point to profiles(id) (previously optional,
--   now NOT NULL after this migration).
-- • Removed session_id from assessments (guest sessions no longer supported).
-- • Tightened RLS policies on assessments to rely only on user_id (no session_id fallback).
-- • Added helper functions: get_user_profile(), update_username().
-- • Backfilled assessment_count for existing users.
--
-- PURPOSE:
-- - Creates a profiles table linked one-to-one with auth.users.
-- - Automatically creates a profile when a new user signs up (via trigger on auth.users).
-- - Maintains a denormalised assessment_count for fast dashboard queries.
-- - Provides RLS policies so users can only manage their own profile.
-- - Upgrades the assessments table to fully rely on authenticated users (no guest mode).

-- ============================================
-- 0. Drop existing profiles table and functions (clean slate)
-- ============================================

DROP TABLE IF EXISTS profiles CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'handle_new_user',
        'update_profiles_updated_at_column',
        'get_user_profile',
        'update_username',
        'increment_profile_assessment_count',
        'decrement_profile_assessment_count'
    ];
    func_name text;
    rec record;
BEGIN
    FOREACH func_name IN ARRAY func_names
    LOOP
        FOR rec IN
            SELECT nspname, proname, oidvectortypes(pg_proc.proargtypes) as args
            FROM pg_proc
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE proname = func_name AND nspname = 'public'
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;', rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 1. Create Profiles Table
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  -- ── Identity ─────────────────────────────────────────────────────────────────
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,

  -- ── Optional profile data ─────────────────────────────────────────────────────
  display_name          TEXT,                        -- optional friendly name
  avatar_url            TEXT,                        -- profile picture URL
  bio                   TEXT,                        -- short bio / about
  preferred_industry    TEXT,                        -- user's primary industry interest

  -- ── Denormalised counters (kept in sync via trigger) ─────────────────────────
  assessment_count      INTEGER NOT NULL DEFAULT 0 CHECK (assessment_count >= 0),
  last_assessment_at    TIMESTAMP WITH TIME ZONE,    -- updated on each save

  -- ── Timestamps ───────────────────────────────────────────────────────────────
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  profiles IS
  'User profiles — one-to-one with auth.users. Includes denormalised assessment_count for fast dashboard queries.';
COMMENT ON COLUMN profiles.username IS
  'Unique username chosen at signup';
COMMENT ON COLUMN profiles.display_name IS
  'Optional human-readable display name';
COMMENT ON COLUMN profiles.assessment_count IS
  'Denormalised count of saved assessments — kept in sync by trigger';
COMMENT ON COLUMN profiles.last_assessment_at IS
  'Timestamp of most recent saved assessment';
COMMENT ON COLUMN profiles.preferred_industry IS
  'User-selected default industry for new assessments';

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- 2. Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON profiles;
DROP POLICY IF EXISTS profiles_select_own    ON profiles;
DROP POLICY IF EXISTS profiles_select_by_username ON profiles;
DROP POLICY IF EXISTS profiles_insert_own   ON profiles;
DROP POLICY IF EXISTS profiles_update_own   ON profiles;
DROP POLICY IF EXISTS profiles_delete_own   ON profiles;

-- Anyone can read profiles (needed for username lookups / public pages)
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_insert_policy ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE
  USING      ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY profiles_delete_policy ON profiles
  FOR DELETE USING ((SELECT auth.uid()) = id);

-- ============================================
-- 3. Auto-create Profile on New User (trigger)
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1),
      'user_' || REPLACE(NEW.id::TEXT, '-', '')
    ),
    NOW(), NOW()
  )
  ON CONFLICT (username) DO UPDATE
    SET username = 'user_' || REPLACE(NEW.id::TEXT, '-', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Creates a profile row automatically when a new auth user signs up';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 4. Assessment counter triggers
-- ============================================

-- Increment counter when a new assessment is saved
CREATE OR REPLACE FUNCTION increment_profile_assessment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      assessment_count   = assessment_count + 1,
      last_assessment_at = NOW(),
      updated_at         = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION increment_profile_assessment_count IS 'Increments profiles.assessment_count when an assessment is saved';

DROP TRIGGER IF EXISTS trg_increment_profile_assessment_count ON assessments;
CREATE TRIGGER trg_increment_profile_assessment_count
  AFTER INSERT ON assessments
  FOR EACH ROW EXECUTE FUNCTION increment_profile_assessment_count();

-- Decrement counter when an assessment is deleted
CREATE OR REPLACE FUNCTION decrement_profile_assessment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      assessment_count = GREATEST(0, assessment_count - 1),
      updated_at       = NOW()
    WHERE id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION decrement_profile_assessment_count IS 'Decrements profiles.assessment_count when an assessment is deleted';

DROP TRIGGER IF EXISTS trg_decrement_profile_assessment_count ON assessments;
CREATE TRIGGER trg_decrement_profile_assessment_count
  AFTER DELETE ON assessments
  FOR EACH ROW EXECUTE FUNCTION decrement_profile_assessment_count();

-- ============================================
-- 5. Update assessments table: upgrade FK and RLS
-- ============================================

-- Remove session_id if still present (migrating from v1)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'session_id'
  ) THEN
    DROP INDEX  IF EXISTS idx_assessments_session_id;
    ALTER TABLE assessments DROP COLUMN session_id;
  END IF;
END $$;

-- Delete guest assessments and enforce NOT NULL user_id
DELETE FROM assessments WHERE user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE assessments ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Re-point FK to profiles(id)
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey;
ALTER TABLE assessments ADD CONSTRAINT assessments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Tighten RLS (no more session_id fallback once user_id is NOT NULL)
DROP POLICY IF EXISTS assessments_select_policy ON assessments;
DROP POLICY IF EXISTS assessments_insert_policy ON assessments;
DROP POLICY IF EXISTS assessments_update_policy ON assessments;
DROP POLICY IF EXISTS assessments_delete_policy ON assessments;

CREATE POLICY assessments_select_policy ON assessments
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id OR is_public = true
  );

CREATE POLICY assessments_insert_policy ON assessments
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY assessments_update_policy ON assessments
  FOR UPDATE
  USING      ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY assessments_delete_policy ON assessments
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 6. updated_at trigger for profiles
-- ============================================

CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();

-- ============================================
-- 7. Helper functions
-- ============================================

CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id                  UUID,
  username            TEXT,
  display_name        TEXT,
  avatar_url          TEXT,
  bio                 TEXT,
  preferred_industry  TEXT,
  assessment_count    INTEGER,
  last_assessment_at  TIMESTAMP WITH TIME ZONE,
  email               TEXT,
  created_at          TIMESTAMP WITH TIME ZONE,
  updated_at          TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.username, p.display_name, p.avatar_url, p.bio,
    p.preferred_industry, p.assessment_count, p.last_assessment_at,
    u.email, p.created_at, p.updated_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = user_uuid AND p.id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_username(user_uuid UUID, new_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF (SELECT auth.uid()) != user_uuid THEN
    RAISE EXCEPTION 'Cannot update another user''s username';
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE username = new_username AND id != user_uuid) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;
  UPDATE profiles SET username = new_username, updated_at = NOW() WHERE id = user_uuid;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

-- ============================================
-- 8. Backfill: resync assessment_count for existing users
-- ============================================

UPDATE profiles p
SET
  assessment_count   = sub.cnt,
  last_assessment_at = sub.last_at,
  updated_at         = NOW()
FROM (
  SELECT user_id, COUNT(*)::INTEGER AS cnt, MAX(created_at) AS last_at
  FROM assessments
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id;

-- Backfill new auth users that don't have a profile yet
INSERT INTO profiles (id, username, created_at, updated_at)
SELECT
  u.id,
  COALESCE(SPLIT_PART(u.email,'@',1), 'user_' || REPLACE(u.id::TEXT,'-',''))
    || CASE
         WHEN EXISTS (
           SELECT 1 FROM profiles p2
           WHERE p2.username = COALESCE(SPLIT_PART(u.email,'@',1), 'user_' || REPLACE(u.id::TEXT,'-',''))
         ) THEN '_' || SUBSTRING(u.id::TEXT FROM 1 FOR 8)
         ELSE ''
       END,
  NOW(), NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (username) DO UPDATE
  SET username = 'user_' || REPLACE(EXCLUDED.id::TEXT, '-', '');

-- ============================================
-- 9. Grants
-- ============================================

GRANT ALL     ON profiles TO authenticated;
GRANT SELECT  ON profiles TO anon;
GRANT ALL     ON profiles TO service_role;

-- ============================================
-- 10. Verification
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles','assessments');
SELECT policyname, tablename  FROM pg_policies WHERE tablename IN ('profiles','assessments');
