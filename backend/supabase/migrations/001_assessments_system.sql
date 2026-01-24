/**
 * Supabase Migration: Assessment System (Phase 2)
 *
 * Adds assessment portfolio tracking and market analysis functionality.
 * Run this migration AFTER setup.sql is executed.
 *
 * Creates:
 * - assessments table (portfolio storage)
 * - RPC functions: get_assessment_statistics(), get_market_data()
 * - RLS policies (public, session-based)
 * - Indexes for fast queries
 */

-- ============================================
-- 1. Create Assessments Table (Phase 2)
-- ============================================

CREATE TABLE IF NOT EXISTS assessments (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT, -- Per-session grouping (no auth)
  title TEXT NOT NULL,
  business_problem TEXT NOT NULL,
  business_solution TEXT NOT NULL,
  result_json JSONB NOT NULL, -- Complete /score response
  industry TEXT,
  overall_score INTEGER,
  business_viability_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE assessments IS 'Stores saved assessment results for historical tracking and comparison';
COMMENT ON COLUMN assessments.result_json IS 'Full /score endpoint response (scores, audit, gap_analysis, similar_cases, metadata)';

-- ============================================
-- 2. Create Indexes for Fast Queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_assessments_session_id ON assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_industry ON assessments(industry);
CREATE INDEX IF NOT EXISTS idx_assessments_overall_score ON assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- ============================================
-- 3. Enable Row Level Security
-- ============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Permissive policies: public access without auth
DROP POLICY IF EXISTS assessments_read_own ON assessments;
DROP POLICY IF EXISTS assessments_write_own ON assessments;
DROP POLICY IF EXISTS assessments_select_all ON assessments;
DROP POLICY IF EXISTS assessments_insert_all ON assessments;
DROP POLICY IF EXISTS assessments_update_all ON assessments;
DROP POLICY IF EXISTS assessments_delete_all ON assessments;

CREATE POLICY assessments_select_all ON assessments FOR SELECT USING (true);
CREATE POLICY assessments_insert_all ON assessments FOR INSERT WITH CHECK (true);
CREATE POLICY assessments_update_all ON assessments FOR UPDATE USING (true);
CREATE POLICY assessments_delete_all ON assessments FOR DELETE USING (true);

-- ============================================
-- 4. Analytics Functions (Phase 2)
-- ============================================

-- Drop existing functions if they exist (safe to re-run migration)
DROP FUNCTION IF EXISTS get_assessment_statistics() CASCADE;
DROP FUNCTION IF EXISTS get_market_data() CASCADE;

-- Function 1: Get overall assessment statistics
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

-- Function 2: Get market data grouped by industry, scale, and strategy
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

-- ============================================
-- 5. Verification Queries
-- ============================================

-- After running this migration, verify the setup:
--
-- SELECT COUNT(*) as total_assessments FROM assessments;
-- SELECT * FROM get_assessment_statistics();
-- SELECT * FROM get_market_data();
