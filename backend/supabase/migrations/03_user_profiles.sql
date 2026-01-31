/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                ║
 * ║  MIGRATION: 03_user_profiles.sql                                              ║
 * ║  User Profile System with Usernames and Enhanced RLS                          ║
 * ║  STATUS: Required for user profile management                                 ║
 * ║                                                                                ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * WHAT THIS MIGRATION DOES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * This migration creates a user profile system with usernames and removes
 * session-based guest access. Key changes:
 *
 * 1. Create profiles table
 *    - Links to auth.users via id (UUID, one-to-one)
 *    - Stores unique usernames
 *    - Includes timestamps for tracking
 *
 * 2. Update assessments table
 *    - Remove session_id column (no guest access)
 *    - Make user_id NOT NULL (authenticated users only)
 *    - Update foreign key to reference profiles(id) instead of auth.users(id)
 *
 * 3. Auto-create profile trigger
 *    - Automatically creates profile row when user signs up
 *    - Ensures every auth.users has a corresponding profiles entry
 *
 * 4. Enhanced Row Level Security
 *    - Users can only view/edit their own profile
 *    - Users can only view/edit their own assessments
 *    - Enforces user_id = auth.uid() at database level
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * EXECUTION ORDER
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * MUST RUN AFTER:
 *   ✓ 01_vector_infrastructure.sql
 *   ✓ 02_user_assessments.sql
 *
 * WARNING: This migration removes session_id column
 *   - Backup existing data before running if needed
 *   - Guest sessions will be lost
 */

-- ============================================
-- 1. Create Profiles Table
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with unique usernames, linked one-to-one with auth.users';
COMMENT ON COLUMN profiles.id IS 'Primary key and foreign key to auth.users.id (one-to-one relationship)';
COMMENT ON COLUMN profiles.username IS 'Unique username chosen by user during signup or profile setup';
COMMENT ON COLUMN profiles.created_at IS 'When the profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'When the profile was last updated';

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ============================================
-- 2. Enable Row Level Security on Profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;

-- SELECT: Users can view their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Users can create their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- 3. Create Trigger for Auto-Creating Profiles
-- ============================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile with a default username
  -- Username will be user's email prefix or UUID if email not available
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      -- Extract username from email (before @)
      SPLIT_PART(NEW.email, '@', 1),
      -- Fallback to UUID if email is NULL
      'user_' || REPLACE(NEW.id::TEXT, '-', '')
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (username) DO UPDATE
  SET username = 'user_' || REPLACE(NEW.id::TEXT, '-', '');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile entry when a new user signs up via Supabase Auth';

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 4. Update Assessments Table
-- ============================================

-- Drop session_id index
DROP INDEX IF EXISTS idx_assessments_session_id;

-- Remove session_id column
ALTER TABLE assessments DROP COLUMN IF EXISTS session_id;

-- Make user_id NOT NULL (authenticated users only)
-- First, delete any assessments without a user_id (guest sessions)
DELETE FROM assessments WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE assessments ALTER COLUMN user_id SET NOT NULL;

-- Drop existing foreign key constraint
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey;

-- Create new foreign key referencing profiles(id)
ALTER TABLE assessments ADD CONSTRAINT assessments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

COMMENT ON COLUMN assessments.user_id IS 'Reference to user profile (required - authenticated users only)';

-- ============================================
-- 5. Update RLS Policies for Assessments
-- ============================================

-- Drop old guest-related policies
DROP POLICY IF EXISTS assessments_select_guest ON assessments;
DROP POLICY IF EXISTS assessments_insert_guest ON assessments;
DROP POLICY IF EXISTS assessments_update_guest ON assessments;
DROP POLICY IF EXISTS assessments_delete_guest ON assessments;

-- Keep existing authenticated policies:
-- - assessments_select_authenticated
-- - assessments_insert_authenticated
-- - assessments_update_authenticated
-- - assessments_delete_authenticated
-- (These are already in place from 02_user_assessments.sql)

-- ============================================
-- 6. Create Maintenance Trigger for Profiles
-- ============================================

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_profiles_updated_at_column() CASCADE;

-- Update the updated_at timestamp for profiles
CREATE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at_column();

-- ============================================
-- 7. Helper Functions for Profile Management
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_username(UUID, TEXT) CASCADE;

-- Function to get user profile by user_id
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    u.email,
    p.created_at,
    p.updated_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = user_uuid AND p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_profile IS 'Returns user profile with email from auth.users (RLS enforced)';

-- Function to update username
CREATE OR REPLACE FUNCTION update_username(user_uuid UUID, new_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is updating their own username
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Cannot update another user''s username';
  END IF;

  -- Check if username is already taken
  IF EXISTS (SELECT 1 FROM profiles WHERE username = new_username AND id != user_uuid) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;

  -- Update the username
  UPDATE profiles
  SET username = new_username, updated_at = NOW()
  WHERE id = user_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_username IS 'Safely updates username with validation (must be unique, can only update own username)';

-- ============================================
-- 8. Backfill Existing Users
-- ============================================

-- Create profiles for any existing auth.users that don't have profiles yet
INSERT INTO profiles (id, username, created_at, updated_at)
SELECT
  u.id,
  COALESCE(
    SPLIT_PART(u.email, '@', 1),
    'user_' || REPLACE(u.id::TEXT, '-', '')
  ) || CASE
    WHEN EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.username = COALESCE(SPLIT_PART(u.email, '@', 1), 'user_' || REPLACE(u.id::TEXT, '-', ''))
    ) THEN '_' || SUBSTRING(u.id::TEXT FROM 1 FOR 8)
    ELSE ''
  END,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (username) DO UPDATE
SET username = 'user_' || REPLACE(EXCLUDED.id::TEXT, '-', '');

-- ============================================
-- 9. Verification Queries
-- ============================================

-- After running this migration, verify the setup:
--
-- -- Check profiles table exists with correct columns
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'profiles' ORDER BY ordinal_position;
--
-- -- Verify RLS is enabled on profiles
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
--
-- -- Check profile policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
--
-- -- Verify assessments no longer has session_id
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'assessments' AND column_name = 'session_id';
--   -- Should return no rows
--
-- -- Check user_id is NOT NULL on assessments
-- SELECT column_name, is_nullable FROM information_schema.columns
--   WHERE table_name = 'assessments' AND column_name = 'user_id';
--   -- Should show is_nullable = 'NO'
--
-- -- Verify FK constraint from assessments to profiles
-- SELECT constraint_name, table_name, column_name
--   FROM information_schema.key_column_usage
--   WHERE table_name = 'assessments' AND column_name = 'user_id';
--
-- -- Check that all auth.users have profiles
-- SELECT COUNT(*) FROM auth.users u
--   LEFT JOIN profiles p ON p.id = u.id
--   WHERE p.id IS NULL;
--   -- Should return 0
--
-- -- Test profile functions
-- SELECT * FROM get_user_profile(auth.uid());
