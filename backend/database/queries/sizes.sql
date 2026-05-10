-- Embedding Column vs. Table Size (The "Vector Tax")

SELECT
    pg_size_pretty(sum(pg_column_size(embedding))) AS vector_column_size,
    pg_size_pretty(pg_total_relation_size('documents')) AS total_table_size,
    round((sum(pg_column_size(embedding))::numeric /
           pg_total_relation_size('documents')::numeric) * 100, 2) || '%' AS percentage_of_table
FROM
    documents;

-- output example

[
  {
    "vector_column_size": "14 MB",
    "total_table_size": "51 MB",
    "percentage_of_table": "27.07%"
  }
]

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

-- output example

[
  {
    "table_name": "ce_cases",
    "total_size": "74 MB"
  },
  {
    "table_name": "documents",
    "total_size": "51 MB"
  },
  {
    "table_name": "scoring_results_log",
    "total_size": "9704 kB"
  },
  {
    "table_name": "user_assessments",
    "total_size": "7528 kB"
  },
  {
    "table_name": "uptime_checks",
    "total_size": "1272 kB"
  },
  {
    "table_name": "profiles",
    "total_size": "96 kB"
  },
  {
    "table_name": "anonymous_usage",
    "total_size": "96 kB"
  }
]

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

-- output example

