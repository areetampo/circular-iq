# CircularIQ - Circular Economy Evaluator

![Node](https://img.shields.io/badge/node-18+-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express-blue)
![DB](https://img.shields.io/badge/database-Supabase%20pgvector-3ECF8E?logo=supabase)
![AI](https://img.shields.io/badge/AI-OpenAI-412991?logo=openai&logoColor=white)
![Deployment](https://img.shields.io/badge/deploy-Vercel%20%2B%20Render-black?logo=vercel)

AI-powered platform for evaluating circular economy business initiatives against a knowledge base of case studies. Uses semantic vector search, evidence-based scoring, and multi-layer LLM enrichment to produce comprehensive, actionable assessments.

- **Authors:** [Areeb Ahmed Zahoori](mailto:areebrawl@gmail.com) & [Mahit Singh](mailto:mahitsingh02@gmailcom)
- **Repository:** [areetampo/circular-iq](https://github.com/areetampo/circular-iq)
- **License:** MIT

---

## Overview

The platform guides users through a structured assessment and returns a complete evaluation:

1. **Describe** your business problem and proposed solution
2. **Score** across 8 evaluation parameters (manual or guided mode)
3. **Enrich** with 3 deterministic and LLM-powered analysis layers
4. **Compare** against similar real-world projects from the knowledge base
5. **Export** as PDF or CSV with full SDG alignment and improvement roadmap
6. **Track** assessment history and benchmark against global data

---

## Core Architecture

```txt
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Full-Stack Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Frontend Layer (React 19 + Vite 7)                                         │
│  ├─ Assessment Flow — guided questionnaires + business context              │
│  ├─ Results Visualisation — charts, tables, export, drawers                 │
│  ├─ Global Activity — live analytics from scoring_results_log               │
│  ├─ State Management — React Query + custom hooks                           │
│  ├─ UI Components — HeroUI v3 + Tailwind CSS v4 + Recharts                  │
│  └─ Session Persistence — localStorage + anonymous tracking                 │
│                                                                             │
│  API Layer (Express.js — ESM)                                               │
│  ├─ /api/score — full scoring + enrichment pipeline                         │
│  ├─ /api/analytics — global stats, doc stats                                │
│  ├─ /api/search — ce_cases knowledge base search (keyword + hybrid)         │
│  ├─ /api/assessments — assessment CRUD + comparison                         │
│  ├─ /api/health — health check endpoints                                    │
│  └─ /api/uptime — uptime monitoring data storage and retrieval              │
│                                                                             │
│  Business Logic Layer (Services)                                            │
│  ├─ scoring.service.js — hybrid search + LLM audit orchestration            │
│  ├─ scoring.logic.js — pure deterministic enrichment (Layer 2)              │
│  └─ embedding.service.js — OpenAI API integration + batching                │
│                                                                             │
│  Data Processing Pipeline                                                   │
│  ├─ Extraction Layer (35 dataset scripts)                                   │
│  │  ├─ scrape_*.js (Puppeteer web automation)                               │
│  │  └─ extract_*.js (PDF/CSV/JSON/API parsing)                              │
│  ├─ Merge (merge_datasets.js)                                               │
│  ├─ Chunking (generate_chunks.js)                                           │
│  ├─ Embedding (generate_embeddings.js)                                      │
│  └─ Storage (store_embeddings.js)                                           │
│                                                                             │
│  Database Layer (Supabase PostgreSQL + pgvector / Aiven)                    │
│  ├─ documents — vector-searchable knowledge base (40k+ chunks)              │
│  ├─ user_assessments — user-saved results with all enrichment columns       │
│  ├─ RPC functions — hybrid search, market data, assessment stats            │
│  ├─ user_profiles — user preferences                                        │
│  ├─ anonymous_usage — rate limiting + session tracking                      │
│  ├─ scoring_results_log — immutable log of every scoring call               │
│  ├─ ce_cases — circular economy cases knowledge base                        │
│  └── uptime_checks — health monitoring history                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| **Layer**                   | **Technology**                                                                                  | **Purpose**                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Runtime**                 | Node.js 18+ (backend), Node.js 24+ (frontend)                                                   | Server runtime                                     |
| **Backend**                 | Express.js (ESM)                                                                                | REST API server                                    |
| **Frontend**                | React 19 + Vite 7                                                                               | UI framework and build tool                        |
| **UI Library**              | HeroUI v3                                                                                       | Component library                                  |
| **Styling**                 | Tailwind CSS v4                                                                                 | Utility-first CSS                                  |
| **Charts**                  | Recharts                                                                                        | Data visualisation                                 |
| **Database**                | Supabase PostgreSQL + pgvector                                                                  | Primary vector store + relational data             |
| **Alt DB**                  | Aiven PostgreSQL                                                                                | Alternative vector store (switchable via env flag) |
| **AI — Embeddings**         | OpenAI text-embedding-3-small                                                                   | Semantic similarity search (1536 dims)             |
| **AI — Reasoning**          | GPT-4o-mini                                                                                     | LLM audit, enrichment, metadata extraction         |
| **State**                   | TanStack React Query                                                                            | Server state, caching, background refetch          |
| **Auth**                    | Supabase Auth                                                                                   | User authentication + Row Level Security           |
| **Monitoring & Deployment** | Built-in uptime monitoring service, UptimeRobot, GitHub keep-alive workflow, Vercel ping helper | Monitoring and deployment                          |

---

## Quick Start

### Prerequisites

- Node.js 18+ (backend), Node.js 24+ (frontend)
- npm 8+
- Supabase project with pgvector extension enabled
- OpenAI API key

### Installation

```bash
# 1. Clone
git clone https://github.com/areetampo/circular-iq.git
cd circular-iq

# 2. Install dependencies (workspace setup)
npm install

# 3. Environment setup
cp env/.env.example env/.env.backend
cp env/.env.example env/.env.frontend
# Edit both files — see Environment Variables section below

# 4. Database migrations
# Run in order via Supabase SQL editor:
#   backend/database/migrations/00_app_settings.sql
#   backend/database/migrations/01_vector_infrastructure.sql
#   backend/database/migrations/02_user_assessments.sql
#   backend/database/migrations/03_user_profiles.sql
#   backend/database/migrations/04_anonymous_usage.sql
#   backend/database/migrations/05_results_logs.sql
#   backend/database/migrations/06_ce_cases.sql
#   backend/database/migrations/07_uptime_monitor.sql

# 5. Start development servers (single command)
npm run dev    # Starts both backend:8000 and frontend:5173 concurrently

# Or run individually:
npm run backend    # Backend only: http://localhost:8000
npm run frontend   # Frontend only: http://localhost:5173
```

### Environment Variables

**Backend** (`env/.env.backend`):

```env
# Required
PORT=8000
NODE_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:5173
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
INTERNAL_BACKEND_API_KEY=your-secret-key

# Database backend switch
USE_SUPABASE_DOCUMENTS=true   # false = use Aiven PostgreSQL

# Aiven (only if USE_SUPABASE_DOCUMENTS_TABLE=false)
AIVEN_HOST=
AIVEN_PORT=25060
AIVEN_DATABASE=defaultdb
AIVEN_USER=avnadmin
AIVEN_PASSWORD=
AIVEN_SSL_MODE=require
AIVEN_CONNECTION_LIMIT=10
# OR use a connection string instead:
AIVEN_CONNECTION_STRING=postgresql://avnadmin:[password]@host:25060/defaultdb?sslmode=require

# Pool settings (both backends)
SUPABASE_CONNECTION_LIMIT=10

# Optional
ANON_SCORING_LIMIT=5
LOG_LEVEL=info
API_AUTH_ENABLED=true
API_KEY=your-api-key
STRICT_ENV=false
```

**Frontend** (`env/.env.frontend`):

```env
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Important:** `INTERNAL_BACKEND_API_KEY` is **never** a `VITE_` prefixed variable. It lives only in Vercel server-side environment and is used by the legacy `api/proxy.js`.

---

## Assessment Engine — Three Enrichment Layers

**Layer 1 — Business Context** (optional structured inputs)

- Business model type: classify circular strategy (PaaS, take-back, remanufacturing, recycling, etc.)
- Operational stage: maturity level (idea → prototype → pilot → scaling → mature operation)
- Target geography: market scope (local → global)
- Annual volume estimate (< 1 tonne → > 100 tonnes)
- Material complexity (single → multi-material → hazardous → electronics → biological)
- Existing supply chain partnerships (boolean)

These inputs improve LLM calibration and enable stage-appropriate scoring.

**Layer 2 — Deterministic Computed Outputs** (no LLM, fully reproducible)

- **Weighted Score Card** — per-factor contribution breakdown with Strong/Moderate/Weak/Critical classifications and top/bottom contributors
- **Circular Economy Tier** — Leader / Established / Developing / Emerging with percentile estimate, badge colour, description, and next-milestone guidance
- **Parameter Consistency** — internal coherence analysis (0–100) detecting unrealistic score combinations across 8 validation rules
- **R-Strategy Alignment** — validates that factor scores match the detected circular strategy across 9 profile types; identifies well-aligned and misaligned factors

**Layer 3 — Extended LLM Output** (GPT-4o-mini)

- **Improvement Roadmap** — 3 prioritised actions with effort/impact/timeframe estimates and target evaluation factor
- **SDG Alignment** — 2–4 most relevant UN Sustainable Development Goals with rationale
- **Market Opportunity Summary** — grounded in database evidence, calibrated to score level
- **Audit Verdict** — comparative analysis, integrity gap list, strengths, technical recommendations
- **Similar Cases Summaries** — one cleaned summary per matched case (LLM OCR artifact cleanup)

---

## Knowledge Base & Datasets

### Knowledge Base

- **40,000+ document chunks** from 32 curated datasets
- Sources: Ellen MacArthur Foundation, WBCSD, Eurostat, academic papers, government reports, corporate sustainability reports
- Vector search: cosine similarity on OpenAI embeddings (pgvector HNSW)
- Per-field chunking: problem, solution, impact, materials, circular_strategy
- Structured metadata: industry, R-strategy, scale, geographic focus, primary material

### Datasets Included

**32 processed datasets** from diverse authoritative sources:

- GreenTechGuardians: 2,286 case studies
- Ellen MacArthur Foundation: 3,825+ case studies
- Eurostat: 501+ environmental records
- Open Food / Beauty / Products Facts: 1,000+ product records
- Academic & government datasets: 40,000+ records

See [backend/DATASETS_REFERENCE.md](./backend/DATASETS_REFERENCE.md) for complete inventory.

---

## Data Pipeline

### Complete Data Lifecycle

```txt
1)  RAW SOURCE DATA (datasets/raw/*)
    ↓ extract_*.js or scrape_*.js (35 scripts)

2)  PROCESSED DATASETS (datasets/processed/*.csv)
    Standard columns: id, problem, solution, materials, circular_strategy,
    category, impact, source_url, metadata_json — 32 total datasets

3)  MANUAL ENTRIES (datasets/manual_entries/manual_entries.csv)
    User-contributed problem/solution pairs (same column format)

4)  MERGED INPUT → `npm run merge -w backend`
    Concatenates all CSVs + manual_entries, dedupes, validates
    Output: datasets/out/combined_input.csv (50,000+ rows)

5)  SEMANTIC CHUNKS → `npm run chunk -w backend`
    Per-field chunking: problem_solution, problem, solution, impact, materials
    Metadata extraction: industry, category, r_strategy, scale, primary_material, geographic_focus
    Output: datasets/out/chunks.json (14,000–19,000 chunks)

6)  VECTOR EMBEDDINGS → `npm run embed -w backend`
    OpenAI text-embedding-3-small, 1536 dims
    Batch: 20 chunks/call, 500ms delay, exponential backoff on rate limits
    Output: datasets/out/embedded_chunks.json

7)  DATABASE STORAGE → `npm run store -w backend`
    Inserts into documents table via configured backend (Supabase or Aiven)
    Creates/maintains HNSW index for fast similarity search
    Resume mode (--resume): skips already-stored documents by chunk_id

8)  QUERY & SCORING (Live API)
    POST /api/score → hybrid search RPC → scoring → Layer 2 → LLM audit → Layer 3
```

### Pipeline Commands

```bash
cd backend

npm run populate  # All four stages: merge → chunk → embed → store

npm run merge     # Stage 1 only → datasets/out/combined_input.csv
npm run chunk     # Stage 2 only → datasets/out/chunks.json
npm run embed     # Stage 3 only → datasets/out/embedded_chunks.json
npm run store     # Stage 4 only → documents table

# Dry-run (writes locally, no DB)
npm run embed -- --dry-run
npm run store -- --dry-run

# Archive outputs (write to datasets/archives/ instead of out/)
npm run merge -- --archives
npm run chunk -- --archives
npm run embed -- --archives
npm run store -- --archives   # also forces Supabase backend
```

### Search & Retrieval Architecture

- **Vector Search** — cosine similarity on OpenAI embeddings (HNSW index, < 100ms)
- **Keyword Search** — BM25 algorithm for exact term matches (< 50ms)
- **Metadata Filtering** — industry, scale, R-strategy filtering via B-tree indexes

### Adding a New Dataset

1. Create extraction script in `backend/datasets/scripts/`
2. Output standardised CSV to `backend/datasets/processed/`
3. Register in `backend/utils/datasetsUtils.js` DATASETS array
4. Run: `npm run populate`
5. Update `backend/DATASETS_REFERENCE.md`

See [PIPELINE_ADDING_DATASETS.md](./backend/PIPELINE_ADDING_DATASETS.md) for the full guide including JSDoc requirements and backup/recovery implementation.

For running the pipeline: [backend/PIPELINE_RUNNING.md](./backend/PIPELINE_RUNNING.md)
For dataset inventory: [backend/DATASETS_REFERENCE.md](./backend/DATASETS_REFERENCE.md)

---

## Performance Characteristics

### Pipeline Execution Times

| Stage             | Typical Duration   |
| ----------------- | ------------------ |
| Merge             | 1–2 seconds        |
| Chunking          | 5–10 seconds       |
| Embedding         | 3–5 minutes        |
| Storage           | 2–4 minutes        |
| **Full pipeline** | **~10–12 minutes** |

### Pipeline Costs (per full run)

| Resource              | Typical Cost              |
| --------------------- | ------------------------- |
| OpenAI embeddings     | ~$0.02–$0.10              |
| Supabase reads/writes | Free tier (within limits) |

### Query Performance

| Operation                 | Typical Latency            |
| ------------------------- | -------------------------- |
| Vector search (HNSW)      | < 100ms                    |
| Keyword + filter (B-tree) | < 50ms                     |
| Hybrid search             | < 150ms                    |
| Full scoring pipeline     | 3–8 seconds (includes LLM) |

---

## API Reference

### Scoring

| Method | Endpoint            | Auth     | Description                                                                       |
| ------ | ------------------- | -------- | --------------------------------------------------------------------------------- |
| `POST` | `/api/score`        | Optional | Full scoring pipeline: validation → vector search → Layer 2 → LLM audit → Layer 3 |
| `POST` | `/api/score/stream` | Optional | Real-time scoring with Server-Sent Events for progress updates                    |

### Analytics

| Method | Endpoint                            | Auth     | Description                                    |
| ------ | ----------------------------------- | -------- | ---------------------------------------------- |
| `GET`  | `/api/analytics/global-stats`       | Optional | Global activity stats from scoring_results_log |
| `POST` | `/api/analytics/embeddings/reindex` | Optional | Reindex embeddings (maintenance)               |

### Search

| Method | Endpoint               | Auth     | Description                                  |
| ------ | ---------------------- | -------- | -------------------------------------------- |
| `GET`  | `/api/search/ce-cases` | Optional | Search circular economy cases knowledge base |

### Assessments

| Method   | Endpoint                              | Auth     | Description                                                   |
| -------- | ------------------------------------- | -------- | ------------------------------------------------------------- |
| `POST`   | `/api/assessments`                    | Required | Save completed assessment                                     |
| `GET`    | `/api/assessments`                    | Required | List user's assessments                                       |
| `GET`    | `/api/assessments/stats`              | Required | User aggregate statistics                                     |
| `GET`    | `/api/assessments/public/:publicId`   | Optional | Retrieve public/shared assessment (ownership check with auth) |
| `GET`    | `/api/assessments/validate/:publicId` | Optional | Validate shared assessment id (ownership check with auth)     |
| `GET`    | `/api/assessments/compare`            | Optional | Compare two assessments (query params: id1, id2)              |
| `GET`    | `/api/assessments/:publicId`          | Required | Fetch specific assessment                                     |
| `PATCH`  | `/api/assessments/:id`                | Required | Update assessment (rename, set is_public)                     |
| `DELETE` | `/api/assessments/:id`                | Required | Delete assessment                                             |

### Health & System

| Method | Endpoint                 | Auth     | Description                                    |
| ------ | ------------------------ | -------- | ---------------------------------------------- |
| `GET`  | `/health`                | Optional | Basic health check for load balancers          |
| `GET`  | `/health/detailed`       | Optional | Comprehensive health check with service status |
| `GET`  | `/health/database`       | Optional | Database connectivity check                    |
| `GET`  | `/health/database/aiven` | Optional | Aiven PostgreSQL database connectivity check   |
| `GET`  | `/health/openai`         | Optional | OpenAI API connectivity check                  |
| `GET`  | `/health/system`         | Optional | System resources health check                  |
| `GET`  | `/health/config`         | Optional | Configuration validation check                 |
| `GET`  | `/health/readiness`      | Optional | Kubernetes readiness probe                     |
| `GET`  | `/health/liveness`       | Optional | Kubernetes liveness probe                      |
| `GET`  | `/health/version`        | Optional | Version and build information                  |

### Uptime Monitor

| Method | Endpoint                                   | Auth     | Description                                                   |
| ------ | ------------------------------------------ | -------- | ------------------------------------------------------------- |
| `GET`  | `/api/uptime/count`                        | Optional | Get total number of uptime checks (optionally per endpoint)   |
| `GET`  | `/api/uptime/history/:endpointId`          | Optional | Retrieve recent checks for specific endpoint                  |
| `GET`  | `/api/uptime/stream`                       | Optional | SSE stream for real-time uptime updates (fallback to polling) |
| `GET`  | `/api/uptime/daily-stats`                  | Optional | Get daily uptime statistics for the last N days               |
| `GET`  | `/api/uptime/heatmap-aggregated`           | Optional | Get aggregated heatmap buckets for uptime visualization       |
| `GET`  | `/api/uptime/global-trend`                 | Optional | Get hourly avg response time across all endpoints             |
| `GET`  | `/api/uptime/endpoint-latency`             | Optional | Get per-endpoint avg latency scalar                           |
| `GET`  | `/api/uptime/endpoint-buckets/:endpointId` | Optional | Get bucketed avg response time for one endpoint               |

### User Profile

| Method | Endpoint       | Auth     | Description                |
| ------ | -------------- | -------- | -------------------------- |
| `GET`  | `/api/profile` | Required | Authenticated user profile |

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

---

## Key Features

### Solutions Search

**Solutions Search** (`/solutions`)

- Semantic search across 6,000+ real circular economy case studies from the `ce_cases` knowledge base
- Two search modes: **Keyword** (BM25 full-text, < 50ms) and **Semantic** (AI-powered hybrid vector + keyword, < 500ms)
- URL-as-state architecture: every search query, mode, active filters, and page number are reflected in the URL — shareable, refreshable, back-navigable
- Three client-side filter groups (Strategy, Category, Source) with per-group "All" clear, automatic validation of filter params against actual results
- Resizable two-panel layout: filter sidebar + paginated result cards (5 per page)
- Background fetch indicators, stale data refresh button, and prefetch-on-hover for hybrid mode
- Result cards display: title, match score %, circular strategy chip, category chip, materials chip, full expandable problem / solution / summary / impact, company name, source link

### Global Activity

**Global Activity** (`/global-activity`)

- **Section 1 — Global Activity**: Live aggregates from `scoring_results_log` (all non-junk scoring calls, authenticated + anonymous)
  - Top-line stats: total scored, avg score, saved assessments (community), input quality rate with junk count
  - Derived metric averages: confidence, technical feasibility, economic viability, circularity potential, parameter consistency, strategy alignment
  - Score Distribution bar chart (4 bands: 0–25, 26–50, 51–75, 76–100)
  - CE Tier and Risk Distribution pie charts with single-value fallbacks
  - Geographic Focus bar chart (rotated labels, top 8 regions)
  - Primary Material and Company Scale pie charts (side-by-side)
  - Weekly Volume trend (12-week rolling window) — dual Y-axis line chart: assessment count (left axis, volume + 3-week rolling average lines) and avg score % (right axis); week-over-week % growth shown in chart title
  - Most Used R-Strategy callout card (name + total count)
  - R-Strategy Distribution bar chart (top 8, rotated labels)
  - Assessment Volume by Industry bar chart (top 10, rotated labels, excluding uncategorized)
- **Section 2 — Industry Intelligence**: Benchmark data from both log_stats and saved assessments
  - Top Performing Industry callout card (highest avg score from all scoring sessions)
  - Avg Score by Industry bar chart (from `scoring_results_log` — all sessions)
  - Industry table: volume, avg score, share of assessments (from `scoring_results_log`)
  - Saved Assessments by Tier and by Risk pie charts (from `get_assessment_statistics()` RPC — opted-in saved assessments only)

Global Activity includes manual refresh button with "updated N minutes ago" timestamp.

### Assessment Management

- Save, rename, delete, and share assessments (public links via opaque `public_id`)
- Side-by-side comparison of two assessments with 4-tab layout (Overview, Factor Analysis, Details, Database Evidence)
- Export individual or comparison results as PDF or CSV
- Session persistence for anonymous users (auto-save/restore via localStorage)
- 5 free anonymous assessments; unlimited for authenticated users

---

## Authentication

- **Anonymous Users** — 5 free assessments with IP-based usage tracking
- **Authenticated Users** — Unlimited access via Supabase Auth (JWT Bearer token)
- **Session Management** — Automatic persistence across page reloads via localStorage
- **Public Sharing** — Assessment results shareable via opaque `public_id` links
- **Service Role** — Used server-side for `scoring_results_log` writes and analytics queries; never exposed to client
- **Security** — Master API key comparison uses timing-safe comparison to prevent timing attacks

---

## Security & Access Control

### Auth

- RLS policies on all Supabase tables — users can only read/write their own data
- Service role key used only server-side for admin operations (writes to `scoring_results_log`, analytics aggregation)
- Anon key for frontend read-only access where public data is appropriate

### Rate Limiting

- Scoring endpoint: rate limited; anonymous users limited to 5 assessments per IP
- OpenAI API: auto-retry with exponential backoff

### Input Validation

- All request bodies validated with Zod schemas at API boundary
- Query parameters sanitised against allowed values before any DB query
- Junk detection on scoring inputs before LLM calls

### No PII in Logs

- Raw IP addresses never stored
- `ip_hash` and `identifier_hash` are SHA-256 hashes — irreversible
- `user_agent_snippet` is truncated to first 100 chars only

---

## Architecture Decisions

### PostgreSQL + pgvector over a dedicated vector DB

- Native vector type — no separate database to manage or sync
- Structured and unstructured data in one place enables join queries
- B-tree indexes on `industry`, `category`, `source` make SQL filtering fast
- HNSW index on `embedding` gives < 100ms similarity search
- Cost-effective on Supabase free/pro tier

### Dual-backend document store (Supabase + Aiven)

- `USE_SUPABASE_DOCUMENTS_TABLE=true` → Supabase (default, simpler)
- `false` → Aiven PostgreSQL (higher connection limits, geographic isolation)
- All access goes through `DocumentsRepository` — switching backends requires zero application code changes
- `getDatabaseClient()` returns the correct client based on the flag

### `scoring_results_log` for analytics over `assessments` table

- `assessments` only captures user-saved evaluations (a subset)
- `scoring_results_log` captures every API call including anonymous and unsaved — far wider coverage
- Global Activity `GET /api/analytics/global-stats` uses service-role access to `scoring_results_log`
- Identical column promotion strategy across both tables makes analytics queries portable

### Hybrid search (vector + BM25)

- Vector search alone misses exact matches (product names, specific metrics, acronyms)
- Keyword search alone misses semantic similarity (synonyms, paraphrases, domain concepts)
- RRF (Reciprocal Rank Fusion) combination is robust across diverse query types
- Structured metadata filtering (industry, R-strategy, scale) narrows candidates before re-ranking

### Production API Routing

- `INTERNAL_BACKEND_API_KEY` lives only in Vercel server-side environment — never in any `VITE_` variable
- `frontend/vercel.json` rewrites all `/api/*` requests to the backend host server-side
- `buildApiUrl()` returns a relative `/api/...` path in production and a direct `VITE_API_URL` URL in development
- Frontend code and browser DevTools never have access to the secret
- `frontend/api/proxy.js` remains in the repo as a legacy helper but is not the active production routing path

### Batch embedding with resume mode

- Batch size 20, 500ms delay between batches — reduces rate limit hits
- Exponential backoff on 429 errors — handles transient API overload
- `--resume` flag identifies already-stored documents by `chunk_id:field_name` — safe to re-run without duplicates
- Dimension validation before insert prevents malformed vectors from entering the index

---

## Project Structure

```txt
├── backend/
│   ├── .gitignore
│   ├── .renderignore
│   ├── DATASETS_REFERENCE.md                       # Complete inventory of all 32 datasets
│   ├── HEALTH_ENDPOINTS.md                         # Health check endpoints documentation
│   ├── PIPELINE_ADDING_DATASETS.md                 # How to add new dataset sources
│   ├── PIPELINE_RUNNING.md                         # How to run data processing pipeline
│   ├── README.md
│   ├── package.json
│   │
│   ├── config/                                     # Centralised config, env schema
│   │
│   ├── constants/                                  # API endpoints, uptime endpoints constants
│   │
│   ├── controllers/                                # Route handlers (analytics, scoring, assessments, search)
│   │   ├── analytics.controller.js                 # Analytics, global-stats, featured solutions, document stats
│   │   ├── assessments.controller.js               # Assessment CRUD, market analysis, comparison
│   │   ├── scoring.controller.js                   # Full scoring pipeline orchestration + log
│   │   └── search.controller.js                    # ce_cases search functionality
│   │
│   ├── database/
│   │   ├── README.md                               # Database layer documentation
│   │   ├── client.js                               # Dual-backend DB client factory (Supabase or Aiven)
│   │   ├── supabase.client.js                      # Supabase client factory (anon + service-role)
│   │   │
│   │   ├── diagnostics/                            # Read-only monitoring queries (sizes, performance, health, schema, vector)
│   │   ├── migrations/                             # SQL migration files 00–07 (run in Supabase SQL editor)
│   │   └── repositories/                           # Data access layer (documents.repository.js, ce_cases.repository.js)
│   │
│   ├── middleware/                                 # Auth guard (API key + JWT) + Zod validation
│   │
│   ├── pipeline/                                   # Data processing scripts
│   │   │
│   │   ├── ce_cases/                               # For solutions search functionality via database/migrations/05_ce_cases
│   │   │   ├── embed_ce_cases.js                   # Embed ce_cases knowledge base
│   │   │   └── ingest_ce_cases.js                  # Ingest ce_cases data
│   │   │
│   │   ├── populate_scoring_results/               # Generate test inputs, run scoring pipeline and save calculated results
│   │   │   ├── generate_test_inputs.js             # Generate test assessment inputs
│   │   │   └── run_and_save_test_assessments.js    # Run and save test assessments results
│   │   │
│   │   └── rag/                                    #
│   │       ├── run_datasets_scripts.js             # Stage 0: Orchestrate all dataset extraction scripts in sequence
│   │       ├── merge_datasets.js                   # Stage 1: merge all processed CSVs + manual_entries/ → combined_input.csv
│   │       ├── create_samples.js                   # (Optional) Generate test/sample data from combined_input.csv
│   │       ├── generate_chunks.js                  # Stage 2: semantic chunking → chunks.json
│   │       ├── generate_embeddings.js              # Stage 3: OpenAI embeddings → chunks.json → embedded_chunks.json
│   │       └── store_embeddings.js                 # Stage 4: store vectors in documents table (Supabase or Aiven)
│   │
│   ├── routes/                                     # Thin Express wrappers — HTTP definition only
│   │   ├── analytics.routes.js                     # GET /api/analytics/...
│   │   ├── assessments.routes.js                   # POST/GET/PATCH/DELETE /api/assessments/...
│   │   ├── health.routes.js                        # GET /health/* endpoints
│   │   ├── scoring.routes.js                       # POST /api/score
│   │   ├── search.routes.js                        # GET /api/search/ce-cases
│   │   └── uptime.routes.js                        # GET/POST /api/uptime/* endpoints
│   │
│   ├── server/                                     # Entry point (index.js), app factory (app.js), bootstrap
│   │
│   ├── services/                                   # Business logic: scoring.service, scoring.logic, embedding.service, health.service
│   │   ├── auth.service.js                         # Authentication service
│   │   ├── embedding.service.js                    # OpenAI API: embed text, batch handling, exponential backoff
│   │   ├── health.service.js                       # Health check endpoints and system monitoring
│   │   ├── scoring.logic.js                        # Pure deterministic Layer 2 algorithms (no LLM, no side effects)
│   │   ├── scoring.service.js                      # Full scoring pipeline orchestration
│   │   ├── uptime.broadcaster.js                   # SSE client registry for uptime
│   │   └── uptimePolling.service.js                # Uptime monitoring polling service
│   │
│   ├── tests/                                      # Backend test suite (api/, database/, services/)
│   │   ├── run-tests.js                            # Test runner script
│   │   └── *.test.js files                         # Unit and integration tests
│   │
│   └── utils/                                      # anonymousTracking.js, datasetsUtils.js, embedding config, chunk config etc
│
├── env/
│   └── .env.example                                # Environment variable template
│
├── frontend/
│   ├── api/
│   │   └── proxy.js                                # Legacy Vercel proxy helper; production uses vercel.json rewrite to backend
│   │
│   ├── package.json                                # Frontend dependencies and scripts
│   │
│   ├── public/                                     # Static assets (app-bg.svg, site-logo images)
│   │
│   ├── src/
│   │   ├── app/                                    # Root component, routes, global providers
│   │   │   ├── App.jsx                             # Root component with providers and routing
│   │   │   ├── AppProvider.jsx                     # Global context providers (Auth, Dialog, Drawer, Modal, QueryClient)
│   │   │   └── AppRoutes.jsx                       # All route definitions
│   │   │
│   │   ├── components/                             # Shared UI: charts, common, dialogs, drawers, export, layout, error-boundaries etc
│   │   ├── config/                                 # Frontend configuration with route definitions and query parameters
│   │   ├── constants/                              # Evaluation data, industries, drawer + dialog constants etc
│   │   ├── contexts/                               # React Context providers (Auth, Dialog, Drawer) etc
│   │   ├── features/                               # Feature modules: assessments, export, search, session etc
│   │   ├── hooks/                                  # Custom React hooks (useAuth, useDebounce, etc.)
│   │   ├── index.css                               # Global styles + Tailwind directives
│   │   ├── lib/                                    # API client, formatting, metadata, scoring, storage, supabase, validation etc
│   │   ├── main.jsx                                # React entry point
│   │   ├── pages/                                  # Page components (LandingPage, ResultsPage, UptimeMonitorPage, etc.) (90+ items)
│   │   ├── setupTests.js                           # Vitest global setup
│   │   ├── test/                                   # Test files
│   │   ├── types/                                  # TypeScript type definitions
│   │   └── utils/                                  # Utility functions
│   │
│   ├── tsconfig.json                               # TypeScript configuration
│   ├── tsconfig.node.json                          # Node.js TypeScript configuration
│   ├── vercel.json                                 # Vercel deployment configuration
│   ├── vite.config.js                              # Vite configuration with aliases and chunking
│   └── vitest.config.js                            # Vitest test configuration
│
└── package.json                                    # Root workspace scripts (dev:backend, dev:frontend, etc.)
```

---

## Development Guide

### Backend

```bash
cd backend

npm run dev     # Development server with watch mode (http://localhost:8000)
npm run start   # Production server
npm test        # Full test suite
npm run lint    # ESLint
```

Test mode is automatically enabled when `NODE_ENV=test`. The server will:

- Skip `.env` file loading (preserves test env vars)
- Use fallback test defaults for missing credentials
- Not auto-listen (allowing test frameworks to control startup)
- Provide stub Supabase clients for offline testing

### Frontend

```bash
cd frontend

npm run dev       # Development server with HMR (http://localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm test          # Run Vitest test suite
npm run lint      # ESLint
```

### Code Quality

#### Linting & Formatting

- **Backend**: ESLint with project config and canonical import aliases
- **Frontend**: ESLint with React recommended rules and Tailwind plugin
- **Formatting**: Prettier with Tailwind plugin (configured, runs on save via VS Code settings)
- **Git Hooks**: Husky with lint-staged for pre-commit quality checks
- **Commits**: Conventional commit format (`feat:`, `fix:`, `docs:`, `test:`)

#### Import Aliases

- **Backend**: Uses `#`-prefixed canonical imports (e.g., `#config/backend.config.js`)
- **Frontend**: Uses `@/`-prefixed path aliases (e.g., `@/components/common/Button`)

### Workspace Scripts

```bash
npm run dev          # Start both frontend and backend
npm run lint         # ESLint across workspace
npm run lint:errors   # ESLint errors only
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm run knip         # Find unused files and dependencies
npm run knip:fix     # Auto-fix knip issues
npm run fix-all      # Lint fix + format + knip fix
npm run test         # Run all test suites
npm run build        # Build all packages
npm run clean        # Clean node_modules across workspace
npm run rei          # Clean + reinstall all dependencies
```

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Write tests for new functionality
3. Implement following existing patterns and architecture
4. Update relevant README sections
5. Run tests: `npm test` (both backend and frontend)
6. Submit PR with description of changes

### Architecture Principles

- **Separation of concerns** — clear boundaries between routes, controllers, services, utils
- **No business logic in routes** — routes are thin HTTP wrappers only
- **No HTTP context in services** — services are pure business logic with no req/res
- **Repository pattern** — all documents table access via `DocumentsRepository`, never direct client
- **Canonical imports** — backend uses `#`-prefixed aliases; frontend uses `@/` aliases

---

## Extending the System

### Adding a New API Endpoint

1. Define route in `backend/routes/` (HTTP method + path only — no logic)
2. Add handler in `backend/controllers/` (validate → delegate to service → format response)
3. Add business logic in `backend/services/` if needed
4. Register route in `backend/server/app.js`
5. Add test in `backend/tests/api/`

### Adding a New Frontend Page

1. Create `frontend/src/pages/MyPage/MyPage.jsx`
2. Add route in `frontend/src/app/AppRoutes.jsx`
3. Extract subcomponents into `frontend/src/pages/MyPage/components/`
4. Create `frontend/src/pages/MyPage/components/index.js` barrel

### Adding a New Database Migration

1. Create SQL file in `backend/database/migrations/` with next number prefix (e.g. `07_*.sql`)
2. Apply in Supabase SQL editor
3. Document any new RPC functions in `backend/README.md`

---

## Testing

### Backend Tests

```bash
cd backend

node --test                                                     # All tests
node --test tests/services/scoring-logic-enrichment.test.js    # Layer 2 enrichment (33 tests)
node --test tests/api/assessments-routes.test.js               # Assessment API integration
node --test tests/api/scoring.rpc.test.js                      # Scoring pipeline
node --test tests/api/health.test.js                           # Health endpoints
node --test tests/api/analytics.enhanced.test.js               # Analytics endpoints
node --test tests/api/api-auth.test.js                         # API authentication
node --test tests/api/anonymous.test.js                        # Anonymous tracking
node --test tests/api/apiKeyGuard.test.js                      # API key guard
node --test tests/database/documents.repository.test.js             # Repository layer
node --test tests/utils/score-validation.test.js                 # Input validation
```

### Frontend Tests

```bash
cd frontend

npx vitest run                                                  # All tests
npx vitest run src/features/assessments/utils.test.js          # reconstructScoringResult (13 tests)
npx vitest run --coverage                                       # Coverage report
npx vitest --watch                                             # Watch mode
```

**Backend Test Suite:**

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

---

## Deployment

### Frontend — Vercel

The frontend deploys as a static SPA on Vercel. Production API routing is handled by `frontend/vercel.json`, which rewrites `/api/*` requests directly to the backend service.

```txt
Browser → /api/<path> → Vercel rewrite → backend service
```

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - All `VITE_*` variables (client-visible)
   - `INTERNAL_BACKEND_API_KEY` (server-only, never `VITE_` prefixed)
3. Verify `frontend/vercel.json` rewrites `/api/*` to the backend host
4. Deploy — automatic on push to main, or manual trigger in dashboard

### Backend — Render / any Node host

```bash
cd backend
npm run start   # Requires NODE_ENV=production and all env vars set
```

Ensure CORS `ALLOWED_ORIGINS` includes your Vercel domain (`*.vercel.app`) and any custom domain.

### Deployment Checklist

- [ ] All `VITE_*` variables set in Vercel
- [ ] `INTERNAL_BACKEND_API_KEY` set in Vercel (server-only, not in git)
- [ ] Backend `ALLOWED_ORIGINS` includes Vercel domains and custom domain
- [ ] Database migrations 00–07 applied to production Supabase
- [ ] `npm run build` succeeds without errors
- [ ] `npm test` passes for both backend and frontend
- [ ] Preview environment tested before promoting to production
- [ ] DNS configured for custom domain (if applicable)

---

## Uptime Monitoring

### Uptime Monitoring System

The application includes a real-time uptime monitoring dashboard that tracks all backend health endpoints:

- **Backend polling** — runs when `pollingEnabled` is enabled; pings all health endpoints every 2 min (configurable via `env.UPTIME_CHECKS_POLL_INTERVAL_MS`), batch-inserts results into `uptime_checks`, then broadcasts a `poll-complete` SSE event to all connected clients
- **30-day retention** — configurable via `env.UPTIME_CHECKS_RETENTION_DAYS`; cleanup runs daily in production
- **SSE streaming** — `/api/uptime/stream` delivers live updates instantly; frontend falls back to HTTP polling automatically if the connection drops
- **Clock-aligned buckets** — toggleable UI feature that snaps all chart bucket boundaries to clean clock marks (whole hours, whole 15-min slots) instead of rolling from the current moment
- **DB aggregation** — all chart data (heatmaps, trend lines, latency bars) is computed server-side via SQL RPCs; no client-side number crunching on large datasets

See [`frontend/src/pages/UptimeMonitorPage/README.md`](./frontend/src/pages/UptimeMonitorPage/README.md) for full architecture, API reference, SQL functions, constants, and SSE event documentation.

### Monitoring Services

- [UptimeRobot Monitor](https://dashboard.uptimerobot.com/monitors/802964160)
- [Vercel Ping Function](frontend/api/ping.js) & [vercel.json](frontend/vercel.json)
- [Github Workflows](.github/workflows/keep-alive.yml)
  — Repo → Settings → Secrets and variables → Actions → Variables → New repository variable
  — Name: `API_BASE_URL`
  — Value: `[backend-api-url]`

---

## Debugging

### Common Issues

**Pipeline hangs on embedding:**

```bash
echo $OPENAI_API_KEY        # verify key is set
ping api.openai.com         # test network connectivity
npm run embed -- --dry-run  # test locally without API calls
```

**Supabase "401 Unauthorized" on storage:**

- Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check key hasn't expired in Supabase project settings

**Wrong chunk count:**

- Check `MIN_PROBLEM/SOLUTION_LENGTH` thresholds in `utils/chunk.js`
- Review console for "Skipping record" warnings

**API calls failing with 401 from frontend:**

- Verify `INTERNAL_BACKEND_API_KEY` is set in Vercel environment
- Confirm backend `apiKeyGuard` middleware is enabled
- If using the legacy proxy helper, check `frontend/api/proxy.js` and backend `apiKeyGuard` configuration

**CORS errors in browser console:**

- Backend `ALLOWED_ORIGINS` must include `*.vercel.app` and your custom domain

### Debug Logging

```bash
DEBUG=* npm run embed            # verbose embedding logs
DEBUG=* npm run store            # verbose storage logs
DEBUG=backend:* npm run dev      # verbose backend server logs
```

---

## License

**Authors:** Areeb Ahmed Zahoori & Mahit Singh  
**LICENSE:** MIT  
**Last Updated:** 29 June 2026
