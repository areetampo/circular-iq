-- MIGRATION: 05_results_logs.sql (NEW)
-- Immutable Audit Log — every scoring API call recorded here
--
-- DESIGN DECISIONS:
-- • INSERT‑only table (no UPDATE/DELETE for non‑service roles).
-- • user_id is nullable — NULL = anonymous session.
-- • Privacy‑preserving fingerprints (ip_hash, identifier_hash, user_agent_snippet)
--   mirror anonymous_usage for abuse analysis without storing PII.
-- • result_snapshot stores the FULL scoring API response for reproducibility.
-- • Promoted scalar columns (overall_score, industry, risk_level, etc.) mirror the
--   assessments table for fast aggregation without parsing JSONB.
-- • Auto‑cleanup: rows older than 90 days are purged by cleanup_old_scoring_results_log().
--
-- PURPOSE:
-- - Immutable audit trail of all scoring API calls, supporting analytics,
--   abuse detection, and full result reproducibility.
-- - Enables joining with anonymous_usage via identifier_hash for usage pattern analysis.
-- - Allows authenticated users to view their own scoring history (RLS).
--
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
--
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
    func_names text[] := ARRAY[
        'cleanup_old_scoring_results_log'
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

  -- ── Request provenance ────────────────────────────────────────────────────────
  request_id            TEXT,                   -- scoring controller's requestId (random hex)
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
                                                -- NULL = anonymous session
  is_anonymous          BOOLEAN NOT NULL DEFAULT TRUE,

  -- ── Privacy-preserving fingerprints (mirrors anonymous_usage) ────────────────
  ip_hash               TEXT,                   -- SHA-256 of client IP
  identifier_hash       TEXT,                   -- SHA-256 of (IP + User-Agent) — same as anonymous_usage
  user_agent_snippet    TEXT,                   -- first 200 chars of User-Agent

  -- ── Inputs (truncated to avoid bloat) ────────────────────────────────────────
  business_problem      TEXT,                   -- full business problem text
  business_solution     TEXT,                   -- full business solution text
  business_problem_len  INTEGER,                -- length in chars (not content, for analytics)
  business_solution_len INTEGER,
  evaluation_parameters JSONB,                  -- 8-factor scores user submitted
  business_context      JSONB,                  -- business context fields submitted

  -- ── Scoring results — promoted scalars for fast aggregation ──────────────────
  overall_score         INTEGER,
  confidence_level      INTEGER,
  technical_feasibility INTEGER,
  economic_viability    INTEGER,
  circularity_potential INTEGER,
  risk_level            TEXT CHECK (risk_level IN ('low','medium','high')),

  -- ── Metadata (LLM-extracted) ─────────────────────────────────────────────────
  industry              TEXT,
  scale                 TEXT,
  primary_material      TEXT,
  geographic_focus      TEXT,

  -- ── Audit quality signals ────────────────────────────────────────────────────
  audit_confidence_score INTEGER,              -- audit.confidence_score (LLM's own confidence)
  audit_is_junk_input         BOOLEAN,              -- audit.is_junk_input
  audit_integrity_gaps_count   INTEGER DEFAULT 0,    -- count of integrity gaps found
  audit_similar_cases_count   INTEGER DEFAULT 0,    -- how many similar DB cases were returned

  -- ── Layer 2 enrichment columns ────────────────────────────────────────────
  weighted_score_card         JSONB,         -- factor contribution breakdown
  circular_economy_tier       JSONB,         -- tier classification
  parameter_consistency_score INTEGER,       -- consistency score 0-100 (scalar for fast queries)
  parameter_consistency_rating TEXT,         -- High / Moderate / Low / Very Low
  r_strategy_alignment_score  INTEGER,       -- alignment score 0-100 (scalar for fast queries)
  r_strategy_alignment_rating TEXT,          -- Strong Alignment / Moderate / Weak / Poor
  r_strategy                  TEXT,          -- detected strategy (mirrors assessments column)

  -- ── Layer 3 extended audit columns ───────────────────────────────────────
  improvement_roadmap         JSONB,         -- array of 3 prioritised actions
  sdg_alignment               JSONB,         -- array of 2-4 SDG objects
  market_opportunity_summary  TEXT,          -- 2-3 sentence market assessment

  -- ── Processing performance ───────────────────────────────────────────────────
  processing_time_ms    INTEGER,              -- total end-to-end ms
  timings               JSONB,               -- per-step timings from processing_info.timings

  -- ── Full snapshot (complete API response — for reproducibility / debugging) ───
  result_snapshot       JSONB,               -- full scoring API response object

  -- ── Timestamp ────────────────────────────────────────────────────────────────
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Column comments for scoring_results_log table
COMMENT ON TABLE scoring_results_log IS
  'Immutable append-only log of every scoring API call. Supports analytics, abuse detection, and reproducibility.';
COMMENT ON COLUMN scoring_results_log.id IS
  'Primary key UUID for this log entry';
COMMENT ON COLUMN scoring_results_log.request_id IS
  'Random hex ID from scoring controller — links logs to backend console output';
COMMENT ON COLUMN scoring_results_log.user_id IS
  'Auth user UUID if logged in, NULL for anonymous sessions';
COMMENT ON COLUMN scoring_results_log.is_anonymous IS
  'TRUE when no authenticated user was present';
COMMENT ON COLUMN scoring_results_log.ip_hash IS
  'SHA-256 of client IP — privacy-safe, same algo as anonymous_usage';
COMMENT ON COLUMN scoring_results_log.identifier_hash IS
  'SHA-256 of IP+UA — can be joined to anonymous_usage.identifier_hash';
COMMENT ON COLUMN scoring_results_log.user_agent_snippet IS
  'First 200 chars of User-Agent header';
COMMENT ON COLUMN scoring_results_log.business_problem_len IS
  'Length in chars of the business problem description (not the content itself)';
COMMENT ON COLUMN scoring_results_log.business_solution_len IS
  'Length in chars of the business solution description (not the content itself)';
COMMENT ON COLUMN scoring_results_log.business_problem IS
  'Full text of the business problem description';
COMMENT ON COLUMN scoring_results_log.business_solution IS
  'Full text of the business solution description';
COMMENT ON COLUMN scoring_results_log.evaluation_parameters IS
  'User-submitted 8-factor evaluation scores (0-100 scale)';
COMMENT ON COLUMN scoring_results_log.business_context IS
  'User-submitted business context (model type, stage, geography, volume, material complexity, partnerships)';
COMMENT ON COLUMN scoring_results_log.overall_score IS
  'Final overall score (0-100)';
COMMENT ON COLUMN scoring_results_log.confidence_level IS
  'LLM-reported confidence level (0-100)';
COMMENT ON COLUMN scoring_results_log.technical_feasibility IS
  'Technical feasibility score (0-100)';
COMMENT ON COLUMN scoring_results_log.economic_viability IS
  'Economic viability score (0-100)';
COMMENT ON COLUMN scoring_results_log.circularity_potential IS
  'Circularity potential score (0-100)';
COMMENT ON COLUMN scoring_results_log.risk_level IS
  'Risk level category (low/medium/high)';
COMMENT ON COLUMN scoring_results_log.industry IS
  'LLM-extracted industry sector';
COMMENT ON COLUMN scoring_results_log.scale IS
  'LLM-extracted company scale (e.g. Startup, SME, Enterprise)';
COMMENT ON COLUMN scoring_results_log.primary_material IS
  'LLM-extracted primary material (e.g. Plastic, Metal, Textile)';
COMMENT ON COLUMN scoring_results_log.geographic_focus IS
  'LLM-extracted geographic focus (e.g. Local, Regional, Global)';
COMMENT ON COLUMN scoring_results_log.audit_confidence_score IS
  'LLM-reported confidence (audit.confidence_score), distinct from score confidence_level';
COMMENT ON COLUMN scoring_results_log.audit_is_junk_input IS
  'LLM-determined boolean flag for junk input (audit.is_junk_input)';
COMMENT ON COLUMN scoring_results_log.audit_integrity_gaps_count IS
  'Count of integrity gaps found during scoring (audit.integrity_gaps)';
COMMENT ON COLUMN scoring_results_log.audit_similar_cases_count IS
  'Number of similar cases returned from DB during scoring (audit.similar_cases_count)';
COMMENT ON COLUMN scoring_results_log.weighted_score_card IS
  'JSONB object breaking down the overall score into factor contributions (for explainability)';
COMMENT ON COLUMN scoring_results_log.circular_economy_tier IS
  'LLM-determined circular economy tier classification (e.g. Tier 1: Circular, Tier 2: Partially Circular, Tier 3: Linear)';
COMMENT ON COLUMN scoring_results_log.parameter_consistency_score IS
  'Scalar consistency score 0-100 for fast aggregation without parsing JSONB';
COMMENT ON COLUMN scoring_results_log.parameter_consistency_rating IS
  'Categorical rating (High/Moderate/Low/Very Low) derived from parameter_consistency_score';
COMMENT ON COLUMN scoring_results_log.r_strategy_alignment_score IS
  'Scalar alignment score 0-100 for fast aggregation without parsing JSONB';
COMMENT ON COLUMN scoring_results_log.r_strategy_alignment_rating IS
  'Categorical rating (Strong Alignment / Moderate / Weak / Poor) derived from r_strategy_alignment_score';
COMMENT ON COLUMN scoring_results_log.r_strategy IS
  'LLM-detected R-strategy (e.g. Refuse, Rethink, Reduce, Reuse, Repair, etc.) — mirrors the same column in assessments for easy querying';
COMMENT ON COLUMN scoring_results_log.improvement_roadmap IS
  'LLM-generated prioritised improvement roadmap (3 items)';
COMMENT ON COLUMN scoring_results_log.sdg_alignment IS
  'LLM-generated UN SDG alignment (2-4 goals)';
COMMENT ON COLUMN scoring_results_log.market_opportunity_summary IS
  'LLM-generated market opportunity assessment (2-3 sentences)';
COMMENT ON COLUMN scoring_results_log.processing_time_ms IS
  'Total end-to-end processing time in milliseconds';
COMMENT ON COLUMN scoring_results_log.timings IS
  'Per-step duration breakdown (validation, scoring, embeddings, vectorSearch, audit, …)';
COMMENT ON COLUMN scoring_results_log.result_snapshot IS
  'Complete scoring API response — allows full UI repopulation from this row alone';
COMMENT ON COLUMN scoring_results_log.created_at IS
  'Timestamp of when the scoring API call was made (defaults to NOW())';

-- ============================================
-- 2. Indexes
-- ============================================

-- Time-based (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_srl_created_at
  ON scoring_results_log(created_at DESC);

-- User-based queries
CREATE INDEX IF NOT EXISTS idx_srl_user_id
  ON scoring_results_log(user_id)
  WHERE user_id IS NOT NULL;

-- Anonymous tracking (join with anonymous_usage)
CREATE INDEX IF NOT EXISTS idx_srl_identifier_hash
  ON scoring_results_log(identifier_hash)
  WHERE identifier_hash IS NOT NULL;

-- Analytics on scores
CREATE INDEX IF NOT EXISTS idx_srl_overall_score
  ON scoring_results_log(overall_score);

-- Analytics on industry / strategy
CREATE INDEX IF NOT EXISTS idx_srl_industry
  ON scoring_results_log(industry);

CREATE INDEX IF NOT EXISTS idx_srl_risk_level
  ON scoring_results_log(risk_level);

-- Request ID lookup (for debugging)
CREATE INDEX IF NOT EXISTS idx_srl_request_id
  ON scoring_results_log(request_id)
  WHERE request_id IS NOT NULL;

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE scoring_results_log ENABLE ROW LEVEL SECURITY;

-- Service role: full access (backend writes happen via service-role client)
CREATE POLICY "srl_service_role_full_access"
  ON scoring_results_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users: can read their own rows
CREATE POLICY "srl_authenticated_select_own"
  ON scoring_results_log FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- No INSERT/UPDATE/DELETE from authenticated or anon roles —
-- all writes go through the service-role backend only.
-- (Anon has no policy → no access by default)

-- ============================================
-- 4. Cleanup function (run periodically, e.g. via pg_cron)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_scoring_results_log()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Keep logs for 90 days; adjust retention period here
  DELETE FROM scoring_results_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_scoring_results_log IS
  'Deletes scoring_results_log rows older than 90 days. Schedule via pg_cron or Supabase scheduled functions.';

-- ============================================
-- 5. Grants
-- ============================================

-- Only service_role should INSERT (backend API)
GRANT SELECT, INSERT ON scoring_results_log TO service_role;
GRANT SELECT         ON scoring_results_log TO authenticated;
-- anon has no grants — anonymous users cannot read the log

-- ============================================
-- 6. Verification
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'scoring_results_log';
SELECT policyname FROM pg_policies WHERE tablename = 'scoring_results_log';
SELECT indexname   FROM pg_indexes  WHERE tablename = 'scoring_results_log';
