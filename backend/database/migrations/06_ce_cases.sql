-- MIGRATION: 06_ce_cases.sql
-- Circular Economy Cases Storage — for CSV/JSON data from various sources
--
-- PURPOSE:
-- - Stores circular economy case studies, products, policies, and initiatives from sources like C2C certified, Circle Economy Knowledge Hub, Refed, etc.
-- - Supports full-text search and optional vector similarity search (pgvector)
-- - Provides indexes on key searchable columns (problem, solution, materials, strategy)
-- - RLS: service_role has full access; authenticated users can read all; anon can read only public?
-- - Actually this is reference data — all authenticated and anon can SELECT; only service_role can INSERT/UPDATE/DELETE
--
-- CHANGES FROM V1:
-- - tsvector now includes searchable fields from metadata_json (title, product_name at weight A;
--   company, description, summary at weight B; keywords, keyArea at weight C; impact at weight D)
-- - Fixed search_ce_cases_hybrid: removed broken AND keyword filter; now uses weighted scoring
--   (vector score * vector_weight + keyword score * (1-vector_weight)) over ALL embedded rows,
--   so vector similarity finds broadly and keyword scoring boosts matching results — not AND-filtered.
-- - fetchAllRows in embed script now fetches metadata_json too (for richer embedding text).
-- - Ingest script fixed: collects all rows first, then batch-upserts sequentially (no race condition).
--
-- COLUMNS:
-- - id, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
-- - plus search_vector (tsvector), embedding (halfvec), created_at, updated_at
--
-- INDEXES:
-- - GIN index on search_vector (full-text)
-- - HNSW index on embedding (vector similarity)
-- - B-tree on category, circular_strategy, source_url, created_at
-- - Trigram indexes for fuzzy search on materials and circular_strategy
--
-- FUNCTIONS:
-- - search_ce_cases_keyword(keyword, match_limit)
-- - search_ce_cases_hybrid(query_embedding, keyword, match_limit, vector_weight)
-- - get_ce_cases_statistics()
-- - truncate_ce_cases()
--
-- RLS:
-- - Service role: full CRUD
-- - Authenticated & anon: SELECT only (read-only reference data)

-- ============================================
-- 0. Drop existing table and dependent objects (clean slate)
-- ============================================

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
-- 1. Create CE Cases Table
-- ============================================

CREATE TABLE IF NOT EXISTS ce_cases (
  -- Primary identifier (string from source, e.g., "c2c_00001")
  id                TEXT PRIMARY KEY,

  -- Core descriptive fields (from CSV)
  problem           TEXT,
  solution          TEXT,
  materials         TEXT,
  circular_strategy TEXT,
  category          TEXT,
  impact            TEXT,
  source_url        TEXT,

  -- Flexible JSONB for any extra metadata (e.g., company, certifications, extracted stats)
  metadata_json     JSONB DEFAULT '{}'::jsonb,

  -- Full-text search vector (auto-updated, GENERATED ALWAYS AS STORED)
  -- Covers core columns + key fields extracted from metadata_json:
  --   Weight A (highest): problem, solution, title, product_name
  --   Weight B: materials, circular_strategy, company, description, summary
  --   Weight C: category, keywords, keyArea
  --   Weight D (lowest): impact
  search_vector     tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(problem, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(solution, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'title', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'product_name', '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(materials, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(circular_strategy, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'company', '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'description', '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'summary', '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'keywords', '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(metadata_json->>'keyArea', '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(impact, '')), 'D')
  ) STORED,

  -- Optional vector embedding (1536 dimensions, matches documents table)
  embedding         extensions.halfvec(1536),

  -- Timestamps
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Column comments
COMMENT ON TABLE ce_cases IS
  'Reference library of circular economy case studies, products, policies, and initiatives from multiple sources.';
COMMENT ON COLUMN ce_cases.id IS
  'Unique identifier from source (e.g., c2c_00001, circle_knowledge_hub_00001).';
