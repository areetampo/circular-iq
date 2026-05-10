-- ============================================================
-- FILE: diagnostics/sizes/02_column_breakdown.sql
-- PURPOSE: Column-level size analysis within tables
-- ============================================================


-- ------------------------------------------------------------
-- [1] Column sizes — specific table
--
-- Shows how much disk space each column consumes within a
-- single table, plus its percentage of the total table size.
-- Uses xpath/query_to_xml to dynamically evaluate each column.
-- Good for finding which columns are bloating a specific table.
-- ------------------------------------------------------------

WITH column_stats AS (
    SELECT
        table_schema,
        table_name,
        column_name,
        (data_type ||
            CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE '' END) AS data_type
    FROM information_schema.columns
    WHERE table_name = 'uptime_checks'         -- << change table name here
      AND table_schema NOT IN ('information_schema', 'pg_catalog')
),
storage_calc AS (
    SELECT
        table_schema,
        table_name,
        column_name,
        data_type,
        pg_total_relation_size('"' || table_schema || '"."' || table_name || '"') AS total_table_bytes,
        NULLIF(
            (xpath('/row/c/text()',
                query_to_xml(format('SELECT sum(pg_column_size(%I)) as c FROM %I.%I',
                column_name, table_schema, table_name), false, true, '')
            ))[1]::text::numeric, 0
        ) AS col_bytes
    FROM column_stats
)
SELECT
    column_name,
    data_type,
    pg_size_pretty(col_bytes) AS column_size,
    CASE
        WHEN total_table_bytes > 0
        THEN round((col_bytes / total_table_bytes) * 100, 2) || '%'
        ELSE '0%'
    END AS percent_of_table_total
FROM storage_calc
ORDER BY col_bytes DESC NULLS LAST;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Column sizes — all tables
--
-- Same as above but runs across every table in every non-system
-- schema. Ranked by column size descending.
-- NOTE: this is slow on large DBs — it queries every column of
-- every table dynamically. Run off-peak if DB is under load.
-- ------------------------------------------------------------

WITH column_stats AS (
    SELECT
        table_schema,
        table_name,
        column_name,
        (data_type ||
            CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE '' END) AS data_type
    FROM information_schema.columns
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'extensions', '_aiven')
),
storage_calc AS (
    SELECT
        table_schema,
        table_name,
        column_name,
        data_type,
        pg_total_relation_size('"' || table_schema || '"."' || table_name || '"') AS total_table_bytes,
        NULLIF(
            (xpath('/row/c/text()',
                query_to_xml(format('SELECT sum(pg_column_size(%I)) as c FROM %I.%I',
                column_name, table_schema, table_name), false, true, '')
            ))[1]::text::numeric, 0
        ) AS col_bytes
    FROM column_stats
)
SELECT
    table_name,
    column_name,
    data_type,
    pg_size_pretty(col_bytes) AS column_size,
    pg_size_pretty(total_table_bytes) AS total_table_size,
    CASE
        WHEN total_table_bytes > 0
        THEN round((col_bytes / total_table_bytes) * 100, 2) || '%'
        ELSE '0%'
    END AS percent_of_total_table
FROM storage_calc
ORDER BY col_bytes DESC NULLS LAST;

-- output example:
-- [
--
-- ]
