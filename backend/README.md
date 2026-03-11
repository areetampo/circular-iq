# Backend Architecture: Circular Economy Document Processing & RAG System

Complete technical documentation of the circular economy business auditor backend stack.

## System Overview

The backend is a Node.js/Express server that powers a document processing pipeline and RAG (Retrieval-Augmented Generation) system for circular economy business evaluation and problem-solution matching. It:

1. **Ingests** 34+ datasets from various sources (scraped/extracted/API)
2. **Processes** CSV data into semantic chunks with metadata extraction
3. **Generates** vector embeddings using OpenAI's text-embedding-3-small model
4. **Stores** embeddings in Supabase PostgreSQL with pgvector extension
5. **Serves** REST APIs for hybrid search, scoring, and assessment management

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Layer (Express.js)                                   │
│  ├─ /analytics - Data analytics & filtering              │
│  ├─ /scoring - Business problem scoring & hybrid search  │
│  └─ /assessments - User assessment management            │
│                                                             │
│  Business Logic Layer (Services)                          │
│  ├─ scoring.service.js - RPC calls + hybrid search       │
│  ├─ embedding.service.js - OpenAI API integration        │
│  ├─ chunking.service.js - Semantic text splitting        │
│  ├─ assessment.service.js - CRUD operations              │
│  └─ scoring.logic.js - Pure scoring algorithms           │
│                                                             │
│  Data Processing Pipeline                                 │
│  ├─ Extraction Layer (34 dataset extraction scripts)      │
│  │  ├─ scrape_*.js (Puppeteer web automation)            │
│  │  └─ extract_*.js (PDF/CSV/JSON/API parsing)           │
│  ├─ Ingestion (merge_datasets.js)                        │
│  ├─ Chunking (generate_chunks.js)                        │
│  ├─ Embedding (generate_embeddings.js)                   │
│  └─ Storage (store_embeddings.js)                        │
│                                                             │
│  Orchestration                                            │
│  └─ run_datasets_scripts.js - Automate dataset processing │
│                                                             │
│  Database Layer (Supabase PostgreSQL + pgvector)         │
│  ├─ documents - Primary vector-searchable document store (Supabase or Aiven)
│  ├─ user_assessments - Evaluation result persistence     │
│  ├─ user_profiles - Anonymous usage tracking             │
│  └─ RPC Functions - Hybrid search logic (embeddings + BM25) │
│                                                             │
│  Utilities & Configuration                               │
│  ├─ datasetsUtils.js - Dataset registry & path helpers   │
│  ├─ backend.config.js - Centralized config               │
│  └─ anonymousTracking.js - Usage analytics               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/
├── server/                       # Express server bootstrap & lifecycle
│   ├── index.js                  # startServer() / stopServer() functions
│   ├── app.js                    # Express app setup with routes/middleware
│   └── bootstrap.js              # Server initialization logic
│
├── config/                       # Centralized configuration
│   ├── backend.config.js         # Main config object (includes test defaults)
│   ├── env.schema.js             # Zod schema for environment validation
│   ├── embedding.js              # OpenAI embedding model constants
│   └── loadEnv.js                # Environment variable loader (.env.backend)
│
├── routes/                       # API route definitions (thin Express wrappers)
│   ├── analytics.routes.js       # GET /analytics/... endpoints
│   ├── assessments.routes.js     # POST/GET /assessments/... endpoints
│   └── scoring.routes.js         # POST /scoring/... endpoints
│
├── controllers/                  # Request handlers & business logic delegation
│   ├── analytics.controller.js   # Analytics query logic
│   ├── assessments.controller.js # Assessment CRUD logic
│   └── scoring.controller.js     # Scoring validation & response formatting
│
├── services/                     # Core business logic & integrations
│   ├── scoring.service.js        # Hybrid search RPC + scoring orchestration
│   ├── scoring.logic.js          # Pure scoring algorithms (no side effects)
│   ├── embedding.service.js      # OpenAI API integration & batching
│   ├── chunking.service.js       # Semantic text splitting from CSV
│   └── assessment.service.js     # Assessment data CRUD
│
├── middleware/                   # Express middleware
│   ├── auth.middleware.js        # API key validation & JWT verification
│   └── validation.middleware.js  # Input schema validation (Zod)
│
├── database/                     # Database layer
│   ├── supabase.client.js        # Supabase client initialization
│   ├── migrations/               # SQL migration tracking files (legacy archives migration removed)
│   └── sql/                      # Database schema (DDL)
│       ├── 01_vector_infrastructure.sql  # pgvector setup
│       ├── 02_user_assessments.sql       # Assessment tables
│       ├── 03_user_profiles.sql          # Anonymous tracking
│       └── 04_anonymous_usage.sql        # Usage analytics
│
├── utils/                        # Utility functions & helpers
│   ├── datasetsUtils.js          # Dataset registry, path constants, file I/O helpers
│   ├── anonymousTracking.js      # User tracking without PII
│   └── ...                       # Other utility modules
│
├── datasets/                      # Data ingestion & processing (33GB+)
│   ├── raw/                      # Original unprocessed source files (by dataset)
│   │   ├── c2c/
│   │   ├── epa_tri/
│   │   ├── eurostat/
│   │   └── ...                   # 30+ other dataset raw folders
│   │
│   ├── processed/                # Standardized CSV files (ready for pipeline)
│   │   ├── c2c_registry.csv      # From scrape_c2c.js
│   │   ├── epa_tri_processed.csv # From extract_epa_tri.js
│   │   ├── emf_case_studies.csv  # From scrape_emf.js
│   │   └── ...                   # 34 total processed datasets
│   │
│   ├── manual_entries/           # User-contributed problem/solution pairs
│   │   └── manual_entries.csv    # Standardized format (same columns as processed/)
│   │
│   ├── archives/                 # Archive outputs (for dry-runs & testing)
│   │   ├── combined_input.csv    # merged CSV output (archive mode only)
│   │   ├── chunks.json           # chunked output
│   │   ├── embedded_chunks.json  # embedding output
│   │   ├── stored_documents.jsonl # storage output
│   │   └── scrape_backup/        # Scraped backup files (recovery mode)
│   │       ├── c2c_scrape_backup/
│   │       │   ├── c2c_scrape_backup.csv
│   │       │   └── c2c_logs.txt
│   │       └── ...               # One folder per scraper
│   │
│   ├── out/                      # Live pipeline outputs (ignored by git)
│   │   ├── combined_input.csv    # Stage 1: Merged CSVs
│   │   ├── chunks.json           # Stage 2: Processed chunks
│   │   ├── embedded_chunks.json  # Stage 3: Embedded vectors
│   │   └── stored_documents.jsonl # Stage 4: Storage verification
│   │
│   └── scripts/                  # Dataset extraction scripts (34 total)
│       ├── scrape_c2c.js         # Puppeteer web scraper
│       ├── scrape_ecesp.js       # Another web scraper
│       ├── scrape_emf.js         # Ellen MacArthur Foundation scraper
│       ├── extract_cgr_2025.js   # PDF text extraction
│       ├── extract_epa_tri.js    # CSV/Excel parsing
│       ├── extract_eippcb.js     # Multi-file extraction
│       ├── extract_metabolic.js  # Metabolic reports extraction
│       ├── run_datasets_scripts.js # Orchestrator (runs all extract_*, then scrape_*)
│       └── ...                   # 25+ other scripts (see DATASETS_REFERENCE.md)
│
├── pipeline/                     # Data processing stages
│   ├── merge_datasets.js         # Stage 1: CSV merge (processed/ + manual_entries/)
│   ├── generate_chunks.js        # Stage 2: Semantic chunking
│   ├── generate_embeddings.js    # Stage 3: OpenAI embedding generation
│   ├── store_embeddings.js       # Stage 4: Supabase storage
│   ├── validate_pipeline.js      # Schema validation for all stages
│   ├── test_score_fetch.js       # Test scoring RPC
│   ├── test_validate_input.js    # Test input validation
│   └── poll_supabase.js          # Monitor Supabase vector storage
│
├── tests/                        # Test suite
│   ├── anonymous.test.js         # Anonymous tracking tests
│   ├── apiKeyGuard.test.js       # Auth middleware tests
│   ├── datasetsUtils.test.js     # Dataset utility tests
│   ├── api/                      # API integration tests
│   ├── integration/              # End-to-end pipeline tests
│   └── services/                 # Service unit tests
│
├── package.json                  # Dependencies & npm scripts
├── .env.backend                  # Environment secrets (gitignored)
├── eslint.config.js             # ESLint rules
├── DATASETS_REFERENCE.md        # Complete dataset inventory (34 datasets)
├── PIPELINE_ADDING_DATASETS.md  # Guide: Adding new datasets
├── PIPELINE_RUNNING.md          # Guide: Running the processing pipeline
└── README.md                     # This file
```

## Layered Architecture

The backend follows a **strict layered architecture** for clean separation of concerns:

```
┌────────────────────────────────────────────────┐
│       REST API (Express Routes)                │  ← HTTP request/response
├────────────────────────────────────────────────┤
│    Controllers (Request Handlers)              │  ← Validation, formatting
├────────────────────────────────────────────────┤
│      Services (Business Logic)                 │  ← Core algorithms, RPC calls
├────────────────────────────────────────────────┤
│     Utilities (Helper Functions)               │  ← Reusable logic
├────────────────────────────────────────────────┤
│   Database Client (Supabase)                   │  ← Data persistence
└────────────────────────────────────────────────┘
```

## ID Format and Generation

Each document across all datasets has a unique ID format: `prefix_NNNNN` where:

- **prefix**: 2-3 character dataset key (e.g., 'c2c', 'epa', 'emf')
- **underscore**: Separator
- **NNNNN**: Zero-padded index (5 digits by default, auto-expands beyond)

### ID Generation

Use the `formatId()` helper from `utils/datasetsUtils.js` for consistency:

```javascript
import { formatId, ID_DIGITS } from '#utils/datasetsUtils.js';

