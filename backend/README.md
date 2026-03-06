# Backend Architecture: Circular Economy Document Processing & RAG System

Complete technical documentation of the circular economy business auditor backend stack.

## System Overview

The backend is a Node.js/Express server that powers a document processing pipeline and RAG (Retrieval-Augmented Generation) system for circular economy business evaluation. It processes CSV datasets into semantic chunks, generates embeddings using OpenAI, stores vectors in Supabase PostgreSQL with pgvector, and provides REST APIs for hybrid search and scoring.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  API Layer (Express.js)                                   │
│  ├─ /analytics - Data analytics & filtering              │
│  ├─ /scoring - Business problem scoring & RAG            │
│  └─ /assessments - User assessment management            │
│                                                             │
│  Data Processing Pipeline                                 │
│  ├─ Ingestion (merge_datasets.js)                        │
│  ├─ Chunking (generate_chunks.js)                        │
│  ├─ Embedding (generate_embeddings.js)                   │
│  └─ Storage (store_embeddings.js)                        │
│                                                             │
│  *Utility*                                               │
│  └─ run_datasets_scripts.js  - orchestrates all extractor │
│      and scraper dataset scripts in the correct order     │
│                                                             │
│  Database Layer (Supabase PostgreSQL + pgvector)         │
│  ├─ documents - Vector-searchable document store (switchable with USE_DOCUMENTS_ARCHIVES_TABLE to documents_archives)
│  ├─ documents_archives - optional archive dataset mirror  │
│  ├─ user_assessments - Evaluation results                │
│  ├─ user_profiles - Anonymous usage tracking             │
│  └─ RPC Functions - Hybrid search logic                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/
├── server/                       # Express server bootstrap
│   ├── index.js                  # Server lifecycle (startServer/stopServer)
│   ├── app.js                    # Express application setup
│   └── bootstrap.js              # Initialization logic
│
├── config/                       # Centralized configuration
│   ├── backend.config.js         # Main config object (with test defaults)
│   ├── env.schema.js             # Zod validation schema
│   ├── embedding.js              # Embedding constants
│   └── loadEnv.js                # Environment variable loader
│
├── routes/                       # API route definitions (thin Express wrappers)
│   ├── analytics.routes.js       # Analytics endpoints
│   ├── assessments.routes.js     # Assessment endpoints
│   └── scoring.routes.js         # RAG scoring endpoints
│
├── controllers/                  # Request handlers & business logic delegation
│   ├── analytics.controller.js   # Analytics logic
│   ├── assessments.controller.js # Assessment logic
│   └── scoring.controller.js     # Scoring validation & response formatting
│
├── services/                     # Core business logic & integrations
│   ├── scoring.service.js        # Scoring RPC + hybrid search
│   ├── scoring.logic.js          # Pure scoring calculations
│   ├── embedding.service.js      # OpenAI embedding operations
│   ├── chunking.service.js       # Document chunking logic
│   └── assessment.service.js     # Assessment CRUD operations
│
├── middleware/                   # Express middleware
│   ├── auth.middleware.js        # Authentication & authorization
│   └── validation.middleware.js  # Input validation
│
├── database/                     # Database layer
│   ├── supabase.client.js        # Supabase client initialization
│   ├── migrations/               # Migration tracking
│   └── sql/                      # SQL schema files
│
├── utils/                        # Utility functions
│   ├── anonymousTracking.js      # Usage analytics
│   ├── datasetsUtils.js          # Dataset path constants
│   └── ...                       # Other helpers
│
├── datasets/                      # Data ingestion & processing
│   ├── manual_entries/
│   │   └── manual_entries.csv    # User-added problem/solution pairs
	│   ├── processed/                # 32 standardized CSV files from registered datasets
│   ├── raw/                      # Original unprocessed source files
│   ├── archives/                 # Archive outputs & scraped data (for testing/archival)
│   │   ├── combined_input.csv    # merged CSV output (archive mode only)
│   │   ├── chunks.json           # chunk output (archive mode only)
│   │   ├── embedded_chunks.json  # embedding output (archive mode only)
│   │   └── scrape_backup/       # scraped pages from dataset scripts (backup mode)

