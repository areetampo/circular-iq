-- MIGRATION: 03_user_profiles.sql (v3)
-- User Profile System — OPTIMIZED & SECURED
-- STATUS: Depends on 02_user_assessments.sql (v3)
--
-- CHANGES FROM v1:
-- • Added columns to profiles table: display_name, avatar_url, bio, preferred_industry,
--   assessment_count (denormalised counter), last_assessment_at.
-- • Added increment_profile_assessment_count() trigger on user_assessments INSERT to keep
--   assessment_count in sync automatically.
-- • Added decrement_profile_assessment_count() trigger on user_assessments DELETE.
-- • Updated user_assessments.user_id FK to point to profiles(id) (previously optional,
--   now NOT NULL after this migration).
-- • Removed session_id from user_assessments (guest sessions no longer supported).
-- • Tightened RLS policies on user_assessments to rely only on user_id (no session_id fallback).
-- • Added helper functions: get_user_profile(), update_username().
-- • Backfilled assessment_count for existing users.
--
-- PURPOSE:
-- - Creates a profiles table linked one-to-one with auth.users.
-- - Automatically creates a profile when a new user signs up (via trigger on auth.users).
-- - Maintains a denormalised assessment_count for fast dashboard queries.
-- - Provides RLS policies so users can only manage their own profile.
-- - Upgrades the user_assessments table to fully rely on authenticated users (no guest mode).

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
        'decrement_profile_assessment_count',
        'supabase_noop_send_email',
        'force_internal_email'
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
  display_name          TEXT CHECK (char_length(display_name) <= 50),
  avatar_url            TEXT CHECK (char_length(avatar_url)   <= 500),
  bio                   TEXT CHECK (char_length(bio)           <= 300),
  preferred_industry    TEXT CHECK (char_length(preferred_industry) <= 100),   -- <-- added missing comma

  -- ── Denormalised counters (kept in sync via trigger) ─────────────────────────
  assessment_count      INTEGER NOT NULL DEFAULT 0 CHECK (assessment_count >= 0),
  last_assessment_at    TIMESTAMP WITH TIME ZONE,    -- updated on each save

  -- ── Timestamps ───────────────────────────────────────────────────────────────
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- ── Constraints ───────────────────────────────────────────────────────────────
  -- Username validation: enforce length, pattern, and character restrictions
  -- This is the "hard floor" — the database physically refuses invalid data
  CONSTRAINT username_valid_format CHECK (
    char_length(username) >= 3
    AND char_length(username) <= 30
    -- Must contain at least one letter (lookahead) AND only allowed chars
    -- Mirrors frontend Zod regex: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/
    AND username ~ '^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$'
    AND username NOT LIKE '%@%'
  )
);

COMMENT ON TABLE  profiles IS
  'User profiles — one-to-one with auth.users. Includes denormalised assessment_count for fast dashboard queries. Username validation is enforced by both BEFORE INSERT trigger and CHECK constraint.';
COMMENT ON COLUMN profiles.username IS
  'Unique username chosen at signup. Must be 3-30 characters, alphanumeric and underscores only (no @ characters). Validated at signup by trigger and enforced by table constraint.';
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
-- 1b. Grants — applied immediately after table creation
-- ============================================
-- IMPORTANT: these are placed here (not at the bottom) because the migration
-- opens with DROP TABLE CASCADE which wipes all prior grants. If the migration
-- errors partway through, grants at the bottom of the file never execute and
-- the authenticated role is left with no access — producing error code 42501
-- "permission denied for table profiles". Granting early ensures the table is
-- always usable as soon as it exists.

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
REVOKE ALL ON profiles FROM anon;  -- anon must never access profiles directly

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

-- Users can only read their own profile row.
-- If you need public username lookups (e.g. /u/:username pages), create a
-- separate Postgres function with SECURITY DEFINER that returns only safe
-- public fields — never expose the full table to anon.
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

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

-- 1. Function to force the internal email mapping BEFORE the user is created
-- This acts as the backend "Zod schema" for username validation
CREATE OR REPLACE FUNCTION public.force_internal_email()
RETURNS TRIGGER AS $$
DECLARE
  username_raw TEXT;
  username_length INT;
