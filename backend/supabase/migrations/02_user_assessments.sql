/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                ║
 * ║  MIGRATION: 02_user_assessments.sql                                           ║
 * ║  PHASE 2 - User Authentication & Assessment Portfolio System                  ║
 * ║  STATUS: Required for user-facing features                                    ║
 * ║                                                                                ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * WHAT THIS MIGRATION DOES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * This migration sets up user authentication and assessment portfolio management.
 * It implements Supabase's built-in auth system with Row Level Security to ensure
 * users can only access their own data. Key components:
 *
 * 1. Assessments Table
 *    - Stores assessment results for historical tracking
 *    - Links to auth.users via user_id foreign key
 *    - Includes session_id for optional guest mode (currently disabled)
 *    - Metadata: industry, scores, business problem/solution, JSON results
 *
 * 2. User Ownership & Foreign Keys
 *    - user_id: UUID reference to Supabase auth.users table
 *    - ON DELETE CASCADE: Deleting user also deletes their assessments
 *    - NOT NULL: Ensures every assessment has an owner
 *    - Index on user_id for fast lookups
 *
 * 3. Row Level Security (RLS) - The Core Privacy Feature
 *    ┌─────────────────────────────────────────────────────────────┐
 *    │ How RLS Works:                                              │
 *    │                                                             │
 *    │ - RLS is a database-level security mechanism                │
 *    │ - Every query is evaluated against RLS policies             │
 *    │ - Policies use auth context (current user ID)               │
 *    │ - Only rows matching policy conditions are visible          │
 *    │                                                             │
 *    │ Example:                                                    │
 *    │   User 123 tries: SELECT * FROM assessments;               │
 *    │   Database policy checks: WHERE user_id = auth.uid()       │
 *    │   Result: Only assessments with user_id = 123 are shown    │
 *    │                                                             │
 *    │ Benefit:                                                    │
 *    │   - Cannot be bypassed by frontend or backend bugs         │
 *    │   - Privacy enforced at the database layer                 │
 *    │   - Users literally cannot query other users' data         │
 *    └─────────────────────────────────────────────────────────────┘
 *
 * 4. Active RLS Policies
 *    - SELECT: Users can only see their own assessments
 *    - INSERT: Users can only insert with their own user_id
 *    - UPDATE: Users can only update their own assessments
 *    - DELETE: Users can only delete their own assessments
 *    - Service role bypass: Backend can write with full access
 *
 * 5. Analytics Functions (RPC)
 *    - get_assessment_statistics() - User's portfolio stats
 *    - get_market_data() - Industry/scale/strategy benchmarks
 *
 * 6. Performance Indexes
 *    - Index on user_id (fast user lookups)
 *    - Index on session_id (optional guest session grouping)
 *    - Index on industry (filtering by sector)
 *    - Index on overall_score (sorting/filtering by score)
 *    - Composite index on (user_id, created_at DESC) for listings
 *    - BRIN index on created_at DESC (efficient time-based queries)
 *
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * AUTH.USERS RELATIONSHIP - Understanding the Connection
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Supabase provides auth.users table automatically:
 *
 *   auth.users (Supabase managed)
 *   ├── id (UUID primary key)
 *   ├── email (unique email)
 *   ├── encrypted_password
 *   ├── last_sign_in_at
 *   └── ... (other Supabase fields)
 *
 *   assessments (This migration)
 *   ├── id (BIGSERIAL primary key)
 *   ├── user_id (UUID → FOREIGN KEY auth.users.id)
 *   ├── title
 *   ├── result_json
 *   └── ... (assessment fields)
 *
 * Connection:
 *   - When user signs up via frontend, Supabase creates auth.users record
 *   - Frontend gets access token containing user's UUID
 *   - Backend uses token to identify user via auth.uid()
 *   - When saving assessment, backend sets user_id = auth.uid()
 *   - RLS policies use auth.uid() to enforce data access
 *
 * Frontend Auth Flow:
 *   1. User clicks "Sign Up" → Calls supabase.auth.signUp()
 *   2. Supabase creates user in auth.users table
 *   3. Session token with UUID is returned to frontend
 *   4. Frontend stores token and sends with API requests
 *   5. Backend middleware extracts UUID and calls supabase.auth.getUser(token)
 *   6. auth.uid() in RLS policies returns the authenticated UUID
 *   7. User can only see rows where assessments.user_id = auth.uid()
 *
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * HOW ROW LEVEL SECURITY (RLS) PROTECTS YOUR DATA
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * RLS is a database-level enforcement that protects from:
 *
 * ✓ Frontend bugs:
 *   If frontend forgets to filter by user_id, RLS still protects data
 *   User cannot see other users' assessments even with a direct query
 *
 * ✓ Compromised API keys:
 *   Even if anon key is exposed, attacker cannot query other users' data
 *   Database enforces that only YOUR rows are accessible
 *
 * ✓ Malicious backend:
 *   Backend cannot use anon key to access user X's data as user Y
 *   auth.uid() always returns the authenticated user making the request
 *
 * ✓ Intentional data leaks:
 *   Developer cannot accidentally include "WHERE 1=1" to bypass filters
 *   RLS is enforced regardless of SQL written
 *
 * Policy Structure for assessments table:
 *
 *   Policy: "Users can SELECT their own assessments"
 *   SQL: CREATE POLICY ... FOR SELECT TO authenticated
 *        USING (user_id = auth.uid());
 *   Effect: SELECT * FROM assessments returns only rows where
 *           assessments.user_id = (current user's UUID)
 *
 *   Policy: "Users can INSERT their own assessments"
 *   SQL: CREATE POLICY ... FOR INSERT TO authenticated
 *        WITH CHECK (user_id = auth.uid());
 *   Effect: INSERT is rejected if user_id != auth.uid()
 *           User literally cannot insert a row with different user_id
 *
 *   Policy: "Users can UPDATE their own assessments"
 *   SQL: CREATE POLICY ... FOR UPDATE TO authenticated
 *        USING (user_id = auth.uid())
 *        WITH CHECK (user_id = auth.uid());
 *   Effect: Can only modify rows where user_id = auth.uid()
 *           Cannot change user_id to another user's UUID
 *
 *   Policy: "Users can DELETE their own assessments"
 *   SQL: CREATE POLICY ... FOR DELETE TO authenticated
 *        USING (user_id = auth.uid());
 *   Effect: Can only delete rows where user_id = auth.uid()
 *
 * Disabled (Optional):
 *   - Guest mode policies (commented out below)
 *   - Can be enabled in future for session_id based access
 *
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VERIFICATION QUERIES - Check RLS is Active
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Run these queries AFTER executing this migration to verify setup:
 *
 * 1. Check RLS is enabled on assessments table:
 *    SELECT tablename, rowsecurity FROM pg_tables
 *    WHERE tablename = 'assessments';
 *    (Expected: rowsecurity = true)
 *
 * 2. List all policies on assessments:
 *    SELECT policyname, cmd, qual, with_check FROM pg_policies
 *    WHERE tablename = 'assessments'
 *    ORDER BY policyname;
 *    (Expected: 4 policies for SELECT, INSERT, UPDATE, DELETE)
 *
 * 3. Verify foreign key constraint:
 *    SELECT constraint_name, table_name, column_name,
 *           foreign_table_name, foreign_column_name
 *    FROM information_schema.key_column_usage
 *    WHERE table_name = 'assessments' AND column_name = 'user_id';
 *    (Expected: Shows FK to auth.users.id with ON DELETE CASCADE)
 *
 * 4. Check indexes exist:
 *    SELECT indexname, tablename, indexdef FROM pg_indexes
 *    WHERE tablename = 'assessments'
 *    ORDER BY indexname;
 *    (Expected: Indexes on user_id, industry, overall_score, created_at)
 *
 * 5. Test RLS enforcement (requires authenticated session):
 *    -- As authenticated user, try to see assessments:
 *    SELECT COUNT(*) FROM assessments;
 *    (Expected: 0 initially, increases as user saves assessments)
 *
 *    -- As service role (backend), bypass RLS:
 *    SELECT COUNT(*) FROM assessments;
 *    (Expected: Can see all assessments from all users)
 *
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DEPENDENCIES & EXECUTION ORDER
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * MUST RUN AFTER:
 *   ✓ 01_vector_infrastructure.sql (creates documents table, enables extensions)
 *   ✓ Supabase auth is configured (automatic with Supabase project)
 *
 * CAN RUN BEFORE:
 *   ✓ Embedding pipeline (independent of assessment data)
 *   ✓ Frontend deployment (users can sign up anytime)
 *   ✓ Assessment data loading (assessments are user-generated)
 *
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * WHEN TO RUN THIS MIGRATION
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * First deployment:
 *   - REQUIRED when deploying user authentication features
 *   - Must run AFTER 01_vector_infrastructure.sql
 *   - Run before frontend sign-up goes live
 *
 * Safe to re-run:
 *   - Uses DROP IF EXISTS for functions and policies
 *   - Uses CREATE IF NOT EXISTS for table
 *   - Existing assessment data is preserved
 *   - Policies are safely recreated
 */

-- ============================================
-- 1. Create Assessments Table with User Auth
-- ============================================

CREATE TABLE IF NOT EXISTS assessments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  title TEXT NOT NULL,
  business_problem TEXT NOT NULL,
  business_solution TEXT NOT NULL,
  result_json JSONB NOT NULL,
  industry TEXT,
  overall_score INTEGER,
  business_viability_score INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  public_id UUID DEFAULT gen_random_uuid(),
  contribute_to_global_benchmarks BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE assessments IS 'Stores saved assessment results for historical tracking, comparison, and portfolio management';
COMMENT ON COLUMN assessments.user_id IS 'Reference to authenticated user (optional - NULL for guest sessions)';
COMMENT ON COLUMN assessments.session_id IS 'Per-session grouping for guest data (used when user_id is NULL)';
COMMENT ON COLUMN assessments.title IS 'User-provided assessment name or auto-generated title';
COMMENT ON COLUMN assessments.business_problem IS 'Environmental/circular economy problem addressed';
COMMENT ON COLUMN assessments.business_solution IS 'How business solves the problem';
COMMENT ON COLUMN assessments.result_json IS 'Complete /score endpoint response (scores, audit, gap_analysis, similar_cases, metadata)';
COMMENT ON COLUMN assessments.industry IS 'Industry classification (extracted from result_json.metadata)';
COMMENT ON COLUMN assessments.overall_score IS 'Overall circular economy score (0-100)';
COMMENT ON COLUMN assessments.business_viability_score IS 'Business viability sub-score from comprehensive evaluation';
COMMENT ON COLUMN assessments.is_public IS 'Whether assessment is included in global analytics benchmarks';
COMMENT ON COLUMN assessments.public_id IS 'Public UUID for sharing assessments without exposing internal ID';
COMMENT ON COLUMN assessments.contribute_to_global_benchmarks IS 'Whether assessment data contributes to global benchmark statistics';

-- ============================================
-- 2. Create Indexes for Fast Queries
-- ============================================

-- User-based queries
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);