│   ├── out/                      # Generated outputs (ignored by git)
│   │   ├── combined_input.csv    # OUTPUT: Merged CSVs
│   │   ├── chunks.json           # OUTPUT: Processed chunks
│   │   └── embedded_chunks.json  # OUTPUT: Embedded vectors
│   └── scripts/                  # Dataset extraction scripts
│       ├── scrape_*.js           # Web scraping scripts (Puppeteer automation)
│       │                          #   Each script includes comprehensive file-level header
│       │                          #   with purpose, features, usage flags, and input/output
│       │                          #   Use `--show` flag to debug with visible browser
│       │                          #   Use `--use-backup` flag to rebuild from saved backups
│       └── extract_*.js          # Data extraction scripts (CSV/PDF/API parsing)
│                                  #   Each script includes file-level documentation
│                                  #   and JSDoc comments on key functions
|
├── pipeline/                     # Data processing pipeline
│   ├── merge_datasets.js         # CSV merge (processed/ & manual_entries/) with duplicate row removal
│   ├── generate_chunks.js        # CSV → chunks.json
│   ├── generate_embeddings.js    # chunks.json → embedded_chunks.json
│   ├── store_embeddings.js       # embedded_chunks.json → Supabase (or local JSONL with --dry-run)
│   ├── validate_pipeline.js      # Pipeline validation
│   ├── test_score_fetch.js       # Scoring test
│   ├── test_validate_input.js    # Input validation test
│   └── poll_supabase.js          # Monitor Supabase vector storage
│
├── tests/                        # Test suite
│   ├── api/                      # API integration tests
│   ├── services/                 # Service unit tests
│   └── integration/              # End-to-end integration tests
│
├── package.json                  # Dependencies & scripts
├── .env.local (gitignored)      # Environment secrets
├── eslint.config.js             # Linting configuration
├── DATASETS_REFERENCE.md        # Dataset inventory
├── PIPELINE_ADDING_DATASETS.md  # Guide: Adding new datasets
├── PIPELINE_RUNNING.md          # Guide: Running the pipeline
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

**ID Format**

