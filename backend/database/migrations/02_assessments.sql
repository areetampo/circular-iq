-- MIGRATION: 02_assessments.sql (v2 — full scoring API schema)
-- User Assessment Storage — OPTIMIZED & SECURED
-- STATUS: Depends on 01_vector_infrastructure.sql

-- CHANGES FROM v1:
-- • Added dedicated columns for every top-level field the scoring API returns:
--   confidence_level, derived_metrics (JSONB), score_breakdown (JSONB),
--   sub_scores (JSONB), audit (JSONB), gap_analysis (JSONB),
--   similar_cases (JSONB), metadata (JSONB), input_parameters (JSONB)
-- • Added scalar sub-columns promoted out of derived_metrics for fast queries:
--   technical_feasibility, economic_viability, circularity_potential, risk_level
-- • Added scalar metadata sub-columns for market analytics:
--   scale, r_strategy, primary_material, geographic_focus
-- • Removed business_viability_score (not a real scoring API field —
--   replaced by economic_viability from derived_metrics)
-- • Updated get_assessment_statistics and get_market_data to use new columns
-- • All prior RLS policies, indexes, and constraints preserved

-- PURPOSE:
-- - Stores complete assessment results with columns mirroring the scoring API response,
--   enabling full UI repopulation without parsing result_json.
-- - Promotes key metrics to scalar columns for fast filtering, sorting, and analytics.
-- - Provides RLS policies for authenticated users and guest sessions.
-- - Includes analytics functions for statistics and market data.
-- - Automatically updates updated_at timestamp.

-- ============================================
-- 0. Drop existing table and functions (clean slate)
-- ============================================

DROP TABLE IF EXISTS assessments CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'get_assessment_statistics',
        'get_market_data',
        'update_assessments_updated_at_column'
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
            WHERE proname = func_name
              AND nspname = 'public'
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;', rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 1. Create Assessments Table
-- ============================================

