-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 06_ce_cases.sql (v2)
-- Circular Economy Cases — reference library with full-text and vector search
-- ══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE
-- ───────
-- • Stores circular economy case studies, products, policies, and initiatives
--   sourced from C2C Certified, Circle Economy Knowledge Hub, ReFed, and others.
-- • Supports fast full-text search via a weighted, auto-generated tsvector
--   (search_vector) covering all key text columns including metadata_json fields.
-- • Supports semantic similarity search via optional OpenAI halfvec embeddings.
-- • Provides keyword-only and hybrid (vector + keyword) search functions used
--   by the Express search API.
-- • Includes analytics and admin utility functions (statistics, truncate).
-- • Automatically maintains updated_at via trigger.
--
-- DESIGN DECISIONS
-- ────────────────
-- • search_vector is GENERATED ALWAYS AS STORED: no application-side maintenance;
--   always consistent with the row data. Weighted A–D:
--     A (highest): problem, solution, title, product_name
--     B:           materials, circular_strategy, company, description, summary
--     C:           category, keywords, keyArea
--     D (lowest):  impact
-- • Hybrid search uses weighted scoring (vec * vector_weight + kw * (1-vector_weight))
--   over ALL embedded rows — no AND keyword filter. This gives semantic reach while
--   keyword scoring boosts exact matches. Pure vector is the fallback when no keyword.
-- • Trigram indexes on materials and circular_strategy for fuzzy / partial matching.
-- • HNSW index on embedding is partial (WHERE embedding IS NOT NULL) to skip
--   un-embedded rows and keep the index lean.
-- • text PRIMARY KEY (not UUID): source IDs like "c2c_00001" are stable and
--   human-readable — no separate natural key needed.
--
-- ACCESS CONTROL
-- ──────────────
-- • ce_cases table:
--     service_role — full access (ingestion pipeline via Express backend).
--     authenticated — SELECT only (FOR SELECT policy, no writes).
--     anon          — SELECT only (FOR SELECT policy, no writes).
-- • search_ce_cases_keyword, search_ce_cases_hybrid, get_ce_cases_statistics:
--     callable by authenticated, anon, service_role (public reference data).
-- • truncate_ce_cases:      service_role only (ingestion admin utility).
-- • update_ce_cases_updated_at: service_role only (trigger function, no RPC).
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
-- Drop table first — CASCADE removes dependent indexes, triggers, and policies.
-- Then drop every function in this migration regardless of signature so that
-- signature changes never leave orphaned overloads behind.

DROP TABLE IF EXISTS ce_cases CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'search_ce_cases_keyword',
        'search_ce_cases_hybrid',
        'get_ce_cases_statistics',
        'truncate_ce_cases',
        'update_ce_cases_updated_at'
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
-- 1. TABLE — ce_cases
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ce_cases (
    -- ── Identity ─────────────────────────────────────────────────────────────
    -- Text PK: source IDs (e.g. "c2c_00001") are stable and human-readable.
    id                TEXT PRIMARY KEY,

    -- ── Core descriptive fields ───────────────────────────────────────────────
    problem           TEXT,           -- the challenge / problem addressed
    solution          TEXT,           -- the circular solution implemented
    materials         TEXT,           -- comma-separated materials involved
    circular_strategy TEXT,           -- R-strategy (Recycle, Reuse, Repair, …)
    category          TEXT,           -- industry/domain (Fashion, Construction, …)
    impact            TEXT,           -- quantified or descriptive impact
    source_url        TEXT,           -- original URL of the case study

    -- ── Flexible metadata ─────────────────────────────────────────────────────
    metadata_json     JSONB           NOT NULL DEFAULT '{}'::jsonb,

    -- ── Generated full-text search vector ────────────────────────────────────
    -- GENERATED ALWAYS AS STORED: always consistent, zero application maintenance.
    -- Weighted A–D (see header for field-weight mapping).
    search_vector     tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(problem,                          '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(solution,                         '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'title',          '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'product_name',   '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(materials,                        '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(circular_strategy,                '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'company',        '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'description',    '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'summary',        '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(category,                         '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'keywords',       '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(metadata_json->>'keyArea',        '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(impact,                           '')), 'D')
    ) STORED,

    -- ── Vector embedding ──────────────────────────────────────────────────────
    -- 1536-dim halfvec (text-embedding-3-small). NULL = not yet embedded.
    -- KEEP IN SYNC with EMBEDDING_DIMENSION in backend/config/embedding.js.
    embedding         extensions.halfvec(1536),

    -- ── Timestamps ───────────────────────────────────────────────────────────
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()  -- maintained by trigger
);

