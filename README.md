# Circular Economy Assessor

AI-powered platform for evaluating circular economy business initiatives against a knowledge base of 40,000+ real-world case studies. Uses semantic vector search, evidence-based scoring, and multi-layer LLM enrichment to produce comprehensive, actionable assessments.

**Author:** Areeb Ahmed Zahoori <areebrawl@gmail.com>
**License:** UNLICENSED
**Repository:** https://github.com/areetampo/circular-economy

## Overview

The platform guides users through a structured assessment and returns a complete evaluation:

1. **Describe** your business problem and proposed solution
2. **Score** across 8 evaluation parameters (manual or guided mode)
3. **Enrich** with 3 deterministic and LLM-powered analysis layers
4. **Compare** against similar real-world projects from the knowledge base
5. **Export** as PDF or CSV with full SDG alignment and improvement roadmap
6. **Track** assessment history and benchmark against global data on the Dashboard

## Core Architecture

```txt
┌─────────────────────────────────────────────────────────────────────┐
│                    Full-Stack Architecture                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Frontend Layer (React 19 / Vite 7)                                 │
│  ├─ Assessment Flow — guided questionnaires + business context      │
│  ├─ Results Visualisation — charts, tables, export, drawers         │
│  ├─ Global Dashboard — live analytics from scoring_results_log      │
│  ├─ State Management — React Query + custom hooks                   │
│  ├─ UI Components — HeroUI v3 + Tailwind CSS v4 + Recharts          │
│  └─ Session Persistence — localStorage + anonymous tracking         │
│                                                                     │
│  API Layer (Express.js — ESM)                                       │
│  ├─ /api/score — full scoring + enrichment pipeline                 │
│  ├─ /api/analytics — global stats, featured solutions, doc stats    │
│  ├─ /api/assessments — assessment CRUD + comparison                 │
│  └─ /api/search — semantic search over knowledge base               │
│                                                                     │
│  Business Logic Layer (Services)                                    │
│  ├─ scoring.service.js — hybrid search + LLM audit orchestration    │
│  ├─ scoring.logic.js — pure deterministic enrichment (Layer 2)      │
│  ├─ embedding.service.js — OpenAI API integration + batching        │
│  └─ chunking.service.js — semantic text splitting from CSV          │
│                                                                     │
│  Data Processing Pipeline                                           │
│  ├─ Extraction Layer (34+ dataset scripts)                          │
│  │  ├─ scrape_*.js (Puppeteer web automation)                       │
│  │  └─ extract_*.js (PDF/CSV/JSON/API parsing)                      │
│  ├─ Merge (merge_datasets.js)                                       │
│  ├─ Chunking (generate_chunks.js)                                   │
│  ├─ Embedding (generate_embeddings.js)                              │
│  └─ Storage (store_embeddings.js)                                   │
│                                                                     │
│  Database Layer (Supabase PostgreSQL + pgvector / Aiven)            │
│  ├─ documents — vector-searchable knowledge base (40k+ chunks)      │
│  ├─ assessments — user-saved results with all enrichment columns    │
│  ├─ scoring_results_log — immutable log of every scoring call       │
│  ├─ user_profiles — user preferences                                │
│  ├─ anonymous_usage — rate limiting + session tracking              │
│  └─ RPC functions — hybrid search, market data, assessment stats    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Category            | Technology                                     | Purpose                                            |
| ------------------- | ---------------------------------------------- | -------------------------------------------------- |
| **Runtime**         | Node.js 18+                                    | Server runtime                                     |
| **Backend**         | Express.js (ESM)                               | REST API server                                    |
| **Frontend**        | React 19 + Vite 7                              | UI framework and build tool                        |
| **UI Library**      | HeroUI v3                                      | Component library                                  |
| **Styling**         | Tailwind CSS v4                                | Utility-first CSS                                  |
| **Charts**          | Recharts                                       | Data visualisation                                 |
| **Database**        | Supabase PostgreSQL + pgvector                 | Primary vector store + relational data             |
| **Alt DB**          | Aiven PostgreSQL                               | Alternative vector store (switchable via env flag) |
| **AI — Embeddings** | OpenAI text-embedding-3-small                  | Semantic similarity search (1536 dims)             |
| **AI — Reasoning**  | GPT-4o-mini                                    | LLM audit, enrichment, metadata extraction         |
| **State**           | TanStack React Query                           | Server state, caching, background refetch          |
| **Auth**            | Supabase Auth                                  | User authentication + Row Level Security           |
| **Deployment**      | Vercel (frontend) + Render (backend)           | Hosting platforms                                  |
| **Testing**         | Vitest (frontend) · Node test runner (backend) | Test frameworks                                    |
| **Package Manager** | npm (workspaces)                               | Monorepo dependency management                     |
| **Code Quality**    | ESLint + Prettier + Husky                      | Linting, formatting, and git hooks                 |

## Key Features

### Assessment Engine — Three Enrichment Layers

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

### Knowledge Base

- **40,000+ document chunks** from 34+ curated datasets
- Sources: Ellen MacArthur Foundation, WBCSD, Eurostat, academic papers, government reports, corporate sustainability reports
- Hybrid search: vector cosine similarity (pgvector HNSW) + BM25 keyword matching
- Per-field chunking: problem, solution, impact, materials, circular_strategy
- Structured metadata: industry, R-strategy, scale, geographic focus, primary material

### Global Intelligence Dashboard

Live analytics from the `scoring_results_log` table (all scoring calls — authenticated and anonymous):

- Top-line metrics: total scored, avg score, input quality rate
- Derived metric averages: confidence, technical feasibility, economic viability, circularity, consistency, R-alignment
- Distributions: score bands, CE tier, risk level, R-strategy, primary material, geographic focus, company scale
- Weekly volume trend (12-week rolling window)
- Industry benchmark table from `get_market_data()` RPC (opted-in contributions only)
- Knowledge base statistics and featured solutions search with category chip filtering

### Assessment Management

- Save, rename, delete, and share assessments (public links via opaque `public_id`)
- Side-by-side comparison of two assessments with 4-tab layout (Overview, Factor Analysis, Details, Database Evidence)
- Export individual or comparison results as PDF or CSV
- Session persistence for anonymous users (auto-save/restore via localStorage)
- 5 free anonymous assessments; unlimited for authenticated users

## Project Structure

```txt
├── backend/
│   ├── config/                      # Centralised config, env schema, embedding constants, chunk config
│   ├── controllers/                 # Route handlers (analytics, scoring, assessments, search)
│   ├── database/
│   │   ├── migrations/              # SQL migration files 01–06 (run in Supabase SQL editor)
│   │   ├── repositories/            # Data access layer (documents.repository.js)
│   │   ├── client.js                # Dual-backend DB client factory (Supabase or Aiven)
│   │   └── supabase.client.js       # Supabase client factory (anon + service-role)
│   ├── middleware/                  # Auth guard (API key + JWT) + Zod validation
│   ├── pipeline/                    # Data processing stages + datasetsUtils.js
│   ├── routes/                      # Express route definitions (thin HTTP wrappers)
│   ├── server/                      # Entry point (index.js), app factory (app.js), bootstrap
│   ├── services/                    # Business logic: scoring.service, scoring.logic, embedding, chunking
│   ├── tests/                       # Backend test suite (api/, database/, services/)
│   └── utils/                       # anonymousTracking.js
│
├── frontend/
│   ├── api/proxy.js                 # Vercel serverless proxy — injects x-api-key server-side
│   ├── src/
│   │   ├── app/                     # Root component, routes, global providers
│   │   ├── components/              # Shared UI: auth, charts, common, dialogs, drawers, export, layout, error-boundaries
│   │   ├── contexts/                # Auth, Dialog, Drawer, Modal React contexts
│   │   ├── features/
│   │   │   ├── assessments/         # API client, all hooks (useAssessment, useGlobalStats, etc.), validation, utils
│   │   │   ├── export/              # exportCSV.js, exportPDF.js
│   │   │   └── session/             # AppSessionManager, useSession
│   │   ├── hooks/                   # useAuth, useDialog, useDrawer, useDrawerDirection, useExportState, useToast, useDebounce
│   │   ├── lib/                     # apiClient, formatting, metadata, scoring, storage, supabase, validation
│   │   ├── pages/
│   │   │   ├── AssessmentComparisonPage/components/   # Tab components + ComparisonSkeleton + ChangeIndicator
│   │   │   ├── DashboardPage/components/              # StatCard, ChartPanel, SolutionCard, etc.
│   │   │   ├── LandingPage/components/                # BusinessContextContainer, EvaluationParametersContainer, etc.
│   │   │   ├── MyAssessmentsPage/components/          # AssessmentListItem, FilterBar, IndustryFilterChip
│   │   │   └── ResultsPage/components/                # ScoreOverview, WeightedScoreCard, AuditSummary, DatabaseEvidence, etc.
│   │   ├── constants/               # evaluationData, industries, industryThemes, drawer constants
│   │   ├── utils/                   # cn, content, session, async, ui, logger
│   │   ├── test/                    # Test utilities and setup
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── index.css                # Global styles + Tailwind directives
│   │   ├── main.jsx                 # React entry point
│   │   └── setupTests.js            # Vitest global setup
│   ├── vite.config.js               # Vite configuration with aliases and chunking
│   └── package.json                 # Frontend dependencies and scripts
│
├── env/
│   └── .env.example                 # Environment variable template for both backend and frontend
│
└── package.json                     # Root workspace scripts (dev:backend, dev:frontend, etc.)
```

## Quick Start

### Prerequisites

- Node.js 18+ (backend), Node.js 24+ (frontend)
- npm 8+
- Supabase project with pgvector extension enabled
- OpenAI API key

### Installation

```bash
# 1. Clone
git clone https://github.com/areetampo/circular-economy.git
cd circular-economy