COMMENT ON COLUMN ce_cases.problem IS
  'The problem statement or challenge addressed by the case.';
COMMENT ON COLUMN ce_cases.solution IS
  'The circular solution or approach implemented.';
COMMENT ON COLUMN ce_cases.materials IS
  'Comma-separated list of materials involved (e.g., plastic, wood, textile).';
COMMENT ON COLUMN ce_cases.circular_strategy IS
  'Primary circular strategy (e.g., Recycling, Reuse, Repair, Remanufacturing, etc.).';
COMMENT ON COLUMN ce_cases.category IS
  'Industry or domain category (e.g., Interior Design, Fashion, Construction, Food).';
COMMENT ON COLUMN ce_cases.impact IS
  'Quantified or descriptive impact (e.g., tons diverted, CO₂ saved, jobs created).';
COMMENT ON COLUMN ce_cases.source_url IS
  'Original URL of the case study or source.';
COMMENT ON COLUMN ce_cases.metadata_json IS
  'Flexible JSONB for additional structured metadata (company, title, certifications, extracted stats, etc.).';
COMMENT ON COLUMN ce_cases.search_vector IS
  'Generated tsvector: problem/solution/title/product_name (A), materials/strategy/company/description/summary (B), category/keywords/keyArea (C), impact (D). Includes key metadata_json text fields for full coverage.';
COMMENT ON COLUMN ce_cases.embedding IS
  'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic similarity search. Text embedded: title + company + problem + solution. NULL if not yet embedded.';
COMMENT ON COLUMN ce_cases.created_at IS
  'Row creation timestamp.';
COMMENT ON COLUMN ce_cases.updated_at IS
  'Row last update timestamp (auto-updated via trigger).';

-- ============================================
-- 2. Indexes
-- ============================================

-- Full-text search index (GIN on generated search_vector)
CREATE INDEX IF NOT EXISTS idx_ce_cases_search_vector
ON ce_cases USING GIN (search_vector);

COMMENT ON INDEX idx_ce_cases_search_vector IS
  'GIN index for fast full-text search across all weighted text columns including metadata_json fields.';

-- HNSW index for vector similarity (only where embedding is populated)
CREATE INDEX IF NOT EXISTS idx_ce_cases_embedding_hnsw
ON ce_cases USING hnsw (embedding extensions.halfvec_cosine_ops)
WITH (m = 16, ef_construction = 128)
WHERE embedding IS NOT NULL;

COMMENT ON INDEX idx_ce_cases_embedding_hnsw IS
  'HNSW index for approximate nearest-neighbour search on embeddings. Only indexes non-null embeddings.';

-- B-tree indexes for structured filtering
CREATE INDEX IF NOT EXISTS idx_ce_cases_circular_strategy
ON ce_cases(circular_strategy);

CREATE INDEX IF NOT EXISTS idx_ce_cases_category
ON ce_cases(category);

CREATE INDEX IF NOT EXISTS idx_ce_cases_source_url
ON ce_cases(source_url);

CREATE INDEX IF NOT EXISTS idx_ce_cases_created_at
ON ce_cases(created_at DESC);