formatId('c2c', 1); // → 'c2c_00001'
formatId('c2c', 42); // → 'c2c_00042'
formatId('c2c', 100000); // → 'c2c_100000' (auto-expands beyond 5 digits)

// ID_DIGITS is exported (currently 5) for use in custom logic
const padding = index.toString().padStart(ID_DIGITS, '0');
```

**Why use the helper?** It handles overflow automatically and keeps IDs consistent across all dataset scripts.

### Dataset Registry

The `DATASETS` array in `utils/datasetsUtils.js` contains metadata for all 34 registered datasets. Each entry includes:

- `key`: Unique identifier (e.g., 'c2c')
- `name`: Human-readable title
- `raw_folder`: Directory path for raw source files (null if web-scraped)
- `processed_csv`: Output CSV filename
- `scrape_script` / `extract_script`: Path to processing script
- `source_url`: Primary data source URL
- `urls`: Additional URLs (API endpoints, paginated lists, etc.)
- `raw_folder_contents`: File inventory (maps property names to actual filenames)
- `scrape_backup_folder`: Backup location for recovery mode (null if no scraping)

See [DATASETS_REFERENCE.md](DATASETS_REFERENCE.md) for the complete registry with all 34 datasets.

## Layered Architecture & Separation of Concerns

The backend follows a **strict 5-layer architecture** for clean code organization:

```
┌────────────────────────────────────────────┐
│       REST API (Express Routes)            │  ← HTTP request/response
├────────────────────────────────────────────┤
│    Controllers (Request Handlers)          │  ← Validation, formatting
├────────────────────────────────────────────┤
│      Services (Business Logic)             │  ← Core algorithms, RPC calls
├────────────────────────────────────────────┤
│     Utilities (Helper Functions)           │  ← Reusable logic and constants
├────────────────────────────────────────────┤
│   Database Client (Supabase)               │  ← Data persistence
└────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Routes** — Define HTTP methods, paths, and rate limiting
   - No business logic
   - Delegate to controllers
   - Example: [routes/scoring.routes.js](routes/scoring.routes.js)