# 2. Install dependencies (workspace setup)
npm install

# 3. Environment setup
cp env/.env.example env/.env.backend
cp env/.env.example env/.env.frontend
# Edit both files — see Environment Variables section below

# 4. Database migrations
# Open Supabase SQL editor and run in order:
#   backend/database/migrations/01_vector_infrastructure.sql
#   backend/database/migrations/02_user_assessments.sql
#   backend/database/migrations/03_user_profiles.sql
#   backend/database/migrations/04_anonymous_usage.sql
#   backend/database/migrations/05_results_logs.sql
# Run 06_after_ingestion.sql once after bulk data load

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
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
INTERNAL_BACKEND_API_KEY=your-secret-key
PORT=8000
NODE_ENV=development

# Database backend switch
USE_SUPABASE_DOCUMENTS_TABLE=true   # false = use Aiven PostgreSQL

# Aiven (only if USE_SUPABASE_DOCUMENTS_TABLE=false)
AIVEN_HOST=
AIVEN_PORT=22335
AIVEN_DATABASE=defaultdb
AIVEN_USER=avnadmin
AIVEN_PASSWORD=
AIVEN_SSL_MODE=require
AIVEN_CONNECTION_LIMIT=20
```

**Frontend** (`env/.env.frontend`):

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FRONTEND_URL=http://localhost:5173
VITE_LOG_LEVEL=debug          # optional
VITE_ENABLE_ANALYTICS=true    # optional
```

