# Backend — Circular Economy Assessor API

Node.js/Express backend powering the Circular Economy Assessor. Handles document processing, semantic search, AI-driven assessment scoring, analytics, and the data ingestion pipeline.

**Author:** Areeb Ahmed Zahoori <areebrawl@gmail.com>
**License:** MIT

## Overview

The backend is the core of the RAG (Retrieval-Augmented Generation) system:

1. **Data Pipeline** — ingests 32+ circular economy datasets → chunks → embeddings → PostgreSQL + pgvector
2. **Hybrid Search** — combines semantic vector similarity (pgvector HNSW) with BM25 keyword matching
3. **Assessment Scoring** — 8-dimensional scoring system with 3-layer enrichment (deterministic + LLM)
4. **API Layer** — REST endpoints for scoring, assessment management, analytics, and search
5. **Uptime Monitoring** — automated health checks every 30 seconds with 7-day retention and real-time dashboard
6. **Analytics** — global dashboard stats from `scoring_results_log` covering all users and sessions

## Layered Architecture

```txt
┌────────────────────────────────────────────────┐
│       REST API (Express Routes)                │  ← HTTP request/response only
├────────────────────────────────────────────────┤
│    Controllers (Request Handlers)              │  ← Validate, format, delegate
├────────────────────────────────────────────────┤
│      Services (Business Logic)                 │  ← Core algorithms, RPC calls
├────────────────────────────────────────────────┤
│     Utilities (Helper Functions)               │  ← Reusable logic, constants
├────────────────────────────────────────────────┤
│   Database Client (Supabase / Aiven)           │  ← Data persistence
└────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Routes** — define HTTP methods, paths, and rate limiting. No business logic. Delegate to controllers.
2. **Controllers** — handle requests, validate input, format responses, call services.
3. **Services** — core business logic and integrations. No HTTP context (no req/res).
4. **Utilities** — shared helper functions, path constants, ID formatting.
5. **Database** — Supabase client initialization, DocumentsRepository, migrations.

## Directory Structure

```txt
backend/
├── server/
│   ├── index.js              # Entry point — startServer() / stopServer()
│   ├── app.js                # Express app factory — mounts routes and middleware
│   └── bootstrap.js          # Pre-flight startup (env validation, DB ping)
│
├── config/
│   ├── backend.config.js     # Central config object (reads env, includes test defaults)
│   ├── env.schema.js         # Zod schema for environment variable validation
│   ├── embedding.js          # OpenAI embedding model constants (model name, 1536 dims)
│   ├── chunk.js              # Chunking config (min/max sizes, overlap, length thresholds)
│   └── loadEnv.js            # Loads .env.backend before app initialisation
│
├── routes/                   # Thin Express wrappers — HTTP definition only
│   ├── analytics.routes.js   # GET /api/analytics/...
│   ├── assessments.routes.js # POST/GET/PATCH/DELETE /api/assessments/... (including validate, share, compare)
│   ├── health.routes.js      # GET /health/* endpoints
│   ├── scoring.routes.js     # POST /api/score
│   ├── search.routes.js      # GET /api/search/ce-cases
│   └── uptime.routes.js     # GET/POST /api/uptime/* endpoints
│
├── controllers/                  # Request handlers — validate, delegate, format
│   ├── analytics.controller.js   # Analytics, global-stats, featured solutions, document stats
│   ├── assessments.controller.js # Assessment CRUD, market analysis, comparison
│   ├── scoring.controller.js     # Full scoring pipeline orchestration + log
│   └── search.controller.js      # ce_cases search functionality
│
├── services/                    # Business logic: scoring.service, scoring.logic, embedding.service, health.service
│   ├── auth.service.js          # Authentication service
│   ├── embedding.service.js     # OpenAI API: embed text, batch handling, exponential backoff
│   ├── health.service.js         # Health check endpoints and system monitoring
│   ├── scoring.logic.js         # Pure deterministic Layer 2 algorithms (no LLM, no side effects)
│   ├── scoring.service.js       # Full scoring pipeline orchestration
│   └── uptimePolling.service.js # Uptime monitoring polling service
│
├── middleware/
│   ├── auth.middleware.js        # API key guard (x-api-key) + Supabase JWT verification
│   └── validation.middleware.js  # Zod-based request body validation
│
├── database/
│   ├── client.js                         # Dual-backend client factory (returns Supabase or Aiven client)
│   ├── index.js                          # Exports documentsRepository singleton
│   ├── supabase.client.js                # Supabase client initialisation (anon + service-role)
│   ├── queries/                          # Database query definitions (3 files)
│   ├── repositories/
│   │   ├── ce_cases.repository.js         # CE cases search functions
│   │   └── documents.repository.js       # All documents table access (matchDocuments, searchHybrid, etc.)
│   └── migrations/                        # SQL migration files — run in Supabase SQL editor in order
│       ├── 01_vector_infrastructure.sql  # pgvector + halfvec extension, documents table + HNSW index
│       ├── 02_user_profiles.sql          # user_profiles table
│       ├── 03_user_assessments.sql       # assessments table (v3) + get_market_data/get_assessment_statistics RPCs
│       ├── 04_anonymous_usage.sql        # anonymous_usage table + rate limiting logic
│       ├── 05_results_logs.sql           # scoring_results_log table (append-only audit log)
│       ├── 06_ce_cases.sql               # ce_cases table with hybrid search functions
│       └── 07_uptime_monitor.sql        # uptime_checks table for monitoring history
│
├── pipeline/ # Data processing stages (10 scripts)
│ ├── create_samples.js # Generate test/sample data for development
│ ├── embed_ce_cases.js # Embed ce_cases knowledge base
│ ├── generate_chunks.js # Stage 2: semantic chunking → chunks.json
│ ├── generate_embeddings.js # Stage 3: OpenAI embeddings → embedded_chunks.json
│ ├── generate_test_inputs.js # Generate test assessment inputs
│ ├── ingest_ce_cases.js # Ingest ce_cases data
│ ├── merge_datasets.js # Stage 1: merge all processed/ CSVs + manual_entries/ → combined_input.csv
│ ├── run_datasets_scripts.js # Orchestrate all dataset extraction scripts in sequence
│ ├── run_test_assessments.js # Run test assessments
│ ├── store_embeddings.js # Stage 4: store vectors in documents table (Supabase or Aiven)
│ └── datasetsUtils.js # DATASETS registry, path constants, formatId() helper
│
├── utils/
│ ├── analyticsHelpers.js # Analytics helper functions
│ ├── anonymousTracking.js # IP hashing, identifier generation (no PII stored)
│ ├── controller-helpers.js # Helper functions for controllers
│ ├── datasetsUtils.js # DATASETS registry, path constants, formatId() helper
│ ├── formatting.js # Text formatting utilities
│ └── logger.js # Logging utilities
├── constants/ # API endpoints, uptime endpoints constants
│ ├── apiEndpoints.js # Centralized API endpoint definitions
│ ├── index.js # Constants barrel export
│ └── uptimeEndpoints.js # Uptime monitoring endpoint definitions
│
├── config/ # Centralised config, env schema, embedding constants, chunk config
├── middleware/ # Auth guard (API key + JWT) + Zod validation
├── pipeline/ # Data processing stages (10 scripts)
├── routes/ # Thin Express wrappers — HTTP definition only
├── server/ # Entry point (index.js), app factory (app.js), bootstrap
├── services/ # Business logic: scoring.service, scoring.logic, embedding.service, health.service, uptimePolling.service
├── tests/ # Backend test suite
│ ├── api/ # API endpoint tests (10 test files)
│ │ ├── analytics-missing-endpoints.test.js
│ │ ├── analytics.enhanced.test.js
│ │ ├── analytics.featured.test.js
│ │ ├── anonymous.test.js
│ │ ├── api-auth.test.js
│ │ ├── apiKeyGuard.test.js
│ │ ├── assessments-routes.test.js
│ │ ├── health.test.js
│ │ ├── misc-endpoints.test.js
│ │ └── scoring.rpc.test.js
│ ├── database/ # Database tests (1 test file)
│ ├── services/ # Service layer tests (2 test files)
│ │ ├── score-validation.test.js
│ │ └── scoring-logic-enrichment.test.js
│ ├── utils/ # Utility tests (2 test files)
│ ├── run-tests.js # Main test runner
│ ├── run-tests-simple.js # Simple test runner
│ └── setup.js # Test setup and configuration
├── DATASETS_REFERENCE.md ## Complete inventory of all 32 datasets
├── HEALTH_ENDPOINTS.md # Health check endpoints documentation
├── PIPELINE_ADDING_DATASETS.md # How to add new dataset sources
├── PIPELINE_RUNNING.md # How to run data processing pipeline
├── .gitignore, .renderignore
├── requirements-dev.txt, package.json
└── README.md