-- Trigram indexes for fuzzy matching on short fields
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_ce_cases_materials_trgm
ON ce_cases USING gin (materials extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ce_cases_circular_strategy_trgm
ON ce_cases USING gin (circular_strategy extensions.gin_trgm_ops);

COMMENT ON INDEX idx_ce_cases_materials_trgm IS
  'Trigram index for fuzzy/partial matching on materials.';

COMMENT ON INDEX idx_ce_cases_circular_strategy_trgm IS
  'Trigram index for fuzzy/partial matching on circular_strategy.';

-- ============================================
-- 3. Row Level Security
-- ============================================

ALTER TABLE ce_cases ENABLE ROW LEVEL SECURITY;

-- Service role: full access (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY ce_cases_service_role_full ON ce_cases
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users: read-only (SELECT)
CREATE POLICY ce_cases_authenticated_read ON ce_cases
  TO authenticated
  USING (true);

-- Anonymous users: read-only (SELECT)
CREATE POLICY ce_cases_anon_read ON ce_cases
  TO anon
  USING (true);

COMMENT ON POLICY ce_cases_service_role_full ON ce_cases IS 'Service role can perform all operations.';
COMMENT ON POLICY ce_cases_authenticated_read ON ce_cases IS 'Authenticated users can only read reference data.';
COMMENT ON POLICY ce_cases_anon_read ON ce_cases IS 'Anonymous users can only read reference data.';

-- ============================================
-- 4. Helper Functions
-- ============================================

-- Keyword-only full-text search
-- Uses plainto_tsquery: handles multi-word input naturally, ignores stopwords, applies stemming.
-- Returns rows ranked by ts_rank (weighted by column importance A > B > C > D).
CREATE OR REPLACE FUNCTION search_ce_cases_keyword(
  keyword TEXT,
  match_limit INT DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  problem TEXT,
  solution TEXT,
  materials TEXT,
  circular_strategy TEXT,
  category TEXT,
  impact TEXT,
  source_url TEXT,
  metadata_json JSONB,
  relevance FLOAT
) AS $$
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
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION search_ce_cases_keyword IS
  'Full-text keyword search on ce_cases. Searches across problem, solution, title, company, materials, strategy, category, and more. Returns rows ranked by weighted relevance.';

-- Hybrid search: vector similarity + keyword score (FIXED)
--
-- HOW IT WORKS:
--   For every row where embedding IS NOT NULL, we compute:
--     - vec_score  = 1 - cosine_distance(embedding, query_embedding)   → 0..1
--     - kw_score   = ts_rank(search_vector, query)                     → 0..1 (0 if no keyword match)
--     - final_score = vec_score * vector_weight + kw_score * (1 - vector_weight)
--
--   There is NO WHERE keyword filter — all embedded rows are candidates.
--   Vector similarity finds broadly; keyword score boosts exact-match rows.
--   This is the correct hybrid approach: semantic reach + keyword precision.
--
-- PARAMS:
--   query_embedding — 1536-dim halfvec from OpenAI (embed the user's search query at runtime)
--   keyword         — raw search string (same as what user typed); '' = pure vector search
--   match_limit     — number of results to return (default 20)
--   vector_weight   — how much to weight vector vs keyword, 0.0–1.0 (default 0.7)
CREATE OR REPLACE FUNCTION search_ce_cases_hybrid(
  query_embedding extensions.halfvec(1536),
  keyword TEXT DEFAULT '',
  match_limit INT DEFAULT 20,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id TEXT,
  problem TEXT,
  solution TEXT,
  materials TEXT,
  circular_strategy TEXT,
  category TEXT,
  impact TEXT,
  source_url TEXT,
  metadata_json JSONB,
  similarity FLOAT
) AS $$
BEGIN
  -- Pure vector search when no keyword provided
  IF keyword IS NULL OR keyword = '' THEN
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
      (1 - (c.embedding <=> query_embedding))::FLOAT AS similarity
    FROM ce_cases c
    WHERE c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_limit;

  ELSE
    -- Hybrid: score ALL embedded rows, boost by keyword match
    -- No AND filter — vector finds broadly, keyword scoring rewards matches
    RETURN QUERY
    WITH scored AS (
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
        (1 - (c.embedding <=> query_embedding)) AS vec_score,
        ts_rank(c.search_vector, plainto_tsquery('english', keyword), 1) AS kw_score
      FROM ce_cases c
      WHERE c.embedding IS NOT NULL
    )
    SELECT
      s.id,
      s.problem,
      s.solution,
      s.materials,
      s.circular_strategy,
      s.category,
      s.impact,
      s.source_url,
      s.metadata_json,
      (s.vec_score * vector_weight + s.kw_score * (1.0 - vector_weight))::FLOAT AS similarity
    FROM scored s
    ORDER BY similarity DESC
    LIMIT match_limit;
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION search_ce_cases_hybrid IS
  'Hybrid search combining vector similarity + keyword scoring. All embedded rows are candidates (no AND filter). vector_weight=1.0 is pure vector; 0.0 is pure keyword rank; default 0.7 blends both.';

-- Get basic statistics about the CE cases collection
CREATE OR REPLACE FUNCTION get_ce_cases_statistics()
RETURNS TABLE (
  total_cases BIGINT,
  cases_with_embedding BIGINT,
  cases_by_strategy JSONB,
  cases_by_category JSONB,
  avg_problem_len NUMERIC,
  avg_solution_len NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) AS total,
      COUNT(embedding) AS with_emb,
      AVG(LENGTH(COALESCE(problem, ''))) AS avg_prob,
      AVG(LENGTH(COALESCE(solution, ''))) AS avg_sol
    FROM ce_cases
  ),
  strategy_counts AS (
    SELECT
      jsonb_object_agg(
        COALESCE(circular_strategy, 'unknown'),
        cnt
      ) AS strat_json
    FROM (
      SELECT circular_strategy, COUNT(*)::INT AS cnt
      FROM ce_cases
      GROUP BY circular_strategy
    ) sub
  ),
  category_counts AS (
    SELECT
      jsonb_object_agg(
        COALESCE(category, 'unknown'),
        cnt
      ) AS cat_json
    FROM (
      SELECT category, COUNT(*)::INT AS cnt
      FROM ce_cases
      GROUP BY category
    ) sub
  )
  SELECT
    s.total,
    s.with_emb,
    COALESCE(sc.strat_json, '{}'::jsonb),
    COALESCE(cc.cat_json, '{}'::jsonb),
    ROUND(s.avg_prob, 1),
    ROUND(s.avg_sol, 1)
  FROM stats s
  CROSS JOIN strategy_counts sc
  CROSS JOIN category_counts cc;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION get_ce_cases_statistics IS
  'Returns aggregated statistics: total cases, embedded count, breakdown by strategy and category, average text lengths.';

-- Truncate table (used during ingestion to reset)
CREATE OR REPLACE FUNCTION truncate_ce_cases()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE ce_cases RESTART IDENTITY;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION truncate_ce_cases IS
  'Safely truncates the ce_cases table (used by ingestion scripts to reset).';

-- ============================================
-- 5. Update Trigger for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_ce_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION update_ce_cases_updated_at IS
  'Automatically updates updated_at timestamp on row modification.';

DROP TRIGGER IF EXISTS trg_ce_cases_updated_at ON ce_cases;
CREATE TRIGGER trg_ce_cases_updated_at
  BEFORE UPDATE ON ce_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_ce_cases_updated_at();

-- ============================================
-- 6. Grants
-- ============================================

GRANT ALL ON ce_cases TO service_role;
GRANT SELECT ON ce_cases TO authenticated;
GRANT SELECT ON ce_cases TO anon;

GRANT EXECUTE ON FUNCTION search_ce_cases_keyword(TEXT, INT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_ce_cases_hybrid(extensions.halfvec, TEXT, INT, FLOAT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_ce_cases_statistics() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION truncate_ce_cases() TO service_role;

-- ============================================
-- 7. Verification Queries
-- ============================================

-- Check table exists and RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'ce_cases';

-- Check policies
SELECT policyname, tablename, cmd FROM pg_policies WHERE tablename = 'ce_cases';

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'ce_cases' ORDER BY indexname;

-- Check search_vector is populated on a sample row (should be non-null after insert)
-- SELECT id, search_vector IS NOT NULL AS has_vector FROM ce_cases LIMIT 5;
