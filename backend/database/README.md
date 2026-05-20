# Database Layer — Comprehensive Reference

A production-grade PostgreSQL database system for circular economy assessment and semantic search, featuring dual-backend support (Supabase + Aiven), pgvector-powered hybrid search, and a full audit infrastructure.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Dual Backend Support](#dual-backend-support)
- [Migration Sequence](#migration-sequence)
- [Migration 00 — App Settings](#migration-00--app-settings)
- [Migration 01 — Vector Infrastructure (Core)](#migration-01--vector-infrastructure-core)
- [Migration 02 — User Assessments](#migration-02--user-assessments)
- [Migration 03 — User Profiles](#migration-03--user-profiles)
- [Migration 04 — Anonymous Usage](#migration-04--anonymous-usage)
- [Migration 05 — Scoring Results Log](#migration-05--scoring-results-log)
- [Migration 06 — CE Cases (Core)](#migration-06--ce-cases)
- [Migration 07 — Uptime Monitor](#migration-07--uptime-monitor)
- [RPC Functions Reference](#rpc-functions-reference)
- [Repository Layer](#repository-layer)
- [Client & Connection Management](#client--connection-management)
- [Security Model](#security-model)
- [Performance & Monitoring](#performance--monitoring)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The database system is built on PostgreSQL with the pgvector extension, supporting two deployment targets:

- **Supabase** — managed PostgreSQL with built-in auth, RLS, and PostgREST
- **Aiven** — self-managed PostgreSQL for full infrastructure control

The backend selects which database to use at runtime via a single environment flag (`USE_SUPABASE_DOCUMENTS_TABLE`). Both targets share the same schema and functions; only the connection and query execution path differ.

### Core Data Collections

| Table                 | Purpose                                          | Scale                |
| --------------------- | ------------------------------------------------ | -------------------- |
| `documents`           | Vector-embedded CE knowledge chunks for RAG      | 50,000–500,000+ rows |
| `user_assessments`    | Full assessment lifecycle per user               | Per-user             |
| `profiles`            | User profile data linked to Supabase auth        | Per-user             |
| `anonymous_usage`     | Free-tier rate limiting via IP+UA fingerprinting | Per-fingerprint      |
| `scoring_results_log` | Immutable audit trail of all scoring API calls   | Append-only          |
| `ce_cases`            | Curated circular economy reference library       | Thousands of cases   |
| `uptime_checks`       | Backend health check monitoring history          | 15-day retention     |

### Technology Stack

- **pgvector** — 1536-dimensional `halfvec` embeddings (OpenAI `text-embedding-3-small`)
- **HNSW indexing** — O(log n) approximate nearest-neighbor search
- **BM25 full-text search** — PostgreSQL `tsvector`/`GIN` for keyword matching
- **Hybrid scoring** — combined `(vector_score × weight) + (keyword_score × (1 - weight))`
- **Row Level Security** — per-table policies for `service_role`, `authenticated`, and `anon`

---

## Directory Structure

```txt
backend/database/
├── README.md                          ← this file
├── client.js                          ← singleton pool/client factory (Supabase + Aiven)
├── index.js                           ← exports repositories and connection helpers
├── supabase.client.js                 ← Supabase JS client initialisation
│
├── migrations/
│   ├── 00_app_settings.sql            ← app schema, settings table, get_setting() accessor
│   ├── 01_vector_infrastructure.sql   ← pgvector, documents table, search + backfill functions
│   ├── 02_user_assessments.sql        ← user_assessments table + scoring RPCs
│   ├── 03_user_profiles.sql           ← profiles table, auth triggers, FK upgrade
│   ├── 04_anonymous_usage.sql         ← anonymous_usage table + rate-limit function
│   ├── 05_results_logs.sql            ← scoring_results_log table (append-only audit)
│   ├── 06_ce_cases.sql                ← ce_cases table + hybrid search functions
│   └── 07_uptime_monitor.sql          ← uptime_checks table + analytics RPCs
│
├── repositories/
│   ├── documents.repository.js        ← DocumentsRepository class (Supabase + Aiven routing)
│   └── ce_cases.repository.js         ← ce_cases stateless query functions
│
└── diagnostics/                       ← standalone SQL scripts for ad-hoc inspection
    ├── README.md
    ├── bloat_and_vacuum.sql
    ├── cache_and_io.sql
    ├── column_breakdown.sql
    ├── connections_and_locks.sql
    ├── index_sizes.sql
    ├── replication_and_wal.sql
    ├── schema_introspection.sql
    ├── slow_queries.sql
    ├── table_overview.sql
    ├── uptime_checks_distribution.sql
    └── vector_sizes.sql
```

> **Note:** The legacy `scripts/backfill_documents_industry.sql` file has been removed. Metadata backfilling is now handled automatically by `backfill_document_metadata()` — a `SECURITY DEFINER` function defined in `01_vector_infrastructure.sql` and called by `store_embeddings.js` after every ingestion run. See [Post-Ingestion Maintenance](#post-ingestion-maintenance) for details.

---

## Dual Backend Support

The `getDatabaseClient()` function in `client.js` transparently returns either a Supabase JS client or an Aiven `pg.Pool` based on configuration. The repository layer handles the behavioral difference:

- **Supabase path** — calls functions via `.rpc(functionName, namedParams)`
- **Aiven path** — builds raw SQL `SELECT * FROM function_name($1, $2, ...)` with explicit `::extensions.halfvec` casts for vector arguments

This is necessary because the `pg` driver serializes JS float arrays in a format that Postgres `halfvec` rejects. The repository formats them as `[0.04,0.08,...]` vector literals before passing to Postgres.

### Environment Variables

```env
# Backend selection
USE_SUPABASE_DOCUMENTS_TABLE=false   # false = Aiven (default), true = Supabase

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Aiven
AIVEN_HOST=your-aiven-host.aivencloud.com
AIVEN_PORT=25060
AIVEN_DATABASE=defaultdb
AIVEN_USER=avnadmin
AIVEN_PASSWORD=your-password
AIVEN_SSL_CA=-----BEGIN CERTIFICATE-----...  # PEM cert (required for Aiven TLS)
# OR use a connection string instead:
AIVEN_CONNECTION_STRING=postgresql://avnadmin:[password]@host:25060/defaultdb?sslmode=require

# Pool settings (both backends)
DB_CONNECTION_LIMIT=20
DB_IDLE_TIMEOUT_MS=30000
```

---

## Migration Sequence

Migrations live in `backend/database/migrations/`. Run them **in order** via Supabase SQL editor or `psql`. Every migration is idempotent: it drops conflicting tables and functions before re-creating them, so it is safe to re-run.

```txt
00_app_settings.sql           ← PREREQUISITE: app schema + settings table + get_setting() — must run first
01_vector_infrastructure.sql  ← pgvector + halfvec extension, documents table + HNSW index + backfill function
02_user_assessments.sql       ← assessments table (v3) + get_market_data/get_assessment_statistics RPCs
03_user_profiles.sql          ← profiles table + auth triggers, assessment counters, FK upgrade on user_assessments
04_anonymous_usage.sql        ← anonymous_usage table + rate limiting logic
05_results_logs.sql           ← scoring_results_log table (append-only audit log)
06_ce_cases.sql               ← ce_cases table with hybrid search functions
07_uptime_monitor.sql         ← uptime_checks table + analytics RPCs (set-based) + count estimate
```

---

## Migration 00 — App Settings

**File:** `00_app_settings.sql`

This migration must run **before all others**. It creates the `app` schema, a `settings` key/value table, and a `SECURITY DEFINER` accessor function used by downstream migrations (currently Migration 07) to read runtime configuration.

### Purpose

Stores global application runtime configuration shared across SQL functions and backend services. It replaces `ALTER ROLE` / `ALTER DATABASE` custom GUC configuration, which Supabase managed Postgres does not allow for persistent custom parameters.

### The `app.settings` Table

| Column        | Type        | Purpose                                    |
| ------------- | ----------- | ------------------------------------------ |
| `key`         | TEXT PK     | Setting identifier                         |
| `value`       | TEXT        | Setting value (cast by consuming function) |
| `description` | TEXT        | Human-readable description                 |
| `created_at`  | TIMESTAMPTZ | Row creation timestamp                     |
| `updated_at`  | TIMESTAMPTZ | Last modification timestamp                |

### Default Settings

| Key                                         | Default | Description                                              |
| ------------------------------------------- | ------- | -------------------------------------------------------- |
| `uptime_checks-query_window_days`           | `28`    | Maximum analytics query window in days for uptime RPCs   |
| `uptime_checks-uptime_warning_threshold_ms` | `1000`  | Response time threshold (ms) for heatmap warning buckets |

To change a setting without redeploying functions, update the row directly:

```sql
UPDATE app.settings SET value = '14' WHERE key = 'uptime_checks-query_window_days';
```

The new value takes effect on the next function call — no function redeployment required.

### Function — `app.get_setting(p_key TEXT)`

`STABLE`, `SECURITY DEFINER`, `service_role` only. Returns the `TEXT` value for the given key. Consuming functions cast the return value explicitly (e.g. `app.get_setting('uptime_checks-query_window_days')::INT`).

### Access Control

- `service_role` — `SELECT` on `app.settings`; `EXECUTE` on `app.get_setting()`
- `anon` / `authenticated` / `public` — no access to the table or function

---

## Migration 01 — Vector Infrastructure (Core)

**File:** `01_vector_infrastructure.sql`

This is the foundation of the entire system. It sets up the extension schema, creates the `documents` table with half-precision vector storage, and defines all document search, analytics, and post-ingestion backfill functions.

### Extensions

Three extensions are installed into a dedicated `extensions` schema (security best practice — keeps them out of `public`):

- `vector` (pgvector) — enables `halfvec` type and `<=>` cosine distance operator
- `btree_gin` — composite GIN index support
- `pgcrypto` — `gen_random_uuid()` for UUID generation

All roles (`authenticated`, `anon`, `service_role`) receive `USAGE` on the `extensions` schema.

> **Note:** A fourth extension, `pg_trgm`, is installed into `extensions` by migration 06 (`06_ce_cases.sql`) for trigram-based fuzzy matching on `ce_cases` columns. It is not part of migration 01.

### The `documents` Table

The core vector store for all knowledge chunks. The embedding column uses `halfvec(1536)` (half-precision float16) rather than `vector(1536)`, cutting per-row storage roughly in half with negligible accuracy loss.

**Key columns:**

| Column       | Type             | Purpose                                                                        |
| ------------ | ---------------- | ------------------------------------------------------------------------------ |
| `id`         | UUID             | Primary key                                                                    |
| `content`    | TEXT             | Full document chunk text (required)                                            |
| `embedding`  | `halfvec(1536)`  | OpenAI `text-embedding-3-small` vector (required)                              |
| `industry`   | TEXT             | Indexed filter column (e.g., `textiles`, `electronics`)                        |
| `category`   | TEXT             | Indexed filter column (e.g., `design`, `materials`)                            |
| `source`     | TEXT             | Dataset source identifier                                                      |
| `metadata`   | JSONB            | Flexible fields (scale, r_strategy, geography, etc.)                           |
| `chunk_id`   | TEXT (generated) | Extracted from `metadata->>'chunk_id'` — used for RAG chunk expansion          |
| `field_name` | TEXT (generated) | Extracted from `metadata->>'field_name'` — used for upsert conflict resolution |

The `chunk_id` and `field_name` generated columns are critical. Together they form a unique constraint `(chunk_id, field_name)` that powers **resume-safe ingestion**: when re-running the embedding pipeline, rows are upserted on this constraint rather than duplicated.

### Indexes on `documents`

| Index                             | Type                                     | Purpose                            |
| --------------------------------- | ---------------------------------------- | ---------------------------------- |
| `idx_unique_chunk_field`          | UNIQUE btree on `(chunk_id, field_name)` | Resume-safe upsert conflict target |
| `idx_documents_embedding_hnsw`    | HNSW cosine, `m=16 ef_construction=128`  | Vector similarity search           |
| `idx_documents_content_fts`       | GIN on `to_tsvector('english', content)` | Full-text keyword search           |
| `idx_documents_chunk_id`          | btree                                    | Chunk group expansion in RAG       |
| `idx_documents_created_at`        | btree DESC                               | Recency queries                    |
| `idx_documents_industry_btree`    | btree                                    | Industry filtering                 |
| `idx_documents_category_btree`    | btree                                    | Category filtering                 |
| `idx_documents_source_btree`      | btree                                    | Source filtering                   |
| `idx_documents_industry_category` | composite btree                          | Two-column filter optimization     |

### HNSW Parameters

`m=16` (graph connectivity) and `ef_construction=128` (build quality) represent a balanced tradeoff. For higher-recall production deployments you can increase `ef_construction` to 256 at the cost of longer index build time. At query time, `hnsw.ef_search` can be tuned per-session:

```sql
SET hnsw.ef_search = 100;  -- Higher = slower but more accurate
```

### Functions Defined in Migration 01

All functions use `SET search_path = public, extensions` and are marked `STABLE` unless they write data.

**`match_documents(query_embedding, match_count)`** — basic vector similarity search. Groups by `chunk_id` first to find the best-matching chunk per document, then returns the top rows joined back to full content.

**`search_documents_by_industry(query_embedding, industry_filter, match_count, similarity_threshold)`** — vector search hard-filtered to a single industry, with a minimum cosine similarity cutoff.

**`search_documents_by_category(query_embedding, category_filter, match_count, similarity_threshold)`** — same pattern, filtered by category.

**`search_documents_hybrid(query_embedding, keyword_filter, industry_filter, category_filter, source_filter, match_count, vector_weight, similarity_threshold)`** — the primary search function. Combines cosine similarity and `ts_rank` BM25 keyword scoring with configurable weights. Applies optional metadata filters. Requires keyword to match (AND filter); use `keyword_filter = ''` to skip keyword constraint.

**`search_documents_hybrid_filtered(query_embedding, keyword_filter, industry_filter, match_count, vector_weight)`** — lighter variant of the above, filters by industry only. Accepts five parameters: no `category_filter`, `source_filter`, or `similarity_threshold`.

**`find_recent_documents(limit_count, industry_filter, category_filter, source_filter)`** — returns most recently ingested documents, with optional metadata filters.

**`get_document_statistics()`** — returns total count, breakdown by category and industry (from `metadata` JSONB), and average content length.

**`count_documents_by_category(category_name)`** — scalar count of documents matching a category from `metadata->>'category'`.

**`truncate_documents()`** — `SECURITY DEFINER` function that runs `TRUNCATE TABLE documents`. Used by the embedding pipeline instead of `DELETE` to avoid table bloat. Only executable by `service_role`.

**`update_updated_at_column()`** — `BEFORE UPDATE` trigger function that sets `updated_at = NOW()` on every row modification.

**`safe_jsonb_cast(text)`** — `SECURITY DEFINER` internal helper. Casts text to `jsonb`, returning `NULL` on invalid input instead of raising an exception. Used exclusively by `backfill_document_metadata()`. Not exposed via RPC.

**`backfill_document_metadata()`** — `SECURITY DEFINER` function called automatically by `store_embeddings.js` after every ingestion run. Backfills the `source` and `industry` columns from embedded JSON metadata for rows that were not fully classified at insert time. Idempotent — all `UPDATE` statements are guarded by `WHERE` conditions that only touch rows still needing work, so calling it repeatedly is safe. Only executable by `service_role`.

Backfill order:

1. `source` ← `metadata->>'source'` (where `source IS NULL`)
2. `industry` ← `metadata->'fields'->'metadata_json'->'raw_extracted'->>'category'`
3. `industry` ← same path, split on `' > '`, taking the first segment (fallback)
4. `industry` ← `category` column directly, skipping generic label values (last-resort fallback)

### Post-Ingestion Maintenance

Metadata backfilling is **automatic**. After every ingestion run, `store_embeddings.js` calls `SELECT backfill_document_metadata()` as step 2 of `validateStorage()` (after `VACUUM ANALYZE`, before the count check). No manual SQL step is required.

The function is idempotent — running it against already-backfilled rows is a no-op. It runs against both the Aiven and Supabase `documents` tables; `WHERE` conditions ensure it only touches rows that still need work.

### RLS on `documents`

Documents are public reference data. A single `documents_access_policy` allows `SELECT` for all roles (`FOR SELECT USING (true)`). All writes go exclusively through the embedding pipeline using `service_role`.

---

## Migration 02 — User Assessments

**File:** `02_user_assessments.sql`

Stores the complete lifecycle of a circular economy assessment — from user-supplied inputs through multi-layer AI scoring to final audit results.

### The `user_assessments` Table

The table is intentionally wide. Rather than normalizing scoring results into separate tables, every scalar that might be needed for analytics or fast filtering is promoted to a top-level column, while full JSON blobs are retained for complete reproducibility.

**Identity & inputs:**

- `user_id` (FK → `auth.users`, CASCADE DELETE initially; re-pointed to `profiles(id)` by migration 03) — the owning user
- `title` — unique per user via `UNIQUE (user_id, title)`
- `business_problem`, `business_solution` — the text submitted for scoring
- `evaluation_parameters` (JSONB) — raw 8-factor input scores
- `business_context` (JSONB) — structured context object

**Scoring outputs (promoted scalars for fast analytics):**

- `overall_score`, `confidence_level` — top-level scores (0–100)
- `technical_feasibility`, `economic_viability`, `circularity_potential` — derived metrics
- `risk_level` — constrained to `('low', 'medium', 'high')`
- `industry`, `scale`, `r_strategy`, `primary_material`, `geographic_focus` — metadata
- `parameter_consistency_score`, `parameter_consistency_rating` — Layer 2 enrichment
- `r_strategy_alignment_score`, `r_strategy_alignment_rating` — Layer 2 enrichment
- `audit_confidence_score`, `audit_is_junk_input`, `audit_integrity_gaps_count`, `similar_cases_count` — audit quality signals

**Full JSON blobs (complete API response preservation):**

- `sub_scores`, `derived_metrics`, `score_breakdown`, `weighted_score_card`, `circular_economy_tier`, `parameter_consistency`, `r_strategy_alignment`, `audit`, `gap_analysis`, `similar_cases`, `metadata`
- `improvement_roadmap`, `sdg_alignment` (JSONB), `market_opportunity_summary` (TEXT) — Layer 3 audit outputs
- `result_json` — the entire scoring API response (required, NOT NULL)

**Sharing controls:**

- `is_public` (default TRUE), `public_id` (UUID, unique) — control public sharing
- `contribute_to_global_benchmarks` (default TRUE)

### Indexes on `user_assessments`

| Index                                | Type          | Purpose                                                         |
| ------------------------------------ | ------------- | --------------------------------------------------------------- |
| `idx_user_assessments_user_id`       | btree         | Fast lookup of all assessments per user                         |
| `idx_user_assessments_created_at`    | btree DESC    | Recency sorting and time-series queries                         |
| `idx_user_assessments_overall_score` | btree         | Score-range filtering and analytics                             |
| `idx_user_assessments_industry`      | btree         | Industry-based filtering                                        |
| `idx_user_assessments_public_id`     | btree         | Public sharing lookup by UUID                                   |
| `idx_user_assessments_is_public`     | partial btree | Fast scan of public assessments only (WHERE `is_public = TRUE`) |

### RLS on `user_assessments`

Migration 02 enables RLS on this table (`ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY`) but does **not** install any policies itself. All four RLS policies are installed by migration 03 once the `profiles` table and its FK exist:

- `user_assessments_select_policy` — authenticated users SELECT own rows OR `is_public = true`
- `user_assessments_insert_policy` — authenticated users INSERT own rows only
- `user_assessments_update_policy` — authenticated users UPDATE own rows only
- `user_assessments_delete_policy` — authenticated users DELETE own rows only

`anon` receives table-level `SELECT, INSERT, UPDATE, DELETE` grants in migration 02. RLS (installed by migration 03) applies to all roles — the select policy has no `TO` clause, so it covers `anon` too. For `anon`, `auth.uid()` is NULL, so only the `is_public = true` branch of the select policy matches. In practice: `anon` can SELECT public assessments, but cannot INSERT, UPDATE, or DELETE (those policies require `auth.uid() = user_id`, which is never true for an unauthenticated caller).

---

## Migration 03 — User Profiles

**File:** `03_user_profiles.sql`

User profiles are tightly coupled to Supabase auth. The `profiles.id` is a direct foreign key to `auth.users(id)`.

### The `profiles` Table

**Key fields:**

- `username` — unique, 3–30 characters, must contain at least one letter, no `@` signs, only alphanumeric + `_` and `-`
- `display_name`, `avatar_url`, `bio`, `preferred_industry` — optional profile enrichment
- `assessment_count`, `last_assessment_at` — denormalized counters kept in sync via trigger (avoids expensive `COUNT(*)` queries in dashboard)

### Index on `profiles`

| Index                   | Type  | Purpose                                    |
| ----------------------- | ----- | ------------------------------------------ |
| `idx_profiles_username` | btree | Fast username lookup and uniqueness checks |

### Auth Triggers & Hooks

Two triggers fire on `auth.users` for every signup:

- **`force_internal_email` (BEFORE INSERT on `auth.users`)** — validates username (length 3–30, pattern `/^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$/`, no `@`), then rewrites the `email` field to `<username>@ce.internal` so Supabase Auth's email-based identity system works without exposing real email addresses. Raises an exception on any validation failure.
- **`handle_new_user` (AFTER INSERT on `auth.users`)** — creates the corresponding `profiles` row after a successful signup.

Two triggers fire on `user_assessments` to keep the denormalised counter current:

- **`increment_profile_assessment_count` (AFTER INSERT on `user_assessments`)** — increments `profiles.assessment_count` and stamps `last_assessment_at`.
- **`decrement_profile_assessment_count` (AFTER DELETE on `user_assessments`)** — decrements `profiles.assessment_count` (floored at 0).

A `BEFORE UPDATE` trigger (`update_profiles_updated_at_column`) stamps `updated_at = NOW()` on every profile row change.

### Helper RPCs (service_role only)

- **`get_user_profile(user_uuid UUID)`** — returns the authenticated user's profile fields (email intentionally excluded). The `auth.uid() = id` check inside the function prevents fetching another user's row.
- **`update_username(user_uuid UUID, new_username TEXT)`** — validates and applies a username change, mirrors the `force_internal_email` validation rules.

### No-op Send Email Auth Hook

`supabase_noop_send_email(event JSONB)` — registered as the Supabase Send Email Auth Hook so Supabase never attempts to send mail to `@ce.internal` addresses. Returns `NULL` (signals success). Callable by `supabase_auth_admin` only.

### FK Upgrade on `user_assessments`

Migration 03 re-points the `user_assessments.user_id` foreign key from `auth.users(id)` to `profiles(id)` (CASCADE DELETE), removes the legacy `session_id` column if present, enforces `NOT NULL` on `user_id`, and installs four tightened RLS policies (SELECT own rows OR `is_public = true`; INSERT/UPDATE/DELETE own rows only).

---

## Migration 04 — Anonymous Usage

**File:** `04_anonymous_usage.sql`

Enables free-tier rate limiting without storing any PII.

### The `anonymous_usage` Table

Each row represents a unique device fingerprint. The fingerprint is a SHA-256 hash of `(client IP + User-Agent)` computed in the application layer before being passed to the database. The database never sees raw IP addresses.

**Key columns:**

- `identifier_hash` — `SHA-256(IP + UA)`, unique, the primary lookup key
- `last_ip_hash` — `SHA-256(IP)` only, for abuse debugging
- `user_agent_snippet` — first 200 characters of the User-Agent string
- `usage_count` — number of successful scoring attempts
- `first_used_at` — timestamp of first use (NOT NULL, set on insert)
- `last_used_at` — timestamp of last successful (allowed) use; intentionally NOT updated on blocked requests
- `last_blocked_at` — timestamp of the most recent blocked attempt (NULL if never blocked)
- `created_at` — row creation timestamp

### Index on `anonymous_usage`

| Index                           | Type  | Purpose                                                                                   |
| ------------------------------- | ----- | ----------------------------------------------------------------------------------------- |
| `idx_anonymous_usage_last_used` | btree | Accelerates cleanup DELETE (`WHERE last_used_at < threshold`) and recent-activity lookups |

### RLS on `anonymous_usage`

`service_role` has full access (`FOR ALL` policy). `anon` has SELECT-only access (`FOR SELECT` policy). `authenticated` has no explicit RLS policy and therefore no access — RLS denies by default when no matching policy exists.

### Function — `check_and_increment_anonymous_usage(p_identifier_hash, p_max_tries, p_ip_hash, p_user_agent_snippet)`

This is the rate-limiting gate. It uses `SELECT ... FOR UPDATE` to row-lock the fingerprint record, preventing race conditions under concurrent requests. Behavior:

1. If no row exists → insert with `usage_count = 1`, return `(1, 1 <= p_max_tries, NOW(), NULL)`
2. If `usage_count >= p_max_tries` → update `last_blocked_at` only, return `(current_count, false, last_used_at, last_blocked_at)`
3. Otherwise → increment counter, update `last_used_at`, return `(new_count, new_count <= p_max_tries, last_used_at, last_blocked_at)`

Returns four columns: `current_count INTEGER`, `is_allowed BOOLEAN`, `last_used_at TIMESTAMPTZ`, `last_blocked_at TIMESTAMPTZ`. Only `service_role` can execute this function; explicitly revoked from `public`, `anon`, and `authenticated`.

### Function — `cleanup_old_anonymous_usage()`

Deletes rows with `last_used_at` older than 7 days. Because `last_used_at` is intentionally not updated on blocked requests, persistent abusers are evicted after their trial window passes without resetting the clock. Called by a backend scheduled job (not pg_cron).

---

## Migration 05 — Scoring Results Log

**File:** `05_results_logs.sql`

An append-only audit table recording every scoring API call. It mirrors the `user_assessments` schema for analytics parity — the same promoted scalars and JSON blobs are stored here regardless of whether the caller was authenticated or anonymous.

### The `scoring_results_log` Table

**Additional columns beyond what assessments store:**

- `request_id` — random hex ID from the scoring controller, links logs to backend console traces
- `is_anonymous` — boolean flag, not a FK
- `ip_hash`, `identifier_hash`, `user_agent_snippet` — privacy-preserving fingerprints, same format as `anonymous_usage`
- `business_problem_len`, `business_solution_len` — character length of inputs for analytics (the Express backend controls whether raw text is written to `business_problem`/`business_solution` for anonymous requests — the columns exist in the schema but may be left null)
- `processing_time_ms`, `timings` (JSONB) — backend performance metrics
- `result_snapshot` — the complete API response (equivalent to `user_assessments.result_json`)

**No UPDATE or DELETE** for any application role. RLS enforces: `service_role` can SELECT and INSERT (all writes from the Express backend via table grant `GRANT SELECT, INSERT`); authenticated users can only `SELECT` rows where `user_id = auth.uid()`. `anon` has no access.

> **Note on `cleanup_old_scoring_results_log()`:** This function executes `DELETE FROM scoring_results_log`. Although the `service_role` table grant is limited to `SELECT + INSERT`, the function is `SECURITY DEFINER` and runs as the function owner (which holds broader privileges). This is how the DELETE succeeds despite the narrower table grant.

### Auto-cleanup

`cleanup_old_scoring_results_log()` deletes rows older than 90 days. Should be scheduled.

### Indexes on `scoring_results_log`

| Index                             | Type          | Purpose                                                                           |
| --------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `idx_srl_created_at`              | btree DESC    | Time-series queries; primary access pattern                                       |
| `idx_srl_user_id`                 | partial btree | User history lookups (WHERE `user_id IS NOT NULL`)                                |
| `idx_srl_identifier_hash`         | partial btree | Abuse analysis joins with `anonymous_usage` (WHERE `identifier_hash IS NOT NULL`) |
| `idx_srl_request_id`              | partial btree | Log correlation with backend console output (WHERE `request_id IS NOT NULL`)      |
| `idx_srl_overall_score`           | btree         | Score-range analytics                                                             |
| `idx_srl_industry`                | btree         | Industry-based aggregation                                                        |
| `idx_srl_risk_level`              | btree         | Risk distribution analytics                                                       |
| `idx_srl_audit_is_junk`           | partial btree | Junk-input analysis (WHERE `audit_is_junk_input = true`)                          |
| `idx_srl_param_consistency_score` | btree         | Parameter consistency analytics                                                   |
| `idx_srl_r_alignment_score`       | btree         | R-strategy alignment analytics                                                    |

---

## Migration 06 — CE Cases

**File:** `06_ce_cases.sql`

The curated circular economy reference library. This is a first-class search table, not just a data store — it uses a generated `tsvector` column with weighted full-text indexing and optional vector embeddings, enabling both pure keyword and hybrid semantic search.

### The `ce_cases` Table

Unlike `documents` (which stores ingested chunks), `ce_cases` stores structured records from curated sources (C2C certified, Circle Economy Knowledge Hub, ReFed, etc.). IDs are string identifiers from the source system (e.g., `c2c_00001`).

**Core columns:**

- `id` (TEXT PRIMARY KEY) — source identifier
- `problem`, `solution` — the case's challenge and circular approach
- `materials` — comma-separated material list
- `circular_strategy` — R-strategy classification (Reuse, Recycle, Repair, etc.)
- `category` — industry domain
- `impact` — quantified or descriptive impact
- `source_url` — origin URL
- `metadata_json` (JSONB) — flexible extras: company, title, certifications, extracted stats, etc.

**Search infrastructure columns:**

- `search_vector` (GENERATED ALWAYS AS STORED tsvector) — automatically maintained weighted full-text index covering all text fields including `metadata_json` extractions. Weights:
  - **A (highest):** `problem`, `solution`, `metadata_json->>'title'`, `metadata_json->>'product_name'`
  - **B:** `materials`, `circular_strategy`, `metadata_json->>'company'`, `metadata_json->>'description'`, `metadata_json->>'summary'`
  - **C:** `category`, `metadata_json->>'keywords'`, `metadata_json->>'keyArea'`
  - **D (lowest):** `impact`
- `embedding` (halfvec(1536)) — optional OpenAI vector; NULL until embedded. Text embedded: `title + company + problem + solution`

This migration also installs the `pg_trgm` extension into the `extensions` schema, required for the trigram indexes below.

### Indexes on `ce_cases`

| Index                                 | Type                                          | Purpose                                       |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `idx_ce_cases_search_vector`          | GIN                                           | Full-text search on generated `search_vector` |
| `idx_ce_cases_embedding_hnsw`         | HNSW (partial, WHERE `embedding IS NOT NULL`) | Vector similarity on embedded rows only       |
| `idx_ce_cases_circular_strategy`      | btree                                         | Strategy filtering                            |
| `idx_ce_cases_category`               | btree                                         | Category filtering                            |
| `idx_ce_cases_source_url`             | btree                                         | Source filtering                              |
| `idx_ce_cases_created_at`             | btree DESC                                    | Recency sorting                               |
| `idx_ce_cases_materials_trgm`         | GIN trigram                                   | Fuzzy partial-match on materials              |
| `idx_ce_cases_circular_strategy_trgm` | GIN trigram                                   | Fuzzy partial-match on strategy               |

The HNSW index is a partial index (only rows where `embedding IS NOT NULL`), keeping it compact during incremental embedding runs.

### Functions Defined in Migration 06

**`search_ce_cases_keyword(keyword, match_limit)`**

Pure full-text search using the pre-computed `search_vector`. Applies `plainto_tsquery` (handles multi-word input, stopwords, stemming) and ranks results by weighted `ts_rank`. Returns all core columns plus a `relevance` float.

**`search_ce_cases_hybrid(query_embedding, keyword, match_limit, vector_weight)`**

The main search function for the CE cases library. Two execution paths:

- If `keyword` is empty → pure vector search ordered by cosine distance
- Otherwise → scores **all** embedded rows without a keyword AND filter, then combines:

  ```txt
  final_score = vec_score × vector_weight + kw_score × (1 - vector_weight)
  ```

  This is the correct hybrid approach: vector similarity provides semantic breadth, keyword scoring boosts exact-match rows. An AND filter would suppress semantically relevant results that don't happen to share keywords.

`vector_weight = 1.0` is pure vector; `0.0` is pure keyword rank; default `0.7` balances both.

**`get_ce_cases_statistics()`** — returns total cases, count with embeddings, breakdown by strategy and category (JSONB), and average problem/solution text lengths.

**`truncate_ce_cases()`** — `SECURITY DEFINER`, only callable by `service_role`. Used by ingestion scripts to reset the table.

### RLS on `ce_cases`

CE cases are read-only reference data for authenticated and anonymous users. Only `service_role` can insert, update, or delete.

---

## Migration 07 — Uptime Monitor

**File:** `07_uptime_monitor.sql`

Creates the uptime monitoring infrastructure for tracking backend health check history with real-time streaming capabilities. The backend polls endpoints every `env.UPTIME_CHECKS_POLL_INTERVAL_MS` in production, stores results in this table with a configurable retention policy (default 15 days, controlled via `env.UPTIME_CHECKS_RETENTION_DAYS`), and provides five DB-level analytics RPCs for bucketed chart data plus a cleanup function, with live updates delivered via Server-Sent Events (SSE).

> **Database-Level Configuration**
> This migration reads two runtime constants from `app.settings` (populated by `00_app_settings.sql`) via `app.get_setting()`:
>
> `uptime_checks-query_window_days` (default `28`) — maximum query window enforced by all analytics functions via `LEAST()` guards
> `uptime_checks-uptime_warning_threshold_ms` (default `1000`) — response time threshold above which heatmap buckets are flagged `is_warning = TRUE`
>
> Both values can be changed without redeploying functions. Update the row in `app.settings` and the new value takes effect on the next connection:
>
> ```sql
> UPDATE app.settings SET value = '14' WHERE key = 'uptime_checks-query_window_days';
> ```

### Environment-Controlled Cleanup

**Important**: The uptime table cleanup is controlled by the `env.UPTIME_CHECKS_CLEANUP_ON_START` environment variable (default: `true`):

- **Default**: `true` - wipes the `uptime_checks` table on server start
- **Set to `false`**: preserves existing uptime data across server restarts
- **Location**: Configured in `backend.config.js` under `uptime.cleanupOnStart`

### The `uptime_checks` Table

Stores historical health check results from backend-side polling with efficient querying by endpoint and time.

**Key columns:**

| Column             | Type        | Purpose                                                                  |
| ------------------ | ----------- | ------------------------------------------------------------------------ |
| `id`               | UUID        | Primary key                                                              |
| `endpoint_id`      | TEXT        | Identifier of the health endpoint (e.g., 'health', 'database', 'openai') |
| `endpoint_path`    | TEXT        | API route of the health endpoint (e.g. /health/database)                 |
| `status`           | TEXT        | Status string from the health endpoint response                          |
| `up`               | BOOLEAN     | Boolean indicating if the endpoint was reachable and returning OK        |
| `response_time_ms` | INTEGER     | Response time in milliseconds. NULL for failed or timed-out checks       |
| `payload`          | JSONB       | Full JSON payload returned by the health endpoint                        |
| `created_at`       | TIMESTAMPTZ | Timestamp of the health check                                            |

### Indexes on `uptime_checks`

| Index                         | Type       | Purpose                           |
| ----------------------------- | ---------- | --------------------------------- |
| `idx_uptime_endpoint_created` | btree DESC | Fast queries by endpoint and time |
| `idx_uptime_created_at`       | btree      | Time-based cleanup queries        |

### RLS on `uptime_checks`

`service_role` has full access (backend polling service writes). Both `authenticated` and `anon` roles can SELECT uptime data for dashboards via a `FOR SELECT` policy — no writes are permitted through PostgREST for either role.

### Autovacuum Tuning

Table is configured with reduced autovacuum thresholds to prevent bloat from high-frequency inserts/deletes:

- `autovacuum_vacuum_scale_factor = 0.02`
- `autovacuum_analyze_scale_factor = 0.01`

### SSE Streaming Integration

The uptime monitoring system includes real-time streaming capabilities:

- **SSE Endpoint**: `/api/uptime/stream` provides live updates to connected clients
- **Broadcast System**: `uptime.broadcaster.js` manages client connections and event broadcasting
- **Events**: `connected` (on join), `poll-complete` (after each polling cycle), heartbeat (every )
- **Fallback**: Automatic fallback to polling when SSE connection is lost
- **Client Management**: Frontend handles connection lifecycle with reconnection logic

The uptime monitoring system is designed to run **only in production** environments:

```js
// backend.config.js
uptime: {
  pollIntervalMs: env.UPTIME_CHECKS_POLL_INTERVAL_MS,
  retentionDays: env.UPTIME_CHECKS_RETENTION_DAYS,
  pollingEnabled: env.NODE_ENV === 'production',
  cleanupOnStart: env.UPTIME_CHECKS_CLEANUP_ON_START,
  cleanupIntervalDurationMs: 24 * 60 * 60 * 1000,
  endpoints: HEALTH_ENDPOINTS.map((endpoint) => endpoint.path),
}
```

This prevents duplicate data during development and ensures clean monitoring data in production.

### Cleanup Function

**`cleanup_old_uptime_checks(days INTEGER DEFAULT 30)`** — Deletes uptime check records older than the specified number of days. Uses `TRUNCATE` when `days=0` for complete table cleanup. Returns `BIGINT` row count deleted (0 for TRUNCATE). Called daily by the backend server (production only). This is an administrative retention function, not a query-window function — it is intentionally **not** capped at 30 days so it can be used for manual cleanup or disaster recovery of older data. Retention days configurable via `env.UPTIME_CHECKS_RETENTION_DAYS`.

### SQL Aggregation Functions

Six analytics RPCs provide server-side bucketed data for all chart components — no client-side aggregation over large datasets. (The seventh DB function, `cleanup_old_uptime_checks`, is documented separately in the Cleanup Function section above.)

All analytics functions (`get_daily_uptime_stats`, `get_global_response_trend`, `get_endpoint_avg_latency`, `get_heatmap_buckets`, `get_endpoint_buckets`) are implemented as `LANGUAGE sql` using `generate_series + LEFT JOIN + GROUP BY` — a single index scan per call across the full query window. The previous plpgsql loop implementation issued one index scan per bucket (up to 96 for a 24h/15min window), which was the primary source of slow query time on the `uptime_checks` table.

| Function                          | Signature                                                                                                              | Description                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_daily_uptime_stats`          | `(days INTEGER DEFAULT 28)`                                                                                            | Daily avg uptime % across all endpoints for last N days. Days capped at `uptime_checks-query_window_days`                                                                                               |
| `get_heatmap_buckets`             | `(bucket_minutes INT, days INT, reference_ts BIGINT, p_clock_aligned BOOLEAN DEFAULT FALSE)`                           | Time-bucketed status for all endpoints. Days capped at `uptime_checks-query_window_days` (`LEAST(days, ...)`). Supports clock-aligned mode. `failure_details` as `[{ endpoint_id, endpoint_path, ts }]` |
| `get_global_response_trend`       | `(p_hours INT DEFAULT 24, p_clock_aligned BOOLEAN DEFAULT FALSE)`                                                      | Hourly avg response time across all endpoints. Returns `hour_label` as `TIMESTAMPTZ`. Hours capped at `uptime_checks-query_window_days * 24`. Empty hours return 0, not NULL                            |
| `get_endpoint_avg_latency`        | `(p_hours INT DEFAULT 24)`                                                                                             | Per-endpoint avg response time scalar for last N hours. Hours capped at `uptime_checks-query_window_days * 24`                                                                                          |
| `get_endpoint_buckets`            | `(p_endpoint_id TEXT, p_bucket_minutes INT DEFAULT 15, p_hours INT DEFAULT 24, p_clock_aligned BOOLEAN DEFAULT FALSE)` | Bucketed avg response time for one endpoint. `failure_details` as `[{ ts }]`. Hours capped at `uptime_checks-query_window_days * 24`                                                                    |
| `get_uptime_check_count_estimate` | `()`                                                                                                                   | Fast approximate total row count via `pg_class.reltuples`. Avoids a full table scan. Accurate to ~1% given tuned autovacuum. For display stats only                                                     |

`is_warning`: `TRUE` when `average_ms` exceeds the `uptime_checks-uptime_warning_threshold_ms` setting (default 1000ms). Both thresholds are read from `app.settings` at query time via `app.get_setting()` and can be changed without redeploying functions.

Clock-aligned behaviour differs by function: `get_heatmap_buckets` snaps the window end to the nearest bucket boundary at or after `reference_ts` using `ceil()`, then walks the full window backward so all edges land on clean clock marks; `get_endpoint_buckets` snaps the window end to the nearest bucket boundary at or after `NOW()` using `ceil()`, then walks backward; `get_global_response_trend` uses `date_trunc('hour', NOW())` to snap to the current full hour. In all cases the newest bucket straddles the real current time and is flagged `is_partial = true`. All query-window functions cap their input at a maximum of `uptime_checks-query_window_days` days (`uptime_checks-query_window_days * 24` hours for hour-based functions). The route layer (`uptime.routes.js`) also clamps incoming request values against `BACKEND_CONFIG.uptime.queryWindowDaysLimit` before they reach the DB functions, providing a second independent cap at the API layer.

### Permissions

- `anon` and `authenticated`: `SELECT` only (table grant + RLS `FOR SELECT` policy).
- `service_role`: full access (`ALL`).
- All analytics and cleanup functions (`get_daily_uptime_stats`, `get_heatmap_buckets`, `get_global_response_trend`, `get_endpoint_avg_latency`, `get_endpoint_buckets`, `get_uptime_check_count_estimate`, `cleanup_old_uptime_checks`): callable by `service_role` only. Explicitly revoked from `public`, `anon`, and `authenticated`.

---

## RPC Functions Reference

All functions are accessible via Supabase RPC (PostgREST) or direct SQL. The `documents` functions require vector arguments formatted as `extensions.halfvec(1536)`.

### app schema functions (Migration 00)

| Function                 | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.get_setting(p_key)` | Returns the TEXT value for the given key from `app.settings`. `SECURITY DEFINER`, `service_role` only. Cast the return value explicitly in consuming functions. |

### documents functions (Migration 01)

| Function                                                                                                                                                      | Description                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `match_documents(query_embedding, match_count)`                                                                                                               | Basic vector similarity, groups by chunk_id                                     |
| `search_documents_by_industry(query_embedding, industry_filter, match_count, similarity_threshold)`                                                           | Vector search + industry filter + min similarity                                |
| `search_documents_by_category(query_embedding, category_filter, match_count, similarity_threshold)`                                                           | Vector search + category filter + min similarity                                |
| `search_documents_hybrid(query_embedding, keyword_filter, industry_filter, category_filter, source_filter, match_count, vector_weight, similarity_threshold)` | Full hybrid search with all optional filters                                    |
| `search_documents_hybrid_filtered(query_embedding, keyword_filter, industry_filter, match_count, vector_weight)`                                              | Lighter hybrid, industry filter only (5 params, no category/source/threshold)   |
| `find_recent_documents(limit_count, industry_filter, category_filter, source_filter)`                                                                         | Most recently ingested, with optional filters                                   |
| `get_document_statistics()`                                                                                                                                   | Total count, per-category/industry breakdown, avg content length                |
| `count_documents_by_category(category_name)`                                                                                                                  | Scalar count for a specific category                                            |
| `truncate_documents()`                                                                                                                                        | Truncate table (service_role only)                                              |
| `backfill_document_metadata()`                                                                                                                                | Backfill `source` + `industry` from metadata JSON (service_role only, auto-run) |

> `safe_jsonb_cast(text)` is an internal helper used only by `backfill_document_metadata`. It is not intended for direct RPC calls and is locked down to `service_role`.

### user assessments functions (Migration 02)

| Function                               | Description                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `get_assessment_statistics(user_uuid)` | Aggregated stats for all or one user's assessments; pass NULL for global stats |
| `get_market_data()`                    | Per-industry/scale/strategy benchmark averages from opted-in assessments       |

### user profiles functions (Migration 03)

All functions are `SECURITY DEFINER` and restricted to `service_role`. They are not accessible via the public REST API.

| Function                                             | Description                                                                                                                                                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_user_profile(user_uuid UUID)`                   | Returns the authenticated user's profile (id, username, display_name, avatar_url, bio, preferred_industry, assessment_count, last_assessment_at, timestamps). The internal `auth.uid() = id` guard prevents fetching another user's row. Email is intentionally excluded. |
| `update_username(user_uuid UUID, new_username TEXT)` | Validates and applies a username change (same rules as `force_internal_email`). Raises exception if the username is taken or violates format rules.                                                                                                                       |

### anonymous usage functions (Migration 04)

| Function                                                                                       | Description                                               |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `check_and_increment_anonymous_usage(identifier_hash, max_tries, ip_hash, user_agent_snippet)` | Atomic rate-limit check and increment (service_role only) |
| `cleanup_old_anonymous_usage()`                                                                | Delete rows older than 7 days                             |

### scoring results log functions (Migration 05)

| Function                            | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `cleanup_old_scoring_results_log()` | Delete scoring log rows older than 90 days |

### ce_cases functions (Migration 06)

| Function                                                                       | Description                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `search_ce_cases_keyword(keyword, match_limit)`                                | Weighted full-text search ranked by ts_rank             |
| `search_ce_cases_hybrid(query_embedding, keyword, match_limit, vector_weight)` | Hybrid vector+keyword scoring, no AND filter            |
| `get_ce_cases_statistics()`                                                    | Totals, embedding coverage, strategy/category breakdown |
| `truncate_ce_cases()`                                                          | Truncate table (service_role only)                      |

### uptime monitor functions (Migration 07)

| Function                                                                                                                                   | Description                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cleanup_old_uptime_checks(days INTEGER DEFAULT 30)`                                                                                       | Delete uptime checks older than N days. `days=0` truncates the table. Called daily by backend (production only)                                                          |
| `get_daily_uptime_stats(days INTEGER DEFAULT 28)`                                                                                          | Daily avg uptime % across all endpoints for last N days. Days capped at `uptime_checks-query_window_days`                                                                |
| `get_heatmap_buckets(bucket_minutes INT, days INT, reference_ts BIGINT, p_clock_aligned BOOLEAN DEFAULT FALSE)`                            | All-endpoint bucketed status. Days capped at `uptime_checks-query_window_days`. Supports clock-aligned mode. `failure_details` as `[{ endpoint_id, endpoint_path, ts }]` |
| `get_global_response_trend(p_hours INT DEFAULT 24, p_clock_aligned BOOLEAN DEFAULT FALSE)`                                                 | Hourly avg response time across all endpoints. Returns `hour_label` as `TIMESTAMPTZ`. Empty hours return 0. Hours capped at `uptime_checks-query_window_days * 24`       |
| `get_endpoint_avg_latency(p_hours INT DEFAULT 24)`                                                                                         | Per-endpoint avg response time scalar for last N hours. Hours capped at `uptime_checks-query_window_days * 24`                                                           |
| `get_endpoint_buckets(p_endpoint_id TEXT, p_bucket_minutes INT DEFAULT 15, p_hours INT DEFAULT 24, p_clock_aligned BOOLEAN DEFAULT FALSE)` | Single-endpoint bucketed data. Supports clock-aligned mode. `failure_details` as `[{ ts }]`. Hours capped at `uptime_checks-query_window_days * 24`                      |
| `get_uptime_check_count_estimate()`                                                                                                        | Fast approximate row count via `pg_class.reltuples`. No table scan. Accurate to ~1%. For display stats only (service_role only)                                          |

---

## Repository Layer

The repository layer sits between application services and the database, abstracting away the Supabase vs Aiven difference.

### `DocumentsRepository` (`repositories/documents.repository.js`)

A class-based repository. A single instance is exported from `database/index.js` and reused across the application. The constructor is intentionally empty — clients are resolved per-call so that test overrides via `setDatabaseClientOverride()` take effect immediately.

The central `callFunction(functionName, params, rpcParams)` method handles the routing:

- On the Supabase path it calls `client.rpc(functionName, rpcParams)` with named parameters
- On the Aiven path it builds a positional SQL string, casting any array argument (the embedding) to `::extensions.halfvec` as a vector literal `[x,y,z,...]`

**Public methods:**

- `matchDocuments(queryEmbedding, matchCount)` — wraps `match_documents`
- `searchHybrid(queryEmbedding, keywordFilter, industryFilter, categoryFilter, sourceFilter, matchCount, vectorWeight, similarityThreshold)` — wraps `search_documents_hybrid` (the full 8-parameter function; use `null` for unused filters)
- `getStatistics()` — wraps `get_document_statistics`
- `countBy(columnExpr)` — flexible grouping; simple column names use Supabase `.from().select()`, JSONB expressions use the pg pool directly
- `countByCategory(category)` — wraps `count_documents_by_category`
- `searchByIndustry(queryEmbedding, industryFilter, matchCount, similarityThreshold)` — wraps `search_documents_by_industry`
- `searchByCategory(queryEmbedding, categoryFilter, matchCount, similarityThreshold)` — wraps `search_documents_by_category`
- `findRecent(limit, filters)` — wraps `find_recent_documents`
- `truncate()` — wraps `truncate_documents`

### `ce_cases` Repository (`repositories/ce_cases_repository.js`)

Stateless functions (not a class) that take a Supabase client as their first argument:

- `searchKeyword(supabase, keyword, limit)` — wraps `search_ce_cases_keyword` via RPC
- `searchHybrid(supabase, queryEmbedding, keyword, limit, vectorWeight)` — wraps `search_ce_cases_hybrid` via RPC

Both functions throw on error (no silent returns) and return an empty array if `data` is null.

### Usage Example

```js
import { documentsRepository } from '#database/index.js';
import { searchKeyword, searchHybrid } from '#database/repositories/ce_cases_repository.js';
import { getSupabaseClient } from '#database/client.js';

// Vector similarity search
const results = await documentsRepository.matchDocuments(embedding, 10);

// Hybrid search with full filter set
const hybrid = await documentsRepository.searchHybrid(
  embedding,
  'circular packaging',
  'textiles',
  'design',
  null,
  20,
  0.7,
  0.0,
);

// CE Cases keyword search
const supabase = getSupabaseClient();
const cases = await searchKeyword(supabase, 'plastic recycling', 20);

// CE Cases hybrid
const hybridCases = await searchHybrid(supabase, embedding, 'plastic recycling', 20, 0.7);

// Document statistics
const stats = await documentsRepository.getStatistics();

// Group by JSONB field (falls through to raw pg pool on Supabase)
const byStrategy = await documentsRepository.countBy("metadata->>'r_strategy'");
```

---

## Client & Connection Management

**File:** `client.js`

Manages singleton connection pools and clients. All pools are lazily instantiated on first access.

| Export                                    | Returns                              | Notes                                                        |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `getSupabaseClient()`                     | Supabase JS client (service role)    | Singleton                                                    |
| `getSupabasePgPool()`                     | `pg.Pool` → Supabase direct Postgres | For raw SQL on Supabase                                      |
| `getAivenPgPool()`                        | `pg.Pool` → Aiven Postgres           | Supports SSL CA cert                                         |
| `getDatabaseClient()`                     | Supabase client or Aiven pool        | Respects `USE_SUPABASE_DOCUMENTS_TABLE`                      |
| `getDatabaseType()`                       | `'supabase'` or `'postgres'`         | Used by repositories to choose query path                    |
| `setDatabaseClientOverride(client, type)` | —                                    | Inject mock clients in tests                                 |
| `closeAllPools()`                         | Promise                              | Graceful shutdown; required in tests to prevent open handles |

The Aiven pool supports two auth modes: individual `host/port/user/password/ssl.ca` params (for TLS with a custom CA cert) or a `connectionString` for simpler environments.

### Test Overrides

```js
import { setDatabaseClientOverride } from '#database/client.js';

const mockClient = {
  rpc: jest.fn().mockResolvedValue({ data: mockResults, error: null }),
};

setDatabaseClientOverride(mockClient, 'supabase');
// ... run tests ...
setDatabaseClientOverride(null); // restore
```

---

## Security Model

### Extension Isolation

Extensions are installed in the `extensions` schema rather than `public`. This prevents extension functions from polluting the public namespace and is consistent with modern PostgreSQL security recommendations. Extensions are installed across two migrations:

- **Migration 01** installs `vector`, `btree_gin`, and `pgcrypto` into `extensions`.
- **Migration 06** installs `pg_trgm` into `extensions` (required for trigram indexes on `ce_cases`).

All search functions explicitly set `search_path = public, extensions` so that `halfvec` and operator types resolve correctly without relying on the session search path.

### Row Level Security Summary

| Table                 | service_role  | authenticated                        | anon                 |
| --------------------- | ------------- | ------------------------------------ | -------------------- |
| `documents`           | All           | SELECT                               | SELECT               |
| `user_assessments`    | All           | SELECT/INSERT/UPDATE/DELETE own rows | SELECT (public rows) |
| `profiles`            | All           | SELECT/INSERT/UPDATE/DELETE own row  | —                    |
| `anonymous_usage`     | All           | — (no policy; denied by RLS)         | SELECT               |
| `scoring_results_log` | SELECT+INSERT | SELECT own rows                      | —                    |
| `ce_cases`            | All           | SELECT                               | SELECT               |
| `uptime_checks`       | All           | SELECT                               | SELECT               |

> **`user_assessments` note:** RLS is enabled by migration 02 but the four policies are installed by migration 03. The final state (shown above) reflects the system after all migrations have run.
>
> **`scoring_results_log` note:** `service_role` holds table grants of `SELECT + INSERT` only. The `cleanup_old_scoring_results_log()` function can still DELETE rows because it is `SECURITY DEFINER` and runs as the function owner, which holds broader privileges than the caller's role.

### SECURITY DEFINER Functions

All functions below run as the function owner rather than the caller. This allows `service_role` to perform privileged operations safely, and prevents user-facing roles from calling internal trigger functions or sensitive RPCs via PostgREST.

**Migration 00** — `app.get_setting(TEXT)` (service_role only — read access to `app.settings`).

**Migration 01** — `truncate_documents()` (service_role only), `update_updated_at_column()` (trigger only), `safe_jsonb_cast(text)` (service_role only — internal helper for `backfill_document_metadata`), `backfill_document_metadata()` (service_role only — called automatically by `store_embeddings.js` after ingestion).

**Migration 02** — `update_assessments_updated_at_column()` (trigger only).

**Migration 03** — `force_internal_email()` (trigger on auth.users, no RPC), `handle_new_user()` (trigger on auth.users, no RPC), `update_profiles_updated_at_column()` (trigger only), `increment_profile_assessment_count()` (trigger only), `decrement_profile_assessment_count()` (trigger only), `get_user_profile(UUID)` (service_role only), `update_username(UUID, TEXT)` (service_role only), `supabase_noop_send_email(JSONB)` (supabase_auth_admin only).

**Migration 04** — `check_and_increment_anonymous_usage()` (service_role only), `cleanup_old_anonymous_usage()` (service_role only).

**Migration 05** — `cleanup_old_scoring_results_log()` (service_role only). Executes DELETE via SECURITY DEFINER despite the table grant being SELECT+INSERT only.

**Migration 06** — `truncate_ce_cases()` (service_role only, explicit grant), `update_ce_cases_updated_at()` (trigger only, no explicit service_role grant needed — trigger invocation does not require EXECUTE privilege on the caller's role).

**Migration 07** — `cleanup_old_uptime_checks()`, `get_daily_uptime_stats()`, `get_heatmap_buckets()`, `get_global_response_trend()`, `get_endpoint_avg_latency()`, `get_endpoint_buckets()`, `get_uptime_check_count_estimate()` — all service_role only (all calls proxied through Express backend; no direct PostgREST RPC access by anon or authenticated). The five analytics functions and `get_uptime_check_count_estimate` are `LANGUAGE sql`; `cleanup_old_uptime_checks` remains `LANGUAGE plpgsql` (requires `GET DIAGNOSTICS` and `TRUNCATE`).

---

## Performance & Monitoring

### Hybrid Search Weights

| `vector_weight` | Behavior                              |
| --------------- | ------------------------------------- |
| `1.0`           | Pure vector semantic search           |
| `0.7`           | Default — semantic with keyword boost |
| `0.5`           | Balanced                              |
| `0.0`           | Pure keyword BM25 ranking             |

### Expected Query Latency (100K documents)

| Query type               | Typical latency |
| ------------------------ | --------------- |
| Vector similarity (HNSW) | 5–50ms          |
| Keyword search (GIN)     | 2–10ms          |
| Hybrid search            | 10–60ms         |
| Vector + metadata filter | 5–30ms          |

### Storage Estimates

- Embedding per row: 1536 dims × 2 bytes (halfvec) = ~3KB
- 100K documents: ~300MB vectors, ~5–10GB total with content

### Useful Monitoring Queries

```sql
-- Index size and scan count
SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS size, idx_scan
FROM pg_stat_user_indexes WHERE tablename = 'documents';

-- Table sizes
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS total_size
FROM information_schema.tables WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries (requires pg_stat_statements)
SELECT query, mean_exec_time FROM pg_stat_statements
WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC;

-- Check embedding column vs total table size
SELECT
  pg_size_pretty(sum(pg_column_size(embedding))) AS vector_col_size,
  pg_size_pretty(pg_total_relation_size('documents')) AS total_size
FROM documents;
```

### Diagnostics Scripts

The `diagnostics/` folder contains standalone SQL scripts for ad-hoc database inspection. These are not migrations — run them manually in the Supabase SQL editor or via `psql` as needed.

| Script                           | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `bloat_and_vacuum.sql`           | Table/index bloat estimates and autovacuum activity              |
| `cache_and_io.sql`               | Buffer cache hit rates and I/O statistics                        |
| `column_breakdown.sql`           | Per-column storage breakdown for wide tables                     |
| `connections_and_locks.sql`      | Active connections, blocking queries, lock waits                 |
| `index_sizes.sql`                | Index sizes and scan counts across all tables                    |
| `replication_and_wal.sql`        | WAL activity and replication lag (Aiven-relevant)                |
| `schema_introspection.sql`       | Tables, columns, constraints, and function inventory             |
| `slow_queries.sql`               | Top queries by mean execution time (requires pg_stat_statements) |
| `table_overview.sql`             | Row counts, dead tuples, last vacuum/analyze timestamps          |
| `uptime_checks_distribution.sql` | Distribution of uptime check results by endpoint                 |
| `vector_sizes.sql`               | Embedding column size vs total table size for `documents`        |

---

## Troubleshooting

**Slow vector search** — check `idx_documents_embedding_hnsw` exists and is being used (`\di idx_documents_embedding_hnsw`). If the index was just created on a large table, run `VACUUM ANALYZE documents`. Increase `hnsw.ef_search` for better recall at the cost of latency.

**CE cases search returns empty results** — verify `search_vector` is non-null: `SELECT id, search_vector IS NOT NULL FROM ce_cases LIMIT 5;`. If null, the GENERATED column may need a table rebuild. Check `pg_trgm` is installed: `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';`

**"invalid halfvec input" errors** — the Aiven repository path must format vectors as `[x,y,z,...]` string literals before casting. If you're calling SQL directly, ensure the cast is `$1::extensions.halfvec` and the value is a bracket-delimited string, not a JSON array object.

**"too many connections"** — reduce `DB_CONNECTION_LIMIT` in env. Monitor with `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`. Consider enabling PgBouncer for the Aiven connection.

**Scoring log growing too large** — check size with `SELECT pg_size_pretty(pg_total_relation_size('scoring_results_log'));`, then call `SELECT cleanup_old_scoring_results_log();` manually or schedule it via `pg_cron`.

**Anonymous usage not rate-limiting correctly** — the function uses row-level locking (`SELECT ... FOR UPDATE`). Under very high concurrency on Supabase connection pools with PgBouncer in transaction mode, the lock may not work as expected. Use session mode or Aiven for this function.

**Test cleanup / open handles** — always call `await closeAllPools()` in `afterAll()` hooks. Failing to do so leaves the Aiven and Supabase pg pools open, hanging the test runner.

**Backfill not running** — `backfill_document_metadata()` only executes in non-dry-run mode (same gate as `validateStorage()`). If you need to run it manually: `SELECT backfill_document_metadata();` via `psql` or the Supabase SQL editor using a `service_role` connection. Check logs for the `'Metadata backfill complete'` entry after each ingestion run to confirm it fired.

**Analytics functions returning unexpected results** — verify `app.settings` is populated correctly: `SELECT key, value FROM app.settings ORDER BY key;`. If `00_app_settings.sql` has not been run, `app.get_setting()` will not exist and all Migration 07 analytics functions will fail.
