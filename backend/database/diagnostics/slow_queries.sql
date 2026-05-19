-- ============================================================
-- FILE: diagnostics/slow_queries.sql
-- PURPOSE: Identify slow and expensive queries via pg_stat_statements
-- REQUIRES: pg_stat_statements extension must be enabled
--   Enable via: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
--   On Supabase: enable in Dashboard → Database → Extensions
-- ============================================================


-- ------------------------------------------------------------
-- [1] Top 20 slowest queries by average execution time
--
-- Mean execution time is the most actionable metric — it shows
-- which queries are slow on every call, not just in aggregate.
-- stddev_exec_time being high means the query is unpredictable
-- (often caused by parameter sniffing or missing indexes).
-- ------------------------------------------------------------

SELECT
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round(stddev_exec_time::numeric, 2) AS stddev_ms,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  rows,
  left(query, 200) AS query_snippet
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Top 20 queries by total cumulative time
--
-- A fast query called millions of times can dominate DB CPU.
-- This catches those high-volume, moderate-cost queries that
-- mean_exec_time alone would miss.
-- ------------------------------------------------------------

SELECT
  round(total_exec_time::numeric, 2) AS total_ms,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round((total_exec_time / sum(total_exec_time) OVER ()) * 100, 2) || '%' AS pct_of_total_time,
  left(query, 200) AS query_snippet
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Queries with the most rows examined (potential seq scans)
--
-- High rows / calls ratio with slow execution suggests missing
-- indexes or full table scans. Cross-reference with EXPLAIN.
-- ------------------------------------------------------------

SELECT
  calls,
  round(rows::numeric / nullif(calls, 0), 1) AS avg_rows_returned,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  left(query, 200) AS query_snippet
FROM pg_stat_statements
WHERE calls > 10
ORDER BY (rows::numeric / nullif(calls, 0)) DESC
LIMIT 20;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Recently reset stats check
--
-- pg_stat_statements data resets on pg_stat_statements_reset()
-- or server restart. Check when stats were last cleared so you
-- know how far back the data covers.
-- ------------------------------------------------------------

SELECT stats_reset
FROM pg_stat_bgwriter;

-- output example:
-- [
--
-- ]