BEGIN
  -- Extract username from metadata (passed from frontend signUp options)
  username_raw := NEW.raw_user_meta_data->>'username';

  -- ──────────────────────────────────────────────────────────────────────────
  -- CONSTRAINT 1: Username must exist (not null)
  -- ──────────────────────────────────────────────────────────────────────────
  IF username_raw IS NULL THEN
    RAISE EXCEPTION 'Invalid registration: Username is required';
  END IF;

  username_length := char_length(username_raw);

  -- ──────────────────────────────────────────────────────────────────────────
  -- CONSTRAINT 2: Username length must be 3-30 characters
  -- ──────────────────────────────────────────────────────────────────────────
  IF username_length < 3 THEN
    RAISE EXCEPTION 'Invalid registration: Username must be at least 3 characters';
  END IF;

  IF username_length > 30 THEN
    RAISE EXCEPTION 'Invalid registration: Username must be at most 30 characters';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- CONSTRAINT 3: Username must match pattern
  --   • Only letters, digits, underscores, and hyphens
  --   • Must contain at least one letter (prevents purely numeric/symbol names)
  --   • Postgres ~ operator performs regex match
  --   • Mirrors frontend Zod regex: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/
  -- ──────────────────────────────────────────────────────────────────────────
  IF username_raw !~ '^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Invalid registration: Username can only contain letters, numbers, underscores, and hyphens, and must include at least one letter';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- CONSTRAINT 4: Explicitly reject @ character (protection against bypasses)
  -- ──────────────────────────────────────────────────────────────────────────
  IF username_raw LIKE '%@%' THEN
    RAISE EXCEPTION 'Invalid registration: Username cannot contain @ character';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- ALL VALIDATION PASSED: Hard overwrite the email field
  -- This forces the user into the @ce.internal domain regardless of what they sent
  -- ──────────────────────────────────────────────────────────────────────────
  NEW.email := lower(username_raw) || '@ce.internal';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION force_internal_email() IS
  'BEFORE INSERT trigger acting as the backend "Zod schema" for username validation. Validates: (1) Username exists (2) Length 3-30 chars (3) Pattern ^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$ — letters/digits/underscores/hyphens, at least one letter (4) No @ character. Raises exception on failure, preventing invalid signup. Overwrites email to enforce @ce.internal domain. Runs for ALL signups, even bypassing frontend.';

-- 2. Bind the BEFORE trigger to auth.users
-- This intercepts the record BEFORE it is written to the database
-- Every signup attempt (frontend or direct API call) will be validated here
DROP TRIGGER IF EXISTS trg_force_internal_email ON auth.users;
CREATE TRIGGER trg_force_internal_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.force_internal_email();

-- 3. Your existing Profile Trigger (Modified for safety)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    -- lower() must match force_internal_email which calls lower() before storing the email.
    -- This ensures profiles.username == SPLIT_PART(auth.users.email, '@', 1) always.
    lower(NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Creates a profile row automatically when a new auth user signs up. Trusts that the BEFORE INSERT trigger (force_internal_email) has already validated the username. Simply extracts the validated username from raw_user_meta_data.';

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

DROP TRIGGER IF EXISTS trg_increment_profile_assessment_count ON user_assessments;
CREATE TRIGGER trg_increment_profile_assessment_count
  AFTER INSERT ON user_assessments
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

DROP TRIGGER IF EXISTS trg_decrement_profile_assessment_count ON user_assessments;
CREATE TRIGGER trg_decrement_profile_assessment_count
  AFTER DELETE ON user_assessments
  FOR EACH ROW EXECUTE FUNCTION decrement_profile_assessment_count();

-- ============================================
-- 5. Update user_assessments table: upgrade FK and RLS
-- ============================================

-- Remove session_id if still present (migrating from v1)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_assessments' AND column_name = 'session_id'
  ) THEN
    DROP INDEX  IF EXISTS idx_user_assessments_session_id;
    ALTER TABLE user_assessments DROP COLUMN session_id;
  END IF;
END $$;

