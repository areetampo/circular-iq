/**
 * ============================================
 * MIGRATION: 02_user_assessments.sql
 * ============================================
 *
 * PHASE 2 - Assessment System & User Authentication
 * STATUS: Required for portfolio & user features
 * RUN AFTER 01_vector_infrastructure.sql is complete
 *
 * WHAT THIS DOES:
 * - Creates assessments table with user-based access control
 * - Implements strict Row Level Security (RLS) policies
 * - Links assessments to auth.users (user ownership)
 * - Creates analytics RPC functions for market analysis
 * - Sets up indexes for efficient user queries
 *
 * WHEN TO RUN:
 * - After 01_vector_infrastructure.sql completes
 * - When deploying Phase 2 features (user authentication, portfolios)
 * - Safe to re-run (uses DROP IF EXISTS, CREATE IF NOT EXISTS)
 *
 * DEPENDENCIES: 01_vector_infrastructure.sql must run first
 *
 * KEY FEATURES:
 * - user_id: UUID foreign key to auth.users (owner of assessment)
 * - session_id: Optional, for guest access (can be enabled later)
 * - Strict RLS: Users can ONLY see/edit/delete their own assessments
 * - get_assessment_statistics(): Dashboard stats
 * - get_market_data(): Industry/scale/strategy benchmarking
 *
 * VERIFY AFTER RUNNING:
 *   SELECT * FROM pg_policies WHERE tablename = 'assessments';
 *   SELECT * FROM get_assessment_statistics();
 *   SELECT * FROM get_market_data() LIMIT 5;
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
-- 8. Verification Queries
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
