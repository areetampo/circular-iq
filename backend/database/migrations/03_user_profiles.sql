-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 03_user_profiles.sql (v3)
-- User Profile System — profiles table, auth triggers, assessment counters
-- ══════════════════════════════════════════════════════════════════════════════
--
-- RUN ORDER NOTE
-- ──────────────
-- This migration must run AFTER 02_user_assessments.sql because it installs
-- triggers on the user_assessments table and modifies its FK constraint.
-- Correct order: 01 → 02 → 03 → 04 → 05 → 06 → 07
--
-- PURPOSE
-- ───────
-- • Creates the profiles table linked one-to-one with auth.users.
-- • Validates username at signup via a BEFORE INSERT trigger on auth.users
--   (force_internal_email) — acts as the backend equivalent of frontend Zod
--   validation; cannot be bypassed even via direct API calls.
-- • Rewrites the user's email to <username>@ce.internal so Supabase Auth works
--   without exposing real email addresses.
-- • Automatically creates a profile row when a new user signs up
--   (handle_new_user AFTER INSERT trigger on auth.users).
-- • Maintains a denormalised assessment_count via INSERT/DELETE triggers on
--   user_assessments for fast dashboard queries.
-- • Upgrades the user_assessments.user_id FK to reference profiles(id).
-- • Provides helper RPCs: get_user_profile(), update_username().
-- • Registers a no-op Send Email Auth Hook so Supabase never sends email to
--   @ce.internal addresses.
--
-- DESIGN DECISIONS
-- ────────────────
-- • @ce.internal email domain: lets Supabase Auth use its email-based identity
--   system internally while the app presents username-only auth to users.
-- • Denormalised assessment_count: avoids a COUNT(*) query on every profile
--   page load. Kept in sync by trigger — never manually updated.
-- • Username validation enforced at two layers:
--     1. BEFORE INSERT trigger (force_internal_email) — hard database floor.
--     2. profiles CHECK constraint — secondary guarantee.
-- • Grants applied early (section 1b) so the table is immediately usable even
--   if the migration fails partway through.
--
-- ACCESS CONTROL
-- ──────────────
-- • profiles table:  authenticated can SELECT/INSERT/UPDATE/DELETE own row
--                    (RLS restricts to auth.uid() = id).
--                    anon has no access.
--                    service_role has full access.
-- • SECURITY DEFINER fns: all locked to service_role only via REVOKE.
--   - force_internal_email, handle_new_user: trigger fns — no direct RPC.
--   - increment/decrement_profile_assessment_count: trigger fns — no RPC.
--   - update_profiles_updated_at_column: trigger fn — no RPC.
--   - get_user_profile, update_username: Express backend only (service_role).
--   - supabase_noop_send_email: Auth hook — granted to supabase_auth_admin only.
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
-- Drop profiles table first — CASCADE removes dependent indexes, policies,
-- triggers, and the auth.users triggers that reference its functions.
-- Then drop every function in this migration regardless of signature.

DROP TABLE IF EXISTS profiles CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'handle_new_user',
        'force_internal_email',
        'update_profiles_updated_at_column',
        'get_user_profile',
        'update_username',
        'increment_profile_assessment_count',
        'decrement_profile_assessment_count',
        'supabase_noop_send_email'
    ];
    func_name text;
    rec       record;
BEGIN
    FOREACH func_name IN ARRAY func_names LOOP
        FOR rec IN
            SELECT nspname, proname, oidvectortypes(pg_proc.proargtypes) AS args
            FROM   pg_proc
            JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE  proname = func_name AND nspname = 'public'
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
                rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE — profiles
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
    -- ── Identity ─────────────────────────────────────────────────────────────
    id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username           TEXT UNIQUE NOT NULL,

    -- ── Optional profile data ─────────────────────────────────────────────────
    display_name       TEXT CHECK (char_length(display_name)       <= 50),
    avatar_url         TEXT CHECK (char_length(avatar_url)         <= 500),
    bio                TEXT CHECK (char_length(bio)                 <= 300),
    preferred_industry TEXT CHECK (char_length(preferred_industry) <= 100),

    -- ── Denormalised counters (kept in sync by trigger — never edit manually) ─
    assessment_count   INTEGER NOT NULL DEFAULT 0 CHECK (assessment_count >= 0),
    last_assessment_at TIMESTAMP WITH TIME ZONE,

    -- ── Timestamps ───────────────────────────────────────────────────────────
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- ── Username validation constraint ────────────────────────────────────────
    -- Hard database floor — mirrors frontend Zod regex:
    --   /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/
    -- Also enforced by the BEFORE INSERT trigger (force_internal_email).
    CONSTRAINT username_valid_format CHECK (
        char_length(username) >= 3
        AND char_length(username) <= 30
        AND username ~ '^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$'
        AND username NOT LIKE '%@%'
    )
);

