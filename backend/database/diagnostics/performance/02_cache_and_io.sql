-- ============================================================
-- FILE: diagnostics/performance/02_cache_and_io.sql
-- PURPOSE: Buffer cache hit rates and I/O patterns per table
-- ============================================================


-- ------------------------------------------------------------
-- [1] Cache hit rate per table (heap reads)
--
-- heap_blks_hit = served from shared_buffers (RAM)
-- heap_blks_read = had to go to disk (or OS page cache)
-- Target: cache_hit_pct above 99%. Anything below 95% for a
-- frequently accessed table suggests the DB needs more RAM
-- or the table is too large to fit in shared_buffers.
-- ------------------------------------------------------------

SELECT
  relname AS table_name,
  heap_blks_read AS disk_reads,
  heap_blks_hit AS cache_hits,
  round(
    heap_blks_hit::numeric / nullif(heap_blks_hit + heap_blks_read, 0) * 100,
    2
  ) AS cache_hit_pct
FROM pg_statio_user_tables
WHERE heap_blks_hit + heap_blks_read > 0
ORDER BY heap_blks_read DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Index cache hit rate
--
-- Same concept applied to index pages. Low index cache hit rate
-- means index scans are causing disk I/O, which can significantly
-- slow down queries that look fast on paper.
-- ------------------------------------------------------------

SELECT
  relname AS table_name,
  indexrelname AS index_name,
  idx_blks_read AS index_disk_reads,
  idx_blks_hit AS index_cache_hits,
  round(
    idx_blks_hit::numeric / nullif(idx_blks_hit + idx_blks_read, 0) * 100,
    2
  ) AS index_cache_hit_pct
FROM pg_statio_user_indexes
WHERE idx_blks_hit + idx_blks_read > 0
ORDER BY idx_blks_read DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Database-wide cache hit rate (single number)
--
-- Quick overall health check. Should be above 99% for an
-- OLTP workload. Below 95% warrants investigating shared_buffers
-- settings or upgrading the Supabase plan for more RAM.
-- ------------------------------------------------------------

SELECT
  round(
    sum(heap_blks_hit)::numeric / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100,
    2
  ) AS overall_cache_hit_pct
FROM pg_statio_user_tables;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] TOAST I/O (large column overflow reads)
--
-- TOAST stores large values (big text, jsonb, vectors) in a
-- separate heap. High toast_blks_read means large-column queries
-- are causing significant disk I/O despite normal cache hit rates.
-- If your tables have heavy jsonb/text, this is important to check.
-- ------------------------------------------------------------

SELECT
  relname AS table_name,
  toast_blks_read,
  toast_blks_hit,
  round(
    toast_blks_hit::numeric / nullif(toast_blks_hit + toast_blks_read, 0) * 100,
    2
  ) AS toast_cache_hit_pct
FROM pg_statio_user_tables
WHERE toast_blks_read + toast_blks_hit > 0
ORDER BY toast_blks_read DESC;

-- output example:
-- [
--
-- ]
