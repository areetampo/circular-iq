-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 02_user_assessments.sql (v3 — aligned with scoring API v2)
-- User Assessment Storage — full scoring API response with promoted scalar columns
-- ══════════════════════════════════════════════════════════════════════════════
--
-- RUN ORDER NOTE
-- ──────────────
-- This migration must run BEFORE 03_user_profiles.sql because 02 installs
-- triggers on this table and upgrades the user_id FK constraint.
-- Correct order: 01 → 02 → 03 → 04 → 05 → 06 → 07
--
-- PURPOSE
-- ───────
-- • Stores complete assessment results with columns mirroring the scoring API
--   response, enabling full UI repopulation without parsing result_json.
-- • Promotes key metrics to scalar columns for fast filtering, sorting, and
--   analytics without JSONB extraction overhead.
-- • Provides analytics functions for dashboard statistics and market data.
-- • RLS policies restrict users to their own rows (or public rows).
-- • Automatically updates updated_at on every row change.
--
-- CHANGES FROM v2
-- ───────────────
-- • Promoted scalars added (mirrors scoring_results_log for analytics parity):
--   parameter_consistency_score, parameter_consistency_rating,
--   r_strategy_alignment_score, r_strategy_alignment_rating,
--   audit_confidence_score, audit_is_junk_input, similar_cases_count.
-- • New JSONB blobs: improvement_roadmap, sdg_alignment.
-- • New TEXT column: market_opportunity_summary.
--
-- CHANGES FROM v1
-- ───────────────
-- • Added dedicated columns for every top-level scoring API field.
-- • Added scalar sub-columns promoted from derived_metrics and metadata.
-- • Removed business_viability_score (not a real API field).
--
-- ACCESS CONTROL
-- ──────────────
-- • authenticated: full CRUD on own rows (RLS enforces user_id = auth.uid()).
--                  SELECT on public rows (is_public = true).
-- • anon:          SELECT + INSERT + UPDATE + DELETE (table grant; RLS restricts).
-- • service_role:  full access.
-- • update_assessments_updated_at_column: SECURITY DEFINER trigger fn —
--   revoked from all user-facing roles.
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
-- Drop table first — CASCADE removes dependent indexes, policies, and triggers.
-- Then drop every function in this migration regardless of signature.