2. **Controllers** — Handle requests and format responses
   - Request validation using middleware
   - Error formatting and status codes
   - Response serialization (JSON)
   - Delegate to services for business logic
   - Example: [controllers/scoring.controller.js](controllers/scoring.controller.js)

3. **Services** — Core business logic and integrations
   - Complex algorithms and calculations
   - Database/external API calls
   - Pure business rules (no HTTP context)
   - Example: [services/scoring.service.js](services/scoring.service.js)

4. **Utilities** — Shared helper functions and constants
   - Path constants and file I/O helpers
   - ID formatting and text sanitization
   - Configuration values
   - Example: [utils/datasetsUtils.js](utils/datasetsUtils.js)

5. **Database** — Data access layer
   - Supabase client initialization
   - Connection management
   - Schema definitions and migrations
   - Example: [database/supabase.client.js](database/supabase.client.js)

### Import Pattern (Canonical Aliases)

All imports use canonical aliases defined in `package.json` to avoid relative paths:

```javascript
// ✅ GOOD (use canonical aliases)
import { performScoring } from '#controllers/scoring.controller.js';
import { getScores } from '#services/scoring.service.js';
import supabase from '#database/supabase.client.js';
import { OPENAI_API_KEY } from '#config/backend.config.js';
import { DATASETS_PROCESSED_DIR } from '#utils/datasetsUtils.js';

// ❌ AVOID (relative paths)
import { performScoring } from '../../controllers/scoring.controller.js';
import supabase from '../../../../database/supabase.client.js';
```