**Important:** `INTERNAL_BACKEND_API_KEY` is **never** a `VITE_` prefixed variable. It lives only in Vercel server-side environment and is injected by `api/proxy.js`.

## API Reference

### Scoring

| Method | Endpoint     | Auth     | Description                                                                       |
| ------ | ------------ | -------- | --------------------------------------------------------------------------------- |
| `POST` | `/api/score` | Optional | Full scoring pipeline: validation → vector search → Layer 2 → LLM audit → Layer 3 |

### Analytics

| Method | Endpoint                            | Auth     | Description                                     |
| ------ | ----------------------------------- | -------- | ----------------------------------------------- |
| `GET`  | `/api/analytics`                    | Optional | Summary analytics                               |
| `GET`  | `/api/analytics/enhanced`           | Optional | Enhanced analytics with time series             |
| `GET`  | `/api/analytics/featured-solutions` | Optional | Featured solutions from knowledge base          |
| `POST` | `/api/analytics/embeddings/reindex` | Optional | Reindex embeddings (maintenance)                |
| `GET`  | `/api/analytics/documents/summary`  | Optional | Documents data summary                          |
| `GET`  | `/api/analytics/documents/stats`    | Optional | Knowledge base statistics                       |
| `GET`  | `/api/analytics/global-stats`       | Optional | Global dashboard stats from scoring_results_log |

### Assessments

| Method   | Endpoint                              | Auth     | Description                                      |
| -------- | ------------------------------------- | -------- | ------------------------------------------------ |
| `POST`   | `/api/assessments`                    | Required | Save completed assessment                        |
| `GET`    | `/api/assessments`                    | Required | List user's assessments                          |
| `GET`    | `/api/assessments/stats`              | Required | User aggregate statistics                        |
| `GET`    | `/api/assessments/public/:publicId`   | None     | Retrieve public/shared assessment                |
| `GET`    | `/api/assessments/validate/:publicId` | None     | Validate shared assessment id                    |
| `GET`    | `/api/assessments/:id`                | Required | Fetch specific assessment                        |
| `PATCH`  | `/api/assessments/:id`                | Required | Update (rename, set is_public)                   |
| `DELETE` | `/api/assessments/:id`                | Required | Delete assessment                                |
| `GET`    | `/api/assessments/compare`            | Required | Compare two assessments (query params: id1, id2) |