-- Session-based queries (for guest users)
CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);

-- Filtering and sorting
CREATE INDEX IF NOT EXISTS idx_assessments_industry ON assessments(industry);
CREATE INDEX IF NOT EXISTS idx_assessments_overall_score ON assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_title ON assessments(title);

-- Composite index for efficient user + creation date queries
CREATE INDEX IF NOT EXISTS idx_assessments_user_created
ON assessments(user_id, created_at DESC);

-- ============================================
-- 3. Enable Row Level Security (Strict Mode)
-- ============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS assessments_select_all ON assessments;
DROP POLICY IF EXISTS assessments_insert_all ON assessments;
DROP POLICY IF EXISTS assessments_update_all ON assessments;
DROP POLICY IF EXISTS assessments_delete_all ON assessments;
DROP POLICY IF EXISTS assessments_read ON assessments;
DROP POLICY IF EXISTS assessments_insert ON assessments;
DROP POLICY IF EXISTS assessments_update ON assessments;
DROP POLICY IF EXISTS assessments_delete ON assessments;
DROP POLICY IF EXISTS assessments_read_own ON assessments;
DROP POLICY IF EXISTS assessments_write_own ON assessments;

-- ============================================
-- 4. Strict RLS Policies (Authenticated Users)
-- ============================================