CREATE TABLE IF NOT EXISTS assessments (
  -- ── Identity ────────────────────────────────────────────────────────────────
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id                  TEXT,          -- kept for guest sessions (removed in 03_)

  -- ── User-supplied inputs ─────────────────────────────────────────────────────
  title                       TEXT NOT NULL,
  business_problem            TEXT NOT NULL,
  business_solution           TEXT NOT NULL,
  evaluation_parameters       JSONB,         -- raw 8-factor scores user entered

  -- ── Top-level scoring API scalars ────────────────────────────────────────────
  overall_score               INTEGER,       -- 0-100
  confidence_level            INTEGER,       -- 0-100  (scores.confidence_level)

  -- ── Derived metrics (promoted scalars for fast filtering / analytics) ────────
  technical_feasibility       INTEGER,       -- derived_metrics.technical_feasibility
  economic_viability          INTEGER,       -- derived_metrics.economic_viability
  circularity_potential       INTEGER,       -- derived_metrics.circularity_potential
  risk_level                  TEXT CHECK (risk_level IN ('low','medium','high')),

  -- ── Metadata scalars (promoted for market analytics & filtering) ─────────────
  industry                    TEXT,
  scale                       TEXT,          -- metadata.scale
  r_strategy                  TEXT,          -- metadata.r_strategy
  primary_material            TEXT,          -- metadata.primary_material
  geographic_focus            TEXT,          -- metadata.geographic_focus

  -- ── Full JSON blobs (complete API response sections) ─────────────────────────
  sub_scores                  JSONB,         -- scores.sub_scores  {public_participation, …}
  derived_metrics             JSONB,         -- scores.derived_metrics (full object)
  score_breakdown             JSONB,         -- scores.score_breakdown (category breakdown)
  audit                       JSONB,         -- auditResult (verdict, gaps, strengths, …)
  gap_analysis                JSONB,         -- gap_analysis (benchmarks, comparisons, …)
  similar_cases               JSONB,         -- formattedCases array (top 4 similar docs)
  metadata                    JSONB,         -- metadata (industry, scale, r_strategy, …)
  weighted_score_card         JSONB,         -- breakdown of factor contributions to overall score
  circular_economy_tier       JSONB,         -- tier classification and guidance
  parameter_consistency       JSONB,         -- internal consistency analysis of parameter choices
  r_strategy_alignment        JSONB,         -- alignment analysis vs detected R-strategy
  business_context            JSONB,         -- user-provided structured business context (model type, stage, geography, volume, material complexity, partnerships)
  result_json                 JSONB NOT NULL, -- FULL scoring API response (complete snapshot)

  -- ── Sharing / visibility ─────────────────────────────────────────────────────
  is_public                   BOOLEAN DEFAULT TRUE,
  public_id                   UUID    DEFAULT gen_random_uuid(),
  contribute_to_global_benchmarks BOOLEAN DEFAULT TRUE,

  -- ── Timestamps ───────────────────────────────────────────────────────────────
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Column comments ───────────────────────────────────────────────────────────
COMMENT ON TABLE  assessments IS
  'Saved assessment results — every column mirrors a field from the scoring API response so the full result can be repopulated without parsing result_json';
COMMENT ON COLUMN assessments.result_json IS
  'Complete raw scoring API response — source of truth for repopulating UI';
COMMENT ON COLUMN assessments.evaluation_parameters IS
  '8-factor scores the user provided (mirrors scoring API response.evaluation_parameters)';
COMMENT ON COLUMN assessments.sub_scores IS
  'Validated 8-factor sub-scores after clamping (mirrors scores.sub_scores)';
COMMENT ON COLUMN assessments.derived_metrics IS
  'Full derived_metrics object from scoring API';
COMMENT ON COLUMN assessments.score_breakdown IS
  'Category-level breakdown (Access / Embedded / Processing Value)';
COMMENT ON COLUMN assessments.audit IS
  'Full AI audit object (verdict, integrity_gaps, strengths, recommendations, …)';
COMMENT ON COLUMN assessments.gap_analysis IS
  'Gap analysis vs similar-case benchmarks';
COMMENT ON COLUMN assessments.similar_cases IS
  'Array of top-4 similar database cases returned by scoring API';
COMMENT ON COLUMN assessments.metadata IS
  'LLM-extracted metadata (industry, scale, r_strategy, primary_material, geographic_focus, short_description)';
COMMENT ON COLUMN assessments.confidence_level IS
  'Score distribution confidence 0-100 (scores.confidence_level)';
COMMENT ON COLUMN assessments.technical_feasibility IS
  'Promoted scalar from derived_metrics for fast analytics';
COMMENT ON COLUMN assessments.economic_viability IS
  'Promoted scalar from derived_metrics for fast analytics';
COMMENT ON COLUMN assessments.circularity_potential IS
  'Promoted scalar from derived_metrics for fast analytics';
COMMENT ON COLUMN assessments.risk_level IS
  'Promoted scalar from derived_metrics: low | medium | high';
COMMENT ON COLUMN assessments.scale IS
  'Promoted from metadata.scale: prototype|pilot|regional|commercial|global';
COMMENT ON COLUMN assessments.r_strategy IS
  'Promoted from metadata.r_strategy (Refuse/Reduce/Reuse/…)';
COMMENT ON COLUMN assessments.business_context IS
  'User-provided structured business context including business_model_type, operational_stage, target_geography, annual_volume_estimate, material_complexity, has_existing_partnerships';
COMMENT ON COLUMN assessments.primary_material IS
  'Promoted from metadata.primary_material (e.g. plastic, e-waste)';
COMMENT ON COLUMN assessments.geographic_focus IS
  'Promoted from metadata.geographic_focus (EU, Asia, global, …)';

-- ============================================
-- 2. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_assessments_user_id       ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_session_id    ON assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_assessments_industry      ON assessments(industry);
CREATE INDEX IF NOT EXISTS idx_assessments_overall_score ON assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_assessments_is_public     ON assessments(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_assessments_created_at    ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_user_created  ON assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_public_id     ON assessments(public_id);
-- Analytics indexes on promoted scalars
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level    ON assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessments_scale         ON assessments(scale);
CREATE INDEX IF NOT EXISTS idx_assessments_r_strategy    ON assessments(r_strategy);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assessments_select_policy ON assessments;
DROP POLICY IF EXISTS assessments_insert_policy ON assessments;
DROP POLICY IF EXISTS assessments_update_policy ON assessments;
DROP POLICY IF EXISTS assessments_delete_policy ON assessments;
-- legacy names
DROP POLICY IF EXISTS assessments_select_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_select_guest         ON assessments;
DROP POLICY IF EXISTS assessments_insert_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_insert_guest         ON assessments;
DROP POLICY IF EXISTS assessments_update_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_update_guest         ON assessments;
DROP POLICY IF EXISTS assessments_delete_authenticated ON assessments;
DROP POLICY IF EXISTS assessments_delete_guest         ON assessments;
DROP POLICY IF EXISTS "Anyone can view public assessments" ON assessments;

CREATE POLICY assessments_select_policy ON assessments
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id OR
    is_public = true OR
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY assessments_insert_policy ON assessments
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user_id OR user_id IS NULL
  );

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

CREATE POLICY assessments_delete_policy ON assessments
  FOR DELETE USING (
    (SELECT auth.uid()) = user_id OR
    (user_id IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  );

-- ============================================
-- 4. Analytics Functions
-- ============================================

-- get_assessment_statistics: now returns richer per-industry stats using
-- promoted scalar columns instead of parsing result_json.
CREATE OR REPLACE FUNCTION get_assessment_statistics(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_assessments        BIGINT,
  completed_assessments    BIGINT,
  avg_score                FLOAT,
  median_score             FLOAT,
  min_score                INTEGER,
  max_score                INTEGER,
  avg_confidence           FLOAT,
  avg_technical_feasibility FLOAT,
  avg_economic_viability   FLOAT,
  avg_circularity_potential FLOAT,
  assessments_by_industry  JSONB,
  assessments_by_risk      JSONB,
  assessments_by_scale     JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT a.*
    FROM assessments a
    WHERE (user_uuid IS NULL OR a.user_id = user_uuid)
      AND a.overall_score IS NOT NULL
  ),
  stats AS (
    SELECT
      COUNT(*)::BIGINT                              AS total,
      COUNT(*) FILTER (WHERE overall_score IS NOT NULL)::BIGINT AS completed,
      AVG(overall_score::FLOAT)                    AS avg_sc,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall_score) AS median_sc,
      MIN(overall_score)                           AS min_sc,
      MAX(overall_score)                           AS max_sc,
      AVG(confidence_level::FLOAT)                 AS avg_conf,
      AVG(technical_feasibility::FLOAT)            AS avg_tf,
      AVG(economic_viability::FLOAT)               AS avg_ev,
      AVG(circularity_potential::FLOAT)            AS avg_cp
    FROM base
  ),
  by_industry AS (
    SELECT jsonb_object_agg(
      COALESCE(industry, 'uncategorized'),
      jsonb_build_object(
        'count', cnt,
        'avg_score', ind_avg
      )
    ) AS ind_stats
    FROM (
      SELECT industry, COUNT(*)::INT AS cnt, ROUND(AVG(overall_score)::NUMERIC, 1) AS ind_avg
      FROM base GROUP BY industry
    ) sub
  ),
  by_risk AS (
    SELECT jsonb_object_agg(COALESCE(risk_level,'unknown'), cnt) AS risk_stats
    FROM (SELECT risk_level, COUNT(*)::INT AS cnt FROM base GROUP BY risk_level) sub
  ),
  by_scale AS (
    SELECT jsonb_object_agg(COALESCE(scale,'unknown'), cnt) AS scale_stats
    FROM (SELECT scale, COUNT(*)::INT AS cnt FROM base GROUP BY scale) sub
  )
  SELECT
    s.total, s.completed, s.avg_sc, s.median_sc, s.min_sc, s.max_sc,
    s.avg_conf, s.avg_tf, s.avg_ev, s.avg_cp,
    COALESCE(bi.ind_stats,  '{}'::jsonb),
    COALESCE(br.risk_stats, '{}'::jsonb),
    COALESCE(bs.scale_stats,'{}'::jsonb)
  FROM stats s
  CROSS JOIN by_industry bi
  CROSS JOIN by_risk     br
  CROSS JOIN by_scale    bs;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION get_assessment_statistics IS
  'Aggregated statistics for all (or one user''s) assessments using promoted scalar columns';

-- get_market_data: returns per-industry/scale/strategy aggregate rows
-- used by the market-analysis endpoints and dashboard.
CREATE OR REPLACE FUNCTION get_market_data()
RETURNS TABLE (
  industry        TEXT,
  scale           TEXT,
  r_strategy      TEXT,
  avg_score       NUMERIC,
  min_score       INTEGER,
  max_score       INTEGER,
  avg_confidence  NUMERIC,
  avg_tech_feas   NUMERIC,
  avg_econ_viab   NUMERIC,
  avg_circ_pot    NUMERIC,
  count           BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.industry,
    a.scale,
    a.r_strategy,
    ROUND(AVG(a.overall_score)::NUMERIC, 1)              AS avg_score,
    MIN(a.overall_score)                                 AS min_score,
    MAX(a.overall_score)                                 AS max_score,
    ROUND(AVG(a.confidence_level)::NUMERIC, 1)           AS avg_confidence,
    ROUND(AVG(a.technical_feasibility)::NUMERIC, 1)      AS avg_tech_feas,
    ROUND(AVG(a.economic_viability)::NUMERIC, 1)         AS avg_econ_viab,
    ROUND(AVG(a.circularity_potential)::NUMERIC, 1)      AS avg_circ_pot,
    COUNT(*)                                             AS count
  FROM assessments a
  WHERE a.overall_score IS NOT NULL
    AND a.contribute_to_global_benchmarks = TRUE
  GROUP BY a.industry, a.scale, a.r_strategy
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION get_market_data IS
  'Per-industry/scale/strategy market benchmark data for analytics dashboard';

-- ============================================
-- 5. updated_at Trigger
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

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_assessments_updated_at_column();

-- ============================================
-- 6. Grants
-- ============================================

GRANT ALL ON assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assessments TO anon;
GRANT ALL ON assessments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE assessments_id_seq TO authenticated, anon, service_role;

-- ============================================
-- 7. Constraints
-- ============================================

ALTER TABLE assessments ADD CONSTRAINT check_title_not_empty
  CHECK (title != '');

ALTER TABLE assessments ADD CONSTRAINT check_business_problem_not_empty
  CHECK (business_problem != '');

ALTER TABLE assessments ADD CONSTRAINT check_business_solution_not_empty
  CHECK (business_solution != '');

-- ============================================
-- 8. Verification
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'assessments';
SELECT policyname FROM pg_policies WHERE tablename = 'assessments';
SELECT indexname  FROM pg_indexes  WHERE tablename = 'assessments';
