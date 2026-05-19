-- ============================================================
-- FILE: diagnostics/index_sizes.sql
-- PURPOSE: Index inventory, sizes, and usage statistics
-- ============================================================


-- ------------------------------------------------------------
-- [1] All indexes with size and scan count
--
-- Lists every index across all user tables with its size and
-- how many times it has been used (idx_scan). Essential for
-- understanding which indexes are actually paying for themselves.
-- Resets on pg_stat_reset() or server restart.
-- ------------------------------------------------------------

SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS times_scanned,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Unused or rarely used indexes (candidates for removal)
--
-- Indexes that have been scanned fewer than 50 times and are
-- not primary keys or unique constraints. Large unused indexes
-- waste disk space and slow down writes.
-- Threshold (50) can be adjusted based on query frequency.
-- ------------------------------------------------------------

SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS wasted_size,
  idx_scan AS times_used
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE idx_scan < 50
  AND NOT indisprimary
  AND NOT indisunique
ORDER BY pg_relation_size(indexrelid) DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Duplicate indexes (same columns, different names)
--
-- Finds indexes that cover the exact same set of columns on
-- the same table — one of each pair can usually be dropped.
-- Compares using array_agg of column positions (indkey).
-- ------------------------------------------------------------

SELECT
  t.relname AS table_name,
  array_agg(i.relname ORDER BY i.relname) AS duplicate_indexes,
  pg_size_pretty(sum(pg_relation_size(ix.indexrelid))) AS wasted_size
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
GROUP BY t.relname, ix.indkey
HAVING count(*) > 1
ORDER BY sum(pg_relation_size(ix.indexrelid)) DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Index-to-table size ratio
--
-- Shows what percentage of each table's total disk usage is
-- consumed by indexes. A ratio above ~60% often means over-indexing.
-- Useful for spotting tables where indexes outweigh the data.
-- ------------------------------------------------------------

SELECT
  l.relname AS table_name,
  pg_size_pretty(pg_relation_size(l.oid)) AS data_size,
  pg_size_pretty(pg_indexes_size(l.oid)) AS index_size,
  pg_size_pretty(pg_total_relation_size(l.oid)) AS total_size,
  round(pg_indexes_size(l.oid)::numeric / nullif(pg_total_relation_size(l.oid), 0) * 100, 1) || '%' AS index_pct_of_total
FROM pg_class l
JOIN pg_namespace n ON n.oid = l.relnamespace
WHERE l.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY pg_indexes_size(l.oid) DESC;

-- output example:
-- [
--
-- ]