COMMENT ON TABLE  profiles IS
    'User profiles — one-to-one with auth.users. Includes denormalised assessment_count for fast dashboard queries. Username validation enforced by BEFORE INSERT trigger and CHECK constraint.';
COMMENT ON COLUMN profiles.username           IS 'Unique username (3-30 chars, letters/digits/underscores/hyphens, at least one letter, no @).';
COMMENT ON COLUMN profiles.display_name       IS 'Optional human-readable display name.';
COMMENT ON COLUMN profiles.assessment_count   IS 'Denormalised count of saved assessments — kept in sync by trigger, never manually updated.';
COMMENT ON COLUMN profiles.last_assessment_at IS 'Timestamp of the most recent saved assessment.';
COMMENT ON COLUMN profiles.preferred_industry IS 'User-selected default industry for new assessments.';

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- ── 1b. Early table grants ────────────────────────────────────────────────────
-- Applied immediately after table creation so the table is usable even if the
-- migration fails partway through. Repeated at the end of section 8 for clarity.
-- (The DROP TABLE CASCADE at the top wipes prior grants, so early grant is essential.)
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
REVOKE ALL ON profiles FROM anon;   -- anon must never access profiles directly


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY — profiles
-- ══════════════════════════════════════════════════════════════════════════════
-- Each user can only access their own profile row.
-- For public username lookups, use a SECURITY DEFINER function that returns
-- only safe public fields — never expose the full table to anon.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy      ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy      ON profiles;
DROP POLICY IF EXISTS profiles_update_policy      ON profiles;
DROP POLICY IF EXISTS profiles_delete_policy      ON profiles;
DROP POLICY IF EXISTS profiles_select_own         ON profiles;
DROP POLICY IF EXISTS profiles_select_by_username ON profiles;
DROP POLICY IF EXISTS profiles_insert_own         ON profiles;
DROP POLICY IF EXISTS profiles_update_own         ON profiles;
DROP POLICY IF EXISTS profiles_delete_own         ON profiles;

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


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. AUTH HOOK FUNCTIONS — Signup validation & profile creation
-- ══════════════════════════════════════════════════════════════════════════════
-- These two functions run as triggers on auth.users for every signup attempt.
-- They cannot be bypassed even via direct Supabase API calls.

-- ── 3a. force_internal_email (BEFORE INSERT on auth.users) ───────────────────
-- Acts as the backend "Zod schema" for username validation.
-- Validates username, then rewrites the email field to <username>@ce.internal
-- so Supabase Auth's email-based identity system works without real emails.
-- Raises an exception on any validation failure, preventing the INSERT.

CREATE OR REPLACE FUNCTION public.force_internal_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
    username_raw    TEXT;
    username_length INT;
BEGIN
    username_raw := NEW.raw_user_meta_data->>'username';

    -- Constraint 1: username must be present
    IF username_raw IS NULL THEN
        RAISE EXCEPTION 'Invalid registration: Username is required';
    END IF;

    username_length := char_length(username_raw);

    -- Constraint 2: length 3-30 characters
    IF username_length < 3 THEN
        RAISE EXCEPTION 'Invalid registration: Username must be at least 3 characters';
    END IF;

    IF username_length > 30 THEN
        RAISE EXCEPTION 'Invalid registration: Username must be at most 30 characters';
    END IF;

    -- Constraint 3: pattern — letters/digits/underscores/hyphens, at least one letter
    -- Mirrors frontend Zod regex: /^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/
    IF username_raw !~ '^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$' THEN
        RAISE EXCEPTION 'Invalid registration: Username can only contain letters, numbers, underscores, and hyphens, and must include at least one letter';
    END IF;

    -- Constraint 4: explicitly reject @ (protection against bypass attempts)
    IF username_raw LIKE '%@%' THEN
        RAISE EXCEPTION 'Invalid registration: Username cannot contain @ character';
    END IF;

    -- All validation passed: rewrite email to @ce.internal domain.
    -- lower() ensures profiles.username == SPLIT_PART(auth.users.email, '@', 1).
    NEW.email := lower(username_raw) || '@ce.internal';

    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.force_internal_email IS
    'BEFORE INSERT trigger on auth.users. Validates username (length, pattern, no @) and rewrites email to <username>@ce.internal. Raises exception on failure — prevents invalid signups regardless of how they arrive. SECURITY DEFINER — trigger only, no RPC access.';

