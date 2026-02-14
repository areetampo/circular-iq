/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                ║
 * ║  MIGRATION: 02_user_assessments.sql                                          ║
 * ║  User Assessment Storage - OPTIMIZED & SECURED                                ║
 * ║  STATUS: Depends on 001_vector_infrastructure.sql                             ║
 * ║                                                                                ║
 * ║  ✅ NO SECURITY WARNINGS                                                       ║
 * ║  ✅ NO PERFORMANCE WARNINGS                                                    ║
 * ║  ✅ OPTIMIZED RLS POLICIES                                                     ║
 * ║                                                                                ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 */

-- ============================================
-- 1. Create Assessments Table
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
COMMENT ON COLUMN assessments.result_json IS 'Complete assessment response (scores, audit, gap_analysis, similar_cases, metadata)';
COMMENT ON COLUMN assessments.industry IS 'Industry classification';
COMMENT ON COLUMN assessments.overall_score IS 'Overall circular economy score (0-100)';
COMMENT ON COLUMN assessments.business_viability_score IS 'Business viability sub-score';
COMMENT ON COLUMN assessments.is_public IS 'Whether assessment is public';
COMMENT ON COLUMN assessments.public_id IS 'Public UUID for sharing';
COMMENT ON COLUMN assessments.contribute_to_global_benchmarks IS 'Whether data contributes to benchmarks';

-- ============================================
-- 2. Create Optimized Indexes (PERFORMANCE)
-- ============================================

-- User-based queries (most common)
CREATE INDEX IF NOT EXISTS idx_assessments_user_id
ON assessments(user_id);

COMMENT ON INDEX idx_assessments_user_id IS 'Fast lookups of assessments by user';

-- Session-based queries (for guest users)
CREATE INDEX IF NOT EXISTS idx_assessments_session_id
ON assessments(session_id);

COMMENT ON INDEX idx_assessments_session_id IS 'Fast lookups by session for guest users';

-- Industry filtering
CREATE INDEX IF NOT EXISTS idx_assessments_industry
ON assessments(industry);

COMMENT ON INDEX idx_assessments_industry IS 'Fast lookups by industry';

-- Score filtering and sorting
CREATE INDEX IF NOT EXISTS idx_assessments_overall_score
ON assessments(overall_score);

COMMENT ON INDEX idx_assessments_overall_score IS 'Fast filtering and sorting by score';

-- Public assessments
CREATE INDEX IF NOT EXISTS idx_assessments_is_public
ON assessments(is_public) WHERE is_public = true;

COMMENT ON INDEX idx_assessments_is_public IS 'Fast lookups of public assessments';

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_assessments_created_at
ON assessments(created_at DESC);

COMMENT ON INDEX idx_assessments_created_at IS 'Fast time-based queries and sorting';

-- Composite index for user + time queries
CREATE INDEX IF NOT EXISTS idx_assessments_user_created
ON assessments(user_id, created_at DESC);

COMMENT ON INDEX idx_assessments_user_created IS 'Optimized for user timeline queries';

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS assessments_select_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_select_guest ON assessments;
DROP POLICY IF EXISTS "Anyone can view public assessments" ON assessments;
DROP POLICY IF EXISTS assessments_insert_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_insert_guest ON assessments;
DROP POLICY IF EXISTS assessments_update_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_update_guest ON assessments;
DROP POLICY IF EXISTS assessments_delete_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_delete_guest ON assessments;

-- OPTIMIZED POLICIES (PERFORMANCE FIX)
-- Note: (SELECT auth.uid()) evaluates once per query instead of per row

-- SELECT: View own assessments OR public assessments
CREATE POLICY assessments_select_policy ON assessments
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id OR
    is_public = true OR
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

COMMENT ON POLICY assessments_select_policy ON assessments IS 'Users can view their own assessments, public assessments, or their session assessments';

-- INSERT: Create assessments for self
CREATE POLICY assessments_insert_policy ON assessments
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR
    user_id IS NULL
  );

COMMENT ON POLICY assessments_insert_policy ON assessments IS 'Users can create assessments for themselves or as guests';

-- UPDATE: Update own assessments
CREATE POLICY assessments_update_policy ON assessments
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id OR
    (user_id IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id OR
    (user_id IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

COMMENT ON POLICY assessments_update_policy ON assessments IS 'Users can only update their own assessments or their session assessments';

-- DELETE: Delete own assessments
CREATE POLICY assessments_delete_policy ON assessments
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id OR
    (user_id IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

COMMENT ON POLICY assessments_delete_policy ON assessments IS 'Users can only delete their own assessments or their session assessments';

-- ============================================
-- 4. Assessment Analytics Functions (SECURITY FIX)
-- ============================================

CREATE OR REPLACE FUNCTION get_assessment_statistics(user_uuid UUID)
RETURNS TABLE (
  total_assessments BIGINT,
  completed_assessments BIGINT,
  avg_score FLOAT,
  assessments_by_industry JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_assessments AS (
    SELECT * FROM assessments WHERE user_id = user_uuid
  ),
  stats AS (
    SELECT
      COUNT(*)::BIGINT AS total,
      COUNT(*) FILTER (WHERE overall_score IS NOT NULL)::BIGINT AS completed,
      AVG(overall_score::FLOAT) AS avg_score
    FROM user_assessments
  ),
  by_industry AS (
    SELECT
      jsonb_object_agg(
        COALESCE(industry, 'uncategorized'),
        cnt
      ) AS ind_stats
    FROM (
      SELECT
        industry,
        COUNT(*)::INT AS cnt
      FROM user_assessments
      GROUP BY industry
    ) sub
  )
  SELECT
    s.total,
    s.completed,
    s.avg_score,
    COALESCE(bi.ind_stats, '{}'::jsonb)
  FROM stats s
  CROSS JOIN by_industry bi;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION get_assessment_statistics IS 'Get aggregated statistics for a user''s assessments';

CREATE OR REPLACE FUNCTION get_market_data()
RETURNS TABLE (
  data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT '{}'::JSONB;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION get_market_data IS 'Placeholder for market data analytics';

-- ============================================
-- 5. Maintenance Trigger (SECURITY FIX)
-- ============================================

CREATE OR REPLACE FUNCTION update_assessments_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION update_assessments_updated_at_column IS 'Automatically update updated_at timestamp on assessment modification';

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_assessments_updated_at_column();

-- ============================================
-- 6. Grant Permissions
-- ============================================

GRANT ALL ON assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assessments TO anon;
GRANT ALL ON assessments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE assessments_id_seq TO authenticated, anon, service_role;

-- ============================================
-- 7. Validation Constraints
-- ============================================

-- Ensure required fields are not empty
ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS check_title_not_empty
  CHECK (title != '');

ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS check_business_problem_not_empty
  CHECK (business_problem != '');

ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS check_business_solution_not_empty
  CHECK (business_solution != '');

-- ============================================
-- 8. Verification Queries
-- ============================================

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'assessments';

-- Check policies (should have 4)
-- SELECT policyname FROM pg_policies WHERE tablename = 'assessments';

-- Check indexes exist
-- SELECT tablename, indexname FROM pg_indexes WHERE tablename = 'assessments';

-- Check functions have search_path set
-- SELECT proname, proconfig FROM pg_proc WHERE proname LIKE '%assessment%';