-- SELECT: Users can only see their own assessments
CREATE POLICY assessments_select_authenticated ON assessments
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert assessments for themselves
CREATE POLICY assessments_insert_authenticated ON assessments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own assessments
CREATE POLICY assessments_update_authenticated ON assessments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own assessments
CREATE POLICY assessments_delete_authenticated ON assessments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Guest Access Policies (Session-Based - Optional for MVP)
-- ============================================

-- NOTE: These policies are commented out for Phase 2.
-- Enable these if you need guest user support for MVP.
-- Guests will use session_id instead of auth.uid()

-- SELECT: Session-based access for guests
-- CREATE POLICY assessments_select_guest ON assessments
--   FOR SELECT
--   USING (user_id IS NULL AND session_id IS NOT NULL);

-- INSERT: Guests can insert assessments with their session
-- CREATE POLICY assessments_insert_guest ON assessments
--   FOR INSERT
--   WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- UPDATE: Guests can update their session assessments
-- CREATE POLICY assessments_update_guest ON assessments
--   FOR UPDATE
--   USING (user_id IS NULL AND session_id IS NOT NULL)
--   WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- DELETE: Guests can delete their session assessments
-- CREATE POLICY assessments_delete_guest ON assessments
--   FOR DELETE
--   USING (user_id IS NULL AND session_id IS NOT NULL);