DROP TABLE IF EXISTS user_assessments CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'get_assessment_statistics',
        'get_market_data',
        'update_assessments_updated_at_column'
    ];
    func_name text;
    rec       record;
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
-- 1. TABLE — user_assessments
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_assessments (
    -- ── Identity ─────────────────────────────────────────────────────────────
    id          UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Note: user_id FK is upgraded to profiles(id) by 02_user_profiles.sql.

    -- ── User-supplied inputs ──────────────────────────────────────────────────
    title               TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 50),
    UNIQUE (user_id, title),
    business_problem    TEXT NOT NULL CHECK (business_problem  != ''),
    business_solution   TEXT NOT NULL CHECK (business_solution != ''),
    evaluation_parameters JSONB,   -- raw 8-factor scores submitted by user
    business_context    JSONB,     -- model type, stage, geography, volume, etc.

    -- ── Top-level scoring API scalars ─────────────────────────────────────────
    overall_score       INTEGER CHECK (overall_score    BETWEEN 0 AND 100),
    confidence_level    INTEGER CHECK (confidence_level BETWEEN 0 AND 100),

    -- ── Derived metrics — promoted for fast filtering and analytics ───────────
    technical_feasibility  INTEGER CHECK (technical_feasibility  BETWEEN 0 AND 100),
    economic_viability     INTEGER CHECK (economic_viability     BETWEEN 0 AND 100),
    circularity_potential  INTEGER CHECK (circularity_potential  BETWEEN 0 AND 100),
    risk_level             TEXT    CHECK (risk_level IN ('low', 'medium', 'high')),

    -- ── Metadata scalars — promoted for market analytics and filtering ─────────
    industry         TEXT,
    scale            TEXT,
    r_strategy       TEXT,
    primary_material TEXT,
    geographic_focus TEXT,

    -- ── Layer 2 enrichment scalars ────────────────────────────────────────────
    parameter_consistency_score   INTEGER CHECK (parameter_consistency_score  BETWEEN 0 AND 100),
    parameter_consistency_rating  TEXT,   -- High / Moderate / Low / Very Low
    r_strategy_alignment_score    INTEGER CHECK (r_strategy_alignment_score   BETWEEN 0 AND 100),
    r_strategy_alignment_rating   TEXT,   -- Strong / Moderate / Weak / Poor

    -- ── Audit quality signals — promoted for analytics ────────────────────────
    audit_confidence_score      INTEGER CHECK (audit_confidence_score    BETWEEN 0 AND 100),
    audit_is_junk_input         BOOLEAN,
    audit_integrity_gaps_count  INTEGER DEFAULT 0 CHECK (audit_integrity_gaps_count >= 0),
    similar_cases_count         INTEGER DEFAULT 0 CHECK (similar_cases_count        >= 0),

    -- ── Full JSON blobs — complete API response sections ─────────────────────
    sub_scores              JSONB,   -- validated 8-factor sub-scores after clamping
    derived_metrics         JSONB,   -- full derived_metrics object
    score_breakdown         JSONB,   -- category breakdown (Access / Embedded / Processing Value)
    audit                   JSONB,   -- full auditResult (verdict, gaps, strengths, roadmap, SDGs)
    gap_analysis            JSONB,   -- benchmarks and comparisons
    similar_cases           JSONB,   -- top 4 similar docs, enriched
    metadata                JSONB,   -- industry, scale, r_strategy, etc.
    weighted_score_card     JSONB,   -- factor contributions to overall score
    circular_economy_tier   JSONB,   -- tier classification and guidance
    parameter_consistency   JSONB,   -- full parameter_consistency object
    r_strategy_alignment    JSONB,   -- full r_strategy_alignment object
    improvement_roadmap     JSONB,   -- audit.improvement_roadmap (3 prioritised actions)
    sdg_alignment           JSONB,   -- audit.sdg_alignment (2-4 UN SDG objects)
    market_opportunity_summary TEXT, -- audit.market_opportunity_summary
    result_json             JSONB NOT NULL, -- complete scoring API response (source of truth)

    -- ── Visibility and sharing ────────────────────────────────────────────────
    is_public                        BOOLEAN DEFAULT TRUE,
    public_id                        UUID    DEFAULT gen_random_uuid() UNIQUE,
    contribute_to_global_benchmarks  BOOLEAN DEFAULT TRUE,

    -- ── Timestamps ───────────────────────────────────────────────────────────
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  user_assessments IS
    'Saved assessment results. Columns mirror the scoring API response for fast analytics without parsing result_json.';
COMMENT ON COLUMN user_assessments.result_json               IS 'Complete raw scoring API response — source of truth for repopulating the UI.';
COMMENT ON COLUMN user_assessments.evaluation_parameters     IS '8-factor scores submitted by the user.';
COMMENT ON COLUMN user_assessments.business_context          IS 'User-provided structured context: business_model_type, operational_stage, target_geography, annual_volume_estimate, material_complexity, has_existing_partnerships.';
COMMENT ON COLUMN user_assessments.public_id                 IS 'Public sharing identifier — never exposes the internal UUID.';
COMMENT ON COLUMN user_assessments.improvement_roadmap       IS 'Promoted from audit.improvement_roadmap — 3 prioritised actions.';
COMMENT ON COLUMN user_assessments.sdg_alignment             IS 'Promoted from audit.sdg_alignment — 2-4 UN SDG objects.';
COMMENT ON COLUMN user_assessments.market_opportunity_summary IS 'Promoted from audit.market_opportunity_summary — 2-3 sentence market assessment.';
COMMENT ON COLUMN user_assessments.parameter_consistency_score  IS 'Consistency score 0-100 across the 8 input factors.';
COMMENT ON COLUMN user_assessments.r_strategy_alignment_score   IS 'Alignment score 0-100 between solution and detected R-strategy.';
COMMENT ON COLUMN user_assessments.audit_confidence_score       IS 'LLM''s own confidence score for the audit result (0-100).';
COMMENT ON COLUMN user_assessments.audit_is_junk_input          IS 'True if the audit detected implausible or nonsensical inputs.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id
    ON user_assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_created_at
    ON user_assessments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_assessments_overall_score
    ON user_assessments (overall_score);
