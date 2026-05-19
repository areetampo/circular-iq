-- ============================================================
-- FILE: diagnostics/bloat_and_vacuum.sql
-- PURPOSE: Dead row accumulation, vacuum health, and table bloat
-- CONTEXT: Postgres does not delete rows on UPDATE/DELETE — it
--   marks them dead and relies on VACUUM to reclaim the space.
--   Dead rows inflate table size and slow sequential scans.
-- ============================================================


-- ------------------------------------------------------------
-- [1] Dead rows and vacuum recency per table
--
-- n_dead_tup: rows marked dead but not yet vacuumed
-- dead_pct: what fraction of the table is dead weight
-- A dead_pct above ~10% on a frequently written table is a
-- signal that autovacuum is not keeping up.
-- ------------------------------------------------------------

SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Tables overdue for autovacuum
--
-- autovacuum_vacuum_threshold: minimum dead rows before autovacuum fires
-- autovacuum_vacuum_scale_factor: fraction of table size added to threshold
-- A table is "due" when: n_dead_tup > threshold + (scale_factor * n_live_tup)
-- This query shows which tables have crossed that line.
-- ------------------------------------------------------------

SELECT
  schemaname,
  relname AS table_name,
  n_dead_tup AS dead_rows,
  n_live_tup AS live_rows,
  round((current_setting('autovacuum_vacuum_threshold')::numeric +
    current_setting('autovacuum_vacuum_scale_factor')::numeric * n_live_tup)) AS vacuum_threshold,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > (
    current_setting('autovacuum_vacuum_threshold')::numeric +
    current_setting('autovacuum_vacuum_scale_factor')::numeric * n_live_tup
  )
ORDER BY n_dead_tup DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Table modification rate since last vacuum
--
-- n_mod_since_analyze: rows modified since last ANALYZE ran.
-- High values mean query planner is using stale statistics,
-- which can cause poor query plans even with good indexes.
-- ------------------------------------------------------------

SELECT
  schemaname,
  relname AS table_name,
  n_mod_since_analyze AS modifications_since_analyze,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE n_mod_since_analyze > 1000
ORDER BY n_mod_since_analyze DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Autovacuum currently running
--
-- Shows if autovacuum workers are active right now and which
-- tables they are processing. Useful when a vacuum is slow and
-- you want to confirm it's actually running.
-- ------------------------------------------------------------

SELECT
  pid,
  now() - query_start AS running_for,
  left(query, 200) AS vacuum_query
FROM pg_stat_activity
WHERE query ILIKE '%autovacuum%'
   OR query ILIKE '%vacuum%'
ORDER BY query_start;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [5] Table write volume (inserts / updates / deletes)
--
-- Shows the lifetime write activity per table since last stats reset.
-- Tables with high update/delete counts accumulate dead rows fastest
-- and need more aggressive vacuum settings.
-- ------------------------------------------------------------

SELECT
  relname AS table_name,
  n_tup_ins AS inserts,
  n_tup_upd AS updates,
  n_tup_del AS deletes,
  n_tup_ins + n_tup_upd + n_tup_del AS total_writes
FROM pg_stat_user_tables
ORDER BY total_writes DESC;

-- output example:
-- [
--
-- ]