[
  {
    "table_name": "ce_cases",
    "column_name": "embedding",
    "data_type": "USER-DEFINED",
    "column_size": "15 MB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "19.68%"
  },
  {
    "table_name": "documents",
    "column_name": "embedding",
    "data_type": "USER-DEFINED",
    "column_size": "14 MB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "27.07%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "metadata_json",
    "data_type": "jsonb",
    "column_size": "9943 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "13.08%"
  },
  {
    "table_name": "documents",
    "column_name": "metadata",
    "data_type": "jsonb",
    "column_size": "6682 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "12.76%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "search_vector",
    "data_type": "tsvector",
    "column_size": "5868 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "7.72%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "result_snapshot",
    "data_type": "jsonb",
    "column_size": "3123 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "32.18%"
  },
  {
    "table_name": "documents",
    "column_name": "content",
    "data_type": "text",
    "column_size": "3089 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "5.90%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "solution",
    "data_type": "text",
    "column_size": "2816 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "3.71%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "result_json",
    "data_type": "jsonb",
    "column_size": "2345 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "31.15%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "problem",
    "data_type": "text",
    "column_size": "1317 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "1.73%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "audit",
    "data_type": "jsonb",
    "column_size": "992 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "10.22%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "similar_cases",
    "data_type": "jsonb",
    "column_size": "846 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "8.72%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "audit",
    "data_type": "jsonb",
    "column_size": "714 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "9.48%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "similar_cases",
    "data_type": "jsonb",
    "column_size": "671 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "8.91%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "impact",
    "data_type": "text",
    "column_size": "549 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.72%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "score_breakdown",
    "data_type": "jsonb",
    "column_size": "267 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.75%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "payload",
    "data_type": "jsonb",
    "column_size": "256 kB",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "20.10%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "business_solution",
    "data_type": "text",
    "column_size": "246 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.53%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "weighted_score_card",
    "data_type": "jsonb",
    "column_size": "232 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.39%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "improvement_roadmap",
    "data_type": "jsonb",
    "column_size": "226 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.33%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "sdg_alignment",
    "data_type": "jsonb",
    "column_size": "220 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.26%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "source_url",
    "data_type": "text",
    "column_size": "208 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.27%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "business_solution",
    "data_type": "text",
    "column_size": "203 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "2.70%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "business_problem",
    "data_type": "text",
    "column_size": "201 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.07%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "score_breakdown",
    "data_type": "jsonb",
    "column_size": "194 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "2.58%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "circular_economy_tier",
    "data_type": "jsonb",
    "column_size": "194 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "2.00%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "r_strategy_alignment",
    "data_type": "jsonb",
    "column_size": "191 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "1.97%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "weighted_score_card",
    "data_type": "jsonb",
    "column_size": "169 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "2.25%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "improvement_roadmap",
    "data_type": "jsonb",
    "column_size": "164 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "2.17%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "business_problem",
    "data_type": "text",
    "column_size": "159 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "2.12%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "sdg_alignment",
    "data_type": "jsonb",
    "column_size": "159 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "2.11%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "market_opportunity_summary",
    "data_type": "text",
    "column_size": "148 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "1.52%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "gap_analysis",
    "data_type": "jsonb",
    "column_size": "142 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "1.46%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "metadata",
    "data_type": "jsonb",
    "column_size": "141 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "1.46%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "r_strategy_alignment",
    "data_type": "jsonb",
    "column_size": "141 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "1.87%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "circular_economy_tier",
    "data_type": "jsonb",
    "column_size": "140 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "1.86%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "materials",
    "data_type": "text",
    "column_size": "121 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.16%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "gap_analysis",
    "data_type": "jsonb",
    "column_size": "112 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "1.48%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "market_opportunity_summary",
    "data_type": "text",
    "column_size": "107 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "1.42%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "metadata",
    "data_type": "jsonb",
    "column_size": "105 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "1.40%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "sub_scores",
    "data_type": "jsonb",
    "column_size": "102 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "1.05%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "evaluation_parameters",
    "data_type": "jsonb",
    "column_size": "102 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "1.05%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "circular_strategy",
    "data_type": "text",
    "column_size": "92 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.12%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "business_context",
    "data_type": "jsonb",
    "column_size": "88 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.91%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "timings",
    "data_type": "jsonb",
    "column_size": "88 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.91%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "parameter_consistency",
    "data_type": "jsonb",
    "column_size": "81 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.84%"
  },
  {
    "table_name": "documents",
    "column_name": "chunk_id",
    "data_type": "text",
    "column_size": "75 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.14%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "evaluation_parameters",
    "data_type": "jsonb",
    "column_size": "74 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.98%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "sub_scores",
    "data_type": "jsonb",
    "column_size": "74 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.98%"
  },
  {
    "table_name": "documents",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "74 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.14%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "business_context",
    "data_type": "jsonb",
    "column_size": "69 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.91%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "id",
    "data_type": "text",
    "column_size": "66 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "category",
    "data_type": "text",
    "column_size": "64 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.08%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "parameter_consistency",
    "data_type": "jsonb",
    "column_size": "59 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.79%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "derived_metrics",
    "data_type": "jsonb",
    "column_size": "57 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.59%"
  },
  {
    "table_name": "documents",
    "column_name": "category",
    "data_type": "text",
    "column_size": "43 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.08%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "derived_metrics",
    "data_type": "jsonb",
    "column_size": "42 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.55%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "39 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "ce_cases",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "39 kB",
    "total_table_size": "74 MB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "documents",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "37 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "documents",
    "column_name": "industry",
    "data_type": "text",
    "column_size": "37 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "documents",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "37 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "32 kB",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "2.49%"
  },
  {
    "table_name": "documents",
    "column_name": "field_name",
    "data_type": "text",
    "column_size": "29 kB",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.06%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "ip_hash",
    "data_type": "text",
    "column_size": "27 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.27%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "identifier_hash",
    "data_type": "text",
    "column_size": "27 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.27%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "endpoint_id",
    "data_type": "text",
    "column_size": "17 kB",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "1.37%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "16 kB",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "1.25%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "status",
    "data_type": "text",
    "column_size": "13 kB",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "1.03%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "user_agent_snippet",
    "data_type": "text",
    "column_size": "12 kB",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.12%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "title",
    "data_type": "text",
    "column_size": "11 kB",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.15%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "response_time_ms",
    "data_type": "integer",
    "column_size": "8120 bytes",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "0.62%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "r_strategy_alignment_rating",
    "data_type": "text",
    "column_size": "7678 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.08%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "6720 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": "6224 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.06%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "r_strategy_alignment_rating",
    "data_type": "text",
    "column_size": "5713 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "primary_material",
    "data_type": "text",
    "column_size": "5340 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "industry",
    "data_type": "text",
    "column_size": "5155 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "4880 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.06%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": "4880 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.06%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "public_id",
    "data_type": "uuid",
    "column_size": "4880 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.06%"
  },
  {
    "table_name": "documents",
    "column_name": "source",
    "data_type": "text",
    "column_size": "4718 bytes",
    "total_table_size": "51 MB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "primary_material",
    "data_type": "text",
    "column_size": "3890 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "industry",
    "data_type": "text",
    "column_size": "3769 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "geographic_focus",
    "data_type": "text",
    "column_size": "3449 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "request_id",
    "data_type": "text",
    "column_size": "3360 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "3360 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "r_strategy",
    "data_type": "text",
    "column_size": "3149 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "scale",
    "data_type": "text",
    "column_size": "3112 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "geographic_focus",
    "data_type": "text",
    "column_size": "2624 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "migrations",
    "column_name": "hash",
    "data_type": "character varying(40)",
    "column_size": "2501 bytes",
    "total_table_size": "40 kB",
    "percent_of_total_table": "6.11%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "user_id",
    "data_type": "character varying(255)",
    "column_size": "2442 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "1.42%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "2440 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "2440 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "r_strategy",
    "data_type": "text",
    "column_size": "2273 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "scale",
    "data_type": "text",
    "column_size": "2213 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.03%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "parameter_consistency_rating",
    "data_type": "text",
    "column_size": "2100 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "uptime_checks",
    "column_name": "up",
    "data_type": "boolean",
    "column_size": "2030 bytes",
    "total_table_size": "1272 kB",
    "percent_of_total_table": "0.16%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "risk_level",
    "data_type": "text",
    "column_size": "1779 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "confidence_level",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "technical_feasibility",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "economic_viability",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "circularity_potential",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "audit_confidence_score",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "audit_integrity_gaps_count",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "similar_cases_count",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "overall_score",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "parameter_consistency_score",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "r_strategy_alignment_score",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "business_solution_len",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "business_problem_len",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "processing_time_ms",
    "data_type": "integer",
    "column_size": "1680 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "sessions",
    "column_name": "user_agent",
    "data_type": "text",
    "column_size": "1568 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "1.20%"
  },
  {
    "table_name": "migrations",
    "column_name": "name",
    "data_type": "character varying(100)",
    "column_size": "1529 bytes",
    "total_table_size": "40 kB",
    "percent_of_total_table": "3.73%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "parameter_consistency_rating",
    "data_type": "text",
    "column_size": "1525 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "identities",
    "column_name": "identity_data",
    "data_type": "jsonb",
    "column_size": "1362 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "1.66%"
  },
  {
    "table_name": "users",
    "column_name": "raw_user_meta_data",
    "data_type": "jsonb",
    "column_size": "1362 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.88%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "risk_level",
    "data_type": "text",
    "column_size": "1274 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "economic_viability",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "circularity_potential",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "parameter_consistency_score",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "r_strategy_alignment_score",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "audit_confidence_score",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "audit_integrity_gaps_count",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "similar_cases_count",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "overall_score",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "confidence_level",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "technical_feasibility",
    "data_type": "integer",
    "column_size": "1220 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "schema_migrations",
    "column_name": "version",
    "data_type": "character varying(255)",
    "column_size": "1128 bytes",
    "total_table_size": "24 kB",
    "percent_of_total_table": "4.59%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "session_id",
    "data_type": "uuid",
    "column_size": "1056 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.61%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "instance_id",
    "data_type": "uuid",
    "column_size": "1056 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.61%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "token",
    "data_type": "character varying(255)",
    "column_size": "858 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.50%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "parent",
    "data_type": "character varying(255)",
    "column_size": "676 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.39%"
  },
  {
    "table_name": "schema_migrations",
    "column_name": "version",
    "data_type": "bigint",
    "column_size": "552 bytes",
    "total_table_size": "24 kB",
    "percent_of_total_table": "2.25%"
  },
  {
    "table_name": "schema_migrations",
    "column_name": "inserted_at",
    "data_type": "timestamp without time zone",
    "column_size": "552 bytes",
    "total_table_size": "24 kB",
    "percent_of_total_table": "2.25%"
  },
  {
    "table_name": "users",
    "column_name": "encrypted_password",
    "data_type": "character varying(255)",
    "column_size": "549 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.35%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "528 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.31%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "id",
    "data_type": "bigint",
    "column_size": "528 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.31%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "528 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.31%"
  },
  {
    "table_name": "users",
    "column_name": "raw_app_meta_data",
    "data_type": "jsonb",
    "column_size": "522 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.34%"
  },
  {
    "table_name": "migrations",
    "column_name": "executed_at",
    "data_type": "timestamp without time zone",
    "column_size": "488 bytes",
    "total_table_size": "40 kB",
    "percent_of_total_table": "1.19%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "audit_is_junk_input",
    "data_type": "boolean",
    "column_size": "420 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.00%"
  },
  {
    "table_name": "scoring_results_log",
    "column_name": "is_anonymous",
    "data_type": "boolean",
    "column_size": "420 bytes",
    "total_table_size": "9704 kB",
    "percent_of_total_table": "0.00%"
  },
  {
    "table_name": "identities",
    "column_name": "provider_id",
    "data_type": "text",
    "column_size": "333 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.41%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "contribute_to_global_benchmarks",
    "data_type": "boolean",
    "column_size": "305 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.00%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "is_public",
    "data_type": "boolean",
    "column_size": "305 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.00%"
  },
  {
    "table_name": "user_assessments",
    "column_name": "audit_is_junk_input",
    "data_type": "boolean",
    "column_size": "305 bytes",
    "total_table_size": "7528 kB",
    "percent_of_total_table": "0.00%"
  },
  {
    "table_name": "migrations",
    "column_name": "id",
    "data_type": "integer",
    "column_size": "244 bytes",
    "total_table_size": "40 kB",
    "percent_of_total_table": "0.60%"
  },
  {
    "table_name": "mfa_amr_claims",
    "column_name": "session_id",
    "data_type": "uuid",
    "column_size": "224 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.27%"
  },
  {
    "table_name": "sessions",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": "224 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.17%"
  },
  {
    "table_name": "sessions",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "224 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.17%"
  },
  {
    "table_name": "mfa_amr_claims",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "224 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.27%"
  },
  {
    "table_name": "identities",
    "column_name": "email",
    "data_type": "text",
    "column_size": "168 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.21%"
  },
  {
    "table_name": "users",
    "column_name": "email",
    "data_type": "character varying(255)",
    "column_size": "168 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.11%"
  },
  {
    "table_name": "users",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "144 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "identities",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "144 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.18%"
  },
  {
    "table_name": "identities",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": "144 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.18%"
  },
  {
    "table_name": "users",
    "column_name": "instance_id",
    "data_type": "uuid",
    "column_size": "144 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "users",
    "column_name": "role",
    "data_type": "character varying(255)",
    "column_size": "126 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.08%"
  },
  {
    "table_name": "users",
    "column_name": "aud",
    "data_type": "character varying(255)",
    "column_size": "126 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.08%"
  },
  {
    "table_name": "mfa_amr_claims",
    "column_name": "authentication_method",
    "data_type": "text",
    "column_size": "126 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.15%"
  },
  {
    "table_name": "sessions",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "112 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "mfa_amr_claims",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "112 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.14%"
  },
  {
    "table_name": "sessions",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "112 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "mfa_amr_claims",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "112 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.14%"
  },
  {
    "table_name": "sessions",
    "column_name": "ip",
    "data_type": "inet",
    "column_size": "98 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "users",
    "column_name": "email_confirmed_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "users",
    "column_name": "last_sign_in_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "users",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "users",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "users",
    "column_name": "confirmed_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "identities",
    "column_name": "last_sign_in_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "identities",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "identities",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "72 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.09%"
  },
  {
    "table_name": "refresh_tokens",
    "column_name": "revoked",
    "data_type": "boolean",
    "column_size": "66 bytes",
    "total_table_size": "168 kB",
    "percent_of_total_table": "0.04%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "last_ip_hash",
    "data_type": "text",
    "column_size": "65 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "identifier_hash",
    "data_type": "text",
    "column_size": "65 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "sessions",
    "column_name": "aal",
    "data_type": "USER-DEFINED",
    "column_size": "56 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.04%"
  },
  {
    "table_name": "identities",
    "column_name": "provider",
    "data_type": "text",
    "column_size": "54 bytes",
    "total_table_size": "80 kB",
    "percent_of_total_table": "0.07%"
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "48 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.05%"
  },
  {
    "table_name": "sessions",
    "column_name": "refreshed_at",
    "data_type": "timestamp without time zone",
    "column_size": "32 bytes",
    "total_table_size": "128 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "profiles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "24 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "profiles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": "24 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "users",
    "column_name": "email_change_confirm_status",
    "data_type": "smallint",
    "column_size": "18 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "profiles",
    "column_name": "last_assessment_at",
    "data_type": "timestamp with time zone",
    "column_size": "16 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": "16 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.02%"
  },
  {
    "table_name": "profiles",
    "column_name": "username",
    "data_type": "text",
    "column_size": "13 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "profiles",
    "column_name": "assessment_count",
    "data_type": "integer",
    "column_size": "12 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "email_change",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "reauthentication_token",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "confirmation_token",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "is_sso_user",
    "data_type": "boolean",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "email_change_token_current",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "phone_change",
    "data_type": "text",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "phone_change_token",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "is_anonymous",
    "data_type": "boolean",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "email_change_token_new",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "users",
    "column_name": "recovery_token",
    "data_type": "character varying(255)",
    "column_size": "9 bytes",
    "total_table_size": "152 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "last_used_at",
    "data_type": "timestamp with time zone",
    "column_size": "8 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "last_blocked_at",
    "data_type": "timestamp with time zone",
    "column_size": "8 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": "8 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "first_used_at",
    "data_type": "timestamp with time zone",
    "column_size": "8 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "user_agent_snippet",
    "data_type": "text",
    "column_size": "8 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.01%"
  },
  {
    "table_name": "anonymous_usage",
    "column_name": "usage_count",
    "data_type": "integer",
    "column_size": "4 bytes",
    "total_table_size": "96 kB",
    "percent_of_total_table": "0.00%"
  },
  {
    "table_name": "oauth_client_states",
    "column_name": "code_verifier",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "allowed_mime_types",
    "data_type": "ARRAY",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "attestation_type",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "owner_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "messages",
    "column_name": "topic",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "oauth_consents",
    "column_name": "scopes",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "bucket_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "friendly_name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "messages",
    "column_name": "extension",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "authorization_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_challenges",
    "column_name": "challenge_type",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "redirect_uri",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "scope",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "state",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "resource",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "code_challenge",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "path_tokens",
    "data_type": "ARRAY",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "authorization_code",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "version",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "owner_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "nonce",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "upload_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "messages",
    "column_name": "event",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "users",
    "column_name": "phone",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "bucket_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "etag",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "owner_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "version",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "tag",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "refresh_token_hmac_key",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_vectors",
    "column_name": "id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "scopes",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "audit_log_entries",
    "column_name": "ip_address",
    "data_type": "character varying(64)",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "client_secret_hash",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "request_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "for_email",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "redirect_to",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "redirect_uris",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "grant_types",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "client_name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "client_uri",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "logo_uri",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_domains",
    "column_name": "domain",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "bucket_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "token_endpoint_auth_method",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "data_type",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "provider_type",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "identifier",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "entity_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "metadata_xml",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "metadata_url",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "client_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "client_secret",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "name_id_format",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "acceptable_client_ids",
    "data_type": "ARRAY",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "scopes",
    "data_type": "ARRAY",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "distance_metric",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "issuer",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "discovery_url",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "token_hash",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "relates_to",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "action_filter",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "format",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "authorization_url",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "friendly_name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "token_url",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "userinfo_url",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "jwks_uri",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "secret",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "phone",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "key",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "decrypted_secret",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "flow_state_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "key",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_client_states",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_client_states",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_consents",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_consents",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_consents",
    "column_name": "client_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_consents",
    "column_name": "granted_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_consents",
    "column_name": "revoked_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "client_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "code_challenge_method",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "response_type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "expires_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_authorizations",
    "column_name": "approved_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "factor_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "not_after",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "oauth_client_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sessions",
    "column_name": "refresh_token_counter",
    "data_type": "bigint",
    "column_size": null,
    "total_table_size": "128 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "registration_type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "deleted_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_clients",
    "column_name": "client_type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "pkce_enabled",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "attribute_mapping",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "authorization_params",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "enabled",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "email_optional",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "skip_nonce_check",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "cached_discovery",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "discovery_cached_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "custom_oauth_providers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "in_progress_size",
    "data_type": "bigint",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "user_metadata",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "metadata",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "owner",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "public",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "avif_autodetection",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "file_size_limit",
    "data_type": "bigint",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "owner",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "last_accessed_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "metadata",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "objects",
    "column_name": "user_metadata",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "48 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "size",
    "data_type": "bigint",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "part_number",
    "data_type": "integer",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_vectors",
    "column_name": "type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_vectors",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_vectors",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "dimension",
    "data_type": "integer",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "metadata_configuration",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "vector_indexes",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets_analytics",
    "column_name": "deleted_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "id",
    "data_type": "bigint",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "subscription_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "entity",
    "data_type": "regclass",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "filters",
    "data_type": "ARRAY",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "claims",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "claims_role",
    "data_type": "regrole",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "subscription",
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "messages",
    "column_name": "payload",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "messages",
    "column_name": "private",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "messages",
    "column_name": "updated_at",
    "data_type": "timestamp without time zone",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "messages",
    "column_name": "inserted_at",
    "data_type": "timestamp without time zone",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "messages",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "instances",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "instances",
    "column_name": "uuid",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "instances",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "instances",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "key_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "nonce",
    "data_type": "bytea",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "key_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "nonce",
    "data_type": "bytea",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "credential_id",
    "data_type": "bytea",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "public_key",
    "data_type": "bytea",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "aaguid",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "sign_count",
    "data_type": "bigint",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "transports",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "backup_eligible",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "backed_up",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_credentials",
    "column_name": "last_used_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_challenges",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_challenges",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_challenges",
    "column_name": "session_data",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_challenges",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "webauthn_challenges",
    "column_name": "expires_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "invited_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "confirmation_sent_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "recovery_sent_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "email_change_sent_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "is_super_admin",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "phone_confirmed_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "phone_change_sent_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "banned_until",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "reauthentication_sent_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "users",
    "column_name": "deleted_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "152 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "audit_log_entries",
    "column_name": "instance_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "audit_log_entries",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "audit_log_entries",
    "column_name": "payload",
    "data_type": "json",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "audit_log_entries",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "sso_provider_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_relay_states",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_domains",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_domains",
    "column_name": "sso_provider_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_domains",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_domains",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "sso_provider_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "attribute_mapping",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "saml_providers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "token_type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "created_at",
    "data_type": "timestamp without time zone",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "one_time_tokens",
    "column_name": "updated_at",
    "data_type": "timestamp without time zone",
    "column_size": null,
    "total_table_size": "88 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "factor_type",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "last_challenged_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "web_authn_credential",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "web_authn_aaguid",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_factors",
    "column_name": "last_webauthn_challenge_data",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "56 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "factor_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "verified_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "ip_address",
    "data_type": "inet",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "web_authn_session_data",
    "data_type": "jsonb",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_providers",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_providers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_providers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_providers",
    "column_name": "disabled",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "user_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "code_challenge_method",
    "data_type": "USER-DEFINED",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "auth_code_issued_at",
    "data_type": "timestamp with time zone",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "oauth_client_state_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "linking_target_id",
    "data_type": "uuid",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "email_optional",
    "data_type": "boolean",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "sso_providers",
    "column_name": "resource_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "32 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "profiles",
    "column_name": "display_name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "96 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "profiles",
    "column_name": "avatar_url",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "96 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "profiles",
    "column_name": "bio",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "96 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "profiles",
    "column_name": "preferred_industry",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "96 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "bucket_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "mfa_challenges",
    "column_name": "otp_code",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "upload_signature",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "version",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "s3_multipart_uploads",
    "column_name": "owner_id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "auth_code",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "instances",
    "column_name": "raw_base_config",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "16 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "code_challenge",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "provider_type",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "provider_access_token",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "provider_refresh_token",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "authentication_method",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "description",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "secrets",
    "column_name": "secret",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "invite_token",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "flow_state",
    "column_name": "referrer",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "40 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "buckets",
    "column_name": "id",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "description",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "decrypted_secrets",
    "column_name": "secret",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "0 bytes",
    "percent_of_total_table": "0%"
  },
  {
    "table_name": "buckets",
    "column_name": "name",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  },
  {
    "table_name": "oauth_client_states",
    "column_name": "provider_type",
    "data_type": "text",
    "column_size": null,
    "total_table_size": "24 kB",
    "percent_of_total_table": null
  }
]

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
  AND l.relname = 'uptime_checks';

-- output example

[
  {
    "table_name": "uptime_checks",
    "actual_data_size": "976 kB",
    "index_size": "256 kB",
    "toast_and_meta_size": "40 kB",
    "total_disk_usage": "1272 kB"
  }
]

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