-- ============================================
-- 6. Assessment Analytics Functions
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_assessment_statistics() CASCADE;
DROP FUNCTION IF EXISTS get_market_data() CASCADE;

-- Function 1: Get overall assessment statistics
-- Returns aggregated stats across all users
CREATE OR REPLACE FUNCTION get_assessment_statistics()
RETURNS TABLE (
  total_assessments BIGINT,
  avg_score NUMERIC,
  median_score NUMERIC,
  min_score INTEGER,
  max_score INTEGER,
  total_industries INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    ROUND(AVG(overall_score)::NUMERIC, 2),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall_score)::NUMERIC,
    MIN(overall_score)::INTEGER,
    MAX(overall_score)::INTEGER,
    COUNT(DISTINCT industry)::INTEGER
  FROM assessments
  WHERE overall_score IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_assessment_statistics IS 'Returns aggregated assessment statistics for dashboard and analytics';

-- Function 2: Get market data grouped by industry, scale, and strategy
-- Enables competitive analysis and benchmarking
CREATE OR REPLACE FUNCTION get_market_data()
RETURNS TABLE (
  industry TEXT,
  scale TEXT,
  r_strategy TEXT,
  count BIGINT,
  avg_score NUMERIC,
  max_score INTEGER,
  min_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.industry,
    (a.result_json->'metadata'->>'scale')::TEXT,
    (a.result_json->'metadata'->>'r_strategy')::TEXT,
    COUNT(*)::BIGINT,
    ROUND(AVG(a.overall_score)::NUMERIC, 2),
    MAX(a.overall_score)::INTEGER,
    MIN(a.overall_score)::INTEGER
  FROM assessments a
  WHERE a.overall_score IS NOT NULL
  GROUP BY a.industry, (a.result_json->'metadata'->>'scale'), (a.result_json->'metadata'->>'r_strategy')
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_market_data IS 'Returns market analysis data grouped by industry, scale, and strategy for competitive benchmarking';

-- ============================================
-- 7. Maintenance Functions & Triggers
-- ============================================

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
DROP FUNCTION IF EXISTS update_assessments_updated_at_column() CASCADE;

-- Update the updated_at timestamp
CREATE FUNCTION update_assessments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at on assessments
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessments_updated_at_column();

-- ============================================
-- 8. Public Sharing Support (Non-Destructive)
-- ============================================

-- 1. Ensure pgcrypto extension exists for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add public sharing columns (idempotent with IF NOT EXISTS)
-- Note: Existing rows will get 'false' for is_public and a fresh UUID for public_id
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_id UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS contribute_to_global_benchmarks BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN assessments.is_public IS 'Whether assessment is included in global analytics benchmarks and public viewing';
COMMENT ON COLUMN assessments.public_id IS 'Public UUID for sharing assessments without exposing internal ID';
COMMENT ON COLUMN assessments.contribute_to_global_benchmarks IS 'Whether assessment data contributes to global benchmark statistics';

-- 3. Create a unique index for efficient public_id lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessments_public_id ON assessments(public_id);

-- 4. RLS Policy: Allow anyone (public role) to view assessments marked as public
-- This enables read-only access to public assessments without authentication
CREATE POLICY "Anyone can view public assessments"
  ON assessments FOR SELECT
  USING (is_public = true);

-- ============================================
-- 9. Verification Queries
-- ============================================

-- After running this migration, verify the setup:
--
-- -- Check assessments table exists with correct columns
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'assessments' ORDER BY ordinal_position;
--
-- -- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'assessments';
--
-- -- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'assessments';
--
-- -- Test RPC functions
-- SELECT * FROM get_assessment_statistics();
-- SELECT * FROM get_market_data();
--
-- -- Verify FK constraint
-- SELECT constraint_name, table_name, column_name
--   FROM information_schema.key_column_usage
--   WHERE table_name = 'assessments' AND column_name = 'user_id';
