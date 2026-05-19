-- ============================================================
-- FILE: diagnostics/vector_sizes.sql
-- PURPOSE: Embedding/vector column costs and pgvector diagnostics
-- ============================================================


-- ------------------------------------------------------------
-- [1] Vector "tax" — embedding column vs total table size
--
-- Measures how much of the documents table's total footprint
-- is consumed by the embedding column alone. Useful for
-- deciding whether to compress to halfvec or quantize.
-- Change table and column names as needed.
-- ------------------------------------------------------------

SELECT
    pg_size_pretty(sum(pg_column_size(embedding))) AS vector_column_size,
    pg_size_pretty(pg_total_relation_size('documents')) AS total_table_size,
    round((sum(pg_column_size(embedding))::numeric /
           pg_total_relation_size('documents')::numeric) * 100, 2) || '%' AS percentage_of_table
FROM
    documents;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Vector extension location
--
-- Confirms which schema pgvector is installed in.
-- Matters for operator resolution — if it's in a non-search-path
-- schema, queries may fail to find the <=> operator.
-- ------------------------------------------------------------

SELECT extname, nspname
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'vector';

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Embedding column type details
--
-- Shows exact type, schema, and UDT name for the embedding
-- column. Distinguishes vector vs halfvec vs other variants.
-- ------------------------------------------------------------

SELECT data_type, udt_schema, udt_name
FROM information_schema.columns
WHERE table_name = 'documents' AND column_name = 'embedding';

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Check cosine distance operator exists for halfvec
--
-- If migrating to halfvec for storage savings, verify the <=>
-- operator is available before altering the column type.
-- Returns rows only if the operator is registered.
-- ------------------------------------------------------------

SELECT oprname, oprleft::regtype, oprright::regtype, nspname
FROM pg_operator o
JOIN pg_namespace n ON o.oprnamespace = n.oid
WHERE oprname = '<=>'
  AND oprleft::regtype::text LIKE '%halfvec%';

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [5] Vector index inventory
--
-- Lists all HNSW and IVFFlat indexes (pgvector's index types).
-- Shows their access method and which table/column they cover.
-- Use to confirm vector indexes are actually in place.
-- ------------------------------------------------------------

SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  am.amname AS index_type,
  pg_size_pretty(pg_relation_size(ix.indexrelid)) AS index_size,
  idx_scan AS times_scanned
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_am am ON am.oid = i.relam
JOIN pg_stat_user_indexes si ON si.indexrelid = ix.indexrelid
WHERE am.amname IN ('hnsw', 'ivfflat')
ORDER BY pg_relation_size(ix.indexrelid) DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [6] Embedding dimension check
--
-- Counts unique embedding vector lengths in the documents table.
-- Should return a single dimension (e.g. 1536 for OpenAI ada-002,
-- 3072 for text-embedding-3-large). Multiple values = mixed models,
-- which will cause unexpected similarity scores.
-- ------------------------------------------------------------

SELECT
  array_length(embedding, 1) AS dimensions,
  count(*) AS row_count
FROM documents
GROUP BY 1
ORDER BY 2 DESC;

-- output example:
-- [
--
-- ]
