-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 05_results_logs.sql (v2)
-- Scoring Results Log — immutable audit trail of every scoring API call
-- ══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE
-- ───────
-- • Provides an immutable, append-only record of every scoring API call —
--   anonymous and authenticated — for analytics, abuse detection, and
--   full result reproducibility.
-- • Stores promoted scalar columns mirroring the assessments table so
--   aggregation queries never need to parse JSONB.
-- • Links to anonymous_usage via identifier_hash for usage pattern analysis.
-- • Lets authenticated users view their own scoring history via RLS.
-- • Includes a cleanup function that purges rows older than 90 days.
--
-- DESIGN DECISIONS
-- ────────────────
-- • INSERT-only for application roles: no UPDATE or DELETE (audit integrity).
--   Only service_role can write; authenticated can only SELECT own rows.
-- • user_id nullable: NULL = anonymous session. is_anonymous flag mirrors this
--   for fast filtering without a NULL check.
-- • Privacy-preserving fingerprints (ip_hash, identifier_hash, user_agent_snippet)
--   match anonymous_usage columns so the two tables can be joined for abuse
--   analysis without storing PII.
-- • result_snapshot = complete scoring API response: guarantees full UI
--   repopulation from a single column if promoted scalars ever drift.
-- • Promoted scalars (overall_score, risk_level, industry, r_strategy, …):
--   enable fast GROUP BY / ORDER BY analytics without JSONB extraction.
-- • Layer 3 sub-fields (improvement_roadmap, sdg_alignment, market_opportunity_summary)
--   are promoted from audit JSONB for direct query access.
-- • request_id links log rows to backend console output for debugging.
--
-- ACCESS CONTROL
-- ──────────────
-- • service_role:  SELECT + INSERT (all writes from Express backend).
-- • authenticated: SELECT own rows only (RLS: auth.uid() = user_id).
-- • anon:          no access.
-- • cleanup_old_scoring_results_log: service_role only (scheduled job).
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
-- Drop table first — CASCADE removes dependent indexes and RLS policies.
-- Then drop every function in this migration regardless of signature.