-- ── 3b. handle_new_user (AFTER INSERT on auth.users) ─────────────────────────
-- Creates the corresponding profiles row after a successful signup.
-- Trusts that force_internal_email has already validated the username.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (
        NEW.id,
        -- lower() matches force_internal_email, ensuring
        -- profiles.username == SPLIT_PART(auth.users.email, '@', 1) always.
        lower(NEW.raw_user_meta_data->>'username')
    );
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user IS
    'AFTER INSERT trigger on auth.users. Creates a profile row for the new user. Relies on force_internal_email having already validated the username. SECURITY DEFINER — trigger only, no RPC access.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. AUTH TRIGGERS — Bind to auth.users
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_force_internal_email ON auth.users;
CREATE TRIGGER trg_force_internal_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.force_internal_email();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. ASSESSMENT COUNTER FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════
-- Maintain profiles.assessment_count in sync with user_assessments rows.
-- These functions fire on INSERT/DELETE of user_assessments, not via RPC.

-- ── 5a. increment_profile_assessment_count ────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_profile_assessment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
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
$$;
COMMENT ON FUNCTION increment_profile_assessment_count IS
    'Increments profiles.assessment_count when an assessment is saved. SECURITY DEFINER — trigger only, no RPC access.';

DROP TRIGGER IF EXISTS trg_increment_profile_assessment_count ON user_assessments;
CREATE TRIGGER trg_increment_profile_assessment_count
    AFTER INSERT ON user_assessments
    FOR EACH ROW EXECUTE FUNCTION increment_profile_assessment_count();

-- ── 5b. decrement_profile_assessment_count ────────────────────────────────────

CREATE OR REPLACE FUNCTION decrement_profile_assessment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
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
$$;
COMMENT ON FUNCTION decrement_profile_assessment_count IS
    'Decrements profiles.assessment_count when an assessment is deleted. GREATEST(0,...) prevents negative counts. SECURITY DEFINER — trigger only, no RPC access.';

DROP TRIGGER IF EXISTS trg_decrement_profile_assessment_count ON user_assessments;
CREATE TRIGGER trg_decrement_profile_assessment_count
    AFTER DELETE ON user_assessments
    FOR EACH ROW EXECUTE FUNCTION decrement_profile_assessment_count();


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. UPGRADE user_assessments — FK + RLS
-- ══════════════════════════════════════════════════════════════════════════════
-- Migrates user_assessments from the v1 schema (nullable user_id, session_id)
-- to v3 (NOT NULL user_id FK → profiles, no guest sessions).

-- Remove session_id column if still present (migrating from v1).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_assessments' AND column_name = 'session_id'
    ) THEN
        DROP INDEX IF EXISTS idx_user_assessments_session_id;
        ALTER TABLE user_assessments DROP COLUMN session_id;
    END IF;
END $$;

-- Delete any remaining guest (NULL user_id) rows, then enforce NOT NULL.
DELETE FROM user_assessments WHERE user_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_assessments'
          AND column_name = 'user_id'
          AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE user_assessments ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Re-point FK to profiles(id) (was auth.users(id) in v1).
ALTER TABLE user_assessments DROP CONSTRAINT IF EXISTS user_assessments_user_id_fkey;
ALTER TABLE user_assessments ADD CONSTRAINT user_assessments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Tighten RLS: remove session_id fallback now that user_id is always NOT NULL.
DROP POLICY IF EXISTS user_assessments_select_policy ON user_assessments;
DROP POLICY IF EXISTS user_assessments_insert_policy ON user_assessments;
DROP POLICY IF EXISTS user_assessments_update_policy ON user_assessments;
DROP POLICY IF EXISTS user_assessments_delete_policy ON user_assessments;

CREATE POLICY user_assessments_select_policy ON user_assessments
    FOR SELECT USING ((SELECT auth.uid()) = user_id OR is_public = true);

CREATE POLICY user_assessments_insert_policy ON user_assessments
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_assessments_update_policy ON user_assessments
    FOR UPDATE
    USING      ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY user_assessments_delete_policy ON user_assessments
    FOR DELETE USING ((SELECT auth.uid()) = user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. TIMESTAMP TRIGGER — profiles.updated_at
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION update_profiles_updated_at_column IS
    'Trigger function: sets profiles.updated_at = NOW() on row UPDATE. SECURITY DEFINER — trigger only, no RPC access.';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════
-- Called exclusively by the Express backend using service_role.
-- email is intentionally excluded — @ce.internal is an internal detail.

-- ── 8a. get_user_profile ──────────────────────────────────────────────────────

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
)
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.username, p.display_name, p.avatar_url, p.bio,
        p.preferred_industry, p.assessment_count, p.last_assessment_at,
        p.created_at, p.updated_at
    FROM  profiles p
    WHERE p.id = user_uuid AND p.id = (SELECT auth.uid());
