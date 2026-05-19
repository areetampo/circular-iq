-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 01_vector_infrastructure.sql (v2)
-- Vector Search Foundation — pgvector, documents table, search functions
-- ══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE
-- ───────
-- • Installs pgvector, btree_gin, and pgcrypto into a dedicated extensions
--   schema (security best practice — keeps extension objects out of public API).
-- • Creates the documents table with a 1536-dim halfvec column for
--   OpenAI text-embedding-3-small embeddings.
-- • Adds generated columns (chunk_id, field_name) extracted from metadata
--   for conflict handling and resume-safe upserts.
-- • Enforces a unique constraint on (chunk_id, field_name) to support the
--   --resume flag in the embedding pipeline.
-- • Builds indexes: HNSW for vector similarity, GIN for full-text search,
--   btree for structured metadata filters (industry, category, source).
-- • Defines the full suite of search, analytics, and maintenance functions.
-- • Adds an automatic updated_at trigger.
--
-- DESIGN DECISIONS
-- ────────────────
-- • halfvec instead of vector: halves storage and index size with negligible
--   quality loss for normalized OpenAI embeddings.
-- • HNSW preferred over IVFFlat: better query performance, no training phase.
-- • chunk_id / field_name as GENERATED ALWAYS AS STORED: Supabase upsert
--   conflict targets always match actual stored values automatically.
-- • search_documents_hybrid: keyword pre-filter + weighted scoring to balance
--   semantic reach with lexical precision.
--
-- ACCESS CONTROL
-- ──────────────
-- • anon / authenticated : SELECT only (public reference data).
-- • service_role          : Full table access (embedding pipeline writes).
-- • truncate_documents    : SECURITY DEFINER — service_role only.
-- • update_updated_at_column : SECURITY DEFINER trigger fn — no direct RPC.
-- • Search / analytics fns: callable by all roles (no sensitive data).
--
-- IMPORTANT NOTES
-- ───────────────
-- • Embedding dimension MUST match EMBEDDING_DIMENSION in
--   backend/config/embedding.js (currently 1536).
-- • (chunk_id, field_name) must be present in metadata during upserts.
-- • For memory-intensive HNSW index creation, run first if needed:
--     SET maintenance_work_mem = '128MB';
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
-- Drop table first — CASCADE removes dependent indexes, policies, and triggers.
-- Then drop every function owned by this migration regardless of signature so
-- that signature changes never leave orphaned overloads behind.

DROP TABLE IF EXISTS documents CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'match_documents',
        'search_documents_by_industry',
        'search_documents_by_category',
        'search_documents_hybrid',
        'search_documents_hybrid_filtered',
        'find_recent_documents',
        'get_document_statistics',
        'count_documents_by_category',
        'truncate_documents',
        'update_updated_at_column',
        'safe_jsonb_cast',
        'backfill_document_metadata'
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
-- 1. EXTENSIONS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS extensions;
COMMENT ON SCHEMA extensions IS
    'Dedicated schema for PostgreSQL extensions — prevents extension objects from leaking into the public API surface.';

CREATE EXTENSION IF NOT EXISTS vector    SCHEMA extensions CASCADE;
CREATE EXTENSION IF NOT EXISTS btree_gin SCHEMA extensions CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto  SCHEMA extensions;

COMMENT ON EXTENSION vector    IS 'pgvector: vector similarity search for embeddings';
COMMENT ON EXTENSION btree_gin IS 'GIN index support for btree-indexable data types';
COMMENT ON EXTENSION pgcrypto  IS 'Provides gen_random_uuid() for UUID generation';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT USAGE ON SCHEMA extensions TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT USAGE ON SCHEMA extensions TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT USAGE ON SCHEMA extensions TO service_role;
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. TABLE — documents
-- ══════════════════════════════════════════════════════════════════════════════
-- DIMENSION NOTE: embedding dimension must stay in sync with
-- EMBEDDING_DIMENSION in backend/config/embedding.js (currently 1536).
-- Update BOTH locations when switching embedding models.