DROP TABLE IF EXISTS scoring_results_log CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY['cleanup_old_scoring_results_log'];
    func_name  text;
    rec        record;
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
-- 1. TABLE — scoring_results_log
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scoring_results_log (

    -- ── Identity ─────────────────────────────────────────────────────────────
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ── Request provenance ───────────────────────────────────────────────────
    request_id                  TEXT,           -- scoring controller requestId (random hex) — links to backend logs
    user_id                     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_anonymous                BOOLEAN     NOT NULL DEFAULT TRUE,

    -- ── Privacy-preserving fingerprints ──────────────────────────────────────
    -- Match anonymous_usage columns exactly so the two tables can be joined
    -- for usage pattern analysis without exposing PII.
    ip_hash                     TEXT,           -- SHA-256 of client IP
    identifier_hash             TEXT,           -- SHA-256 of (IP + User-Agent)
    user_agent_snippet          TEXT,           -- first 200 chars of User-Agent

    -- ── User-supplied inputs ─────────────────────────────────────────────────
    business_problem            TEXT,
    business_solution           TEXT,
    business_problem_len        INTEGER,        -- char length for input analytics (not content)
    business_solution_len       INTEGER,        -- char length for input analytics (not content)
    evaluation_parameters       JSONB,          -- 8-factor scores submitted by the user
    business_context            JSONB,          -- structured context submitted by the user

    -- ── Top-level scoring API scalars ────────────────────────────────────────
    overall_score               INTEGER,
    confidence_level            INTEGER,

    -- ── Derived metrics (promoted from derived_metrics JSONB) ────────────────
    technical_feasibility       INTEGER,
    economic_viability          INTEGER,
    circularity_potential       INTEGER,
    risk_level                  TEXT CHECK (risk_level IN ('low', 'medium', 'high')),

    -- ── Metadata scalars ─────────────────────────────────────────────────────
    industry                    TEXT,
    scale                       TEXT,
    primary_material            TEXT,
    geographic_focus            TEXT,

    -- ── Audit quality signals (promoted from audit JSONB) ────────────────────
    audit_confidence_score      INTEGER,
    audit_is_junk_input         BOOLEAN,
    audit_integrity_gaps_count  INTEGER         DEFAULT 0,
    similar_cases_count         INTEGER         DEFAULT 0,

    -- ── Layer 2 enrichment scalars ───────────────────────────────────────────
    parameter_consistency_score  INTEGER,
    parameter_consistency_rating TEXT,
    r_strategy_alignment_score   INTEGER,
    r_strategy_alignment_rating  TEXT,
    r_strategy                   TEXT,           -- promoted for fast analytics

    -- ── Full JSON blobs (mirrors assessments table columns exactly) ──────────
    sub_scores                  JSONB,
    derived_metrics             JSONB,
    score_breakdown             JSONB,
    weighted_score_card         JSONB,
    circular_economy_tier       JSONB,
    parameter_consistency       JSONB,
    r_strategy_alignment        JSONB,
    audit                       JSONB,           -- full audit object
    gap_analysis                JSONB,
    similar_cases               JSONB,
    metadata                    JSONB,

    -- ── Layer 3 audit sub-fields (promoted for direct query access) ──────────
    improvement_roadmap         JSONB,           -- audit.improvement_roadmap — 3 prioritised actions
    sdg_alignment               JSONB,           -- audit.sdg_alignment — 2-4 UN SDG objects
    market_opportunity_summary  TEXT,            -- audit.market_opportunity_summary — 2-3 sentence summary

    -- ── Performance metrics ──────────────────────────────────────────────────
    processing_time_ms          INTEGER,
    timings                     JSONB,

    -- ── Full snapshot ────────────────────────────────────────────────────────
    -- Equivalent to assessments.result_json — guarantees full UI repopulation
    -- from a single column if any promoted scalar ever drifts.
    result_snapshot             JSONB,

    -- ── Timestamp ────────────────────────────────────────────────────────────
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  scoring_results_log IS
    'Immutable append-only log of every scoring API call. '
    'Schema mirrors assessments table for analytics parity. '
    'Authenticated users may SELECT their own rows; all writes are service_role only.';
COMMENT ON COLUMN scoring_results_log.result_snapshot IS
    'Complete scoring API response — equivalent to assessments.result_json. '
    'Source of truth if promoted scalar columns ever drift.';
COMMENT ON COLUMN scoring_results_log.request_id IS
    'Random hex ID from the scoring controller. Links this log row to backend console output.';
COMMENT ON COLUMN scoring_results_log.identifier_hash IS
    'SHA-256 of (IP + User-Agent). Matches anonymous_usage.identifier_hash for join-based analysis.';
COMMENT ON COLUMN scoring_results_log.r_strategy IS
    'Detected R-strategy — promoted scalar for fast analytics, mirrors assessments.r_strategy.';
COMMENT ON COLUMN scoring_results_log.business_problem_len IS
    'Character length of the submitted business problem. Stored for input analytics — not the content itself.';
COMMENT ON COLUMN scoring_results_log.business_solution_len IS
    'Character length of the submitted business solution. Stored for input analytics — not the content itself.';
COMMENT ON COLUMN scoring_results_log.improvement_roadmap IS
    'Promoted from audit.improvement_roadmap — 3 prioritised improvement actions.';
COMMENT ON COLUMN scoring_results_log.sdg_alignment IS
    'Promoted from audit.sdg_alignment — 2-4 UN Sustainable Development Goal objects.';
COMMENT ON COLUMN scoring_results_log.market_opportunity_summary IS
    'Promoted from audit.market_opportunity_summary — 2-3 sentence market assessment.';
COMMENT ON COLUMN scoring_results_log.audit IS
    'Full audit object — same structure as assessments.audit.';
COMMENT ON COLUMN scoring_results_log.similar_cases IS
    'Full enriched similar_cases array — same structure as assessments.similar_cases.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_srl_created_at
    ON scoring_results_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_srl_user_id
    ON scoring_results_log (user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_srl_identifier_hash
    ON scoring_results_log (identifier_hash)
    WHERE identifier_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_srl_request_id
    ON scoring_results_log (request_id)
    WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_srl_overall_score
    ON scoring_results_log (overall_score);

CREATE INDEX IF NOT EXISTS idx_srl_industry
    ON scoring_results_log (industry);

CREATE INDEX IF NOT EXISTS idx_srl_risk_level
    ON scoring_results_log (risk_level);

CREATE INDEX IF NOT EXISTS idx_srl_audit_is_junk
    ON scoring_results_log (audit_is_junk_input)
    WHERE audit_is_junk_input = true;

CREATE INDEX IF NOT EXISTS idx_srl_param_consistency_score
    ON scoring_results_log (parameter_consistency_score);

CREATE INDEX IF NOT EXISTS idx_srl_r_alignment_score
    ON scoring_results_log (r_strategy_alignment_score);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE scoring_results_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS srl_service_role_full_access      ON scoring_results_log;
DROP POLICY IF EXISTS srl_authenticated_select_own      ON scoring_results_log;

-- service_role: full access — all writes come from the Express backend.
CREATE POLICY "srl_service_role_full_access"
    ON scoring_results_log FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- authenticated: SELECT own rows only.
-- The subquery form (SELECT auth.uid()) avoids re-evaluating auth.uid()
-- per row, which improves performance on large result sets.
CREATE POLICY "srl_authenticated_select_own"
    ON scoring_results_log FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

COMMENT ON POLICY "srl_service_role_full_access" ON scoring_results_log IS
    'Service role has unrestricted access (all inserts via Express backend).';
COMMENT ON POLICY "srl_authenticated_select_own" ON scoring_results_log IS
    'Authenticated users may only read their own rows (user_id = auth.uid()).';


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. FUNCTION — cleanup_old_scoring_results_log
-- ══════════════════════════════════════════════════════════════════════════════
-- Purges rows older than 90 days to control table growth.
-- Called by a backend scheduled job via service_role — never via REST API.

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
    'Deletes scoring_results_log rows older than 90 days. '
    'Called by backend scheduled job (service_role). Not callable via REST API.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Table: service_role inserts; authenticated can read own rows (RLS enforces).
-- anon has no access (no policy grants SELECT to anon).
GRANT SELECT, INSERT ON scoring_results_log TO service_role;
GRANT SELECT         ON scoring_results_log TO authenticated;

-- cleanup function: service_role only (backend scheduled job).
REVOKE EXECUTE ON FUNCTION cleanup_old_scoring_results_log() FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION cleanup_old_scoring_results_log() TO service_role;


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- RLS enabled
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  tablename = 'scoring_results_log';

-- Policies
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  tablename = 'scoring_results_log';

-- Indexes
SELECT indexname
FROM   pg_indexes
WHERE  tablename = 'scoring_results_log'
ORDER  BY indexname;

-- Function permissions (should show service_role only)
SELECT proname, proacl
FROM   pg_proc
JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE  nspname = 'public'
  AND  proname = 'cleanup_old_scoring_results_log';
