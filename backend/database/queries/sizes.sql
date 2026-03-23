-- General Table Size Overview

SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS total_size
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
ORDER BY
  pg_total_relation_size(quote_ident(table_name)) DESC;

-- Embedding Column vs. Table Size (The "Vector Tax")

SELECT
    pg_size_pretty(sum(pg_column_size(embedding))) AS vector_column_size,
    pg_size_pretty(pg_total_relation_size('documents')) AS total_table_size,
    round((sum(pg_column_size(embedding))::numeric /
           pg_total_relation_size('documents')::numeric) * 100, 2) || '%' AS percentage_of_table
FROM
    documents;

-- Detailed Column-Level Breakdown

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
    -- Excluded Aiven and standard system schemas
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

-- Index vs. Data Breakdown (Specific Table)

SELECT
    l.relname AS table_name,
    pg_size_pretty(pg_relation_size(l.oid)) AS actual_data_size,
    pg_size_pretty(pg_indexes_size(l.oid)) AS index_size,
    pg_size_pretty(pg_total_relation_size(l.oid) - pg_relation_size(l.oid) - pg_indexes_size(l.oid)) AS toast_and_meta_size,
    pg_size_pretty(pg_total_relation_size(l.oid)) AS total_disk_usage
FROM pg_class l
LEFT JOIN pg_namespace n ON n.oid = l.relnamespace
WHERE l.relkind = 'r'
  AND l.relname = 'documents';

---

SET maintenance_work_mem = '128MB';
SELECT indexname FROM pg_indexes WHERE tablename = 'documents';

---

-- 1. Where is the vector extension installed?
SELECT extname, nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE extname = 'vector';

-- 2. What is the exact type of the embedding column?
SELECT data_type, udt_schema, udt_name
FROM information_schema.columns
WHERE table_name = 'documents' AND column_name = 'embedding';

-- 3. Does the operator exist for halfvec?
SELECT oprname, oprleft::regtype, oprright::regtype, nspname
FROM pg_operator o JOIN pg_namespace n ON o.oprnamespace = n.oid
WHERE oprname = '<=>' AND oprleft::regtype::text LIKE '%halfvec%';

-- functions on a table

SELECT
    trigger_name,
    event_manipulation AS event,
    action_statement AS function_call,
    action_timing AS timing
FROM  information_schema.triggers
WHERE event_object_table = 'documents'
ORDER BY trigger_name;