COMMENT ON TABLE  ce_cases IS
    'Reference library of circular economy case studies, products, policies, and '
    'initiatives from multiple sources. Public read-only; written by ingestion pipeline.';
COMMENT ON COLUMN ce_cases.id IS
    'Source-supplied identifier (e.g. c2c_00001). Stable and human-readable.';
COMMENT ON COLUMN ce_cases.search_vector IS
    'Auto-generated tsvector. Weights: A = problem/solution/title/product_name, '
    'B = materials/strategy/company/description/summary, '
    'C = category/keywords/keyArea, D = impact.';
COMMENT ON COLUMN ce_cases.embedding IS
    'OpenAI text-embedding-3-small (1536 dims). NULL until embedding pipeline runs. '
    'Embedded text: title + company + problem + solution.';
COMMENT ON COLUMN ce_cases.metadata_json IS
    'Flexible JSONB for additional structured metadata (company, title, certifications, extracted stats, …).';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- GIN on generated search_vector — primary index for full-text search.
CREATE INDEX IF NOT EXISTS idx_ce_cases_search_vector
    ON ce_cases USING GIN (search_vector);
COMMENT ON INDEX idx_ce_cases_search_vector IS
    'GIN index for fast full-text search across all weighted columns including metadata_json fields.';

-- Partial HNSW for vector similarity — only indexes rows that have been embedded.
CREATE INDEX IF NOT EXISTS idx_ce_cases_embedding_hnsw
    ON ce_cases USING hnsw (embedding extensions.halfvec_cosine_ops)
    WITH (m = 16, ef_construction = 128)
    WHERE embedding IS NOT NULL;
COMMENT ON INDEX idx_ce_cases_embedding_hnsw IS
    'Partial HNSW index for approximate nearest-neighbour search. Skips un-embedded rows.';

-- B-tree indexes for structured filtering.
CREATE INDEX IF NOT EXISTS idx_ce_cases_circular_strategy ON ce_cases (circular_strategy);
CREATE INDEX IF NOT EXISTS idx_ce_cases_category          ON ce_cases (category);
CREATE INDEX IF NOT EXISTS idx_ce_cases_source_url        ON ce_cases (source_url);
CREATE INDEX IF NOT EXISTS idx_ce_cases_created_at        ON ce_cases (created_at DESC);