```

## Uptime Monitoring System

The backend includes a comprehensive uptime monitoring system that tracks health endpoint status:

### Architecture

- **Polling Service**: Runs every 30 seconds in production (`NODE_ENV=production` only)
- **Health Checks**: Monitors `/health`, `/health/database`, `/health/openai`, and other endpoints
- **Data Storage**: Stores results in `uptime_checks` table with 7-day retention
- **Automatic Cleanup**: Daily job removes old data via `cleanup_old_uptime_checks()`
- **Pre-push Migration**: Git hook automatically resets table schema on each push

### Configuration

```javascript
// backend.config.js
uptime: {
  pollingEnabled: env.NODE_ENV === 'production', // Production-only polling
  pollIntervalMs: 30000, // 30 seconds
  retentionDays: 7, // Data retention period
  endpoints: [
    { id: 'health', path: '/health' },
    { id: 'database', path: '/health/database' },
    { id: 'openai', path: '/health/openai' },
    // ... more endpoints
  ]
}
```

### Pre-push Migration

The `.husky/pre-push` hook ensures fresh monitoring data:

```bash
echo "⫸ Running uptime schema migration..."
psql "$SUPABASE_CONNECTION_STRING" -f backend/database/migrations/07_uptime_monitor.sql || { echo "✕ Migration failed! Push aborted."; exit 1; }
```

This wipes and rebuilds the `uptime_checks` table on every push, ensuring clean monitoring data for production.

### API Endpoints

| Method | Endpoint                          | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/api/uptime/count`               | Total uptime checks count    |
| GET    | `/api/uptime/history/:endpointId` | Historical data for endpoint |

### Each Layer's Responsibilities

1. **Routes** — define HTTP methods, paths, and rate limiting. No business logic. Delegate to controllers.
2. **Controllers** — handle requests, validate input, format responses, call services.
3. **Services** — core business logic and integrations. No HTTP context (no req/res).
4. **Utilities** — shared helper functions, path constants, ID formatting.
5. **Database** — Supabase client initialization, DocumentsRepository, migrations.

## Scoring Pipeline

`POST /api/score` runs a 10-step pipeline on every request:

```txt
1.  Input validation (Zod) + junk detection
    └─ Rejects nonsensical inputs before any LLM calls

2.  calculateScores() — 8-parameter weighted scoring
    └─ Returns sub_scores, derived_metrics, score_breakdown

3.  Layer 2 enrichment (deterministic, no LLM):
    ├─ generateWeightedScoreCard()     — per-factor contribution %
    ├─ classifyCircularEconomyTier()   — Leader/Established/Developing/Emerging
    ├─ calculateParameterConsistency() — contradiction detection (8 rules)
    └─ calculateRStrategyAlignment()   — profile match across 9 R-strategy types

4.  Metadata extraction (GPT-4o-mini)
    └─ industry, scale, R-strategy, primary_material, geographic_focus, short_description

5.  Vector search + keyword filter (Supabase RPC: search_documents_hybrid_filtered)
    └─ Top-K similar cases with similarity scores

6.  cleanSimilarCases() — LLM OCR artifact cleanup on retrieved case text
    └─ Runs AFTER formattedCases mapping (on structured fields, not raw content)

7.  Layer 3 LLM audit (GPT-4o-mini):
    ├─ audit_verdict, comparative_analysis
    ├─ integrity_gaps[], strengths[], technical_recommendations[]
    ├─ improvement_roadmap[] (3 items: priority, action, target_factor, effort, impact, timeframe)
    ├─ sdg_alignment[] (2–4 SDGs: number, name, relevance, rationale)
    ├─ market_opportunity_summary
    ├─ similar_cases_summaries[] (exactly 1 entry per case — enforced in prompt)
    └─ key_metrics_comparison

8.  Gap analysis against similar-case benchmarks
    └─ Comparisons, opportunities, strengths, has_benchmarks flag

9.  Fire-and-forget log to scoring_results_log (service-role, no await — never blocks response)

10. Return complete result object to client
```

## Database Tables

### `documents`

Vector-searchable knowledge base. Key columns: `content`, `embedding` (halfvec 1536), `industry`, `category`, `source`, `metadata` (JSONB: r_strategy, scale, primary_material, geographic_focus, fields, word_count, chunk_type, source_id, source_row).

**Architecture note:** All `documents` table access goes through `DocumentsRepository` — never direct Supabase or Aiven client calls. This enforces the dual-backend abstraction.

#### `documents` table schema

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding extensions.halfvec(1536),
  title text,
  industry text,
  category text,
  source text,
  word_count integer,
  metadata jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_documents_industry ON documents(industry);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_source ON documents(source);
CREATE INDEX idx_documents_industry_category ON documents(industry, category);
CREATE INDEX idx_documents_embedding ON documents
  USING hnsw(embedding extensions.halfvec_cosine_ops);