### Search & Utility

| Method | Endpoint            | Auth     | Description                                     |
| ------ | ------------------- | -------- | ----------------------------------------------- |
| `POST` | `/api/search`       | Optional | Hybrid semantic + keyword search over documents |
| `GET`  | `/health`           | None     | Health check                                    |
| `GET`  | `/docs/methodology` | None     | Methodology and scoring framework metadata      |
| `GET`  | `/api/profile`      | Required | Authenticated user profile                      |

## Authentication

- **Anonymous Users** — 5 free assessments with IP-based usage tracking
- **Authenticated Users** — Unlimited access via Supabase Auth (JWT Bearer token)
- **Session Management** — Automatic persistence across page reloads via localStorage
- **Public Sharing** — Assessment results shareable via opaque `public_id` links
- **Service Role** — Used server-side for `scoring_results_log` writes and analytics queries; never exposed to client

## Data Pipeline

### Complete Data Lifecycle

```txt
1️⃣  RAW SOURCE DATA (datasets/raw/*)
    ↓ extract_*.js (CSV/PDF/JSON/API) or scrape_*.js (Puppeteer)

2️⃣  PROCESSED DATASETS (datasets/processed/*.csv)
    Standard columns: id, problem, solution, materials, circular_strategy,
    category, impact, source_url, metadata_json — 34 total datasets

3️⃣  MANUAL ENTRIES (datasets/manual_entries/manual_entries.csv)
    User-contributed problem/solution pairs (same column format)

4️⃣  MERGED INPUT → npm run merge
    Concatenates all CSVs + manual_entries, dedupes, validates
    Output: datasets/out/combined_input.csv (50,000+ rows)

5️⃣  SEMANTIC CHUNKS → npm run chunk
    Per-field chunking: problem_solution, problem, solution, impact, materials
    Metadata extraction: industry, category, r_strategy, scale, primary_material, geographic_focus
    Output: datasets/out/chunks.json (14,000–19,000 chunks)

6️⃣  VECTOR EMBEDDINGS → npm run embed
    OpenAI text-embedding-3-small, 1536 dims
    Batch: 20 chunks/call, 500ms delay, exponential backoff on rate limits
    Output: datasets/out/embedded_chunks.json

7️⃣  DATABASE STORAGE → npm run store
    Inserts into documents table via configured backend (Supabase or Aiven)
    Creates/maintains HNSW index for fast similarity search
    Resume mode (--resume): skips already-stored documents by chunk_id

8️⃣  QUERY & SCORING (Live API)
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

### Search Architecture

- **Vector Search** — cosine similarity on OpenAI embeddings (HNSW index, < 100ms)
- **Keyword Search** — BM25 algorithm for exact term matches (< 50ms)
- **Hybrid Search** — RRF (Reciprocal Rank Fusion) combining both scores
- **Metadata Filtering** — industry, scale, R-strategy filtering via B-tree indexes
- **Re-ranking** — AI-powered relevance scoring on top results

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

### Code Quality & Development

### Linting & Formatting

- **Backend**: ESLint with project config and canonical import aliases
- **Frontend**: ESLint with React recommended rules and Tailwind plugin
- **Formatting**: Prettier with Tailwind plugin (configured, runs on save via VS Code settings)
- **Git Hooks**: Husky with lint-staged for pre-commit quality checks
- **Commits**: Conventional commit format (`feat:`, `fix:`, `docs:`, `test:`)

### Import Aliases

- **Backend**: Uses `#`-prefixed canonical imports (e.g., `#config/backend.config.js`)
- **Frontend**: Uses `@/`-prefixed path aliases (e.g., `@/components/common/Button`)

### Workspace Scripts

```bash
npm run dev          # Start both frontend and backend
npm run lint         # ESLint across workspace
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm run fix-all      # Lint fix + format
npm run test         # Run all test suites
npm run build        # Build all packages
npm run clean        # Clean node_modules across workspace
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

## Testing

### Backend Tests

```bash
cd backend

node --test                                                     # All tests
node --test tests/services/scoring-logic-enrichment.test.js    # Layer 2 enrichment (33 tests)
node --test tests/api/assessments-routes.test.js               # Assessment API integration
node --test tests/api/scoring.rpc.test.js                      # Scoring pipeline
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
| `analytics.featured.test.js`       | —     | Featured solutions                                                                                                 |
| `api-auth.test.js`                 | —     | API key guard                                                                                                      |
| `anonymous.test.js`                | —     | Anonymous tracking middleware                                                                                      |
| `apiKeyGuard.test.js`              | —     | Auth middleware unit tests                                                                                         |
| `documents.repository.test.js`     | —     | Repository layer                                                                                                   |
| `score-validation.test.js`         | —     | Input validation                                                                                                   |