- **Source:** `utils/datasetsUtils.js` defines `ID_DIGITS = 5` and the helper `formatId(prefix, index)` for consistent ID generation. See [backend/utils/datasetsUtils.js](backend/utils/datasetsUtils.js#L75).
- **Convention:** IDs follow `prefix_NNNNN` (5-digit zero-padded) — for example `new_00001`, `c2c_00042`.
- **Usage:** When creating or transforming datasets, use `formatId()` (or the exported `ID_DIGITS`) rather than hardcoding padding to keep IDs consistent across scripts and pipeline stages.

### Layer Responsibilities

1. **Routes** - Define HTTP methods, paths, rate limiting
   - No business logic
   - Delegate to controllers
   - Example: `routes/scoring.routes.js`

2. **Controllers** - Handle requests & responses
   - Request validation
   - Error formatting
   - Response serialization
   - Delegate to services
   - Example: `controllers/scoring.controller.js`

3. **Services** - Core business logic
   - Complex algorithms
   - Database/external API calls
   - Pure business rules
   - Example: `services/scoring.service.js`

4. **Utils** - Shared utilities
   - Constants
   - Helper functions
   - Path utilities
   - Example: `utils/datasetsUtils.js`

5. **Database** - Data access
   - Supabase client
   - Connection management
   - Schema definitions
   - Example: `database/supabase.client.js`

### Import Pattern (Canonical Aliases)

All imports use canonical aliases defined in `package.json`:

```javascript
// Routes
import { performScoring } from '#controllers/scoring.controller.js';

// Controllers
import { getScores } from '#services/scoring.service.js';

// Services
import supabase from '#database/supabase.client.js';

// Config
import { OPENAI_API_KEY } from '#config/backend.config.js';

// Utils
import { DATASETS_PROCESSED_DIR } from '#utils/datasetsUtils.js';
```

Avoid relative paths (`../../`); always use canonical aliases for consistency.

## Note on structured metadata (industry & category)

Recent database migrations add `industry` and `category` as first-class columns on the `documents` table (in addition to the existing `metadata` JSONB). The pipeline and storage scripts populate these columns at ingest time. Implementation notes:

- Prefer the top-level `industry` and `category` columns for filtering, grouping, and UI display when present, and fall back to `metadata.industry`/`metadata.category` only for backward compatibility.
- The `metadata` JSONB is still preserved for flexible fields (scale, r_strategy, primary_material, geographic_focus, etc.). Do not remove it; continue to use `metadata` for non-structured attributes.
- The ingestion pipeline (`pipeline/store_embeddings.js`) already assigns `industry` and `category` when inserting document rows; queries and response mapping in controllers should prefer `row.industry`/`row.category`.

This change improves query performance (indexable columns) and simplifies frontend consumption while retaining backward compatibility with older clients.

## Dataset Script Documentation

All dataset extraction and scraping scripts follow comprehensive documentation standards for maintainability:

### File-Level Headers

Every script in `datasets/scripts/` includes a JSDoc header block (lines 1-25) describing:

```
📋 Script name and purpose
🎯 Target dataset and source
🔧 Key features and capabilities
💻 Usage instructions with CLI flags
📥 Input file formats and locations
📤 Output file formats and locations
🔌 Dependencies and requirements
```

**Examples:**

- `scrape_c2c.js` – Cradle-to-Cradle certified products (Puppeteer)
- `extract_cgr_2025.js` – Circularity Gap Report PDF extraction
- `extract_epa_tri.js` – EPA pollution data with multi-dimensional scoring
- `scrape_ecesp.js` – European circular economy practices (dynamic pagination)
- `extract_fashion_transparency.js` – Supply chain transparency analysis

### Function Documentation

Key functions include JSDoc comments with:

- `@param {type} description` – Parameter type and description
- `@returns {type} description` – Return type and description
- `@async` – For asynchronous functions
- `@throws {Error}` – For error conditions

**IDE Support:** Browse function signatures and documentation using Ctrl+Space (autocomplete) in your editor.

### Script Flags

Common CLI flags supported by scripts:

- `--show` – Display browser window during scraping (Puppeteer scripts only)
- `--use-backup` – Rebuild final CSV from saved backup (scraper scripts only)
- `--clear-logs` – Clear script log file before running (optional)
- `--append` – Append results to existing processed CSV instead of overwriting. Existing IDs will be renumbered to continue sequentially.

Example:

```pwsh
node datasets/scripts/scrape_c2c.js --show        # Debug with visible browser
node datasets/scripts/scrape_c2c.js --use-backup  # Recover from interruption
```

### Quick Script Reference

See [DATASETS_REFERENCE.md](DATASETS_REFERENCE.md#script-documentation) for:

- Complete documentation overview
- Category-based grouping (Scraper, PDF, CSV, JSON/API)
- For the complete dataset registry, check `backend/utils/datasetsUtils.js` (30+ datasets)

For adding new scripts, see [PIPELINE_ADDING_DATASETS.md](PIPELINE_ADDING_DATASETS.md#script-documentation-best-practices).

## Data Flow

> **Note:** All filesystem paths used by dataset and pipeline scripts are defined
> centrally in `utils/datasetsUtils.js`. Scripts should import constants
> (e.g. `COMBINED_INPUT_CSV`, `DATASETS_PROCESSED_DIR`, `DATASETS_ARCHIVES_DIR`) rather than
> using `../../` relative paths to avoid errors.

### 1. Ingestion Pipeline

```
combined_input.csv
     ↓
[Merge CSVs from processed/ and manual_entries/]
     ↓& manual_entries/]
     ↓
- All processed/*.csv files
- manual_entries.csv
- Normalize columns
- Preserve quoted format
- Validate integrity
     ↓
combined_input.csv
(13,000-14,000 rows + header)
```

**Command:** `npm run merge` → outputs to `datasets/out/combined_input.csv` by default. Append `-- --archives` (or set `USE_DOCUMENTS_ARCHIVES_TABLE=true`) to produce the merged CSV in `datasets/archives/` instead.

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
```

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
```

#### GET `/api/analytics/enhanced`

Detailed analytics with nested breakdown by industry.

#### GET `/api/analytics/featured-solutions`

Top-rated solutions grouped by industry for dashboard.

### Scoring Endpoint

#### POST `/api/scoring`

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

### Required Variables (.env.local)

The new boolean variable `USE_DOCUMENTS_ARCHIVES_TABLE` toggles the database
source between the default `documents` table and the archival
`documents_archives` table. It defaults to `false` and can also be
controlled per-run via CLI flags (`--archives`) in the pipeline scripts.

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=sk_service_xxxxxxxxxxxxx
PORT=8000
NODE_ENV=development
USE_DOCUMENTS_ARCHIVES_TABLE=false   # when true, API/rpc calls target documents_archives table
```

### Configuration Files

1. **config/backend.config.js** - Centralized config object with test defaults
2. **config/embedding.js** - Embedding constants
3. **utils/datasetsUtils.js** - Dataset filesystem paths
4. **.env.local** - Environment secrets

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
npm run store         # Store embeddings in Supabase (datasets/out/embedded_chunks.json → documents); add -- --archives or set USE_DOCUMENTS_ARCHIVES_TABLE=true to operate on archives
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

### Archive Mode

Any pipeline command can be executed in archive mode by appending
`-- --archives` to the npm script or by setting the environment variable
`USE_DOCUMENTS_ARCHIVES_TABLE=true`. Archive mode behaves identically to the
normal pipeline except that:

- Outputs are written to `datasets/archives/` instead of `datasets/out/`.
- Storage operations target the `documents_archives` table instead of
  `documents`.

Example usage:

```pwsh
npm run merge -- --archives
npm run chunk -- --archives
npm run embed -- --archives
npm run store -- --archives
```

> **Note:** Archive mode is controlled via the `-- --archives` flag or the
> `USE_DOCUMENTS_ARCHIVES_TABLE` environment variable. Both the `-- --archives`
> flag and the env variable approach are supported. The flag takes precedence
> if both are present.

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