CREATE INDEX idx_documents_created_at ON documents(created_at);
```

### `user_profiles`

User profile data linked to Supabase Auth. Stores user preferences, display information, and assessment statistics. Key columns: `username`, `display_name`, `avatar_url`, `bio`, `assessment_count`, `last_assessment_at`.

### `user_assessments`

User-saved assessments. Fully aligned with the scoring API response — all promoted scalar columns mirror the result object so the full response can be reconstructed from columns without parsing `result_json`.

**Key columns:**

| Column                         | Type    | Description                                                        |
| ------------------------------ | ------- | ------------------------------------------------------------------ |
| `overall_score`                | INTEGER | 0–100 overall score                                                |
| `confidence_level`             | INTEGER | LLM confidence                                                     |
| `technical_feasibility`        | INTEGER | Derived metric                                                     |
| `economic_viability`           | INTEGER | Derived metric                                                     |
| `circularity_potential`        | INTEGER | Derived metric                                                     |
| `risk_level`                   | TEXT    | low/medium/high                                                    |
| `parameter_consistency_score`  | INTEGER | Layer 2: 0–100                                                     |
| `parameter_consistency_rating` | TEXT    | Layer 2: rating label                                              |
| `r_strategy_alignment_score`   | INTEGER | Layer 2: 0–100                                                     |
| `r_strategy_alignment_rating`  | TEXT    | Layer 2: rating label                                              |
| `circular_economy_tier`        | JSONB   | Full tier object with tier, range, badge_color, description        |
| `weighted_score_card`          | JSONB   | Full weighted score card object                                    |
| `parameter_consistency`        | JSONB   | Full consistency object with issues[]                              |
| `r_strategy_alignment`         | JSONB   | Full alignment object with misaligned_factors[]                    |
| `audit`                        | JSONB   | Full LLM audit blob                                                |
| `similar_cases`                | JSONB   | Array of similar cases with scores and metadata                    |
| `gap_analysis`                 | JSONB   | Benchmark comparison object                                        |
| `improvement_roadmap`          | JSONB   | Layer 3: 3 action items                                            |
| `sdg_alignment`                | JSONB   | Layer 3: 2–4 SDG objects                                           |
| `market_opportunity_summary`   | TEXT    | Layer 3: market analysis                                           |
| `audit_confidence_score`       | INTEGER | Audit quality signal                                               |
| `audit_is_junk_input`          | BOOLEAN | Junk detection result                                              |
| `audit_integrity_gaps_count`   | INTEGER | Number of integrity gaps found                                     |
| `similar_cases_count`          | INTEGER | Number of similar cases matched                                    |
| `result_json`                  | JSONB   | Complete API response snapshot (NOT NULL — source of truth for UI) |

**Analytics RPCs on this table:**

- `get_assessment_statistics(user_uuid)` — per-user or global aggregate stats
- `get_market_data()` — per-industry/scale/strategy benchmarks from opted-in public assessments

### `anonymous_usage`

Enables free-tier rate limiting without storing PII. Uses SHA-256 fingerprinting of (IP + User-Agent) for device identification. Key columns: `identifier_hash`, `usage_count`, `last_blocked_at`.

### `scoring_results_log`

Immutable append-only log of every scoring API call. Same column set as `assessments` minus user-facing fields (`title`, `is_public`, `user_uuid`). Additional log-only columns: `request_id`, `ip_hash`, `identifier_hash`, `user_agent_snippet`, `business_problem_len`, `business_solution_len`, `processing_time_ms`, `timings` (JSONB).

Access rules:

- **Service-role only** for inserts (fire-and-forget from `scoring.controller.js`)
- **Authenticated users** can SELECT their own rows
- **Frontend cannot query directly** — must go through `GET /api/analytics/global-stats` backend endpoint

Used by `GET /api/analytics/global-stats` for Dashboard data — wider coverage than `assessments` since it includes all anonymous and unsaved calls.

### `ce_cases`

Circular economy case studies knowledge base for search functionality. Key columns: `title`, `problem`, `solution`, `impact`, `materials`, `circular_strategy`, `category`, `company_name`, `source_url`, `metadata` (JSONB).

**Search capabilities:**

- Keyword search via BM25 algorithm
- Semantic search via vector similarity
- Hybrid search combining both approaches
- Metadata filtering by strategy, category, source

### `uptime_checks`

Stores health check monitoring data with automatic cleanup and production-only polling:

**Key columns:**

| Column             | Type        | Description                |
| ------------------ | ----------- | -------------------------- |
| `endpoint_id`      | TEXT        | Health endpoint identifier |
| `status`           | TEXT        | Response status string     |
| `up`               | BOOLEAN     | Endpoint availability      |
| `response_time_ms` | INTEGER     | Latency measurement        |
| `payload`          | JSONB       | Full health check response |
| `created_at`       | TIMESTAMPTZ | Check timestamp            |

**Features:**

- 7-day automatic data retention
- Production-only polling to avoid dev data duplication
- Optimized indexes for time-series queries
- Autovacuum tuning for high-frequency inserts

**Cleanup Function:** `cleanup_old_uptime_checks(days)` - removes old records

### RPC Functions

#### `search_documents_hybrid_filtered()`

Hybrid search combining vector similarity + BM25 keyword matching with structured column filters.

**Parameters:**

| Parameter              | Type          | Default  | Description                                            |
| ---------------------- | ------------- | -------- | ------------------------------------------------------ |
| `query_embedding`      | halfvec(1536) | required | Query vector                                           |
| `keyword_filter`       | text          | null     | BM25 keyword search                                    |
| `industry_filter`      | text          | null     | Exact match on industry                                |
| `category_filter`      | text          | null     | Exact match on category                                |
| `source_filter`        | text          | null     | Exact match on source                                  |
| `match_count`          | integer       | 10       | Number of results                                      |
| `vector_weight`        | float         | 0.7      | Vector similarity weight (keyword = 1 - vector_weight) |
| `similarity_threshold` | float         | 0.0      | Minimum combined score                                 |

**Returns:** Top-K results with id, content, title, industry, category, source, metadata, similarity, combined_score, rrf_score.

#### `get_market_data()`

Per-industry/scale/strategy benchmark averages from opted-in public assessments.

#### `get_assessment_statistics(user_uuid)`

Aggregate stats for a specific user. Omit `user_uuid` for global stats.

#### `search_ce_cases_keyword(query, limit)`

BM25 full-text search against `ce_cases`. Returns rows ordered by `relevance` score. Used by `GET /api/search/ce-cases?mode=keyword`.

#### `search_ce_cases_hybrid(query_embedding, keyword_query, limit, vector_weight)`

Hybrid search combining pgvector cosine similarity and BM25, combined via Reciprocal Rank Fusion. Returns rows ordered by `similarity` score. Used by `GET /api/search/ce-cases?mode=hybrid`.

## ID Format and Generation

Every document across all datasets has a unique ID: `prefix_NNNNN`

- **prefix**: 2–3 character dataset key (e.g. `c2c`, `epa`, `emf`)
- **underscore**: separator
- **NNNNN**: zero-padded index (5 digits by default, auto-expands beyond 99999)

### ID Generation

Use the `formatId()` helper from `utils/datasetsUtils.js` for consistency:

```javascript
import { formatId, ID_DIGITS } from '#utils/datasetsUtils.js';

formatId('c2c', 1); // → 'c2c_00001'
formatId('c2c', 42); // → 'c2c_00042'
formatId('c2c', 100000); // → 'c2c_100000'  (auto-expands beyond 5 digits)

