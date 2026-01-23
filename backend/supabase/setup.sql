/**
 * Supabase Schema Setup - Phase 1 (Initial Setup)
 *
 * This file sets up the base infrastructure for the Circular Economy Business Auditor.
 * RUN THIS ONCE during initial deployment.
 *
 * Creates:
 * - pgvector extension for semantic search
 * - documents table with embeddings and metadata
 * - Vector similarity search functions (RPC)
 * - Indexes for fast retrieval
 * - Helper functions for analysis
 *
 * After running this, proceed to migrations/ folder for additional features.
 */

-- ============================================
-- 1. Enable Required Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ============================================
-- 2. Create Documents Table with Full Metadata
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add column comments for documentation
COMMENT ON TABLE documents IS 'Stores chunked circular economy business data with semantic embeddings';
COMMENT ON COLUMN documents.content IS 'The text chunk containing problem + solution pair or supporting details';
COMMENT ON COLUMN documents.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN documents.metadata IS 'JSON metadata: {chunk_id, source_row, chunk_type, category, source_id, fields, word_count}';

-- ============================================
-- 3. Create Indexes for Fast Retrieval
-- ============================================

-- Vector similarity index using IVFFlat (fast but approximate)
CREATE INDEX IF NOT EXISTS idx_documents_embedding_ivfflat
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Text search index for keyword filtering
CREATE INDEX IF NOT EXISTS idx_documents_content_trgm
ON documents USING GIN (content GIN_TRGM_OPS);

-- Metadata JSONB index for filtering by category, chunk_type, etc.
CREATE INDEX IF NOT EXISTS idx_documents_metadata
ON documents USING GIN (metadata);

-- Timestamp index for sorting by recency
CREATE INDEX IF NOT EXISTS idx_documents_created_at
ON documents (created_at DESC);

-- ============================================
-- 4. Core Vector Similarity Search Function
-- ============================================

-- Drop existing functions if they exist (to allow re-running this script)
DROP FUNCTION IF EXISTS match_documents(VECTOR, INT, FLOAT) CASCADE;
DROP FUNCTION IF EXISTS match_documents(VECTOR, INT) CASCADE;
DROP FUNCTION IF EXISTS match_documents(VECTOR) CASCADE;

CREATE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    ROUND(CAST((1 - (documents.embedding <=> query_embedding)) AS NUMERIC), 4)::FLOAT AS similarity
  FROM documents
  WHERE (1 - (documents.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_documents IS 'Find most similar documents using cosine similarity. Returns top N results above threshold.';

-- ============================================
-- 5. Advanced Search Functions
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS search_documents_by_category(VECTOR, TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS search_documents_hybrid(VECTOR, TEXT, INT, FLOAT) CASCADE;
DROP FUNCTION IF EXISTS search_documents_by_industry(VECTOR, TEXT, INT, FLOAT) CASCADE;

-- Search by category + similarity
CREATE FUNCTION search_documents_by_category(
  query_embedding VECTOR(1536),
  category_filter TEXT,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  category TEXT,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata->>'category' AS category,
    ROUND(CAST((1 - (documents.embedding <=> query_embedding)) AS NUMERIC), 4)::FLOAT AS similarity
  FROM documents
  WHERE documents.metadata->>'category' = category_filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Search by industry + similarity (for benchmarking)
CREATE FUNCTION search_documents_by_industry(
  query_embedding VECTOR(1536),
  industry_filter TEXT,
  match_count INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  industry TEXT,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    documents.metadata->>'industry' AS industry,
    ROUND(CAST((1 - (documents.embedding <=> query_embedding)) AS NUMERIC), 4)::FLOAT AS similarity
  FROM documents
  WHERE
    (documents.metadata->>'industry' = industry_filter OR industry_filter = 'all') AND
    (1 - (documents.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION search_documents_by_industry IS 'Find similar documents within a specific industry for benchmarking and comparison.';

-- Hybrid search: vector similarity + keyword matching
CREATE FUNCTION search_documents_hybrid(
  query_embedding VECTOR(1536),
  keyword_filter TEXT,
  match_count INT DEFAULT 5,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  combined_score FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    ROUND(CAST(
      (vector_weight * (1 - (documents.embedding <=> query_embedding))) +
      (1 - vector_weight) * CASE
        WHEN documents.content ILIKE '%' || keyword_filter || '%' THEN 1.0
        ELSE 0.0
      END
    AS NUMERIC), 4)::FLOAT AS combined_score
  FROM documents
  WHERE
    keyword_filter IS NULL OR
    documents.content ILIKE '%' || keyword_filter || '%'
  ORDER BY combined_score DESC
  LIMIT match_count;
$$;

-- ============================================
-- 6. Analytical Functions
-- ============================================

-- Drop analytical functions if they exist
DROP FUNCTION IF EXISTS get_document_statistics() CASCADE;
DROP FUNCTION IF EXISTS count_documents_by_category() CASCADE;

-- Get statistics about stored documents
CREATE FUNCTION get_document_statistics()
RETURNS TABLE (
  total_documents BIGINT,
  total_chunks_from_primary BIGINT,
  total_chunks_from_secondary BIGINT,
  categories TEXT[],
  avg_content_length INT,
  oldest_document TIMESTAMP WITH TIME ZONE,
  newest_document TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE metadata->>'chunk_type' = 'primary'),
    COUNT(*) FILTER (WHERE metadata->>'chunk_type' = 'secondary'),
    ARRAY_AGG(DISTINCT metadata->>'category'),
    AVG(LENGTH(content))::INT,
    MIN(created_at),
    MAX(created_at)
  FROM documents;
$$;

-- Count documents by category
CREATE FUNCTION count_documents_by_category()
RETURNS TABLE (
  category TEXT,
  document_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    metadata->>'category' AS category,
    COUNT(*) AS document_count
  FROM documents
  GROUP BY category
  ORDER BY document_count DESC;
$$;

-- ============================================
-- 7. Maintenance Functions
-- ============================================

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Update the updated_at timestamp (trigger helper)
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Row Level Security (Optional - Recommended)
-- ============================================

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust as needed for your security model)
CREATE POLICY documents_read_policy ON documents
  FOR SELECT
  USING (TRUE);

-- Allow authenticated service role to insert/update/delete
CREATE POLICY documents_write_policy ON documents
  FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================
-- Verification Queries
-- ============================================

-- After running embed_and_store.js, verify data:
--
-- SELECT COUNT(*) as total_docs FROM documents;
-- SELECT * FROM get_document_statistics();
-- SELECT * FROM count_documents_by_category();
-- SELECT * FROM match_documents(
--   (SELECT embedding FROM documents LIMIT 1),
--   5
-- ) WHERE similarity > 0.7;