**Why?** Canonical aliases make code more maintainable when files move, and they're much shorter and clearer.

## Structured Metadata: industry & category

Recent database migrations add `industry` and `category` as first-class columns on the `documents` table, alongside the existing `metadata` JSONB column. This improves query performance and simplifies filtering.

### Column Strategy

- **Top-level columns (indexed):** `industry`, `category` → Use for filtering, grouping, display
- **JSONB column (flexible):** `metadata` → Store flexible fields like scale, r_strategy, primary_material, geographic_focus

### Storage Pipeline

The ingestion pipeline ([pipeline/store_embeddings.js](pipeline/store_embeddings.js)) automatically populates both:

```javascript
// When inserting documents into Supabase:
await supabase.from('documents').insert({
  content: chunk.content,
  embedding: vectorArray,
  industry: 'textiles', // ← top-level column
  category: 'circular_design', // ← top-level column
  metadata: {
    // ← JSONB column (flexible)
    scale: 'medium',
    r_strategy: 'recycling',
    primary_material: 'cotton',
    geographic_focus: 'europe',
    // ... additional flexible fields
  },
});
```

### Querying Strategy

Prefer the top-level columns for queries and UI display:

```javascript
// ✅ FAST (uses indexes)
const results = await supabase
  .from('documents')
  .select('*')
  .eq('industry', 'textiles')
  .eq('category', 'design');

// ✅ WORKS (JSONB filtering)
const results = await supabase
  .from('documents')
  .select('*')
  .contains('metadata', { scale: 'medium' });

// For backward compatibility, fall back to metadata if needed:
const industry = row.industry ?? row.metadata.industry;
```

This design improves performance while maintaining backward compatibility with older clients.

## Dataset Script Documentation Standards

All dataset extraction and scraping scripts follow comprehensive documentation conventions:

### File-Level Headers (Required)

Every script includes a JSDoc header block (lines 1-30) with:

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
 *   node scrape_my_dataset.js --use-backup    # Rebuild from backup (if interrupted)
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
 *
 * Dependencies:
 *   - puppeteer (for browser automation)
 *   - csv-stringify (for CSV output)
 *   - utils/datasetsUtils.js (for path helpers)
 */
```

### Function Documentation

Key functions include JSDoc with types and descriptions:

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
function scoreRecord(record) {
  // implementation...
}
```

**IDE Support:** Use Ctrl+Space (autocomplete) to browse function signatures and hover-documentation.

### CLI Flags Supported

Common flags supported by extraction and scraping scripts:

- `--show` – Display browser window during scraping (Puppeteer only)
- `--use-backup` – Rebuild final CSV from saved backup (scrapers only)
- `--append` – Add new rows to existing CSV (renumbers IDs sequentially)
- `--clear-logs` – Clear previous run logs before starting

Example:

```pwsh
node datasets/scripts/scrape_my_dataset.js --show        # Debug with browser
node datasets/scripts/scrape_my_dataset.js --use-backup  # Recover from interrupt
node datasets/scripts/scrape_my_dataset.js --append      # Add new products
```

## Data Flow & Processing Pipeline

### Complete Data Lifecycle

All datasets follow a standardized flow from raw source to production queries:

```
1️⃣ RAW SOURCE DATA (datasets/raw/*)
   ↓
   [Extract/Scrape via dataset scripts]
   ├─ datasets/scripts/scrape_*.js (Puppeteer web automation)
   ├─ datasets/scripts/extract_*.js (CSV/PDF/JSON/API parsers)
   └─ [Optional: Incremental backups to datasets/archives/scrape_backup/]

2️⃣ PROCESSED DATASETS (datasets/processed/*)
   ↓
   [Standardized CSV with fixed columns]
   ├─ ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
   ├─ 34 total processed datasets (c2c_registry.csv, emf_case_studies.csv, epa_tri_processed.csv, etc.)
   └─ [One CSV file per dataset]

3️⃣ MANUAL ENTRIES (datasets/manual_entries/manual_entries.csv)
   ↓
   [User-contributed problem/solution pairs (same standardized format)]

4️⃣ MERGED INPUT (datasets/out/combined_input.csv or archives/)
   ↓
   npm run merge
   ├─ Concatenates all datasets/processed/*.csv
   ├─ Appends datasets/manual_entries/manual_entries.csv
   ├─ Removes duplicate rows
   ├─ Validates headers and formatting
   └─ Output: 50,000+ combined records

5️⃣ SEMANTIC CHUNKS (datasets/out/chunks.json or archives/)
   ↓
   npm run chunk
   ├─ Splits each CSV row into ~300-500 char semantic units
   ├─ Preserves problem/solution context
   ├─ Extracts metadata (industry, category, r_strategy, etc.)
   ├─ Generates chunk_00001...chunk_N format
   └─ Output: 100,000+ chunks with metadata

6️⃣ VECTOR EMBEDDINGS (datasets/out/embedded_chunks.json or archives/)
   ↓
   npm run embed (or npm run embed -- --dry-run for testing)
   ├─ Generates OpenAI embeddings (text-embedding-3-small, 1536 dims)
   ├─ Batches requests (20 chunks per API call)
   ├─ Rate limit handling with exponential backoff
   ├─ Saves cost & timing metrics
   └─ Output: 100,000+ chunks with vectors + metadata

7️⃣ DATABASE STORAGE (Supabase / Aiven dual-backend)
   ↓
   npm run store (pass -- --archives to force Supabase)
   ├─ Reads datasets/out/embedded_chunks.json (or archives/ when flag used)
   ├─ Inserts into `documents` table via Supabase or Aiven PostgreSQL
   ├─ Creates/maintains pgvector index for similarity search
   ├─ Enables RPC-based hybrid search (vector + BM25) via repository
   └─ Documents available for production queries!

8️⃣ QUERY & SCORING (Live API)
   ↓
   POST /scoring/score-problem-solutions (or GET /analytics/...)
   ├─ Receives user problem/constraints
   ├─ Calls search_documents_hybrid RPC
   ├─ Performs hybrid search (vector + text matching)
   ├─ Scores results using scoring.logic.js
   └─ Returns ranked solutions with explanations
```

     ↓& manual_entries/]
     ↓

- All processed/\*.csv files
- manual_entries.csv
- Normalize columns
- Preserve quoted format
- Validate integrity
  ↓
  combined_input.csv
  (13,000-14,000 rows + header)

```

**Command:** `npm run merge` → outputs to `datasets/out/combined_input.csv` by default. Append `-- --archives` (or set `USE_SUPABASE_DOCUMENTS_TABLE=true` if you want to use the Supabase backend for storage) to produce the merged CSV in `datasets/archives/` instead.

### 2. Chunking Pipeline

```

combined_input.csv
↓
[Parse & validate records]
↓

- Extract: problem, solution, materials, strategy, impact
- Validate: min length, quality checks
- Skip invalid records
  ↓
  [Create semantic chunks]
  ↓
- Primary: problem + solution (always together)
- Secondary: + context fields (if substantial)
- Split long content into sub-chunks
  ↓
  [Extract metadata]
  ↓
- industry (agriculture, textiles, packaging, etc)
- scale (micro, small, medium, large)
- r_strategy (reduction, reuse, recycling, regeneration)
- primary_material (plastic, metal, textile, organic, etc)
- geographic_focus (asia, africa, europe, americas, global)
  ↓
  chunks.json
  (14,000-19,000 chunks with metadata)

```

**Command:** `npm run chunk`

### 3. Embedding & Storage Pipeline

```

chunks.json
↓
[Load & validate chunks]
↓
[Generate embeddings]
↓

- OpenAI text-embedding-3-small API
- Batch: 20 chunks per request
- Delay: 500ms between batches
- Retry: Exponential backoff on rate limits
- Validate: Check dimension (1536) and structure
  ↓
  [Store in Supabase]
  ↓
