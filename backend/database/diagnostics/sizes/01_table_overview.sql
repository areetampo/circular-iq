-- ============================================================
-- FILE: diagnostics/sizes/01_table_overview.sql
-- PURPOSE: High-level disk usage for all tables in the public schema
-- ============================================================


-- ------------------------------------------------------------
-- [1] Total size per table (public schema only), largest first
--
-- Shows the full on-disk footprint including data, indexes,
-- and TOAST. Good starting point before drilling into breakdown.
-- ------------------------------------------------------------

SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS total_size
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
ORDER BY
  pg_total_relation_size(quote_ident(table_name)) DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Data vs. index vs. TOAST breakdown — all schemas
--
-- Splits total size into its three components:
--   - actual_data_size: the raw heap (live rows)
--   - index_size: all indexes combined
--   - toast_and_meta_size: overflow storage for large text/jsonb/vectors
-- Includes raw bytes for easy sorting.
-- ------------------------------------------------------------

SELECT
    n.nspname AS schema_name,
    l.relname AS table_name,
    pg_size_pretty(pg_relation_size(l.oid)) AS actual_data_size,
    pg_size_pretty(pg_indexes_size(l.oid)) AS index_size,
    pg_size_pretty(pg_total_relation_size(l.oid) - pg_relation_size(l.oid) - pg_indexes_size(l.oid)) AS toast_and_meta_size,
    pg_size_pretty(pg_total_relation_size(l.oid)) AS total_disk_usage,
    pg_total_relation_size(l.oid) AS total_bytes
FROM pg_class l
LEFT JOIN pg_namespace n ON n.oid = l.relnamespace
WHERE l.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY total_bytes DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Data vs. index vs. TOAST breakdown — specific table
--
-- Same as above but scoped to one table. Swap the table name
-- in the WHERE clause as needed.
-- ------------------------------------------------------------

SELECT
    l.relname AS table_name,
    pg_size_pretty(pg_relation_size(l.oid)) AS actual_data_size,
    pg_size_pretty(pg_indexes_size(l.oid)) AS index_size,
    pg_size_pretty(pg_total_relation_size(l.oid) - pg_relation_size(l.oid) - pg_indexes_size(l.oid)) AS toast_and_meta_size,
    pg_size_pretty(pg_total_relation_size(l.oid)) AS total_disk_usage
FROM pg_class l
LEFT JOIN pg_namespace n ON n.oid = l.relnamespace
WHERE l.relkind = 'r'
  AND l.relname = 'uptime_checks';  -- << change table name here

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Approximate row counts for all tables (fast)
--
-- Reads from pg_stat_user_tables — no sequential scan.
-- n_live_tup is updated by autovacuum so may lag by minutes.
-- Pair with size queries to get a sense of bytes-per-row.
-- ------------------------------------------------------------

SELECT
  relname AS table_name,
  n_live_tup AS approx_row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [5] Average row size + growth projection — specific table
--
-- Scans the actual rows to measure real average row size,
-- then projects total data size at a given row count.
-- Useful for capacity planning before scaling.
-- Edit the projected row count in the multiplication.
-- ------------------------------------------------------------

SELECT
  count(*) AS row_count,
  pg_size_pretty(avg(pg_column_size(uptime_checks.*))::bigint) AS avg_row_size,
  pg_size_pretty((avg(pg_column_size(uptime_checks.*)) * 230000)::bigint) AS projected_data_230k  -- << change projection target
FROM uptime_checks;  -- << change table name here

-- output example:
-- [
--
-- ]
