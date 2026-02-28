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
│  Database Layer (Supabase PostgreSQL + pgvector)         │
│  ├─ documents - Vector-searchable document store         │
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
│   ├── processed/                # 31 standardized CSV files
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
|
├── pipeline/                     # Data processing pipeline
│   ├── merge_datasets.js         # CSV merge (processed/ & manual_entries/)
│   ├── generate_chunks.js        # CSV → chunks.json
│   ├── generate_embeddings.js    # chunks.json → embedded_chunks.json
│   ├── store_embeddings.js       # embedded_chunks.json → Supabase
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

**Command:** `npm run merge` → outputs to `datasets/out/combined_input.csv` (normal) or `datasets/archives/combined_input.csv` (archives run)

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

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=sk_service_xxxxxxxxxxxxx
PORT=8000
NODE_ENV=development
```

### Configuration Files

1. **config/backend.config.js** - Centralized config object with test defaults
2. **config/embedding.js** - Embedding constants
3. **utils/datasetsUtils.js** - Dataset filesystem paths
4. **.env.local** - Environment secrets

## Running the Backend

### Server

```bash
npm run start         # Production server (set NODE_ENV=production)
npm run dev           # Development with watch mode
```

Test mode is automatically enabled when `NODE_ENV=test`. The server will:

- Skip `.env` file loading to preserve test env vars
- Use fallback test defaults for missing credentials
- Not auto-listen (allowing test frameworks to control startup)
- Provide stub Supabase clients for offline testing

### Data Pipeline

```bash
npm run populate      # Complete pipeline: merge → chunk → embed → store
npm run merge         # Just merge CSVs (processed/ + manual_entries/) → out/
npm run chunk         # Just create chunks (CSV → chunks.json) → out/
npm run embed         # Generate embeddings (chunks → embedded_chunks.json) → out/
npm run store         # Store embeddings in Supabase (datasets/out/embedded_chunks.json → documents_archives)
npm run store:archives  # Store archive embeddings (datasets/archives/embedded_chunks.json → documents)
npm run embed -- --dry-run  # Test embedding generation locally
npm run store -- --dry-run     # Test storage locally (writes JSONL)
```

### Archives Run Pipeline

For testing or archival purposes, use the archives pipeline to isolate outputs in `datasets/archives/`. The archives directory will contain only root-level generated files:

```
archives/
├─ combined_input.csv
├─ chunks.json
├─ embedded_chunks.json
└─ scrape_backup/     (from dataset scrapers)
```

Use the following commands:

```bash
npm run archives        # Complete archives run: merge:archives → chunk:archives → embed:archives
npm run merge:archives  # Merge CSVs → archives/combined_input.csv
npm run chunk:archives  # Create chunks → archives/chunks.json
npm run embed:archives  # Generate embeddings → archives/embedded_chunks.json
```

All files written (both `out/` and `archives/` folders) are automatically set to read-only after generation to prevent accidental modifications.

### Validation & Testing

```bash
npm run validate          # End-to-end pipeline validation
npm test                  # Full test suite (all *.test.js files)
npm run test:validate     # Run input validation checks (pipeline/test_validate_input.js)
npm run test:score-fetch  # Run scoring test (pipeline/test_score_fetch.js)
npm run poll:supabase     # Monitor vector storage (pipeline/poll_supabase.js)
```

## Datasets Included

**31 processed datasets** totaling ~14,000 records from diverse sources:

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

```bash
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