- Truncate documents table (fresh load)
- Batch insert: 10 docs per request
- Structured columns: industry, category, source
- Full metadata preserved in JSONB
  ↓
  [Verify & report]
  ↓
- Test RPC functions
- Count documents
- Verify vector dimension
- Report timing & costs

````

**Command:** `npm run embed` to generate embeddings and `npm run store` to push them to Supabase. For a dry run use `npm run embed -- --dry-run` followed by `npm run store -- --dry-run`.

## API Reference

### Analytics Endpoints

#### GET `/api/analytics`

Returns aggregated statistics across all documents.

**Query Parameters:**

- `industry` - Filter by industry (optional)
- `category` - Filter by category (optional)
- `source` - Filter by source (optional)

**Response:**

```json
{
  "total_documents": 14532,
  "industries": {
    "textiles": { "count": 1245, "percentage": 8.6 },
    "electronics": { "count": 892, "percentage": 6.2 }
  },
  "categories": {...},
  "sources": {...}
}
````

#### GET `/api/analytics/enhanced`

Detailed analytics with nested breakdown by industry.

#### GET `/api/analytics/featured-solutions`

Top-rated solutions grouped by industry for dashboard.

### Scoring Endpoint

#### POST `/api/score`

RAG-powered business problem analysis and solution scoring.

**Request Body:**

```json
{
  "businessProblem": "We generate too much plastic waste",
  "filters": {
    "industry": "packaging",
    "category": null,
    "source": null
  }
}
```

**Response:**

```json
{
  "query": "We generate too much plastic waste",
  "solutions": [
    {
      "id": "chunk_123",
      "content": "Solution: Implement biodegradable alternatives...",
      "industry": "packaging",
      "category": "materials",
      "similarity": 0.87,
      "rrf_score": 0.91
    }
  ],
  "summary": "Found 12 relevant solutions"
}
```

### Assessment Endpoints

#### POST `/api/assessments`

Create a new assessment.

#### GET `/api/assessments/:id`

Retrieve a specific assessment.

#### GET `/api/assessments/user/:userId`

List assessments for a user.

## Database Schema

### documents Table

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  embedding extensions.vector(1536),
  industry text,
  category text,
  source text,
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
  USING hnsw(embedding vector_cosine_ops);
CREATE INDEX idx_documents_created_at ON documents(created_at);
```

### RPC Functions

#### search_documents_hybrid()

Hybrid search combining vector similarity + keyword matching.

**Parameters:**

- `query_embedding` - 1536-dimensional vector
- `keyword_filter` - Text keyword search
- `industry_filter` - Exact match on industry
- `category_filter` - Exact match on category
- `source_filter` - Exact match on source
- `match_count` - Number of results (default: 10)
- `vector_weight` - Vector similarity weight (default: 0.7)
- `similarity_threshold` - Minimum score (default: 0.0)

**Returns:** Top-K results with similarity scores

## Environment Configuration

### Required Variables (.env.backend)

The boolean flag `USE_SUPABASE_DOCUMENTS_TABLE` controls which
backing store will hold the `documents` table used for vector searches.

- `true` _(default)_ → queries and pipeline operations target Supabase.
- `false` → operations use the external Aiven PostgreSQL instance.

(The legacy `documents_archives` table is removed; there is now a single
`documents` table shared by both backends.)

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=sk_service_xxxxxxxxxxxxx
PORT=8000
NODE_ENV=development
USE_SUPABASE_DOCUMENTS_TABLE=true   # set to false to switch to Aiven
```

### Configuration Files

1. **config/backend.config.js** - Centralized config object with test defaults
2. **config/embedding.js** - Embedding constants
3. **utils/datasetsUtils.js** - Dataset filesystem paths
4. **.env.backend** - Environment secrets

## Running the Backend

### Server

```pwsh
npm run start         # Production server (set NODE_ENV=production)
npm run dev           # Development with watch mode
```

Test mode is automatically enabled when `NODE_ENV=test`. The server will:

- Skip `.env` file loading to preserve test env vars
- Use fallback test defaults for missing credentials
- Not auto-listen (allowing test frameworks to control startup)
- Provide stub Supabase clients for offline testing

### Data Pipeline

```pwsh
npm run populate      # Complete pipeline: merge → chunk → embed → store
npm run merge         # Just merge CSVs (processed/ + manual_entries/) → out/ (use -- --archives for archives)
npm run chunk         # Just create chunks (CSV → chunks.json) → out/ (use -- --archives for archives)
npm run embed         # Generate embeddings (chunks → embedded_chunks.json) → out/ (use -- --archives for archives)
npm run store         # Store embeddings in configured backend (`documents` table). Use -- --archives or set USE_SUPABASE_DOCUMENTS_TABLE=true to force Supabase (default=Aiven)
npm run embed -- --dry-run  # Test embedding generation locally
npm run store -- --dry-run     # Test storage locally (writes JSONL)
```

### Dataset Scrapers

Pull data from web sources using Puppeteer automation:

```pwsh
# Individual scraper scripts:
node datasets/scripts/scrape_c2c.js          # Cradle-to-Cradle certified products
node datasets/scripts/scrape_ecesp.js        # ECESP good practices
node datasets/scripts/scrape_emf.js          # EMF case studies
node datasets/scripts/scrape_open_food_facts.js      # Food products
node datasets/scripts/scrape_open_beauty_facts.js    # Beauty products
node datasets/scripts/scrape_open_products_facts.js  # General products

