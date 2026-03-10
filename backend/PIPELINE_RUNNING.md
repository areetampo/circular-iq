# Data Pipeline: Ingestion, Chunking & Embedding

Complete guide for executing the document processing pipeline that transforms CSV datasets into vector embeddings stored in Supabase.

## Pipeline Overview

> **Tip:** All pipeline and dataset scripts rely on centralized path constants
> defined in `utils/datasetsUtils.js`. Avoid using relative paths
> (e.g. `../../`) when editing or creating new scripts; import the required
> constants instead.
>
> **File handling note:** When a script writes an output file it first ensures
> the parent folder exists (creating it if necessary) and touches an empty
> placeholder file on the first write. Generated files are marked read-only
> after creation; scripts will temporarily unlock them when run again so that
> re‑running a stage doesn't require manual permission changes. Stages that
> produce multiple batches (chunking, embedding generation, dry‑run storage)
> clear the target file on the very first write and will flush progress back to
> disk after every batch — the helper functions take care of making the file
> writable before each write and locking it again immediately afterwards.>
> **Running scrapers:** the Puppeteer‑based scrapers are located under
> `datasets/scripts/scrape_*.js`. They default to headless mode so the browser
> does not spawn a visible window. If you need to observe the automation,
> append the `--show` flag when invoking the node command as shown below:
>
> ```pwsh
> node datasets/scripts/scrape_ecesp.js          # headless
> node datasets/scripts/scrape_ecesp.js --show   # open browser window
> ```
>
> **Script documentation:** Each script includes a comprehensive file-level header
> describing its purpose, features, usage flags, input/output formats, and dependencies.
> Open any script in your editor to see the full documentation block (JSDoc format).
> Key functions also include type annotations and descriptions for IDE autocomplete support.
>
> To access detailed documentation for a specific dataset:

- View the script file header: `datasets/scripts/scrape_ecesp.js` (lines 1-30)
- See [DATASETS_REFERENCE.md](DATASETS_REFERENCE.md#dataset-inventory) for complete documentation
- Check the [dataset inventory](DATASETS_REFERENCE.md#complete-dataset-inventory-34-datasets) for all 34 registered datasets

> **Backup & Recovery Mode:** scraper scripts save intermediate results every N
> pages to `datasets/archives/scrape_backup/<dataset>_scrape_backup.csv`. If a
> scrape is interrupted (network timeout, user cancellation), you can rebuild
> the final CSV from saved backup content:
>
> ```pwsh
> # Interrupted scrape? Add --use-backup flag to rebuild from backup:
> node datasets/scripts/scrape_ecesp.js --use-backup
> ```
>
> This skips web fetching and directly processes backup rows to produce the
> final `datasets/processed/<dataset>_processed.csv`. See [DATASETS_REFERENCE.md](DATASETS_REFERENCE.md)
> for details on backup behavior and which scrapers support this feature.
>
> **Running everything at once:** rather than calling each dataset script by
> hand you can use the orchestrator in `backend/pipeline/run_datasets_scripts.js`.
> The npm alias `npm run datasets-scripts` invokes it for you; it will execute all
> `extract_*.js` files first followed by any `scrape_*.js` files, aborting on
> the first error. This is handy when updating multiple sources or after
> pulling upstream changes.
>
> **Stage 1: Merge** - Combine processed/ and manual_entries/ into combined_input.csv
> **Stage 2: Chunk** - Split into semantic units → chunks.json
> **Stage 3: Generate** - Generate embeddings → embedded_chunks.json
> **Stage 4: Store** - Store embeddings in Supabase documents table

## Quick Start

```pwsh
# Complete pipeline (recommended)
npm run populate

# Or run stages individually:
npm run merge         # Merge CSVs → combined_input.csv
npm run chunk         # Create chunks → chunks.json
npm run embed         # Generate embeddings → embedded_chunks.json
npm run store         # Store in Supabase → documents table

# To target the archive dataset instead of live:
$env:USE_DOCUMENTS_ARCHIVES_TABLE = 'true'; npm run store   # store into documents_archives
# or equivalently:
npm run store -- --archives
```

## Data Sources

### Switching Data Source (live vs archive)

The backend can operate against either the **primary `documents` table** or an
alternative **`documents_archives` table** containing archived vectors. This is
controlled by the `USE_DOCUMENTS_ARCHIVES_TABLE` environment variable (boolean) or the
`--archives` / `--archive` flag used by CLI scripts. When active, all database
calls (table names and RPC function names) automatically switch to the archive
variants (e.g. `search_documents_hybrid` → `search_documents_archives_hybrid`).

Set in `.env.local`:

```env
USE_DOCUMENTS_ARCHIVES_TABLE=true   # default false
```

Alternatively, many pipeline scripts accept `--archives` on the command line
which takes precedence over the environment variable. See individual stage
commands below for examples.

### Processed Datasets

**Location:** `datasets/processed/`

Contains 32 standardized CSV files from diverse sources:

- GreenTechGuardians: 2,286 case studies
- Ellen MacArthur Foundation: 3,825+ case studies
- Eurostat: 501+ environmental records
- Open Food/Beauty/Products: 1,000+ product records
- Academic & public datasets: 6,000+ records

See [DATASETS_REFERENCE.md](DATASETS_REFERENCE.md) for complete inventory.

### Manual Entries

**Location:** `datasets/manual_entries/manual_entries.csv`

Add custom problem/solution pairs here using the standard CSV format.

## Stage 1: CSV Merge

### Command

```pwsh
npm run merge          # → datasets/out/combined_input.csv (add -- --archives for archives)
```

**Note:** Pass `-- --archives` (or set `USE_DOCUMENTS_ARCHIVES_TABLE=true`)
to write the merged file into `datasets/archives/` instead of `out/`.

### What It Does

1. Scans `datasets/processed/` (all CSV files)
2. Scans `datasets/manual_entries/` (manual_entries.csv)
3. Merges all rows into combined_input.csv
4. Normalizes column names and formats
5. Makes output file read-only

**Note:** The merge script always scans the same source CSVs; the only difference is
output location. Append `-- --archives` (or set `USE_DOCUMENTS_ARCHIVES_TABLE=true`)
to write the merged file into `datasets/archives/` instead of `out/`.

### Expected Output

```
combined_input.csv created with:
- Header row (unquoted)
- Data rows (quoted properly)
- Validated format for chunking
```

### Troubleshooting

**combined_input.csv is empty:**

```pwsh
# Verify directory structure
Get-ChildItem datasets/processed/ | Select-Object -First 5
Get-ChildItem datasets/manual_entries/
```

## Stage 2: Semantic Chunking

### Command

```pwsh
npm run chunk        # produces chunks in out/ (add -- --archives for archives output)
```

### What It Does

1. Reads `datasets/out/combined_input.csv`
2. Creates semantic chunks from problem/solution pairs
3. Generates metadata (industry, scale, strategy, materials, geography)
4. Outputs `datasets/out/chunks.json`

### Example Output

```json
{
  "id": "chunk_0",
  "content": "Problem: ...\n\nSolution: ...",
  "metadata": {
    "industry": "textiles",
    "scale": "medium",
    "r_strategy": "recycling",
    "primary_material": "textile",
    "geographic_focus": "europe"
  },
  "word_count": 245
}
```

### Configuration (in .env.local)

```env
MIN_PROBLEM_LENGTH=20
MIN_SOLUTION_LENGTH=20
```

The chunking logic is implemented in `services/chunking.service.js`.

## Stage 3: Embedding Generation

### Prerequisites

Set environment variables in `.env.local`:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

### Command

```pwsh
# Test locally without API calls (fake embeddings)
npm run embed -- --dry-run

# Production (real OpenAI embeddings)
npm run embed        # write to out/ by default (add -- --archives for archives)
```

### What It Does

1. Reads `datasets/out/chunks.json`
2. Generates embeddings using OpenAI text-embedding-3-small (1536 dimensions)
3. Batches requests (20 chunks per request, 500ms delay)
4. Auto-retries on rate limits with exponential backoff
5. Saves to `datasets/out/embedded_chunks.json`
6. Reports statistics (count, estimated cost, timing)

### Configuration (optional)

Centralized in `config/embedding.js`:

```javascript
EMBEDDING_MODEL = 'text-embedding-3-small';
EMBEDDING_DIMENSION = 1536;
EMBEDDING_BATCH_SIZE = 20;
EMBEDDING_BATCH_DELAY_MS = 500;
```

The embedding logic is implemented in `services/embedding.service.js`.

### Troubleshooting

**"401 Unauthorized" from OpenAI:**

```pwsh
# Verify key exists
Write-Host $env:OPENAI_API_KEY

# Ensure it starts with 'sk-'
Write-Host $env:OPENAI_API_KEY.Substring(0, 3)
```

**Rate limit (429 error):**

Script auto-retries. To reduce frequency, edit `config/embedding.js`:

```javascript
EMBEDDING_BATCH_SIZE = 10; // Reduce from 20
EMBEDDING_BATCH_DELAY_MS = 2000; // Increase from 500
```

Then run: `npm run embed`

**Hangs or timeouts:**

```pwsh
# Test network connectivity
Test-Connection api.openai.com -Count 1

# Try dry-run (local, no API calls)
npm run embed -- --dry-run
```

## Stage 4: Embedding Storage

### Prerequisites

Set environment variables in `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sk_service_xxxxxxxxxxxxx
```

### Command

```pwsh
# Normal: read from out/ and store in Supabase's `documents` table
npm run store

# Archive mode: add `-- --archives` (or set USE_DOCUMENTS_ARCHIVES_TABLE=true)
#             reads from archives/ and stores into `documents_archives`
npm run store -- --archives
```

# Dry-run: write to local JSONL file without touching Supabase

npm run store -- --dry-run

# Dry-run archive mode: add the flag too

npm run store -- --archives --dry-run

````

### What It Does

1. **Normal Mode** (`npm run store`):
   - Reads `datasets/out/embedded_chunks.json`
   - Clears the `documents` table (truncate)
   - Batches inserts (10 documents per batch) into `documents`
   - Validates stored embeddings with test query

2. **Archive Mode** (pass `-- --archives` or set `USE_DOCUMENTS_ARCHIVES_TABLE=true`):
   - Reads `datasets/archives/embedded_chunks.json`
   - Clears the `documents_archives` table
   - Batches inserts into `documents_archives`

3. **Dry-run Mode** (`npm run store -- --dry-run`):
   - Reads embeddings (from `out/` or `archives/`)
   - **Skips** Supabase truncate operations
   - Writes documents to a local JSONL file:
     - `datasets/out/stored_documents.jsonl` (normal mode)
     - `datasets/archives/stored_documents.jsonl` (with `--archives`)
   - Maintains output file as read-only for durability
   - Useful for testing or offline inspection

### Troubleshooting

**"401 Unauthorized" from Supabase:**

- Ensure using SERVICE_ROLE key (not anon key)
- Should start with: `sk_service_`

## Full Pipeline Execution

### Option 1: Complete (Recommended)

```pwsh
npm run populate
````

Runs all stages in sequence: merge → chunk → embed → store
Outputs saved to: `datasets/out/`
Typical execution time: 4-6 minutes

### Option 2: Individual Stages

```pwsh
npm run merge         # 1-2 sec
npm run chunk         # 5-10 sec
npm run embed         # 3-5 min
npm run store         # 1-2 min
```

Useful for testing each stage independently.

### Option 3: Archive Mode (Isolated Testing)

Archive mode is enabled by appending `-- --archives` to any of the pipeline
npm scripts (or by setting `USE_DOCUMENTS_ARCHIVES_TABLE=true`). It behaves the
same as normal operation except that:

- All generated files go into `datasets/archives/` instead of `datasets/out/`.
- The storage step targets `documents_archives` instead of `documents`.

```pwsh
# run full pipeline in archive mode
npm run merge -- --archives
npm run chunk -- --archives
npm run embed -- --archives
npm run store -- --archives
```

When archive mode is active the `datasets/archives/` directory will contain:

```
archives/
├─ combined_input.csv
├─ chunks.json
├─ embedded_chunks.json
└─ scrape_backup/   (from dataset scrapers)
```

This mode is useful for experimentation or capturing a snapshot without
overwriting your primary outputs. All generated files are marked read-only.

### Option 4: Add/Update Data

```pwsh
# 1. Edit datasets/manual_entries/manual_entries.csv
# 2. Re-run pipeline
npm run merge
npm run chunk
npm run embed
npm run store
```

## Verification

### Check Merged CSV

```pwsh
# Count total rows (including header)
(Get-Content datasets/out/combined_input.csv | Measure-Object -Line).Lines

# Sample first record
Get-Content datasets/out/combined_input.csv -TotalCount 2
```

### Check Chunks JSON

```pwsh
# Count chunks
(Get-Content datasets/out/chunks.json | ConvertFrom-Json | Measure-Object).Count

# View first chunk structure (requires PowerShell v7+)
Get-Content datasets/out/chunks.json | ConvertFrom-Json | Select-Object -First 1 | ConvertTo-Json
```

### Check Supabase

```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM documents;
SELECT dimension(embedding) FROM documents LIMIT 1;
SELECT id, industry, category FROM documents LIMIT 5;
```

## Performance Metrics

### Typical Execution Times

- Ingest: 1-2 seconds
- Chunk: 5-10 seconds
- Embed: 3-5 minutes (20 requests to OpenAI)

### Estimated Costs

- OpenAI embeddings: ~$0.02-$0.10 per full run
- Supabase storage: Included in free tier

### Data Volume

Currently: ~14,000-19,000 chunks processed per run

## Resetting the Pipeline

```pwsh
# Remove all outputs
Remove-Item datasets/out/combined_input.csv -ErrorAction SilentlyContinue
Remove-Item datasets/out/chunks.json -ErrorAction SilentlyContinue

# Supabase: Truncate documents table
# In Supabase SQL Editor:
# TRUNCATE documents;

# Re-run full pipeline
npm run populate
```

## Next Steps

After successful pipeline execution:

1. **Test vector search** in Supabase SQL Editor
2. **Run backend test suite**: `npm test`
3. **Test RAG queries** in frontend application
4. **Monitor Supabase** for query performance

See [PIPELINE_ADDING_DATASETS.md](PIPELINE_ADDING_DATASETS.md) for adding new datasets.
