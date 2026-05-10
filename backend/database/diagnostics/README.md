# Database Diagnostics

SQL queries for monitoring, debugging, and understanding the Supabase PostgreSQL database.
Run these in the Supabase SQL editor or any `psql` client connected to the DB.

---

## Structure

```txt
backend/database/diagnostics/
│
├── sizes/
│   ├── 01_table_overview.sql       # Total size, data/index/TOAST split, row counts, row size projection
│   ├── 02_column_breakdown.sql     # Per-column disk usage (specific table and all tables)
│   └── 03_index_sizes.sql          # Index inventory, unused indexes, duplicates, index/data ratio
│
├── vector/
│   └── 01_vector_sizes.sql         # Embedding column cost, pgvector setup checks, HNSW/IVFFlat indexes, dimension audit
│
├── performance/
│   ├── 01_slow_queries.sql         # Slowest by avg time, highest total time, highest rows/call
│   ├── 02_cache_and_io.sql         # Buffer cache hit rates (heap, index, TOAST), database-wide hit %
│   └── 03_connections_and_locks.sql # Connection summary, limit utilisation, blocked queries, long-running queries, lock inventory
│
├── health/
│   ├── 01_bloat_and_vacuum.sql     # Dead rows, autovacuum recency, overdue tables, write volume
│   └── 02_replication_and_wal.sql  # Replication slot lag, streaming replica lag, WAL rate, checkpoint health
│
└── schema/
    └── 01_schema_introspection.sql # Triggers, foreign keys, RLS policies, tables without RLS, extensions, column types
```

---

## Quick Reference

| Question                                     | File                                                   |
| -------------------------------------------- | ------------------------------------------------------ |
| Which table is largest?                      | `sizes/01_table_overview.sql` — query [1]              |
| Where is all the space going inside a table? | `sizes/02_column_breakdown.sql` — query [1]            |
| Are my indexes worth keeping?                | `sizes/03_index_sizes.sql` — query [2]                 |
| How much disk do my embeddings use?          | `vector/01_vector_sizes.sql` — query [1]               |
| What queries are slow?                       | `performance/01_slow_queries.sql` — query [1]          |
| Am I hitting RAM or disk?                    | `performance/02_cache_and_io.sql` — query [3]          |
| Is something blocking another query?         | `performance/03_connections_and_locks.sql` — query [3] |
| Why is my table larger than expected?        | `health/01_bloat_and_vacuum.sql` — query [1]           |
| Is Realtime lagging?                         | `health/02_replication_and_wal.sql` — query [1]        |
| What RLS policies are in place?              | `schema/01_schema_introspection.sql` — query [4]       |
| Which tables have NO RLS?                    | `schema/01_schema_introspection.sql` — query [5]       |

---

## Notes

- **pg_stat_statements** must be enabled for `performance/01_slow_queries.sql`.
  Enable via Supabase Dashboard → Database → Extensions → `pg_stat_statements`.

- **Stats reset**: `pg_stat_*` views reset on `pg_stat_reset()` or server restart.
  Check recency with the `stats_reset` column in `pg_stat_bgwriter`.

- **Column breakdown queries** (`sizes/02_column_breakdown.sql` all-tables variant) are slow
  on large schemas — run off-peak.

- **WAL rate query** (`health/02_replication_and_wal.sql` query [3]) sleeps for 5 seconds
  by design. Don't run in a transaction.

- Queries with a `-- << change table name here` comment are parameterised by table name.
  Swap `'uptime_checks'` / `'documents'` / etc. for the table you want to inspect.