-- Trigram indexes for fuzzy / partial matching on short text fields.
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_ce_cases_materials_trgm
    ON ce_cases USING gin (materials extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ce_cases_circular_strategy_trgm
    ON ce_cases USING gin (circular_strategy extensions.gin_trgm_ops);

COMMENT ON INDEX idx_ce_cases_materials_trgm IS
    'Trigram index for fuzzy / partial matching on materials field.';
COMMENT ON INDEX idx_ce_cases_circular_strategy_trgm IS
    'Trigram index for fuzzy / partial matching on circular_strategy field.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE ce_cases ENABLE ROW LEVEL SECURITY;

-- service_role: full access (ingestion pipeline writes).
CREATE POLICY "ce_cases_service_role_full"
    ON ce_cases FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- authenticated: SELECT only — FOR SELECT (not FOR ALL) prevents unrestricted
-- INSERT/UPDATE/DELETE even though table-level grants also allow SELECT only.
CREATE POLICY "ce_cases_authenticated_read"
    ON ce_cases FOR SELECT TO authenticated
    USING (true);

-- anon: SELECT only — same reasoning as above.
CREATE POLICY "ce_cases_anon_read"
    ON ce_cases FOR SELECT TO anon
    USING (true);

COMMENT ON POLICY "ce_cases_service_role_full"    ON ce_cases IS
    'Service role has full access (ingestion pipeline).';
COMMENT ON POLICY "ce_cases_authenticated_read"   ON ce_cases IS
    'Authenticated users can SELECT reference data (FOR SELECT — no write access).';
COMMENT ON POLICY "ce_cases_anon_read"            ON ce_cases IS
    'Anonymous users can SELECT reference data (FOR SELECT — no write access).';


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 4a. search_ce_cases_keyword ──────────────────────────────────────────────
-- Full-text keyword search using the generated search_vector.
-- plainto_tsquery: handles multi-word input naturally, applies stemming and
-- ignores stopwords. Results ranked by ts_rank (column weights A > B > C > D).

CREATE OR REPLACE FUNCTION search_ce_cases_keyword(
    keyword    TEXT,
    match_limit INT DEFAULT 20
)
RETURNS TABLE (
    id                TEXT,
    problem           TEXT,
    solution          TEXT,
    materials         TEXT,
    circular_strategy TEXT,
    category          TEXT,
    impact            TEXT,
    source_url        TEXT,
    metadata_json     JSONB,
    relevance         FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.problem,
        c.solution,
        c.materials,
        c.circular_strategy,
        c.category,
        c.impact,
        c.source_url,
        c.metadata_json,
        ts_rank(c.search_vector, plainto_tsquery('english', keyword), 1)::FLOAT AS relevance
    FROM ce_cases c
    WHERE c.search_vector @@ plainto_tsquery('english', keyword)
    ORDER BY relevance DESC
    LIMIT match_limit;
END;
$$;

COMMENT ON FUNCTION search_ce_cases_keyword IS
    'Full-text keyword search on ce_cases. Searches across all weighted text columns '
    'including metadata_json fields. Results ranked by weighted relevance (A > B > C > D).';


-- ── 4b. search_ce_cases_hybrid ───────────────────────────────────────────────
-- Hybrid search combining vector similarity and keyword scoring.
--
-- HOW IT WORKS:
--   For every embedded row:
--     vec_score  = 1 - cosine_distance(embedding, query_embedding)   → [0, 1]
--     kw_score   = ts_rank(search_vector, query)                     → [0, 1]
--     final      = vec_score * vector_weight + kw_score * (1 - vector_weight)
--
--   There is NO WHERE keyword filter — all embedded rows are candidates.
--   Vector finds broadly (semantic reach); keyword boosts exact matches.
--   When keyword is empty, falls back to pure vector search.
--
-- PARAMS:
--   query_embedding — 1536-dim halfvec embedded at request time by the backend
--   keyword         — raw search string (same text that was embedded)
--   match_limit     — rows to return (default 20)
--   vector_weight   — 0.0 = pure keyword, 1.0 = pure vector (default 0.7)

CREATE OR REPLACE FUNCTION search_ce_cases_hybrid(
    query_embedding   extensions.halfvec(1536),
    keyword           TEXT    DEFAULT '',
    match_limit       INT     DEFAULT 20,
    vector_weight     FLOAT   DEFAULT 0.7
)
RETURNS TABLE (
    id                TEXT,
    problem           TEXT,
    solution          TEXT,
    materials         TEXT,
    circular_strategy TEXT,
    category          TEXT,
    impact            TEXT,
    source_url        TEXT,
    metadata_json     JSONB,
    similarity        FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    -- Pure vector search when no keyword provided.
    IF keyword IS NULL OR keyword = '' THEN
        RETURN QUERY
        SELECT
            c.id, c.problem, c.solution, c.materials, c.circular_strategy,
            c.category, c.impact, c.source_url, c.metadata_json,
            (1 - (c.embedding <=> query_embedding))::FLOAT AS similarity
        FROM ce_cases c
        WHERE c.embedding IS NOT NULL
        ORDER BY c.embedding <=> query_embedding
        LIMIT match_limit;

    ELSE
        -- Hybrid: score ALL embedded rows, boost by keyword match.
        -- No AND keyword filter — vector finds broadly, keyword rewards matches.
        RETURN QUERY
        WITH scored AS (
            SELECT
                c.id, c.problem, c.solution, c.materials, c.circular_strategy,
                c.category, c.impact, c.source_url, c.metadata_json,
                (1 - (c.embedding <=> query_embedding))                              AS vec_score,
                ts_rank(c.search_vector, plainto_tsquery('english', keyword), 1)     AS kw_score
            FROM ce_cases c
            WHERE c.embedding IS NOT NULL
        )
        SELECT
            s.id, s.problem, s.solution, s.materials, s.circular_strategy,
            s.category, s.impact, s.source_url, s.metadata_json,
            (s.vec_score * vector_weight + s.kw_score * (1.0 - vector_weight))::FLOAT AS similarity
        FROM scored s
        ORDER BY similarity DESC
        LIMIT match_limit;
    END IF;
END;
$$;

COMMENT ON FUNCTION search_ce_cases_hybrid IS
    'Hybrid search: vector similarity + keyword scoring over all embedded rows. '
    'No AND keyword filter — vector provides semantic reach, keyword boosts exact matches. '
    'vector_weight=1.0 → pure vector; 0.0 → pure keyword rank; default 0.7.';


-- ── 4c. get_ce_cases_statistics ──────────────────────────────────────────────
-- Returns aggregated statistics for the CE cases collection.
-- Used by the admin dashboard and ingestion pipeline health checks.

CREATE OR REPLACE FUNCTION get_ce_cases_statistics()
RETURNS TABLE (
    total_cases         BIGINT,
    cases_with_embedding BIGINT,
    cases_by_strategy   JSONB,
    cases_by_category   JSONB,
    avg_problem_len     NUMERIC,
    avg_solution_len    NUMERIC
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*)                                   AS total,
            COUNT(embedding)                           AS with_emb,
            AVG(LENGTH(COALESCE(problem, '')))         AS avg_prob,
            AVG(LENGTH(COALESCE(solution, '')))        AS avg_sol
        FROM ce_cases
    ),
    by_strategy AS (
        SELECT jsonb_object_agg(COALESCE(circular_strategy, 'unknown'), cnt) AS strat_json
        FROM (
            SELECT circular_strategy, COUNT(*)::INT AS cnt
            FROM   ce_cases
            GROUP  BY circular_strategy
        ) sub
    ),
    by_category AS (
        SELECT jsonb_object_agg(COALESCE(category, 'unknown'), cnt) AS cat_json
        FROM (
            SELECT category, COUNT(*)::INT AS cnt
            FROM   ce_cases
            GROUP  BY category
        ) sub
    )
    SELECT
        s.total, s.with_emb,
        COALESCE(bs.strat_json, '{}'::jsonb),
        COALESCE(bc.cat_json,   '{}'::jsonb),
        ROUND(s.avg_prob, 1),
        ROUND(s.avg_sol,  1)
    FROM   stats s
    CROSS  JOIN by_strategy bs
    CROSS  JOIN by_category  bc;
END;
$$;

COMMENT ON FUNCTION get_ce_cases_statistics IS
    'Returns aggregated stats: total cases, embedded count, breakdown by strategy '
    'and category, average text lengths. Used by admin dashboard and ingestion health checks.';


-- ── 4d. truncate_ce_cases ────────────────────────────────────────────────────
-- Efficiently clears the table for ingestion pipeline resets.
-- TRUNCATE reclaims disk space immediately (unlike DELETE).
-- SECURITY DEFINER: callable by service_role only (locked down in grants section).

CREATE OR REPLACE FUNCTION truncate_ce_cases()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    TRUNCATE TABLE ce_cases RESTART IDENTITY;
END;
$$;

COMMENT ON FUNCTION truncate_ce_cases IS
    'Efficiently truncates the ce_cases table for ingestion pipeline resets. '
    'TRUNCATE reclaims disk space immediately. SECURITY DEFINER — service_role only.';


-- ── 4e. update_ce_cases_updated_at ───────────────────────────────────────────
-- Trigger function that keeps updated_at current on every row modification.
-- SECURITY DEFINER: called by trigger — never via REST API.

CREATE OR REPLACE FUNCTION update_ce_cases_updated_at()
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

COMMENT ON FUNCTION update_ce_cases_updated_at IS
    'Sets updated_at = NOW() on every UPDATE. SECURITY DEFINER — trigger only, no RPC access.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. TRIGGER — updated_at maintenance
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_ce_cases_updated_at ON ce_cases;
CREATE TRIGGER trg_ce_cases_updated_at
    BEFORE UPDATE ON ce_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_ce_cases_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Table access.
GRANT ALL    ON ce_cases TO service_role;
GRANT SELECT ON ce_cases TO authenticated;
GRANT SELECT ON ce_cases TO anon;

-- Search and analytics functions: public reference data — all roles may call.
GRANT EXECUTE ON FUNCTION search_ce_cases_keyword(TEXT, INT)                          TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_ce_cases_hybrid(extensions.halfvec, TEXT, INT, FLOAT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_ce_cases_statistics()                                   TO authenticated, anon, service_role;

-- SECURITY DEFINER functions: service_role only.
-- truncate_ce_cases — admin/ingestion utility, must not be callable via REST API.
-- update_ce_cases_updated_at — trigger function, never needs direct RPC access.
REVOKE EXECUTE ON FUNCTION truncate_ce_cases()          FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION truncate_ce_cases()          TO service_role;

REVOKE EXECUTE ON FUNCTION update_ce_cases_updated_at() FROM public, anon, authenticated;


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- RLS enabled
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  tablename = 'ce_cases';

-- Policies (all three should appear)
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  tablename = 'ce_cases';

-- Indexes
SELECT indexname, indexdef
FROM   pg_indexes
WHERE  tablename = 'ce_cases'
ORDER  BY indexname;

-- Functions with search_path set (proconfig should be non-null for all)
SELECT proname, proconfig
FROM   pg_proc
JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE  nspname = 'public'
  AND  proname IN (
    'search_ce_cases_keyword', 'search_ce_cases_hybrid',
    'get_ce_cases_statistics', 'truncate_ce_cases',
    'update_ce_cases_updated_at'
  )
ORDER  BY proname;