CREATE TABLE IF NOT EXISTS documents (
    id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content (required — must be non-empty for FTS to be useful)
    content    TEXT    NOT NULL,

    -- Vector embedding. halfvec halves storage vs vector with negligible
    -- quality loss for normalized OpenAI embeddings. NOT NULL ensures every
    -- document is queryable via similarity search.
    embedding  extensions.halfvec(1536) NOT NULL,

    -- Structured metadata columns indexed for fast filter queries.
    industry   TEXT,
    category   TEXT,
    source     TEXT,

    -- Flexible JSONB for additional or legacy metadata fields.
    metadata   JSONB DEFAULT '{}'::jsonb,

    -- Generated columns used as upsert conflict targets.
    -- Extracted from metadata so ON CONFLICT targets always match stored values.
    -- Required for the --resume flag in the embedding pipeline.
    chunk_id   TEXT GENERATED ALWAYS AS (metadata->>'chunk_id')   STORED,
    field_name TEXT GENERATED ALWAYS AS (metadata->>'field_name') STORED,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  documents IS
    'Document chunks with vector embeddings for semantic search. Dimension: 1536 (text-embedding-3-small). Keep in sync with backend/config/embedding.js.';
COMMENT ON COLUMN documents.embedding  IS
    'OpenAI text-embedding-3-small halfvec (1536 dims). NOT NULL — all documents must be queryable.';
COMMENT ON COLUMN documents.chunk_id   IS
    'Generated from metadata->>chunk_id. Used to retrieve all rows in the same source chunk during RAG context expansion.';
COMMENT ON COLUMN documents.field_name IS
    'Generated from metadata->>field_name. Uniqueness key for resume-safe upserts.';
COMMENT ON COLUMN documents.industry   IS 'Primary industry classification (indexed).';
COMMENT ON COLUMN documents.category   IS 'Primary category classification (indexed).';
COMMENT ON COLUMN documents.source     IS 'Source identifier or dataset name.';
COMMENT ON COLUMN documents.metadata   IS 'Flexible JSONB for additional or legacy metadata fields.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Unique: enforces (chunk_id, field_name) pairs for resume-safe ingestion.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_chunk_field
    ON documents (chunk_id, field_name);
COMMENT ON INDEX idx_unique_chunk_field IS
    'Enforces unique (chunk_id, field_name) pairs. Required for ON CONFLICT upsert targets and --resume flag.';

-- Fast retrieval of all rows in the same source chunk (RAG context expansion).
CREATE INDEX IF NOT EXISTS idx_documents_chunk_id
    ON documents (chunk_id);
COMMENT ON INDEX idx_documents_chunk_id IS
    'Enables fast full-chunk expansion during RAG retrieval.';

-- HNSW vector similarity index.
-- 5-50× faster ANN queries vs full scan; no training phase required.
CREATE INDEX IF NOT EXISTS idx_documents_embedding_hnsw
    ON documents USING hnsw (embedding extensions.halfvec_cosine_ops)
    WITH (m = 16, ef_construction = 128);
COMMENT ON INDEX idx_documents_embedding_hnsw IS
    'HNSW index for fast approximate nearest-neighbour search on embeddings.';

-- Full-text search on document content.
CREATE INDEX IF NOT EXISTS idx_documents_content_fts
    ON documents USING gin (to_tsvector('english', content));
COMMENT ON INDEX idx_documents_content_fts IS
    'GIN full-text search index on document content.';

-- Time-based queries and sorting.
CREATE INDEX IF NOT EXISTS idx_documents_created_at
    ON documents (created_at DESC);
COMMENT ON INDEX idx_documents_created_at IS
    'Supports time-based queries and recent-document lookups.';

-- Structured filter indexes.
CREATE INDEX IF NOT EXISTS idx_documents_industry_btree    ON documents (industry);
CREATE INDEX IF NOT EXISTS idx_documents_category_btree    ON documents (category);
CREATE INDEX IF NOT EXISTS idx_documents_source_btree      ON documents (source);
CREATE INDEX IF NOT EXISTS idx_documents_industry_category ON documents (industry, category);

COMMENT ON INDEX idx_documents_industry_btree    IS 'Fast filtering by industry.';
COMMENT ON INDEX idx_documents_category_btree    IS 'Fast filtering by category.';
COMMENT ON INDEX idx_documents_source_btree      IS 'Fast filtering by source.';
COMMENT ON INDEX idx_documents_industry_category IS 'Composite index for combined industry + category filters.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════
-- documents is public reference data — all roles can SELECT.
-- Writes go exclusively through the embedding pipeline using service_role.
-- FOR SELECT (not FOR ALL) prevents anon/authenticated from INSERT/UPDATE/DELETE
-- via the REST API even if table-level grants were ever widened.

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_read_policy   ON documents;
DROP POLICY IF EXISTS documents_write_policy  ON documents;
DROP POLICY IF EXISTS documents_access_policy ON documents;

CREATE POLICY documents_access_policy ON documents
    FOR SELECT
    USING (true);
COMMENT ON POLICY documents_access_policy ON documents IS
    'All roles can SELECT documents (public reference data). Writes restricted to service_role via embedding pipeline.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════
-- All functions use SET search_path = public, extensions so the extensions
-- schema types (halfvec, halfvec_cosine_ops) resolve correctly.
-- Search / analytics functions are STABLE (read-only, safe to cache).
-- SECURITY DEFINER functions are locked to service_role in section 7.

-- ── 5a. match_documents ──────────────────────────────────────────────────────
-- Groups by chunk_id first to surface the best chunk per document, then
-- returns the matching row with its cosine similarity score.

CREATE OR REPLACE FUNCTION match_documents(
    query_embedding extensions.halfvec(1536),
    match_count     INT DEFAULT 5
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    metadata   JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_chunks AS (
        SELECT
            chunk_id,
            MIN(embedding <=> query_embedding) AS best_distance
        FROM  documents
        WHERE embedding IS NOT NULL
        GROUP BY chunk_id
        ORDER BY best_distance
        LIMIT match_count
    )
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM  documents d
    JOIN  ranked_chunks rc ON d.chunk_id = rc.chunk_id;
END;
$$;
COMMENT ON FUNCTION match_documents IS
    'Basic vector similarity search. Groups by chunk_id to surface the best chunk per document, ranked by cosine similarity.';

-- ── 5b. search_documents_by_industry ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_documents_by_industry(
    query_embedding      extensions.halfvec(1536),
    industry_filter      TEXT,
    match_count          INT   DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    metadata   JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM  documents d
    WHERE d.embedding IS NOT NULL
      AND d.industry = industry_filter
      AND 1 - (d.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
COMMENT ON FUNCTION search_documents_by_industry IS
    'Vector similarity search filtered by industry column with a minimum similarity threshold.';

-- ── 5c. search_documents_by_category ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_documents_by_category(
    query_embedding      extensions.halfvec(1536),
    category_filter      TEXT,
    match_count          INT   DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    metadata   JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM  documents d
    WHERE d.embedding IS NOT NULL
      AND d.category = category_filter
      AND 1 - (d.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
COMMENT ON FUNCTION search_documents_by_category IS
    'Vector similarity search filtered by category column with a minimum similarity threshold.';

-- ── 5d. search_documents_hybrid ──────────────────────────────────────────────
-- Combines vector similarity and full-text scoring with configurable weights
-- plus optional structured filters (industry, category, source).

CREATE OR REPLACE FUNCTION search_documents_hybrid(
    query_embedding      extensions.halfvec(1536),
    keyword_filter       TEXT  DEFAULT '',
    industry_filter      TEXT  DEFAULT NULL,
    category_filter      TEXT  DEFAULT NULL,
    source_filter        TEXT  DEFAULT NULL,
    match_count          INT   DEFAULT 10,
    vector_weight        FLOAT DEFAULT 0.7,
    similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    industry   TEXT,
    category   TEXT,
    source     TEXT,
    metadata   JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.industry,
        d.category,
        d.source,
        d.metadata,
        (1 - (d.embedding <=> query_embedding)) * vector_weight
        + ts_rank(to_tsvector('english', d.content),
                  plainto_tsquery('english', keyword_filter)) * (1 - vector_weight)
          AS similarity
    FROM  documents d
    WHERE d.embedding IS NOT NULL
      AND (keyword_filter = ''
           OR to_tsvector('english', d.content) @@ plainto_tsquery('english', keyword_filter))
      AND (industry_filter IS NULL OR d.industry = industry_filter)
      AND (category_filter IS NULL OR d.category = category_filter)
      AND (source_filter   IS NULL OR d.source   = source_filter)
      AND (1 - (d.embedding <=> query_embedding)) * vector_weight
        + ts_rank(to_tsvector('english', d.content),
                  plainto_tsquery('english', keyword_filter)) * (1 - vector_weight)
          >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
COMMENT ON FUNCTION search_documents_hybrid IS
    'Hybrid search combining vector similarity and full-text scoring with configurable weights and optional industry/category/source filters.';

-- ── 5e. search_documents_hybrid_filtered ─────────────────────────────────────
-- Simplified hybrid variant filtered to a single industry value.

CREATE OR REPLACE FUNCTION search_documents_hybrid_filtered(
    query_embedding extensions.halfvec(1536),
    keyword_filter  TEXT  DEFAULT '',
    industry_filter TEXT  DEFAULT NULL,
    match_count     INT   DEFAULT 10,
    vector_weight   FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    metadata   JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        (1 - (d.embedding <=> query_embedding)) * vector_weight
        + ts_rank(to_tsvector('english', d.content),
                  plainto_tsquery('english', keyword_filter)) * (1 - vector_weight)
          AS similarity
    FROM  documents d
    WHERE d.embedding IS NOT NULL
      AND (keyword_filter = ''
           OR to_tsvector('english', d.content) @@ plainto_tsquery('english', keyword_filter))
      AND (industry_filter IS NULL OR d.industry = industry_filter)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
COMMENT ON FUNCTION search_documents_hybrid_filtered IS
    'Hybrid search with optional industry filtering using the dedicated industry column.';

-- ── 5f. find_recent_documents ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION find_recent_documents(
    limit_count     INT,
    industry_filter TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    source_filter   TEXT DEFAULT NULL
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    metadata   JSONB,
    industry   TEXT,
    category   TEXT,
    source     TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        d.industry,
        d.category,
        d.source,
        d.created_at
    FROM  documents d
    WHERE (industry_filter IS NULL OR d.industry = industry_filter)
      AND (category_filter IS NULL OR d.category = category_filter)
      AND (source_filter   IS NULL OR d.source   = source_filter)
    ORDER BY d.created_at DESC
    LIMIT limit_count;
END;
$$;
COMMENT ON FUNCTION find_recent_documents IS
    'Returns the most recent documents with optional industry, category, or source filters.';

-- ── 5g. get_document_statistics ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_document_statistics()
RETURNS TABLE (
    total_documents       BIGINT,
    documents_by_category JSONB,
    documents_by_industry JSONB,
    avg_content_length    FLOAT
)
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT COUNT(*)::BIGINT AS total, AVG(LENGTH(content))::FLOAT AS avg_len
        FROM   documents
    ),
    by_category AS (
        SELECT jsonb_object_agg(COALESCE(metadata->>'category', 'uncategorized'), cnt) AS cat_stats
        FROM (
            SELECT metadata->>'category', COUNT(*)::INT AS cnt
            FROM   documents GROUP BY metadata->>'category'
        ) sub
    ),
    by_industry AS (
        SELECT jsonb_object_agg(COALESCE(metadata->>'industry', 'uncategorized'), cnt) AS ind_stats
        FROM (
            SELECT metadata->>'industry', COUNT(*)::INT AS cnt
            FROM   documents GROUP BY metadata->>'industry'
        ) sub
    )
    SELECT
        s.total,
        COALESCE(bc.cat_stats, '{}'::jsonb),
        COALESCE(bi.ind_stats, '{}'::jsonb),
        s.avg_len
    FROM  stats s
    CROSS JOIN by_category bc
    CROSS JOIN by_industry bi;
END;
$$;
COMMENT ON FUNCTION get_document_statistics IS
    'Returns aggregated statistics: total documents, breakdown by category and industry, average content length.';

-- ── 5h. count_documents_by_category ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION count_documents_by_category(category_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SET search_path = public, extensions
STABLE
AS $$
DECLARE
    doc_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO doc_count
    FROM   documents
    WHERE  metadata->>'category' = category_name;
    RETURN doc_count;
END;
$$;
COMMENT ON FUNCTION count_documents_by_category IS
    'Returns the count of documents belonging to a specific category.';

-- ── 5i. truncate_documents (SECURITY DEFINER — service_role only) ─────────────
-- Used by the embedding pipeline instead of DELETE to reclaim disk space.
-- TRUNCATE is orders of magnitude faster and prevents table bloat on large
-- re-ingestion runs. RESTART IDENTITY is a no-op for UUID PKs (no sequence)
-- but is included for forward-compatibility.

CREATE OR REPLACE FUNCTION truncate_documents()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    TRUNCATE TABLE documents RESTART IDENTITY;
END;
$$;
COMMENT ON FUNCTION truncate_documents IS
    'Truncates the documents table to reclaim disk space. Used by the embedding pipeline. SECURITY DEFINER — callable by service_role only; revoked from all other roles.';

-- ── 5j. update_updated_at_column (SECURITY DEFINER — trigger function) ───────
-- Generic trigger function that stamps updated_at = NOW() on every UPDATE.
-- Bound to documents via the trigger in section 6.
-- Never needs to be called directly via RPC.

CREATE OR REPLACE FUNCTION update_updated_at_column()
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
COMMENT ON FUNCTION update_updated_at_column IS
    'Trigger function: sets updated_at = NOW() on row UPDATE. SECURITY DEFINER — invoked by trigger only; revoked from all non-trigger roles.';

-- ── 5k. safe_jsonb_cast (SECURITY DEFINER — internal helper) ─────────────────
-- Silently returns NULL on invalid JSON instead of raising an exception.
-- Used exclusively by backfill_document_metadata. Not exposed via RPC.

CREATE OR REPLACE FUNCTION safe_jsonb_cast(text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
IMMUTABLE
AS $$
BEGIN
    RETURN $1::jsonb;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;
COMMENT ON FUNCTION safe_jsonb_cast(text) IS
    'Casts text to jsonb, returning NULL on failure. Internal helper for backfill_document_metadata. SECURITY DEFINER — not exposed via RPC.';

-- ── 5l. backfill_document_metadata (SECURITY DEFINER — service_role only) ────
-- Backfills source and industry columns from embedded JSON metadata.
-- Replaces the manual backfill_documents_industry.sql script.
-- Called automatically by store_embeddings.js after each ingestion run.
--
-- Idempotent: all UPDATE statements are guarded by WHERE conditions that
-- only match rows still needing work — safe to call repeatedly.
--
-- Backfill order:
--   1. source      ← metadata->>'source'            (where source IS NULL)
--   2. industry    ← metadata->'fields'->'metadata_json'->'raw_extracted'->>'category'
--   3. industry    ← same path, split on ' > ', take first segment (fallback)
--   4. industry    ← category column directly        (last-resort fallback)

CREATE OR REPLACE FUNCTION backfill_document_metadata()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Backfill source from top-level metadata field
    UPDATE documents
    SET source = metadata->>'source'
    WHERE metadata->>'source' IS NOT NULL
      AND source IS NULL;

    -- 2. Backfill industry from nested raw_extracted category
    UPDATE documents
    SET industry =
        COALESCE(
            safe_jsonb_cast(metadata->'fields'->>'metadata_json')->'raw_extracted'->>'category',
            industry
        )
    WHERE industry = 'general'
      AND metadata->'fields' ? 'metadata_json'
      AND safe_jsonb_cast(metadata->'fields'->>'metadata_json') ? 'raw_extracted';

    -- 3. Fallback: split category on ' > ' and take first segment
    UPDATE documents
    SET industry =
        COALESCE(
            SPLIT_PART(
                safe_jsonb_cast(metadata->'fields'->>'metadata_json')->'raw_extracted'->>'category',
                ' > ',
                1
            ),
            industry
        )
    WHERE industry = 'general'
      AND metadata->'fields' ? 'metadata_json'
      AND safe_jsonb_cast(metadata->'fields'->>'metadata_json') ? 'raw_extracted';

    -- 4. Last resort: use category column directly, skipping generic label values
    UPDATE documents
    SET industry = category
    WHERE industry = 'general'
      AND category NOT IN (
          'General', 'Business case', 'Report', 'Policy case',
          'Article / Report', 'Guide', 'Technical Framework',
          'Case Study', 'Business Case', 'Policy'
      );
END;
$$;
COMMENT ON FUNCTION backfill_document_metadata IS
    'Backfills source and industry from embedded JSON metadata. Idempotent — safe to call repeatedly. Called automatically by store_embeddings.js after ingestion. SECURITY DEFINER — callable by service_role only.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Table grants ─────────────────────────────────────────────────────────────
-- anon and authenticated: SELECT only (public reference data).
-- All writes go through the embedding pipeline via service_role.
-- Supabase-specific roles are skipped gracefully on plain Postgres (Aiven).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT SELECT ON documents TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT SELECT ON documents TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT ALL ON documents TO service_role;
    END IF;
END $$;

-- ── Search / analytics function grants ───────────────────────────────────────
-- These functions return public reference data — callable by all roles.
-- Supabase-specific roles are skipped gracefully on plain Postgres (Aiven).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT EXECUTE ON FUNCTION match_documents(extensions.halfvec, INT)                              TO authenticated;
        GRANT EXECUTE ON FUNCTION search_documents_by_industry(extensions.halfvec, TEXT, INT, FLOAT)   TO authenticated;
        GRANT EXECUTE ON FUNCTION search_documents_by_category(extensions.halfvec, TEXT, INT, FLOAT)   TO authenticated;
        GRANT EXECUTE ON FUNCTION search_documents_hybrid(extensions.halfvec, TEXT, TEXT, TEXT, TEXT, INT, FLOAT, FLOAT) TO authenticated;
        GRANT EXECUTE ON FUNCTION search_documents_hybrid_filtered(extensions.halfvec, TEXT, TEXT, INT, FLOAT) TO authenticated;
        GRANT EXECUTE ON FUNCTION find_recent_documents(INT, TEXT, TEXT, TEXT)                         TO authenticated;
        GRANT EXECUTE ON FUNCTION get_document_statistics()                                            TO authenticated;
        GRANT EXECUTE ON FUNCTION count_documents_by_category(TEXT)                                    TO authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT EXECUTE ON FUNCTION match_documents(extensions.halfvec, INT)                              TO anon;
        GRANT EXECUTE ON FUNCTION search_documents_by_industry(extensions.halfvec, TEXT, INT, FLOAT)   TO anon;
        GRANT EXECUTE ON FUNCTION search_documents_by_category(extensions.halfvec, TEXT, INT, FLOAT)   TO anon;
        GRANT EXECUTE ON FUNCTION search_documents_hybrid(extensions.halfvec, TEXT, TEXT, TEXT, TEXT, INT, FLOAT, FLOAT) TO anon;
        GRANT EXECUTE ON FUNCTION search_documents_hybrid_filtered(extensions.halfvec, TEXT, TEXT, INT, FLOAT) TO anon;
        GRANT EXECUTE ON FUNCTION find_recent_documents(INT, TEXT, TEXT, TEXT)                         TO anon;
        GRANT EXECUTE ON FUNCTION get_document_statistics()                                            TO anon;
        GRANT EXECUTE ON FUNCTION count_documents_by_category(TEXT)                                    TO anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION match_documents(extensions.halfvec, INT)                              TO service_role;
        GRANT EXECUTE ON FUNCTION search_documents_by_industry(extensions.halfvec, TEXT, INT, FLOAT)   TO service_role;
        GRANT EXECUTE ON FUNCTION search_documents_by_category(extensions.halfvec, TEXT, INT, FLOAT)   TO service_role;
        GRANT EXECUTE ON FUNCTION search_documents_hybrid(extensions.halfvec, TEXT, TEXT, TEXT, TEXT, INT, FLOAT, FLOAT) TO service_role;
        GRANT EXECUTE ON FUNCTION search_documents_hybrid_filtered(extensions.halfvec, TEXT, TEXT, INT, FLOAT) TO service_role;
        GRANT EXECUTE ON FUNCTION find_recent_documents(INT, TEXT, TEXT, TEXT)                         TO service_role;
        GRANT EXECUTE ON FUNCTION get_document_statistics()                                            TO service_role;
        GRANT EXECUTE ON FUNCTION count_documents_by_category(TEXT)                                    TO service_role;
    END IF;
END $$;

-- ── SECURITY DEFINER lockdown ─────────────────────────────────────────────────
-- REVOKE FROM public always works (public is a built-in pseudo-role in all Postgres).
-- REVOKE FROM anon/authenticated/service_role are wrapped — those roles only
-- exist on Supabase, not on plain Postgres (Aiven).
REVOKE EXECUTE ON FUNCTION truncate_documents()       FROM public;
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM public;
REVOKE EXECUTE ON FUNCTION safe_jsonb_cast(text)        FROM public;
REVOKE EXECUTE ON FUNCTION backfill_document_metadata() FROM public;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE EXECUTE ON FUNCTION truncate_documents()         FROM anon;
        REVOKE EXECUTE ON FUNCTION update_updated_at_column()   FROM anon;
        REVOKE EXECUTE ON FUNCTION safe_jsonb_cast(text)        FROM anon;
        REVOKE EXECUTE ON FUNCTION backfill_document_metadata() FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE EXECUTE ON FUNCTION truncate_documents()         FROM authenticated;
        REVOKE EXECUTE ON FUNCTION update_updated_at_column()   FROM authenticated;
        REVOKE EXECUTE ON FUNCTION safe_jsonb_cast(text)        FROM authenticated;
        REVOKE EXECUTE ON FUNCTION backfill_document_metadata() FROM authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION truncate_documents()         TO service_role;
        GRANT EXECUTE ON FUNCTION safe_jsonb_cast(text)        TO service_role;
        GRANT EXECUTE ON FUNCTION backfill_document_metadata() TO service_role;
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Table exists with correct structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;

-- 2. All indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename = 'documents'
ORDER BY indexname;

-- 3. All functions exist
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'match_documents', 'search_documents_by_industry',
    'search_documents_by_category', 'search_documents_hybrid',
    'search_documents_hybrid_filtered', 'find_recent_documents',
    'get_document_statistics', 'count_documents_by_category',
    'truncate_documents', 'update_updated_at_column',
    'safe_jsonb_cast', 'backfill_document_metadata'
  )
ORDER BY proname;

-- 4. No Supabase roles were created (should return 0 rows)
SELECT rolname FROM pg_roles
WHERE rolname IN ('authenticated', 'anon', 'service_role');

-- 5. SECURITY DEFINER functions have search_path pinned
SELECT proname, proconfig
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('truncate_documents', 'safe_jsonb_cast', 'backfill_document_metadata')
ORDER BY proname;

-- 6. Extensions installed in correct schema
SELECT extname, nspname
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('vector', 'btree_gin', 'pgcrypto');

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. Post data ingestion
-- ══════════════════════════════════════════════════════════════════════════════

-- Metadata backfill (source, industry) runs automatically via
-- backfill_document_metadata() called from store_embeddings.js validateStorage().
