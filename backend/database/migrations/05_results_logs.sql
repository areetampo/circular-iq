-- MIGRATION: 05_results_logs.sql (v2 — fully aligned with assessments v3)
-- Immutable Audit Log — every scoring API call recorded here

-- DESIGN DECISIONS:
-- • INSERT‑only table (no UPDATE/DELETE for non‑service roles).
-- • user_id is nullable — NULL = anonymous session.
-- • Privacy‑preserving fingerprints (ip_hash, identifier_hash, user_agent_snippet)
--   mirror anonymous_usage for abuse analysis without storing PII.
-- • result_snapshot stores the FULL scoring API response for reproducibility.
-- • Promoted scalar columns (overall_score, industry, risk_level, etc.) mirror the
--   assessments table for fast aggregation without parsing JSONB.
-- • Auto‑cleanup: rows older than 90 days are purged by cleanup_old_scoring_results_log().

-- PURPOSE:
-- - Immutable audit trail of all scoring API calls, supporting analytics,
--   abuse detection, and full result reproducibility.
-- - Enables joining with anonymous_usage via identifier_hash for usage pattern analysis.
-- - Allows authenticated users to view their own scoring history (RLS).

-- KEY COLUMNS:
-- - request_id: random hex ID from the scoring controller (links logs to backend console).
-- - identifier_hash: SHA‑256 of (IP + User‑Agent) — same as anonymous_usage.
-- - input_parameters: 8‑factor scores submitted by the user.
-- - overall_score, confidence_level, technical_feasibility, economic_viability,
--   circularity_potential, risk_level — promoted scalars for analytics.
-- - industry, scale, primary_material, geographic_focus — extracted metadata.
-- - audit_confidence_score, audit_is_junk_input, audit_integrity_gaps_count,
--   audit_similar_cases_count — audit quality signals.
-- - parameter_consistency_score, parameter_consistency_rating, r_strategy_alignment_score,
--   r_strategy_alignment_rating, r_strategy — Layer 2 enrichment columns.
-- - improvement_roadmap, sdg_alignment, market_opportunity_summary — Layer 3 extended audit.
-- - processing_time_ms, timings — performance metrics.
-- - result_snapshot: complete API response for full UI repopulation.

-- ACCESS CONTROL:
-- - Writes only via service‑role (backend).
-- - Authenticated users can SELECT their own rows.
-- - Anonymous users have no access.
-- - Row Level Security policies enforce these access rules.

-- ============================================
-- 0. Drop if exists (clean slate)
-- ============================================

DROP TABLE IF EXISTS scoring_results_log CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY['cleanup_old_scoring_results_log'];
    func_name text;
    rec record;
BEGIN
    FOREACH func_name IN ARRAY func_names LOOP
        FOR rec IN
            SELECT nspname, proname, oidvectortypes(pg_proc.proargtypes) as args
            FROM pg_proc
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE proname = func_name AND nspname = 'public'
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
              rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 1. Table
-- ============================================

