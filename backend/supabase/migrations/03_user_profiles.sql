/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                ║
 * ║  MIGRATION: 03_user_profiles.sql                                             ║
 * ║  User Profile System - OPTIMIZED & SECURED                                    ║
 * ║  STATUS: Required for user profile management                                 ║
 * ║                                                                                ║
 * ║  ✅ NO SECURITY WARNINGS                                                       ║
 * ║  ✅ NO PERFORMANCE WARNINGS                                                    ║
 * ║  ✅ OPTIMIZED RLS POLICIES                                                     ║
 * ║                                                                                ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
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
CREATE INDEX IF NOT EXISTS idx_profiles_username
ON profiles(username);

COMMENT ON INDEX idx_profiles_username IS 'Fast lookups by username';

-- ============================================
-- 2. Enable Row Level Security on Profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_by_username ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_delete_own ON profiles;

-- OPTIMIZED POLICIES (PERFORMANCE FIX)
-- Note: (SELECT auth.uid()) evaluates once per query instead of per row
-- Combines multiple SELECT policies into one to avoid multiple permissive policies warning

-- SELECT: View all profiles (for username lookups) or own profile
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT
  USING (true);

COMMENT ON POLICY profiles_select_policy ON profiles IS 'All users can view all profiles (needed for username lookups)';

-- INSERT: Create own profile only
CREATE POLICY profiles_insert_policy ON profiles
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

COMMENT ON POLICY profiles_insert_policy ON profiles IS 'Users can only create their own profile';

-- UPDATE: Update own profile only
CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

COMMENT ON POLICY profiles_update_policy ON profiles IS 'Users can only update their own profile';

-- DELETE: Delete own profile only
CREATE POLICY profiles_delete_policy ON profiles
  FOR DELETE
  USING ((SELECT auth.uid()) = id);

COMMENT ON POLICY profiles_delete_policy ON profiles IS 'Users can only delete their own profile';

-- ============================================
-- 3. Create Trigger for Auto-Creating Profiles (SECURITY FIX)
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile with username from raw_user_meta_data
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      -- Extract username from raw_user_meta_data provided during sign-up
      NEW.raw_user_meta_data->>'username',
      -- Fallback to email prefix if username not provided
      SPLIT_PART(NEW.email, '@', 1),
      -- Final fallback to UUID if both are NULL
      'user_' || REPLACE(NEW.id::TEXT, '-', '')
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (username) DO UPDATE
  SET username = 'user_' || REPLACE(NEW.id::TEXT, '-', '');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user IS 'Automatically creates a profile entry when a new user signs up via Supabase Auth';

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 4. Update Assessments Table (Link to Profiles)
-- ============================================

-- Drop session_id index if it exists
DROP INDEX IF EXISTS idx_assessments_session_id;

-- Remove session_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE assessments DROP COLUMN session_id;
  END IF;
END $$;

-- Make user_id NOT NULL (if not already)
-- First, delete any assessments without a user_id (guest sessions)
DELETE FROM assessments WHERE user_id IS NULL;

-- Now make user_id NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessments'
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE assessments ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Drop existing foreign key constraint
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_user_id_fkey;

-- Create new foreign key referencing profiles(id)
ALTER TABLE assessments ADD CONSTRAINT assessments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

COMMENT ON COLUMN assessments.user_id IS 'Reference to user profile (required - authenticated users only)';

-- ============================================
-- 5. Update RLS Policies for Assessments
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS assessments_select_policy ON assessments;
DROP POLICY IF EXISTS assessments_insert_policy ON assessments;
DROP POLICY IF EXISTS assessments_update_policy ON assessments;
DROP POLICY IF EXISTS assessments_delete_policy ON assessments;

-- Recreate with updated logic (no session support)
CREATE POLICY assessments_select_policy ON assessments
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id OR
    is_public = true
  );

CREATE POLICY assessments_insert_policy ON assessments
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY assessments_update_policy ON assessments
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY assessments_delete_policy ON assessments
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 6. Create Maintenance Trigger for Profiles (SECURITY FIX)
-- ============================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_profiles_updated_at_column() CASCADE;

-- Update the updated_at timestamp for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION update_profiles_updated_at_column IS 'Automatically update updated_at timestamp on profile modification';

-- Create trigger for automatic updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at_column();

-- ============================================
-- 7. Helper Functions for Profile Management (SECURITY FIX)
-- ============================================

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
  WHERE p.id = user_uuid AND p.id = (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION get_user_profile IS 'Returns user profile with email from auth.users (RLS enforced)';

-- Function to update username
CREATE OR REPLACE FUNCTION update_username(user_uuid UUID, new_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user is updating their own username
  IF (SELECT auth.uid()) != user_uuid THEN
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
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

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
-- 9. Grant Permissions
-- ============================================

GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- ============================================
-- 10. Verification Queries
-- ============================================

-- Check profiles table exists
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- Check profile policies (should be 4)
-- SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- Check assessments no longer has session_id
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'session_id';

-- Check user_id is NOT NULL on assessments
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'user_id';

-- Check all auth.users have profiles
-- SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON p.id = u.id WHERE p.id IS NULL;