END;
$$;
COMMENT ON FUNCTION get_user_profile IS
    'Returns the authenticated user''s profile. The auth.uid() = id check ensures users can only fetch their own row. SECURITY DEFINER — callable by service_role only.';

-- ── 8b. update_username ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_username(user_uuid UUID, new_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    IF (SELECT auth.uid()) != user_uuid THEN
        RAISE EXCEPTION 'Cannot update another user''s username';
    END IF;

    IF char_length(new_username) < 3 OR char_length(new_username) > 30 THEN
        RAISE EXCEPTION 'Username must be between 3 and 30 characters';
    END IF;

    IF new_username !~ '^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$' OR new_username LIKE '%@%' THEN
        RAISE EXCEPTION 'Username can only contain letters, numbers, underscores, and hyphens, and must include at least one letter';
    END IF;

    IF EXISTS (SELECT 1 FROM profiles WHERE username = new_username AND id != user_uuid) THEN
        RAISE EXCEPTION 'Username already taken';
    END IF;

    UPDATE profiles SET username = new_username, updated_at = NOW() WHERE id = user_uuid;
    RETURN TRUE;
END;
$$;
COMMENT ON FUNCTION update_username IS
    'Updates the authenticated user''s username after validation. Mirrors username rules from force_internal_email. SECURITY DEFINER — callable by service_role only.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. NO-OP SEND EMAIL AUTH HOOK
-- ══════════════════════════════════════════════════════════════════════════════
-- This app uses username-only auth. @ce.internal addresses are internal
-- placeholders — Supabase must never attempt to send email to them.
--
-- Setup (one-time, in Supabase Dashboard):
--   Authentication → Hooks → Send Email → select this function.
--   Authentication → Providers → Email → disable "Confirm Email".
--
-- Returning NULL signals to Supabase Auth that sending "succeeded".

CREATE OR REPLACE FUNCTION public.supabase_noop_send_email(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    -- Intentional no-op: this app uses username-only auth.
    -- The @ce.internal email is an internal mapping — never send anything.
    RETURN NULL;
END;
$$;
COMMENT ON FUNCTION public.supabase_noop_send_email IS
    'No-op Send Email Auth Hook. Prevents Supabase from sending email to @ce.internal addresses. Register in Dashboard → Auth → Hooks → Send Email. SECURITY DEFINER — callable by supabase_auth_admin only.';

-- Grant only to supabase_auth_admin (required for Auth to call this hook).
GRANT  EXECUTE ON FUNCTION public.supabase_noop_send_email(JSONB) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.supabase_noop_send_email(JSONB) FROM public, anon, authenticated;


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Table grants (restated — see also section 1b) ────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT ALL    ON profiles TO service_role;
REVOKE ALL   ON profiles FROM anon;

-- ── SECURITY DEFINER function lockdown ───────────────────────────────────────
-- All SECURITY DEFINER functions in this migration are either:
--   (a) trigger functions — invoked by DB triggers, never via RPC, or
--   (b) Express-backend RPCs — called via service_role only.
-- Revoke from public/anon/authenticated so none appear in /rest/v1/rpc
-- with callable access.
REVOKE EXECUTE ON FUNCTION public.force_internal_email()                FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                     FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at_column()   FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_profile_assessment_count()  FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_profile_assessment_count()  FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_profile(UUID)                FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_username(UUID, TEXT)           FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_profile(UUID)                TO service_role;
GRANT  EXECUTE ON FUNCTION public.update_username(UUID, TEXT)           TO service_role;


-- ══════════════════════════════════════════════════════════════════════════════
-- 11. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- RLS enabled on both tables.
SELECT tablename, rowsecurity FROM pg_tables
WHERE  tablename IN ('profiles', 'user_assessments');

-- All expected policies exist.
SELECT policyname, tablename FROM pg_policies
WHERE  tablename IN ('profiles', 'user_assessments');

-- Auth triggers exist on auth.users.
SELECT trigger_name, event_manipulation, event_object_table
FROM   information_schema.triggers
WHERE  event_object_table = 'users'
  AND  trigger_schema = 'auth'
ORDER  BY trigger_name;