// ID_DIGITS is exported (currently 5) for use in custom logic
const padding = index.toString().padStart(ID_DIGITS, '0');
```

**Why use the helper?** It handles overflow automatically and keeps IDs consistent across all 32 dataset scripts.

### Dataset Registry

`utils/datasetsUtils.js` exports `DATASETS` — an array of metadata objects for all 32 registered datasets. Each entry includes:

- `key` — unique identifier (e.g. `'c2c'`)
- `name` — human-readable title
- `raw_folder` — directory for raw source files (null if web-scraped)
- `processed_csv` — output CSV filename in `datasets/processed/`
- `scrape_script` / `extract_script` — path to processing script
- `source_url` — primary data source URL
- `urls` — additional URLs (API endpoints, paginated lists, etc.)
- `raw_folder_contents` — file inventory (maps property names to actual filenames)
- `scrape_backup_folder` — backup location for recovery mode (null if no scraping)

See [DATASETS_REFERENCE.md](./DATASETS_REFERENCE.md) for the complete registry.

## API Reference

### Analytics Endpoints

#### GET `/api/analytics`

Returns aggregated statistics across all documents.

**Query Parameters:**

- `industry` — filter by industry (optional)
- `category` — filter by category (optional)
- `source` — filter by source (optional)

**Response:**

```json
{
  "total_documents": 40243,
  "industries": {
    "textiles": { "count": 1245, "percentage": 8.6 },
    "electronics": { "count": 892, "percentage": 6.2 }
  },
  "categories": { "circular_design": { "count": 3120, "percentage": 21.8 } },
  "sources": { "emf": { "count": 3825, "percentage": 26.7 } }
}
```

#### GET `/api/analytics/enhanced`

Detailed analytics with time series, industry metrics, score distributions, and strategy breakdowns. Supports `industry`, `timeRange` query parameters.

#### POST `/api/analytics/embeddings/reindex`

Maintenance endpoint to reindex embeddings. Requires admin access. Used for data pipeline maintenance.

#### GET `/api/analytics/global-stats`

See the full response shape documented above in the [GET /api/analytics/global-stats](#get-apianalyticsglobal-stats) section.

### Search

| Method | Endpoint               | Auth | Description                                         |
| ------ | ---------------------- | ---- | --------------------------------------------------- |
| `GET`  | `/api/search/ce-cases` | None | Search circular economy case studies knowledge base |

#### `GET /api/search/ce-cases`

Query parameters:

| Param           | Type   | Default   | Description                                                                                         |
| --------------- | ------ | --------- | --------------------------------------------------------------------------------------------------- |
| `q`             | string | —         | **Required.** Search query (max 500 chars)                                                          |
| `mode`          | string | `keyword` | `keyword` (BM25 full-text, < 50ms) or `hybrid` (semantic vector + keyword, calls OpenAI embeddings) |
| `limit`         | number | 20        | Max results (capped at 50)                                                                          |
| `vector_weight` | number | 0.7       | Hybrid mode only. Weight given to vector vs keyword (0.0–1.0)                                       |

Response shape:

```json
{
  "query": "plastic bottle recycling",
  "mode": "hybrid",
  "count": 20,
  "results": [
    {
      "id": "...",
      "problem": "...",
      "solution": "...",
      "materials": "...",
      "circular_strategy": "...",
      "category": "...",
      "impact": "...",
      "source_url": "...",
      "title": "...",
      "company": "...",
      "summary": "...",
      "source_display": "example.com",
      "score": 0.87
    }
  ],
  "processing_info": { "processing_time_ms": 210 }
}
```

Hybrid mode embeds the query via `embedding.service.js` then calls `search_ce_cases_hybrid()` RPC (vector + BM25 + RRF). Keyword mode calls `search_ce_cases_keyword()` RPC directly (no OpenAI call).

### Scoring Endpoints

#### POST `/api/score`

Full scoring pipeline. Returns complete result object. Rate limited to 10 requests per minute per IP.

#### POST `/api/score/stream`

Server-Sent Events (SSE) streaming version of the scoring pipeline. Returns real-time progress updates during scoring. Same rate limiting as `/api/score`.

### Assessment Endpoints

#### POST `/api/assessments`

Save a completed assessment for the authenticated user.

**Request body:** Complete scoring result object from `POST /api/score` plus:

```json
{
  "title": "My Packaging Initiative",
  "is_public": true,
  "contribute_to_global_benchmarks": true
}
```

#### GET `/api/assessments/compare`

Compare two assessments. Query params: `id1`, `id2`. Returns both assessments plus computed `factorDiffs`, `comparisonData`, and `overallDiff`. Both assessments must be public for comparison.

#### GET `/api/assessments/validate/:publicId`

Validate assessment ID exists and is shareable. Supports user access to their own assessments regardless of public status. Requires authentication.

### Uptime Monitor Endpoints

| Method | Endpoint                          | Auth | Description                                                 |
| ------ | --------------------------------- | ---- | ----------------------------------------------------------- |
| `GET`  | `/api/uptime/count`               | None | Get total number of uptime checks (optionally per endpoint) |
| `GET`  | `/api/uptime/history/:endpointId` | None | Retrieve recent checks for specific endpoint (max 10000)    |

#### GET `/api/uptime/count`

Returns the total number of stored uptime checks.

**Query Parameters:**

- `endpointId` — filter by specific endpoint (optional)

**Response:**

```json
{
  "total": 1250
}
```

#### GET `/api/uptime/history/:endpointId`

Retrieve recent uptime checks for a specific endpoint.

**Path Parameters:**

- `endpointId` — identifier of the endpoint (e.g., "health", "database", "openai")

**Query Parameters:**

- `limit` — number of results to return (default 10000, max 10000)

**Response:**

```json
{
  "endpointId": "health",
  "checks": [
    {
      "id": "uuid",
      "status": "ok",
      "up": true,
      "responseTimeMs": 45,
      "payload": {...},
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

### Profile Endpoint

#### GET `/api/profile`

Get the authenticated user's profile information. Requires authentication.

**Response:**

```json
{
  "id": "user-uuid",
  "username": "john_doe",
  "created_at": "2026-01-15T10:30:00.000Z",
  "updated_at": "2026-01-20T14:22:00.000Z"
}
```

## Environment Configuration

### Required Variables (`.env.backend`)

The flag `USE_SUPABASE_DOCUMENTS_TABLE` controls which database backend holds the `documents` table:

- `true` _(default)_ → all queries and pipeline operations target Supabase
- `false` → operations use the external Aiven PostgreSQL instance

```env
# Core
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyxxxxxxxxxxxxx
INTERNAL_BACKEND_API_KEY=your-secret-api-key
PORT=8000
NODE_ENV=development

# Scoring endpoints respect SCORING_MAX_FREE_TRIES for anonymous users

# Database backend switch
USE_SUPABASE_DOCUMENTS_TABLE=true   # set to false to switch to Aiven

# Optional low-level Supabase connection settings (tests/tooling):
SUPABASE_HOST=
SUPABASE_PORT=
SUPABASE_DATABASE=
SUPABASE_USER=
SUPABASE_PASSWORD=
SUPABASE_CONNECTION_STRING=

# Aiven settings (required when USE_SUPABASE_DOCUMENTS_TABLE=false):
AIVEN_HOST=
AIVEN_PORT=22335
AIVEN_DATABASE=defaultdb
AIVEN_USER=avnadmin
AIVEN_PASSWORD=
AIVEN_SSL_MODE=require
AIVEN_CONNECTION_LIMIT=20
AIVEN_CONNECTION_STRING=
```

### Environment Setup

```bash
# From project root
cp env/.env.example env/.env.backend
# Edit env/.env.backend with your credentials
```

### Configuration Files

1. `config/backend.config.js` — central config object with test defaults
2. `config/env.schema.js` — Zod schema for environment variable validation
3. `config/embedding.js` — embedding model name and dimension constants
4. `config/chunk.js` — chunking parameters (min length, overlap, etc.)
5. `config/loadEnv.js` — Environment loading utilities
6. `utils/datasetsUtils.js` — dataset filesystem path constants and DATASETS registry

## Import Aliases (Canonical Paths)

All backend imports use `#`-prefixed canonical aliases defined in `package.json` `imports`. Never use relative paths.

```javascript
// ✓ CORRECT (use canonical aliases)
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getDatabaseClient } from '#database/client.js';
import { documentsRepository } from '#database/index.js';
import { performScoring } from '#services/scoring.service.js';
import { generateWeightedScoreCard } from '#services/scoring.logic.js';
import { anonymousTracking } from '#utils/anonymousTracking.js';
import { DATASETS } from '#utils/datasetsUtils.js';

// ✗ AVOID (relative paths break when files move)
import { performScoring } from '../../services/scoring.service.js';
import supabase from '../../../../database/supabase.client.js';
```

### Workspace Integration

The backend is part of a npm workspace. From the project root:

```bash
npm run backend    # Start backend only (http://localhost:8000)
npm run dev        # Start both frontend and backend
npm test           # Run backend tests
```

## Structured Metadata: industry & category

The `documents` table has `industry` and `category` as first-class indexed columns alongside the `metadata` JSONB column.

### Column Strategy

- **Top-level columns (indexed):** `industry`, `category` → use for filtering, grouping, display
- **JSONB column (flexible):** `metadata` → flexible fields: `scale`, `r_strategy`, `primary_material`, `geographic_focus`

### Storage Pipeline

The ingestion pipeline (`pipeline/store_embeddings.js`) automatically populates both:

```javascript
await supabase.from('documents').insert({
  content: chunk.content,
  embedding: vectorArray,
  industry: 'textiles', // ← top-level indexed column
  category: 'circular_design', // ← top-level indexed column
  metadata: {
    // ← JSONB for flexible fields
    scale: 'medium',
    r_strategy: 'recycling',
    primary_material: 'cotton',
    geographic_focus: 'europe',
    word_count: 250,
    chunk_type: 'problem_solution',
  },
});
```

### Querying Strategy

```javascript
// ✓ FAST — uses B-tree indexes
const results = await supabase
  .from('documents')
  .select('*')
  .eq('industry', 'textiles')
  .eq('category', 'design');

// ✓ WORKS — JSONB filtering (slower, no index)
const results = await supabase
  .from('documents')
  .select('*')
  .contains('metadata', { scale: 'medium' });

// For backward compatibility, fall back to metadata if structured column is null:
const industry = row.industry ?? row.metadata?.industry;
```

## Running the Backend

### Server

```bash
npm run start    # Production server (NODE_ENV=production)
npm run dev      # Development with watch mode (http://localhost:8000)
```

**From workspace root:**

```bash
npm run backend  # Equivalent to cd backend && npm run dev
```

Test mode is automatically enabled when `NODE_ENV=test`:

- Skips `.env` file loading (preserves test env vars)
- Uses fallback test defaults for missing credentials
- Does not auto-listen (test frameworks control startup)
- Provides stub Supabase clients for offline testing

### Data Pipeline

```bash
npm run populate  # Complete pipeline: merge → chunk → embed → store

npm run merge     # Stage 1: merge CSVs → datasets/out/combined_input.csv
npm run chunk     # Stage 2: chunk → datasets/out/chunks.json
npm run embed     # Stage 3: embed → datasets/out/embedded_chunks.json
npm run store     # Stage 4: store → documents table (Supabase or Aiven)

# Dry-run (no DB, writes JSONL locally)
npm run embed -- --dry-run
npm run store -- --dry-run

# Archive outputs (write to datasets/archives/ instead of datasets/out/)
npm run merge -- --archives
npm run chunk -- --archives
npm run embed -- --archives
npm run store -- --archives   # also forces Supabase backend
```

### Dataset Scripts

Pull data from web sources using Puppeteer automation:

```bash
# Individual scrapers:
node backend/datasets/scripts/scrape_c2c.js          # Cradle-to-Cradle certified products
node backend/datasets/scripts/scrape_ecesp.js        # ECESP good practices
node backend/datasets/scripts/scrape_emf.js          # Ellen MacArthur Foundation case studies
node backend/datasets/scripts/scrape_open_food_facts.js

# Run all extract_* then scrape_* scripts in sequence:
npm run datasets-scripts

# Debug — show browser window while scraping:
node backend/datasets/scripts/scrape_ecesp.js --show

# Recover from interrupted scrape:
node backend/datasets/scripts/scrape_c2c.js --use-backup
```

**Backup & Recovery Mode:** All scrapers save intermediate results every N pages to `datasets/archives/scrape_backup/<dataset>_scrape_backup.csv`. If interrupted, rebuild from saved backup:

```bash
# Skips web fetching; rebuilds final CSV from backup:
node datasets/scripts/scrape_c2c.js --use-backup
```

**Console feedback during backup saves:**

```code
✓ Backup: Saved 45 rows from page 3
‼ ️ Backup add failed: [error reason]
```

### Dataset Script CLI Flags

| Flag           | Applies to           | Description                                  |
| -------------- | -------------------- | -------------------------------------------- |
| `--show`       | Scrapers (Puppeteer) | Show browser window during scraping          |
| `--use-backup` | Scrapers             | Rebuild CSV from saved backup                |
| `--append`     | All scripts          | Add new rows to existing CSV (renumbers IDs) |
| `--clear-logs` | All scripts          | Clear previous run logs before starting      |

### Workspace Scripts

From the project root, you can also run pipeline scripts:

```bash
npm run datasets-scripts    # Run all dataset extraction scripts
npm run populate           # Full pipeline: merge → chunk → embed → store
```

### Validation & Testing

```bash
npm test                  # Full test suite (all *.test.js)
npm run validate          # End-to-end pipeline validation (if available)
npm run poll:supabase     # Monitor vector storage (if available)
```

**From workspace root:**

```bash
npm test                 # Runs backend tests as part of workspace testing
```

## Test Suite

| Test File                          | Tests | Description                                                                                                        |
| ---------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `scoring-logic-enrichment.test.js` | 33    | WeightedScoreCard, CE Tier (4 tiers + boundaries), ParameterConsistency (8 rules), RStrategyAlignment (9 profiles) |
| `assessments-routes.test.js`       | —     | CRUD endpoints, auth guards                                                                                        |
| `scoring.rpc.test.js`              | —     | Scoring pipeline integration                                                                                       |
| `analytics.enhanced.test.js`       | —     | Analytics endpoints                                                                                                |
| `api-auth.test.js`                 | —     | API key guard                                                                                                      |
| `anonymous.test.js`                | —     | Anonymous tracking middleware                                                                                      |
| `apiKeyGuard.test.js`              | —     | Auth middleware unit tests                                                                                         |
| `documents.repository.test.js`     | —     | Repository layer                                                                                                   |
| `score-validation.test.js`         | —     | Input validation                                                                                                   |

### Running Tests

```bash
# From backend directory
npm test

# From workspace root
npm test

# Run specific test file
node tests/services/scoring-logic-enrichment.test.js
```

## Dataset Script Documentation Standards

All dataset extraction scripts follow comprehensive documentation conventions:

### File-Level Headers (Required)

Every script includes a JSDoc block (lines 1–30):

```javascript
/**
 * scrape_my_dataset.js
 *
 * Scrapes circular economy case studies from My Data Source.
 * Extracts product/solution pairs with environmental impact metrics.
 *
 * Features:
 *   - Pagination with retry logic (max 5 attempts per page)
 *   - Per-item detail extraction via dynamic content
 *   - Quality filtering (excludes incomplete entries)
 *   - Backup & recovery system (--use-backup flag)
 *
 * Usage:
 *   node scrape_my_dataset.js                 # Normal run (headless)
 *   node scrape_my_dataset.js --show          # Debug with visible browser
 *   node scrape_my_dataset.js --use-backup    # Rebuild from backup
 *   node scrape_my_dataset.js --append        # Add rows to existing CSV
 *
 * Input:
 *   - https://example.com/listings (dynamic pagination)
 *
 * Output:
 *   - datasets/processed/my_dataset_processed.csv
 *
 * Backup:
 *   - datasets/archives/scrape_backup/my_dataset_scrape_backup/
 *   - Saved every 3 pages to prevent data loss on network interruption
 */
```

### Function Documentation

```javascript
/**
 * Scores a data record based on completeness and relevance.
 * @param {Object} record - The data record to score
 * @param {string} record.problem - Problem description
 * @param {string} record.solution - Solution description
 * @param {number} [record.completeness] - Data completeness percentage
 * @returns {number} Quality score from 0-100
 * @throws {Error} If problem or solution is missing
 */
function scoreRecord(record) { ... }
```

## Security

- **API Key Guard** — all routes require `x-api-key` header; validated before any handler runs
- **JWT Verification** — Supabase Bearer tokens for user-authenticated routes
- **RLS** — Row Level Security on all Supabase tables; users read/write only their own data
- **Service Role** — `scoring_results_log` inserts use service-role client exclusively (fire-and-forget)
- **Input Validation** — Zod schemas on all request bodies; query params sanitised against allowed values
- **Junk Detection** — scoring endpoint detects and rejects nonsensical inputs before LLM calls
- **Rate Limiting** — anonymous users limited to 5 assessments per IP via `anonymous_usage` table
- **No PII** — `ip_hash` and `identifier_hash` are SHA-256 hashes; raw IPs never stored

## Adding a New Endpoint

1. Define route in `routes/` (HTTP verb + path only — no business logic)
2. Add handler in `controllers/` (validate input → call service → format response)
3. Add business logic in `services/` if needed
4. Register route in `server/app.js`
5. Add test in `tests/api/`
6. Update API Reference in `README.md`

## Performance Characteristics

| Operation                   | Typical Latency                  |
| --------------------------- | -------------------------------- |
| Vector search (HNSW)        | < 100ms                          |
| Keyword + filter (B-tree)   | < 50ms                           |
| Hybrid search               | < 150ms                          |
| Full scoring pipeline       | 3–8 seconds (includes LLM calls) |
| Embedding (20 chunks/batch) | ~200ms per batch                 |
| Storage (10 docs/batch)     | ~50ms per batch                  |

---

## Datasets Included

**32 processed datasets** totalling ~40,000+ document chunks from diverse sources:

- GreenTechGuardians: 2,286 case studies
- Ellen MacArthur Foundation: 3,825+ case studies
- Eurostat: 501+ environmental records
- Open Food / Beauty / Products: 1,000+ product records
- Academic & government datasets: 40,000+ records

See [DATASETS_REFERENCE.md](./DATASETS_REFERENCE.md) for the complete inventory.

## Architecture Decisions

### PostgreSQL + pgvector

- Native vector type — no separate vector database required
- Structured + unstructured data colocated in one place
- SQL filtering is fast with B-tree indexes on `industry`, `category`, `source`
- HNSW index for approximate nearest-neighbour search at scale
- Cost-effective vs dedicated vector databases (Pinecone, Weaviate)

### Batch Embedding

- 20 chunks per OpenAI API call reduces costs and latency
- 500ms delay between batches handles rate limits gracefully
- Validates dimension = 1536 before inserting to DB

### Hybrid Search

- Vector search alone misses exact keyword matches
- Keyword search alone misses semantic similarity
- Combined weighted approach (70% vector + 30% BM25) is more robust for real-world retrieval quality

#### CE Cases Search (Solutions Search tab)

Separate from the scoring pipeline's knowledge base search. The `ce_cases` table contains structured case study records (problem, solution, materials, circular_strategy, category, impact, source metadata). Two search modes:

- **Keyword mode** — BM25 via `search_ce_cases_keyword()` RPC; no external API call; latency < 50ms
- **Hybrid mode** — embeds query via `createEmbedding()` (OpenAI text-embedding-3-small), then calls `search_ce_cases_hybrid()` RPC with RRF combination; latency < 500ms including embedding call

The `vector_weight` parameter (default 0.7) controls the blend: 1.0 = pure vector, 0.0 = pure keyword.

### Structured Filtering

- `industry` and `category` are first-class indexed columns — fast B-tree lookups
- JSONB filtering on `metadata` is slower — only use for flexible/optional fields
- Improves query performance significantly for the most common filter patterns

### scoring_results_log as Analytics Source

- Captures every scoring call regardless of whether the user saves the assessment
- Wider coverage than the `assessments` table (includes anonymous and unsaved calls)
- Immutable append-only — never updated, only inserted via service-role client
- Frontend cannot query it directly — must go through backend analytics endpoint

## Extending the System

### Adding a New Dataset

1. Create extraction script in `datasets/scripts/` following documentation standards above
2. Output standardised CSV to `datasets/processed/`
3. Register in `utils/datasetsUtils.js` DATASETS array
4. Run `npm run populate`
5. Update `DATASETS_REFERENCE.md`

### Adding a New Router Endpoint

1. **Create route** in `routes/` — HTTP definition only, no business logic
2. **Create controller** in `controllers/` — validate, delegate, format response
3. **Create service** in `services/` — business logic, no HTTP context
4. **Register route** in `server/app.js`
5. **Test:** Add test file to `tests/api/`
6. **Document:** Update this README's API Reference

### Adding a New Service Function

1. Create function in appropriate `services/*.service.js` or `services/*.logic.js`
2. Import and call from the relevant controller
3. Add unit tests to `tests/services/`
4. Follow naming: `getX()`, `createX()`, `performX()`, `calculateX()`

### Adding a New Database RPC Function

1. Write SQL in a new migration file `database/migrations/NN_description.sql`
2. Apply in Supabase SQL editor
3. Call from service: `supabase.rpc('function_name', params)`
4. Test in Supabase SQL editor before wiring into code

## Dependencies

### Core

- **express** — REST framework
- **@supabase/supabase-js** — Database + auth client
- **openai** — Embeddings + GPT-4o-mini
- **zod** — Input validation and env schema
- **pg** — PostgreSQL client (Aiven backend)

### Data Processing

- **csv-parse** — CSV parsing in pipeline
- **csv-stringify** — CSV generation for processed datasets
- **puppeteer** — Web scraping for `scrape_*` scripts
- **pdfjs-dist** — PDF text extraction for `extract_*` scripts

For running the pipeline: [PIPELINE_RUNNING.md](./PIPELINE_RUNNING.md)
For adding new datasets: [PIPELINE_ADDING_DATASETS.md](./PIPELINE_ADDING_DATASETS.md)
For dataset inventory: [DATASETS_REFERENCE.md](./DATASETS_REFERENCE.md)

### Development

- **eslint** — Code linting
- **supertest** — HTTP API testing
- **nodemon** — Auto-reload in development

## License & Support

**LICENSE:** MIT
**Author:** Areeb Ahmed Zahoori
**Last Updated:** 02 May 2026