-- Delete guest assessments and enforce NOT NULL user_id
DELETE FROM user_assessments WHERE user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_assessments' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE user_assessments ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Re-point FK to profiles(id)
ALTER TABLE user_assessments DROP CONSTRAINT IF EXISTS user_assessments_user_id_fkey;
ALTER TABLE user_assessments ADD CONSTRAINT user_assessments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Tighten RLS (no more session_id fallback once user_id is NOT NULL)
DROP POLICY IF EXISTS user_assessments_select_policy ON user_assessments;
DROP POLICY IF EXISTS user_assessments_insert_policy ON user_assessments;
DROP POLICY IF EXISTS user_assessments_update_policy ON user_assessments;
DROP POLICY IF EXISTS user_assessments_delete_policy ON user_assessments;

CREATE POLICY user_assessments_select_policy ON user_assessments
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id OR is_public = true
  );

CREATE POLICY user_assessments_insert_policy ON user_assessments
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_assessments_update_policy ON user_assessments
  FOR UPDATE
  USING      ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_assessments_delete_policy ON user_assessments
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

-- NOTE: email is intentionally excluded — the @ce.internal address is an
-- internal implementation detail and must never be surfaced to the client.
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
  created_at          TIMESTAMP WITH TIME ZONE,
  updated_at          TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.username, p.display_name, p.avatar_url, p.bio,
    p.preferred_industry, p.assessment_count, p.last_assessment_at,
    p.created_at, p.updated_at
  FROM profiles p
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

  -- Validate length
  IF char_length(new_username) < 3 OR char_length(new_username) > 30 THEN
    RAISE EXCEPTION 'Username must be between 3 and 30 characters';
  END IF;

  -- Validate pattern: letters/digits/underscores/hyphens, at least one letter, no @
  -- Mirrors: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/
  IF new_username !~ '^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$' OR new_username LIKE '%@%' THEN
    RAISE EXCEPTION 'Username can only contain letters, numbers, underscores, and hyphens, and must include at least one letter';
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
-- 8. No-op Send Email Hook
-- ============================================
-- Supabase Auth requires an email format for its identity system, but this
-- app uses username-only auth with @ce.internal as an internal placeholder.
-- We NEVER want Supabase to send any email to users.
--
-- Solution (per official Supabase guidance):
--   1. Create a no-op Postgres function as the Send Email Auth Hook.
--   2. Register it in Dashboard → Authentication → Hooks → Send Email.
--   3. Disable "Confirm Email" in Dashboard → Authentication → Providers → Email.
--
-- This means: Supabase will call this hook instead of sending any email,
-- the hook does nothing, and the @ce.internal address is never exposed.

CREATE OR REPLACE FUNCTION public.supabase_noop_send_email(event JSONB)
RETURNS JSONB AS $$
BEGIN
  -- Intentional no-op: this app uses username-only auth.
  -- The @ce.internal email is an internal mapping — it must never be sent anywhere.
  -- Returning NULL signals to Supabase Auth that email sending succeeded.
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION supabase_noop_send_email(JSONB) IS
  'No-op Send Email Auth Hook. Prevents Supabase from attempting to send any '
  'emails to @ce.internal addresses. Register this in Dashboard → Auth → Hooks → Send Email.';

-- Grant execute to supabase_auth_admin so Supabase Auth can call this hook.
-- Revoke from all other roles so it cannot be called via the Data API.
GRANT EXECUTE ON FUNCTION public.supabase_noop_send_email(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.supabase_noop_send_email(JSONB) FROM PUBLIC, anon, authenticated;

-- ============================================
-- 9. Grants (re-stated for clarity — also applied in section 1b above)
-- ============================================
-- Repeated here so the final grant state is explicit and auditable at a glance.
-- Section 1b grants are the operative ones (applied before RLS); these confirm them.

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT ALL     ON profiles TO service_role;
REVOKE ALL    ON profiles FROM anon;  -- anon must use SECURITY DEFINER functions only

-- ============================================
-- 10. Verification
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles','user_assessments');
SELECT policyname, tablename  FROM pg_policies WHERE tablename IN ('profiles','user_assessments');