CREATE TABLE IF NOT EXISTS scoring_results_log (
  -- ── Identity ─────────────────────────────────────────────────────────────────
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Request provenance (log-only) ────────────────────────────────────────────
  request_id            TEXT,                   -- scoring controller's requestId (random hex)
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous          BOOLEAN NOT NULL DEFAULT TRUE,

  -- ── Privacy-preserving fingerprints (log-only) ───────────────────────────────
  ip_hash               TEXT,                   -- SHA-256 of client IP
  identifier_hash       TEXT,                   -- SHA-256 of (IP + User-Agent)
  user_agent_snippet    TEXT,                   -- first 200 chars of User-Agent

  -- ── User-supplied inputs ─────────────────────────────────────────────────────
  business_problem      TEXT,
  business_solution     TEXT,
  business_problem_len  INTEGER,                -- length analytics (log-only)
  business_solution_len INTEGER,                -- length analytics (log-only)
  evaluation_parameters JSONB,                  -- 8-factor scores submitted
  business_context      JSONB,                  -- structured context submitted

  -- ── Top-level scoring API scalars ────────────────────────────────────────────
  overall_score               INTEGER,
  confidence_level            INTEGER,

  -- ── Derived metrics (promoted scalars) ───────────────────────────────────────
  technical_feasibility       INTEGER,
  economic_viability          INTEGER,
  circularity_potential       INTEGER,
  risk_level                  TEXT CHECK (risk_level IN ('low','medium','high')),

  -- ── Metadata scalars ─────────────────────────────────────────────────────────
  industry              TEXT,
  scale                 TEXT,
  primary_material      TEXT,
  geographic_focus      TEXT,

  -- ── Audit quality signals (promoted scalars) ─────────────────────────────────
  audit_confidence_score        INTEGER,
  audit_is_junk_input           BOOLEAN,
  audit_integrity_gaps_count    INTEGER DEFAULT 0,
  similar_cases_count           INTEGER DEFAULT 0,

  -- ── Layer 2 enrichment scalars ───────────────────────────────────────────────
  parameter_consistency_score   INTEGER,
  parameter_consistency_rating  TEXT,
  r_strategy_alignment_score    INTEGER,
  r_strategy_alignment_rating   TEXT,
  r_strategy                    TEXT,           -- detected strategy (for fast analytics)

  -- ── Full JSON blobs (mirrors assessments columns exactly) ────────────────────
  sub_scores                  JSONB,
  derived_metrics             JSONB,
  score_breakdown             JSONB,
  weighted_score_card         JSONB,
  circular_economy_tier       JSONB,
  parameter_consistency       JSONB,
  r_strategy_alignment        JSONB,
  audit                       JSONB,            -- full audit object
  gap_analysis                JSONB,
  similar_cases               JSONB,
  metadata                    JSONB,

  -- ── Layer 3 audit sub-fields ───────────────────────────────────────
  improvement_roadmap         JSONB,            -- audit.improvement_roadmap
  sdg_alignment               JSONB,            -- audit.sdg_alignment
  market_opportunity_summary  TEXT,             -- audit.market_opportunity_summary

  -- ── Processing performance (log-only) ────────────────────────────────────────
  processing_time_ms    INTEGER,
  timings               JSONB,

  -- ── Full snapshot (equivalent to assessments.result_json) ────────────────────
  result_snapshot       JSONB,

  -- ── Timestamp ────────────────────────────────────────────────────────────────
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ── Column comments ───────────────────────────────────────────────────────────
COMMENT ON TABLE scoring_results_log IS
  'Immutable append-only log of every scoring API call. Fully aligned with assessments table schema for analytics parity.';
COMMENT ON COLUMN scoring_results_log.result_snapshot IS
  'Complete scoring API response — equivalent to assessments.result_json';
COMMENT ON COLUMN scoring_results_log.r_strategy IS
  'Detected R-strategy — promoted scalar for fast analytics, mirrors assessments.r_strategy';
COMMENT ON COLUMN scoring_results_log.business_problem_len IS
  'Length in chars of the business problem (not the content — for input analytics)';
COMMENT ON COLUMN scoring_results_log.business_solution_len IS
  'Length in chars of the business solution (not the content — for input analytics)';
COMMENT ON COLUMN scoring_results_log.improvement_roadmap IS
  'Promoted from audit.improvement_roadmap — 3 prioritised actions';
COMMENT ON COLUMN scoring_results_log.sdg_alignment IS
  'Promoted from audit.sdg_alignment — 2-4 UN SDG objects';
COMMENT ON COLUMN scoring_results_log.market_opportunity_summary IS
  'Promoted from audit.market_opportunity_summary — 2-3 sentence market assessment';
COMMENT ON COLUMN scoring_results_log.similar_cases IS
  'Full enriched similar_cases array (same as assessments.similar_cases)';
COMMENT ON COLUMN scoring_results_log.audit IS
  'Full audit object — same structure as assessments.audit';

-- ============================================
-- 2. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_srl_created_at
  ON scoring_results_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_srl_user_id
  ON scoring_results_log(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_srl_identifier_hash
  ON scoring_results_log(identifier_hash)
  WHERE identifier_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_srl_overall_score
  ON scoring_results_log(overall_score);

CREATE INDEX IF NOT EXISTS idx_srl_industry
  ON scoring_results_log(industry);

CREATE INDEX IF NOT EXISTS idx_srl_risk_level
  ON scoring_results_log(risk_level);

CREATE INDEX IF NOT EXISTS idx_srl_request_id
  ON scoring_results_log(request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_srl_audit_is_junk
  ON scoring_results_log(audit_is_junk_input)
  WHERE audit_is_junk_input = true;

CREATE INDEX IF NOT EXISTS idx_srl_param_consistency_score
  ON scoring_results_log(parameter_consistency_score);

CREATE INDEX IF NOT EXISTS idx_srl_r_alignment_score
  ON scoring_results_log(r_strategy_alignment_score);

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE scoring_results_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "srl_service_role_full_access"
  ON scoring_results_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "srl_authenticated_select_own"
  ON scoring_results_log FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 4. Cleanup function
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_scoring_results_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  DELETE FROM scoring_results_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_scoring_results_log IS
  'Deletes scoring_results_log rows older than 90 days.';

-- ============================================
-- 5. Grants
-- ============================================

GRANT SELECT, INSERT ON scoring_results_log TO service_role;
GRANT SELECT         ON scoring_results_log TO authenticated;

-- ============================================
-- 6. Verification
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'scoring_results_log';
SELECT policyname FROM pg_policies WHERE tablename = 'scoring_results_log';
SELECT indexname   FROM pg_indexes  WHERE tablename = 'scoring_results_log';