CREATE INDEX IF NOT EXISTS idx_user_assessments_industry
    ON user_assessments (industry);
CREATE INDEX IF NOT EXISTS idx_user_assessments_public_id
    ON user_assessments (public_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_is_public
    ON user_assessments (is_public) WHERE is_public = TRUE;


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════
-- Initial policies set here. Upgraded (FK re-pointed, session_id removed) by
-- 02_user_profiles.sql when it runs after this migration.

ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 4a. get_assessment_statistics ────────────────────────────────────────────
-- Returns aggregated stats for all assessments or a single user's assessments.
-- Uses promoted scalar columns to avoid JSONB parsing overhead.

CREATE OR REPLACE FUNCTION get_assessment_statistics(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_assessments       BIGINT,
    completed_assessments   BIGINT,
    avg_score               FLOAT,
    median_score            FLOAT,
    min_score               INTEGER,
    max_score               INTEGER,
    avg_confidence          FLOAT,
    avg_technical_feasibility FLOAT,
    avg_economic_viability  FLOAT,
    avg_circularity_potential FLOAT,
    avg_param_consistency   FLOAT,
    avg_r_alignment         FLOAT,
    assessments_by_industry JSONB,
    assessments_by_risk     JSONB,
    assessments_by_scale    JSONB,
    assessments_by_tier     JSONB
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH base AS (
        SELECT a.*
        FROM   user_assessments a
        WHERE  (user_uuid IS NULL OR a.user_id = user_uuid)
          AND  a.overall_score IS NOT NULL
    ),
    stats AS (
        SELECT
            COUNT(*)::BIGINT                                           AS total,
            COUNT(*) FILTER (WHERE overall_score IS NOT NULL)::BIGINT AS completed,
            AVG(overall_score::FLOAT)                                 AS avg_sc,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall_score) AS median_sc,
            MIN(overall_score)                                        AS min_sc,
            MAX(overall_score)                                        AS max_sc,
            AVG(confidence_level::FLOAT)                              AS avg_conf,
            AVG(technical_feasibility::FLOAT)                         AS avg_tf,
            AVG(economic_viability::FLOAT)                            AS avg_ev,
            AVG(circularity_potential::FLOAT)                         AS avg_cp,
            AVG(parameter_consistency_score::FLOAT)                   AS avg_pcs,
            AVG(r_strategy_alignment_score::FLOAT)                    AS avg_ras
        FROM base
    ),
    by_industry AS (
        SELECT jsonb_object_agg(
            COALESCE(industry, 'uncategorized'),
            jsonb_build_object('count', cnt, 'avg_score', ind_avg)
        ) AS ind_stats
        FROM (
            SELECT industry,
                   COUNT(*)::INT                                  AS cnt,
                   ROUND(AVG(overall_score)::NUMERIC, 1)          AS ind_avg
            FROM   base GROUP BY industry
        ) sub
    ),
    by_risk AS (
        SELECT jsonb_object_agg(COALESCE(risk_level, 'unknown'), cnt) AS risk_stats
        FROM (SELECT risk_level, COUNT(*)::INT AS cnt FROM base GROUP BY risk_level) sub
    ),
    by_scale AS (
        SELECT jsonb_object_agg(COALESCE(scale, 'unknown'), cnt) AS scale_stats
        FROM (SELECT scale, COUNT(*)::INT AS cnt FROM base GROUP BY scale) sub
    ),
    by_tier AS (
        SELECT jsonb_object_agg(
            COALESCE(circular_economy_tier->>'tier', 'unknown'), cnt
        ) AS tier_stats
        FROM (
            SELECT circular_economy_tier->>'tier' AS tier_name, COUNT(*)::INT AS cnt
            FROM   base WHERE circular_economy_tier IS NOT NULL
            GROUP  BY tier_name
        ) sub
    )
    SELECT
        s.total, s.completed, s.avg_sc, s.median_sc, s.min_sc, s.max_sc,
        s.avg_conf, s.avg_tf, s.avg_ev, s.avg_cp, s.avg_pcs, s.avg_ras,
        COALESCE(bi.ind_stats,   '{}'::jsonb),
        COALESCE(br.risk_stats,  '{}'::jsonb),
        COALESCE(bs.scale_stats, '{}'::jsonb),
        COALESCE(bt.tier_stats,  '{}'::jsonb)
    FROM  stats s
    CROSS JOIN by_industry bi
    CROSS JOIN by_risk     br
    CROSS JOIN by_scale    bs
    CROSS JOIN by_tier     bt;
END;
$$;
COMMENT ON FUNCTION get_assessment_statistics IS
    'Aggregated statistics for all (or one user''s) assessments using promoted scalar columns. Pass user_uuid = NULL for global stats.';

-- ── 4b. get_market_data ───────────────────────────────────────────────────────
-- Per-industry/scale/strategy market benchmark data for the analytics dashboard.
-- Only includes assessments where the user opted in to global benchmarks.

CREATE OR REPLACE FUNCTION get_market_data()
RETURNS TABLE (
    industry              TEXT,
    scale                 TEXT,
    r_strategy            TEXT,
    avg_score             NUMERIC,
    min_score             INTEGER,
    max_score             INTEGER,
    avg_confidence        NUMERIC,
    avg_tech_feas         NUMERIC,
    avg_econ_viab         NUMERIC,
    avg_circ_pot          NUMERIC,
    avg_param_consistency NUMERIC,
    avg_r_alignment       NUMERIC,
    count                 BIGINT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.industry,
        a.scale,
        a.r_strategy,
        ROUND(AVG(a.overall_score)::NUMERIC, 1)               AS avg_score,
        MIN(a.overall_score)                                   AS min_score,
        MAX(a.overall_score)                                   AS max_score,
        ROUND(AVG(a.confidence_level)::NUMERIC, 1)             AS avg_confidence,
        ROUND(AVG(a.technical_feasibility)::NUMERIC, 1)        AS avg_tech_feas,
        ROUND(AVG(a.economic_viability)::NUMERIC, 1)           AS avg_econ_viab,
        ROUND(AVG(a.circularity_potential)::NUMERIC, 1)        AS avg_circ_pot,
        ROUND(AVG(a.parameter_consistency_score)::NUMERIC, 1)  AS avg_param_consistency,
        ROUND(AVG(a.r_strategy_alignment_score)::NUMERIC, 1)   AS avg_r_alignment,
        COUNT(*)                                               AS count
    FROM  user_assessments a
    WHERE a.overall_score IS NOT NULL
      AND a.contribute_to_global_benchmarks = TRUE
    GROUP BY a.industry, a.scale, a.r_strategy
    ORDER BY count DESC;
END;
$$;
COMMENT ON FUNCTION get_market_data IS
    'Per-industry/scale/strategy market benchmark data for the analytics dashboard. Excludes assessments where contribute_to_global_benchmarks = FALSE.';

-- ── 4c. update_assessments_updated_at_column (SECURITY DEFINER — trigger fn) ──

CREATE OR REPLACE FUNCTION update_assessments_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION update_assessments_updated_at_column IS
    'Trigger function: sets user_assessments.updated_at = NOW() on row UPDATE. SECURITY DEFINER — trigger only, no RPC access.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_assessments_updated_at ON user_assessments;

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON user_assessments
    FOR EACH ROW EXECUTE FUNCTION update_assessments_updated_at_column();


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Table grants ─────────────────────────────────────────────────────────────
GRANT ALL ON user_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_assessments TO anon;
GRANT ALL ON user_assessments TO service_role;

-- ── SECURITY DEFINER function lockdown ───────────────────────────────────────
-- update_assessments_updated_at_column is a trigger function — it must not
-- be callable via /rest/v1/rpc by any user-facing role.
REVOKE EXECUTE ON FUNCTION public.update_assessments_updated_at_column() FROM public, anon, authenticated;


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity FROM pg_tables  WHERE tablename = 'user_assessments';
SELECT policyname             FROM pg_policies WHERE tablename = 'user_assessments';
SELECT indexname              FROM pg_indexes  WHERE tablename = 'user_assessments';