## Deployment

### Frontend — Vercel

The frontend deploys as a static SPA with a serverless proxy function:

```txt
Browser → /api/proxy?path=/api/score → Vercel Function → injects x-api-key → Backend
```

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   - All `VITE_*` variables (client-visible)
   - `INTERNAL_BACKEND_API_KEY` (server-only, never `VITE_` prefixed)
3. Verify `vercel.json`: `/api/*` → serverless functions; all other routes → `index.html`
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
- [ ] Database migrations 01–05 applied to production Supabase
- [ ] `npm run build` succeeds without errors
- [ ] `npm test` passes for both backend and frontend
- [ ] Preview environment tested before promoting to production
- [ ] DNS configured for custom domain (if applicable)

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
- Dashboard `GET /api/analytics/global-stats` uses service-role access to `scoring_results_log`
- Identical column promotion strategy across both tables makes analytics queries portable

### Hybrid search (vector + BM25)

- Vector search alone misses exact matches (product names, specific metrics, acronyms)
- Keyword search alone misses semantic similarity (synonyms, paraphrases, domain concepts)
- RRF (Reciprocal Rank Fusion) combination is robust across diverse query types
- Structured metadata filtering (industry, R-strategy, scale) narrows candidates before re-ranking

### Vercel proxy for API key security

- `INTERNAL_BACKEND_API_KEY` lives only in Vercel server-side environment
- `api/proxy.js` serverless function reads it and injects `x-api-key` on every request
- Frontend code and browser DevTools can never expose the secret
- All production API calls route through the proxy transparently via `buildApiUrl()`

### Batch embedding with resume mode

- Batch size 20, 500ms delay between batches — reduces rate limit hits
- Exponential backoff on 429 errors — handles transient API overload
- `--resume` flag identifies already-stored documents by `chunk_id:field_name` — safe to re-run without duplicates
- Dimension validation before insert prevents malformed vectors from entering the index

## Extending the System

### Adding a New Dataset

1. Create extraction script in `backend/datasets/scripts/`
2. Output standardised CSV to `backend/datasets/processed/`
3. Register in `backend/pipeline/datasetsUtils.js` DATASETS array
4. Run: `npm run populate`
5. Update `backend/DATASETS_REFERENCE.md`

See [PIPELINE_ADDING_DATASETS.md](./backend/PIPELINE_ADDING_DATASETS.md) for full guide including JSDoc requirements and backup/recovery implementation.

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

## Security & Access Control

### Authentication

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

- Check `MIN_PROBLEM/SOLUTION_LENGTH` thresholds in `config/chunk.js`
- Review console for "Skipping record" warnings

**API calls failing with 401 from frontend:**

- Verify `INTERNAL_BACKEND_API_KEY` is set in Vercel environment
- Check `api/proxy.js` is forwarding the `x-api-key` header
- Confirm backend `apiKeyGuard` middleware is enabled

**CORS errors in browser console:**

- Backend `ALLOWED_ORIGINS` must include `*.vercel.app` and your custom domain
- Check `PUBLIC_ROUTES` list if a route should be accessible without the header

### Debug Logging

```bash
DEBUG=* npm run embed            # verbose embedding logs
DEBUG=* npm run store            # verbose storage logs
DEBUG=backend:* npm run dev      # verbose backend server logs
```

## Datasets Included

**34 processed datasets** from diverse authoritative sources:

- GreenTechGuardians: 2,286 case studies
- Ellen MacArthur Foundation: 3,825+ case studies
- Eurostat: 501+ environmental records
- Open Food / Beauty / Products Facts: 1,000+ product records
- Academic & government datasets: 40,000+ records

See [backend/DATASETS_REFERENCE.md](./backend/DATASETS_REFERENCE.md) for complete inventory.
For running the pipeline: [backend/PIPELINE_RUNNING.md](./backend/PIPELINE_RUNNING.md)
For adding new datasets: [backend/PIPELINE_ADDING_DATASETS.md](./backend/PIPELINE_ADDING_DATASETS.md)
For dataset inventory: [backend/DATASETS_REFERENCE.md](./backend/DATASETS_REFERENCE.md)

## License

UNLICENSED — proprietary software.
**Author:** Areeb Ahmed Zahoori
**Last Updated:** 23 March 2026

---