# Run all extract & scrape scripts in sequence:
npm run datasets-scripts   # Runs all extract_*.js then scrape_*.js

# Debugging: show browser window while scraping
node datasets/scripts/scrape_ecesp.js --show
```

**Backup & Recovery Mode:**

All scrapers save intermediate results every N pages to `datasets/archives/scrape_backup/<dataset>_scrape_backup.csv`. If a scrape is interrupted, rebuild the final CSV from saved backup content:

```pwsh
# Interrupted scrape? Use --use-backup to rebuild from backup:
node datasets/scripts/scrape_c2c.js --use-backup

# This skips web fetching and builds final CSV from
# datasets/archives/scrape_backup/c2c_scrape_backup.csv
```

**Console Feedback During Backup Saves:**

```
✅ Backup: Saved 45 rows from page 3
⚠️️️ Backup add failed: [error reason]
```

See **DATASETS_REFERENCE.md** for complete scraper documentation and **PIPELINE_ADDING_DATASETS.md** for adding new scrapers with backup support.

### Archive Mode (Supabase Backend)

The historical `-- --archives` flag is now repurposed to **force the
Supabase backend** instead of the default Aiven PostgreSQL storage. The CLI
flag overrides the `USE_SUPABASE_DOCUMENTS_TABLE` environment variable if
both are present.

- Outputs still go to `datasets/archives/` when `-- --archives` is passed; the
  pipeline behaviour mirrors normal mode.
- Storage always writes to the single `documents` table, but the underlying
  client will be Supabase when the flag/variable is truthy or Aiven otherwise.

Example usage:

```pwsh
npm run merge -- --archives    # write merged CSV into archives folder
npm run chunk -- --archives    # create chunks in archives folder
npm run embed -- --archives    # generate embeddings in archives folder
npm run store -- --archives    # store into Supabase (not Aiven)
```

> **Note:** You can also set the environment variable directly:
> `USE_SUPABASE_DOCUMENTS_TABLE=true`.

All generated files (whether in `out/` or `archives/`) are marked read-only
by the scripts to prevent accidental modification.

> **Filesystem behaviour:** pipeline and dataset scripts will create any
> missing parent directories before writing output, touch an empty placeholder
> file on the first write, and then mark the final file as read-only. The
> first time a file is written during a run it is cleared to ensure stale data
> is removed; stages that work in batches (chunking, embedding, dry‑run
> storage) will also flush intermediate progress back to disk after each
> iteration so that partial results are visible. When you re-run a stage the
> script temporarily unlocks the file, so regenerating results does not require
> manual permission changes.

### Validation & Testing

```pwsh
npm run validate          # End-to-end pipeline validation
npm test                  # Full test suite (all *.test.js files)
npm run test:validate     # Run input validation checks (pipeline/test_validate_input.js)
npm run test:score-fetch  # Run scoring test (pipeline/test_score_fetch.js)
npm run poll:supabase     # Monitor vector storage (pipeline/poll_supabase.js)
```

## Datasets Included

**32 processed datasets** totaling ~14,000-19,000 records from diverse sources:

- GreenTechGuardians: 2,286 case studies
- Ellen MacArthur Foundation: 3,825+ case studies
- Eurostat: 501+ environmental records
- Open Food/Beauty/Products: 1,000+ product records
- Academic & government datasets: 6,000+ records

See **DATASETS_REFERENCE.md** for complete inventory.

## Performance Characteristics

### Execution Times

- **Ingestion:** 1-2 seconds
- **Chunking:** 5-10 seconds
- **Embedding:** 3-5 minutes
- **Full pipeline:** ~6-7 minutes

### Costs (per run)

- **OpenAI embeddings:** ~$0.02-$0.10
- **Supabase:** Included in free tier

### Query Performance

- **Vector search:** <100ms (HNSW index)
- **Keyword + filter:** <50ms (B-tree indexes)
- **Hybrid search:** <150ms

## Security & Access Control

### Authentication

- RLS policies on all Supabase tables
- Service role key for server writes (embed_and_store.js)
- Anon key for frontend read-only access

### Rate Limiting

- Scoring endpoint: Rate limited
- OpenAI API: Auto-retry with exponential backoff

### Input Validation

- All queries sanitized with Zod
- Filters validated against allowed values
- Request bodies type-checked at API boundary

## Debugging

### Common Issues

**Pipeline hangs on embedding:**

- Check OpenAI API key: `echo $OPENAI_API_KEY`
- Test network: `ping api.openai.com`
- Try dry-run: `npm run embed -- --dry-run` (and optionally `npm run store -- --dry-run`)

**Supabase "401 Unauthorized":**

- Use SERVICE_ROLE key (not anon)
- Should start with: `sk_service_`

**Wrong chunk count:**

- Check MIN_PROBLEM/SOLUTION_LENGTH thresholds
- Review console for "Skipping record" warnings

### Debug Logging

```pwsh
DEBUG=* npm run embed   # debug embedding stage
DEBUG=* npm run store   # debug storage stage
DEBUG=backend:* npm run dev
```

## Architecture Decisions

### PostgreSQL + pgvector

- Native vector type (no separate DB)
- Structured + unstructured in one place
- SQL filtering is fast with B-tree indexes
- Cost-effective at scale

### Batch Embedding

- Reduces API costs
- Handles rate limiting gracefully
- Validates before DB insert

### Hybrid Search

- Vector search alone misses exact matches
- Keyword alone misses semantic similarity
- Combined approach is more robust

### Structured Filtering

- B-tree indexes are fast for exact matching
- JSONB filtering would be slower
- Improves database efficiency

## Extending the System

### Adding a New Dataset

1. Create extraction script in `datasets/scripts/`
2. Output CSV to `datasets/processed/`
3. Run: `npm run populate`
4. Update DATASETS_REFERENCE.md

### Adding a New Router Endpoint

1. **Create route** in `routes/` (HTTP definition only)
2. **Create controller** in `controllers/` (validation + logic delegation)
3. **Create service** in `services/` (business logic)
4. **Register route** in `server/app.js`
5. **Test:** Add test file to `tests/api/`
6. **Document:** Update this README's API Reference

### Adding a New Service Function

1. Create function in appropriate `services/*.service.js` file
2. Import and call from controller
3. Add unit tests to `tests/services/`
4. Follow naming: `getX()`, `createX()`, `performX()`, etc.

### Adding a New Database RPC Function

1. Create migration SQL in `database/migrations/`
2. Define TypeScript types in controller
3. Call from service using Supabase client
4. Test in Supabase SQL Editor

## Dependencies

### Core

- **express** - REST framework
- **@supabase/supabase-js** - Database client
- **openai** - Embeddings API
- **zod** - Input validation

### Data Processing

- **csv-parse** - CSV parsing
- **csv-stringify** - CSV generation
- **puppeteer** - Web scraping
- **pdfjs-dist** - PDF extraction

### Development

- **eslint** - Code linting
- **supertest** - API testing
- **nodemon** - Auto-reload

## License & Support

**Author:** Areeb Ahmed Zahoori
**License:** UNLICENSED
**Status:** Production Ready
**Last Updated:** 2026-02-27

For guides on running the pipeline, see [PIPELINE_RUNNING.md](./PIPELINE_RUNNING.md).
For adding new datasets, see [PIPELINE_ADDING_DATASETS.md](./PIPELINE_ADDING_DATASETS.md).
For dataset inventory, see [DATASETS_REFERENCE.md](./DATASETS_REFERENCE.md).
