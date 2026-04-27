# Database Layer — Comprehensive Reference

A production-grade PostgreSQL database system for circular economy assessment and semantic search, featuring dual-backend support (Supabase + Aiven), pgvector-powered hybrid search, and a full audit infrastructure.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Dual Backend Support](#dual-backend-support)
- [Migration Sequence](#migration-sequence)
- [Migration 01 — Vector Infrastructure (Core)](#migration-01--vector-infrastructure-core)
- [Migration 02 — User Assessments](#migration-02--user-assessments)
- [Migration 03 — User Profiles](#migration-03--user-profiles)
- [Migration 04 — Anonymous Usage](#migration-04--anonymous-usage)
- [Migration 05 — Scoring Results Log](#migration-05--scoring-results-log)
- [Migration 06 — CE Cases (Core)](#migration-06--ce-cases-core)
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
| `ce_cases`            | Curated circular economy reference library       | Thousands of cases   |
| `user_assessments`    | Full assessment lifecycle per user               | Per-user             |
| `scoring_results_log` | Immutable audit trail of all scoring API calls   | Append-only          |
| `profiles`            | User profile data linked to Supabase auth        | Per-user             |
| `anonymous_usage`     | Free-tier rate limiting via IP+UA fingerprinting | Per-fingerprint      |

### Technology Stack

- **pgvector** — 1536-dimensional `halfvec` embeddings (OpenAI `text-embedding-3-small`)
- **HNSW indexing** — O(log n) approximate nearest-neighbor search
- **BM25 full-text search** — PostgreSQL `tsvector`/`GIN` for keyword matching
- **Hybrid scoring** — combined `(vector_score × weight) + (keyword_score × (1 - weight))`
- **Row Level Security** — per-table policies for `service_role`, `authenticated`, and `anon`

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
DB_CONNECTION_LIMIT=10
DB_IDLE_TIMEOUT_MS=30000
```

---

## Migration Sequence

Migrations live in `backend/database/migrations/`. Run them **in order** via the Supabase SQL editor or `psql`. Every migration is idempotent: it drops conflicting tables and functions before re-creating them, so it is safe to re-run.

```txt
01_vector_infrastructure.sql  ← pgvector setup, documents table, all search functions
02_user_assessments.sql       ← assessment storage, triggers, RLS
03_user_profiles.sql          ← user profiles, assessment counter sync
04_anonymous_usage.sql        ← anonymous rate-limiting
05_results_logs.sql           ← immutable scoring audit log
06_ce_cases.sql               ← circular economy reference library with hybrid search
```

---

## Migration 01 — Vector Infrastructure (Core)

**File:** `01_vector_infrastructure.sql`

This is the foundation of the entire system. It sets up the extension schema, creates the `documents` table with half-precision vector storage, and defines all document search and analytics functions.

### Extensions

Three extensions are installed into a dedicated `extensions` schema (security best practice — keeps them out of `public`):

- `vector` (pgvector) — enables `halfvec` type and `<=>` cosine distance operator
- `btree_gin` — composite GIN index support
- `pgcrypto` — `gen_random_uuid()` for UUID generation

All roles (`authenticated`, `anon`, `service_role`) receive `USAGE` on the `extensions` schema.

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

**`search_documents_hybrid_filtered(query_embedding, keyword_filter, industry_filter, match_count, vector_weight)`** — lighter variant of the above, filters by industry only. Used by the repository's `searchHybrid` method.

**`find_recent_documents(limit_count, industry_filter, category_filter, source_filter)`** — returns most recently ingested documents, with optional metadata filters.

**`get_document_statistics()`** — returns total count, breakdown by category and industry (from `metadata` JSONB), and average content length.

**`count_documents_by_category(category_name)`** — scalar count of documents matching a category from `metadata->>'category'`.

**`truncate_documents()`** — `SECURITY DEFINER` function that runs `TRUNCATE TABLE documents`. Used by the embedding pipeline instead of `DELETE` to avoid table bloat. Only executable by `service_role`.

**`update_updated_at_column()`** — `BEFORE UPDATE` trigger function that sets `updated_at = NOW()` on every row modification.

### RLS on `documents`

Documents are public reference data. A single `documents_access_policy` allows all operations for all roles (`USING (true)`).

---

## Migration 02 — User Assessments

**File:** `02_user_assessments.sql`

Stores the complete lifecycle of a circular economy assessment — from user-supplied inputs through multi-layer AI scoring to final audit results.

### The `user_assessments` Table

The table is intentionally wide. Rather than normalizing scoring results into separate tables, every scalar that might be needed for analytics or fast filtering is promoted to a top-level column, while full JSON blobs are retained for complete reproducibility.

**Identity & inputs:**

- `user_id` (FK → `auth.users`, CASCADE DELETE) — the owning user
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

### Analytics Function — `get_assessment_statistics(user_uuid)`

Defined in `queries/get_assessment_statistics_BUG.sql`. Returns aggregated statistics across all assessments (or a single user's) including mean/median/min/max scores, averages across all derived metrics, and breakdowns by industry, risk level, scale, and circular economy tier. The `user_uuid` parameter is optional — `NULL` returns global stats.

---

## Migration 03 — User Profiles

**File:** `03_user_profiles.sql`

User profiles are tightly coupled to Supabase auth. The `profiles.id` is a direct foreign key to `auth.users(id)`.

### The `profiles` Table

**Key fields:**

- `username` — unique, 3–30 characters, must contain at least one letter, no `@` signs, only alphanumeric + `_` and `-`
- `display_name`, `avatar_url`, `bio`, `preferred_industry` — optional profile enrichment
- `assessment_count`, `last_assessment_at` — denormalized counters kept in sync via trigger (avoids expensive `COUNT(*)` queries in dashboard)

A `BEFORE INSERT OR UPDATE` trigger validates username format and fires a separate trigger after assessment inserts/deletes to keep `assessment_count` accurate on the profiles row.

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
- `usage_count` — number of scoring attempts
- `last_blocked_at` — timestamp of the most recent blocked attempt (NULL if never blocked)

### Function — `check_and_increment_anonymous_usage(p_identifier_hash, p_max_tries, p_ip_hash, p_user_agent_snippet)`

This is the rate-limiting gate. It uses `SELECT ... FOR UPDATE` to row-lock the fingerprint record, preventing race conditions under concurrent requests. Behavior:

1. If no row exists → insert with `usage_count = 1`, return `(1, true)` if `1 <= p_max_tries`
2. If `usage_count >= p_max_tries` → update `last_blocked_at`, return `(current_count, false)`
3. Otherwise → increment counter, return `(new_count, new_count <= p_max_tries)`

Only `service_role` can execute this function. Anonymous and public roles are explicitly revoked.

### Function — `cleanup_old_anonymous_usage()`

Deletes rows with `last_used_at` older than 30 days. Intended to be scheduled via `pg_cron` or an external job.

---

## Migration 05 — Scoring Results Log

**File:** `05_results_logs.sql`

An append-only audit table recording every scoring API call. It mirrors the `user_assessments` schema for analytics parity — the same promoted scalars and JSON blobs are stored here regardless of whether the caller was authenticated or anonymous.

### The `scoring_results_log` Table

**Additional columns beyond what assessments store:**

- `request_id` — random hex ID from the scoring controller, links logs to backend console traces
- `is_anonymous` — boolean flag, not a FK
- `ip_hash`, `identifier_hash`, `user_agent_snippet` — privacy-preserving fingerprints, same format as `anonymous_usage`
- `business_problem_len`, `business_solution_len` — length analytics (the raw text is not stored for anonymous users)
- `processing_time_ms`, `timings` (JSONB) — backend performance metrics
- `result_snapshot` — the complete API response (equivalent to `user_assessments.result_json`)

**No UPDATE or DELETE** for non-service roles. RLS enforces: `service_role` gets full access; authenticated users can only `SELECT` rows where `user_id = auth.uid()`.

### Auto-cleanup

`cleanup_old_scoring_results_log()` deletes rows older than 90 days. Should be scheduled.

### Indexes

Indexes are optimized for the most common analytics queries: `created_at DESC` (time-series), `user_id` (user history), `identifier_hash` (abuse analysis), `overall_score`, `industry`, `risk_level`, `request_id` (log correlation), and partial indexes on `audit_is_junk_input = true` and `parameter_consistency_score`.

---

## Migration 06 — CE Cases (Core)

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

## RPC Functions Reference

All functions are accessible via Supabase RPC (PostgREST) or direct SQL. The `documents` functions require vector arguments formatted as `extensions.halfvec(1536)`.

### documents functions (Migration 01)

| Function                                                                                                                                                      | Description                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `match_documents(query_embedding, match_count)`                                                                                                               | Basic vector similarity, groups by chunk_id                      |
| `search_documents_by_industry(query_embedding, industry_filter, match_count, similarity_threshold)`                                                           | Vector search + industry filter + min similarity                 |
| `search_documents_by_category(query_embedding, category_filter, match_count, similarity_threshold)`                                                           | Vector search + category filter + min similarity                 |
| `search_documents_hybrid(query_embedding, keyword_filter, industry_filter, category_filter, source_filter, match_count, vector_weight, similarity_threshold)` | Full hybrid search with all optional filters                     |
| `search_documents_hybrid_filtered(query_embedding, keyword_filter, industry_filter, match_count, vector_weight)`                                              | Lighter hybrid, industry filter only                             |
| `find_recent_documents(limit_count, industry_filter, category_filter, source_filter)`                                                                         | Most recently ingested, with optional filters                    |
| `get_document_statistics()`                                                                                                                                   | Total count, per-category/industry breakdown, avg content length |
| `count_documents_by_category(category_name)`                                                                                                                  | Scalar count for a specific category                             |
| `truncate_documents()`                                                                                                                                        | Truncate table (service_role only)                               |

### ce_cases functions (Migration 06)

| Function                                                                       | Description                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `search_ce_cases_keyword(keyword, match_limit)`                                | Weighted full-text search ranked by ts_rank             |
| `search_ce_cases_hybrid(query_embedding, keyword, match_limit, vector_weight)` | Hybrid vector+keyword scoring, no AND filter            |
| `get_ce_cases_statistics()`                                                    | Totals, embedding coverage, strategy/category breakdown |
| `truncate_ce_cases()`                                                          | Truncate table (service_role only)                      |

### user assessments function (Migration 02)

| Function                               | Description                                  |
| -------------------------------------- | -------------------------------------------- |
| `get_assessment_statistics(user_uuid)` | Aggregated stats; pass NULL for global stats |

### anonymous usage functions (Migration 04)

| Function                                                                                       | Description                                               |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `check_and_increment_anonymous_usage(identifier_hash, max_tries, ip_hash, user_agent_snippet)` | Atomic rate-limit check and increment (service_role only) |
| `cleanup_old_anonymous_usage()`                                                                | Delete rows older than 30 days                            |

### maintenance functions (Migration 05)

| Function                            | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `cleanup_old_scoring_results_log()` | Delete scoring log rows older than 90 days |

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
- `searchHybrid(queryEmbedding, keywordFilter, industryFilter, categoryFilter, sourceFilter, matchCount, vectorWeight, similarityThreshold)` — wraps `search_documents_hybrid_filtered`
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

```javascript
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

```javascript
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

All extensions (`vector`, `btree_gin`, `pgcrypto`, `pg_trgm`) are installed in the `extensions` schema rather than `public`. This prevents extension functions from polluting the public namespace and is consistent with modern PostgreSQL security recommendations.

All search functions explicitly set `search_path = public, extensions` so that `halfvec` and operator types resolve correctly without relying on the session search path.

### Row Level Security Summary

| Table                 | service_role | authenticated                 | anon   |
| --------------------- | ------------ | ----------------------------- | ------ |
| `documents`           | All          | All                           | SELECT |
| `ce_cases`            | All          | SELECT                        | SELECT |
| `user_assessments`    | All          | SELECT/INSERT/UPDATE own rows | —      |
| `profiles`            | All          | SELECT/UPDATE own row         | —      |
| `anonymous_usage`     | All          | —                             | SELECT |
| `scoring_results_log` | All          | SELECT own rows               | —      |

### SECURITY DEFINER Functions

`truncate_documents()`, `truncate_ce_cases()`, `update_updated_at_column()`, and `update_ce_cases_updated_at()` run as the function owner rather than the caller. This allows `service_role` to truncate tables safely without granting `TRUNCATE` directly. `check_and_increment_anonymous_usage()` is also `SECURITY DEFINER` and has its `EXECUTE` privilege revoked from `public` and `anon`.

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

### Post-Ingestion Maintenance

After bulk document ingestion, run `queries/post_documents_ingestion.sql` manually to:

1. Backfill `documents.source` from `metadata->>'source'` where the column is missing
2. Backfill `documents.industry` from nested `metadata_json` fields for rows still showing `general`
3. Validate industry distribution after the backfill

This script is not an automated migration — it is a one-time cleanup for specific ingestion scenarios.

---

## Troubleshooting

**Slow vector search** — check `idx_documents_embedding_hnsw` exists and is being used (`\di idx_documents_embedding_hnsw`). If the index was just created on a large table, run `VACUUM ANALYZE documents`. Increase `hnsw.ef_search` for better recall at the cost of latency.

**CE cases search returns empty results** — verify `search_vector` is non-null: `SELECT id, search_vector IS NOT NULL FROM ce_cases LIMIT 5;`. If null, the GENERATED column may need a table rebuild. Check `pg_trgm` is installed: `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';`

**"invalid halfvec input" errors** — the Aiven repository path must format vectors as `[x,y,z,...]` string literals before casting. If you're calling SQL directly, ensure the cast is `$1::extensions.halfvec` and the value is a bracket-delimited string, not a JSON array object.

**"too many connections"** — reduce `DB_CONNECTION_LIMIT` in env. Monitor with `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`. Consider enabling PgBouncer for the Aiven connection.

**Scoring log growing too large** — check size with `SELECT pg_size_pretty(pg_total_relation_size('scoring_results_log'));`, then call `SELECT cleanup_old_scoring_results_log();` manually or schedule it via `pg_cron`.

**Anonymous usage not rate-limiting correctly** — the function uses row-level locking (`SELECT ... FOR UPDATE`). Under very high concurrency on Supabase connection pools with PgBouncer in transaction mode, the lock may not work as expected. Use session mode or Aiven for this function.

**Test cleanup / open handles** — always call `await closeAllPools()` in `afterAll()` hooks. Failing to do so leaves the Aiven and Supabase pg pools open, hanging the test runner.
