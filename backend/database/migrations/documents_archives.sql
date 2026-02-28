/**
 * documents_archives table for database/sql/01_vector_infrastructure.sql
 * add "_archives" suffix to all occurences of "documents" or "document"
 */

-- ============================================
-- 0. Drop all existing functions (regardless of signature)
-- ============================================

-- Drop the documents_archives table if it exists (cascades to indexes, policies, triggers)
DROP TABLE IF EXISTS documents_archives CASCADE;

-- Drop all functions that might conflict (regardless of signature)
DO $$
DECLARE
    func_names text[] := ARRAY[
        'match_documents_archives',
        'search_documents_archives_by_industry',
        'search_documents_archives_by_category',
        'search_documents_archives_hybrid',
        'search_documents_archives_hybrid_filtered',
        'truncate_documents_archives',
        'get_document_archives_statistics',
        'count_documents_archives_by_category',
        'update_updated_at_column'
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
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
                           rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;

-- ============================================
-- 1. Create Extensions Schema (SECURITY FIX)
-- ============================================

CREATE SCHEMA IF NOT EXISTS extensions;
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions (security best practice - keeps extensions out of public schema)';

-- ============================================
-- 2. Enable Required Extensions
-- ============================================

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector
  SCHEMA extensions
  CASCADE;

-- Enable btree_gin for composite indexes
CREATE EXTENSION IF NOT EXISTS btree_gin
  SCHEMA extensions
  CASCADE;

COMMENT ON EXTENSION vector IS 'pgvector: vector similarity search for embeddings';
COMMENT ON EXTENSION btree_gin IS 'GIN index support for btree-indexable data types';

-- Grant permissions on extensions schema
GRANT USAGE ON SCHEMA extensions TO authenticated, anon, service_role;

-- ============================================
-- 3. Create documents_archives Table with UUID
-- ============================================
--
-- DIMENSION REFERENCE: Embedding dimension MUST match EMBEDDING_DIMENSION
-- in backend/config/embedding.js (currently 1536 for text-embedding-3-small)
-- If changing embedding models, update BOTH this SQL AND embedding.js
--

CREATE TABLE IF NOT EXISTS documents_archives (
  -- UUID primary key with auto-generation (using gen_random_uuid())
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document content (required)
  content TEXT NOT NULL,

  -- Vector embedding (1536-dimensional for text-embedding-3-small)
  -- KEEP IN SYNC with EMBEDDING_DIMENSION in backend/config/embedding.js
  embedding extensions.vector(1536) NOT NULL,

  -- Structured metadata columns for efficient filtering (indexed)
  industry TEXT,
  category TEXT,
  source TEXT,

  -- Flexible JSONB for additional metadata fields
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps with timezone
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE documents_archives IS 'Documents_archives with vector embeddings for semantic search. Dimension: 1536 (matches text-embedding-3-small). See backend/config/embedding.js';
COMMENT ON COLUMN documents_archives.id IS 'UUID primary key with auto-generation (gen_random_uuid())';
COMMENT ON COLUMN documents_archives.content IS 'Full text content of the document_archives (required)';
COMMENT ON COLUMN documents_archives.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions). NOT NULL to ensure all document_archives are queryable';
COMMENT ON COLUMN documents_archives.industry IS 'Primary industry classification for filtering';
COMMENT ON COLUMN documents_archives.category IS 'Primary category classification for filtering';
COMMENT ON COLUMN documents_archives.source IS 'Source identifier or dataset name';
COMMENT ON COLUMN documents_archives.metadata IS 'Flexible JSONB for additional metadata (legacy/flexible fields)';
COMMENT ON COLUMN documents_archives.created_at IS 'Creation timestamp (automatically set)';
COMMENT ON COLUMN documents_archives.updated_at IS 'Last update timestamp (automatically set)';

-- ============================================
-- 4. Create Optimized Indexes (PERFORMANCE)
-- ============================================

-- HNSW index for fast vector similarity search (better than IVFFlat for most cases)
-- This provides 5-50x faster queries compared to no index
CREATE INDEX IF NOT EXISTS idx_documents_archives_embedding_hnsw
ON documents_archives
USING hnsw (embedding extensions.vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON INDEX idx_documents_archives_embedding_hnsw IS 'HNSW index for fast approximate nearest neighbor search on embeddings';

-- GIN index for metadata queries (industry filter)
CREATE INDEX IF NOT EXISTS idx_documents_archives_metadata_industry
ON documents_archives
USING gin ((metadata->'industry'));

COMMENT ON INDEX idx_documents_archives_metadata_industry IS 'Fast lookups by industry in metadata';

-- GIN index for metadata queries (category filter)
CREATE INDEX IF NOT EXISTS idx_documents_archives_metadata_category
ON documents_archives
USING gin ((metadata->'category'));

COMMENT ON INDEX idx_documents_archives_metadata_category IS 'Fast lookups by category in metadata';

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_archives_content_fts
ON documents_archives
USING gin (to_tsvector('english', content));

COMMENT ON INDEX idx_documents_archives_content_fts IS 'Full-text search index on document_archives content';

-- Time-based queries index
CREATE INDEX IF NOT EXISTS idx_documents_archives_created_at
ON documents_archives(created_at DESC);

COMMENT ON INDEX idx_documents_archives_created_at IS 'Fast time-based queries and sorting';

-- Structured column indexes (improve filter performance)
CREATE INDEX IF NOT EXISTS idx_documents_archives_industry_btree
ON documents_archives(industry);

COMMENT ON INDEX idx_documents_archives_industry_btree IS 'Btree index on industry column';

CREATE INDEX IF NOT EXISTS idx_documents_archives_category_btree
ON documents_archives(category);

COMMENT ON INDEX idx_documents_archives_category_btree IS 'Btree index on category column';

CREATE INDEX IF NOT EXISTS idx_documents_archives_source_btree
ON documents_archives(source);

COMMENT ON INDEX idx_documents_archives_source_btree IS 'Btree index on source column';

CREATE INDEX IF NOT EXISTS idx_documents_archives_industry_category
ON documents_archives(industry, category);

COMMENT ON INDEX idx_documents_archives_industry_category IS 'Composite btree index on (industry, category)';

-- ============================================
-- 5. Enable Row Level Security
-- ============================================

ALTER TABLE documents_archives ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS documents_archives_read_policy ON documents_archives;
DROP POLICY IF EXISTS documents_archives_write_policy ON documents_archives;
DROP POLICY IF EXISTS documents_archives_access_policy ON documents_archives;

-- Single simplified policy - documents_archives are accessible to all
CREATE POLICY documents_archives_access_policy ON documents_archives
  FOR ALL
  USING (true);

COMMENT ON POLICY documents_archives_access_policy ON documents_archives IS 'All users can access documents_archives (public data)';

-- ============================================
-- 6. Create Search Functions (UUID return type)
-- ============================================

-- Basic vector similarity search
CREATE OR REPLACE FUNCTION match_documents_archives(
  query_embedding extensions.vector(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents_archives.id,
    documents_archives.content,
    documents_archives.metadata,
    1 - (documents_archives.embedding <=> query_embedding) AS similarity
  FROM documents_archives
  WHERE documents_archives.embedding IS NOT NULL
  ORDER BY documents_archives.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION match_documents_archives IS 'Find similar documents_archives using cosine similarity on embeddings';

-- Search by industry with similarity threshold
CREATE OR REPLACE FUNCTION search_documents_archives_by_industry(
  query_embedding extensions.vector(1536),
  industry_filter TEXT,
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents_archives d
  WHERE
    d.embedding IS NOT NULL
    AND d.metadata->>'industry' = industry_filter
    AND 1 - (d.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION search_documents_archives_by_industry IS 'Search documents_archives filtered by industry with minimum similarity threshold';

-- Search by category with similarity threshold
CREATE OR REPLACE FUNCTION search_documents_archives_by_category(
  query_embedding extensions.vector(1536),
  category_filter TEXT,
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents_archives d
  WHERE
    d.embedding IS NOT NULL
    AND d.metadata->>'category' = category_filter
    AND 1 - (d.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION search_documents_archives_by_category IS 'Search documents_archives filtered by category with minimum similarity threshold';

-- Hybrid search combining vector similarity and full-text search
-- UPDATED: Added structured filters (industry, category, source) and extended output columns
CREATE OR REPLACE FUNCTION search_documents_archives_hybrid(
  query_embedding extensions.vector(1536),
  keyword_filter TEXT DEFAULT '',
  industry_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  source_filter TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  vector_weight FLOAT DEFAULT 0.7,
  similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  industry TEXT,
  category TEXT,
  source TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.industry,
    d.category,
    d.source,
    d.metadata,
    (1 - (d.embedding <=> query_embedding)) * vector_weight +
    ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', keyword_filter)) * (1 - vector_weight) AS similarity
  FROM documents_archives d
  WHERE
    d.embedding IS NOT NULL
    AND (
      keyword_filter = ''
      OR to_tsvector('english', d.content) @@ plainto_tsquery('english', keyword_filter)
    )
    AND (
      industry_filter IS NULL
      OR d.industry = industry_filter
    )
    AND (
      category_filter IS NULL
      OR d.category = category_filter
    )
    AND (
      source_filter IS NULL
      OR d.source = source_filter
    )
    AND (1 - (d.embedding <=> query_embedding)) * vector_weight +
        ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', keyword_filter)) * (1 - vector_weight) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION search_documents_archives_hybrid IS 'Hybrid search combining vector similarity and full-text search with configurable weights';

-- Hybrid search with industry filtering
CREATE OR REPLACE FUNCTION search_documents_archives_hybrid_filtered(
  query_embedding extensions.vector(1536),
  keyword_filter TEXT DEFAULT '',
  industry_filter TEXT DEFAULT NULL,
  match_count INT DEFAULT 10,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    (1 - (d.embedding <=> query_embedding)) * vector_weight +
    ts_rank(to_tsvector('english', d.content), plainto_tsquery('english', keyword_filter)) * (1 - vector_weight) AS similarity
  FROM documents_archives d
  WHERE
    d.embedding IS NOT NULL
    AND (
      keyword_filter = ''
      OR to_tsvector('english', d.content) @@ plainto_tsquery('english', keyword_filter)
    )
    AND (
      industry_filter IS NULL
      OR d.metadata->>'industry' = industry_filter
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION search_documents_archives_hybrid_filtered IS 'Hybrid search with optional industry filtering';

-- ============================================
-- 7. Analytics Functions (SECURITY FIX)
-- ============================================

-- TRUNCATE documents_archives table to reclaim disk space
-- This is used by the embedding pipeline (embed_and_store.js) instead of DELETE
-- TRUNCATE is much faster and reclaims disk space, preventing table bloat
CREATE OR REPLACE FUNCTION truncate_documents_archives()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE documents_archives RESTART IDENTITY;  -- RESTART IDENTITY is harmless (no sequence for UUID)
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION truncate_documents_archives IS 'Safely truncate the documents_archives table (used by embedding pipeline to prevent storage bloat)';

-- Get document_archives statistics
CREATE OR REPLACE FUNCTION get_document_archives_statistics()
RETURNS TABLE (
  total_documents BIGINT,
  documents_by_category JSONB,
  documents_by_industry JSONB,
  avg_content_length FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*)::BIGINT AS total,
      AVG(LENGTH(content))::FLOAT AS avg_len
    FROM documents_archives
  ),
  by_category AS (
    SELECT
      jsonb_object_agg(
        COALESCE(metadata->>'category', 'uncategorized'),
        cnt
      ) AS cat_stats
    FROM (
      SELECT
        metadata->>'category' AS category,
        COUNT(*)::INT AS cnt
      FROM documents_archives
      GROUP BY metadata->>'category'
    ) sub
  ),
  by_industry AS (
    SELECT
      jsonb_object_agg(
        COALESCE(metadata->>'industry', 'uncategorized'),
        cnt
      ) AS ind_stats
    FROM (
      SELECT
        metadata->>'industry' AS industry,
        COUNT(*)::INT AS cnt
      FROM documents_archives
      GROUP BY metadata->>'industry'
    ) sub
  )
  SELECT
    s.total,
    COALESCE(bc.cat_stats, '{}'::jsonb),
    COALESCE(bi.ind_stats, '{}'::jsonb),
    s.avg_len
  FROM stats s
  CROSS JOIN by_category bc
  CROSS JOIN by_industry bi;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION get_document_archives_statistics IS 'Get aggregated statistics about documents_archives in the system';

CREATE OR REPLACE FUNCTION count_documents_archives_by_category(category_name TEXT)
RETURNS BIGINT AS $$
DECLARE
  doc_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO doc_count
  FROM documents_archives
  WHERE metadata->>'category' = category_name;

  RETURN doc_count;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
STABLE;

COMMENT ON FUNCTION count_documents_archives_by_category IS 'Count documents_archives in a specific category';

-- ============================================
-- 8. Maintenance Trigger (SECURITY FIX)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions
SECURITY DEFINER;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update updated_at timestamp on row modification';

DROP TRIGGER IF EXISTS update_documents_archives_updated_at ON documents_archives;

CREATE TRIGGER update_documents_archives_updated_at
  BEFORE UPDATE ON documents_archives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Grant Permissions (No sequence grants)
-- ============================================

GRANT ALL ON documents_archives TO authenticated;
GRANT SELECT ON documents_archives TO anon;
GRANT ALL ON documents_archives TO service_role;

-- Note: No GRANT on documents_archives_id_seq because UUID doesn't use a sequence

-- Allow service role to execute truncate function
GRANT EXECUTE ON FUNCTION truncate_documents_archives() TO service_role;
GRANT EXECUTE ON FUNCTION match_documents_archives(extensions.vector, INT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_documents_archives_by_industry(extensions.vector, TEXT, INT, FLOAT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_documents_archives_by_category(extensions.vector, TEXT, INT, FLOAT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_documents_archives_hybrid(extensions.vector, TEXT, TEXT, TEXT, TEXT, INT, FLOAT, FLOAT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION search_documents_archives_hybrid_filtered(extensions.vector, TEXT, TEXT, INT, FLOAT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_document_archives_statistics() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION count_documents_archives_by_category(TEXT) TO authenticated, anon, service_role;

-- ============================================
-- 10. Verification Queries (Optional)
-- ============================================

-- Check extensions are in extensions schema (only vector and btree_gin, no pg_trgm)
SELECT extname, nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE extname IN ('vector', 'btree_gin');

-- Check indexes exist (should see: HNSW for embedding, GIN for FTS, and metadata indexes)
SELECT tablename, indexname FROM pg_indexes WHERE tablename = 'documents_archives' ORDER BY indexname;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'documents_archives';

-- Check functions have search_path set
SELECT proname, proconfig FROM pg_proc WHERE proname LIKE '%document_archives%';
