# Data Pipeline: Adding & Processing New Datasets

Complete guide for sourcing, preparing, and integrating new circular economy datasets into the system.

## Overview

### Dataset Lifecycle

New datasets follow this standard flow:

Source (Web/File)

- Extract/Transform (dataset scripts)
- Standardize Format (CSV with standard columns)
- Register in DATASETS array (utils/datasetsUtils.js)
- Merge into combined CSV (pipeline/merge_datasets.js)
- Chunk into semantic units (pipeline/generate_chunks.js)
- Generate embeddings (pipeline/generate_embeddings.js)
- Store in Supabase (pipeline/store_embeddings.js)

### File I/O Best Practices

All backend scripts use `utils/datasetsUtils.js` helpers for consistent file handling:

- **Automatic Directory Creation:** Parent directories created if missing
- **Path Constants:** Use exported constants (e.g., `DATASETS_PROCESSED_DIR`) instead of hardcoded strings
- **First Write:** Empty file created immediately so paths exist for downstream scripts
- **Permission Management:** Files unlocked before write, re-locked after (prevents manual interference)
- **Batch Stages:** Multi-write stages (embeddings, scraping backups) clear on first write, then flush repeatedly with locking
- **Scraper Backups:** Intermediate saves to `datasets/archives/scrape_backup/<dataset_key>/` for recovery
- **Final Output:** Processed CSVs written to `datasets/processed/` following standardized format

## Step 1: Register Dataset in DATASETS Array

Before creating scripts, add your dataset to the registry in `backend/utils/datasetsUtils.js`:

```js
{
  key: 'my_source',           // Unique short identifier
  name: 'My Data Source',      // Human-readable title
  raw_folder: 'my_source',     // null if no raw folder (web-scraped)
  processed_csv: 'my_source_processed.csv',  // Output filename
  scrape_script: scrape_script_path || null,
  extract_script: extract_script_path || null,
  source_url: 'https://example.com',  // Primary source URL
  urls: {                      // Additional URLs (keyed by purpose)
    api: 'https://api.example.com/v2/data',
    listing: 'https://example.com/list?page=',
  },
  raw_folder_contents: {       // Maps property names to actual filenames
    primary_csv: 'input.csv',
    supplementary: 'additional_data.xlsx',
    // null if not applicable
  },
  scrape_backup_folder: 'my_source_scrape_backup',  // null if no scraping
}
```

**Why register?**

- Get path helpers that work with your key: `getDatasetRawDir('my_source')`
- Enable backup recovery for scrapers: `getDatasetBackupCsvPath('my_source')`
- Automatic prefix generation for IDs
- Documentation consistency

## Step 2: Source Your Data

### Option A: Web Scraping with Puppeteer

**When to use:** Data is on a website without direct download or API

1. **Create script:** `datasets/scripts/scrape_my_source.js`

2. **Import utilities from datasetsUtils.js:**

   ```js
   import puppeteer from 'puppeteer';
   import {
     DATASET_LOOKUP,
     getBrowserLaunchOptions,
     getViewportOptions,
     getUserAgentOptions,
     getExtraHttpHeaders,
     createBackupHelper,
     isBackupRecoveryMode,
     readBackupCsv,
     writeCsv,
     getDatasetProcessedCsvPath,
     CSV_COLUMNS,
     STRINGIFY_OPTIONS,
     randomDelay,
     cleanText,
     formatId,
   } from '#utils/datasetsUtils.js';

   const DATASET_KEY = 'my_source';
   const BACKUP_INTERVAL = 3; // flush backup every 3 pages
   ```

3. **Use backup recovery pattern:**

   ```js
   async function main() {
     if (isBackupRecoveryMode()) {
       console.log('♻️ BACKUP RECOVERY MODE...');
       // Rebuild from saved backup instead of scraping
       const backupRows = await readBackupCsv(DATASET_KEY);
       // ... apply filtering/deduplication
       const csvPath = getDatasetProcessedCsvPath(DATASET_KEY);
       await writeCsv(csvPath, finalizedRows);
       return;
     }

     // Normal scraping with periodic backups
     const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, true);
     const browser = await puppeteer.launch(getBrowserLaunchOptions());

     try {
       for (const page of pages) {
         const rows = await scrapePage(page);
         await backup.add(rows); // Auto-flushes every 3 calls
         console.log(`✓ Page ${page}: ${rows.length} rows`);
       }
       await backup.flush(); // Final flush

       const csvPath = getDatasetProcessedCsvPath(DATASET_KEY);
       await writeCsv(csvPath, allRows);
     } finally {
       await browser.close();
     }
   }

   main().catch(console.error);
   ```

4. **Puppeteer helper functions:**

   ```js
   // All these are imported from datasetsUtils.js
   const browser = await puppeteer.launch(getBrowserLaunchOptions());
   const page = await browser.newPage();

   // Standard settings across all scrapers
   await page.setViewport(getViewportOptions());
   await page.setUserAgent(getUserAgentOptions());
   await page.setExtraHTTPHeaders(getExtraHttpHeaders());

   // Random delays between requests (prevents blocking)
   await page.goto(url);
   await page.waitForTimeout(randomDelay());
   ```

5. **Add file-level JSDoc header:**

   ```js
   /**
    * scrape_my_source.js
    *
    * Scrapes circular economy data from My Data Source.
    * Extracts product details including specs and impact metrics.
    *
    * Features:
    *   - Pagination with retry logic (max 5 attempts per page)
    *   - Per-product detail extraction
    *   - Quality filtering (excludes incomplete entries)
    *   - Backup & recovery system (--use-backup flag)
    *
    * Usage:
    *   node scrape_my_source.js                 # Normal run
    *   node scrape_my_source.js --show          # Debug with visible browser
    *   node scrape_my_source.js --use-backup    # Rebuild from backup
    *   node scrape_my_source.js --append        # Add rows to existing CSV
    *
    * Output: datasets/processed/my_source_processed.csv
    * Backup: datasets/archives/scrape_backup/my_source_scrape_backup/
    */
   ```

6. **Run the scraper:**

```pwsh
# Normal run (headless)
node datasets/scripts/scrape_my_source.js

# Debug with browser window
node datasets/scripts/scrape_my_source.js --show

# If interrupted, rebuild from backup
node datasets/scripts/scrape_my_source.js --use-backup

# Add new rows to existing CSV
node datasets/scripts/scrape_my_source.js --append
```

### Option B: PDF Extraction

**When to use:** Data is contained in PDF documents

1. **Create script:** `datasets/scripts/extract_my_source.js`

2. **Use pdf-parse and utilities:**

   ```js
   import pdf from 'pdf-parse';
   import fs from 'fs';
   import {
     getDatasetRawDir,
     getDatasetProcessedCsvPath,
     writeCsv,
     cleanText,
     formatId,
     CSV_COLUMNS,
     STRINGIFY_OPTIONS,
   } from '#utils/datasetsUtils.js';

   const DATASET_KEY = 'my_source';

   async function main() {
     const rawDir = getDatasetRawDir(DATASET_KEY);
     const pdfPath = `${rawDir}/document.pdf`;

     // Read and parse PDF
     const pdfBuffer = fs.readFileSync(pdfPath);
     const data = await pdf(pdfBuffer);
     const text = data.text;

     // Extract structured data (parse text into rows)
     const rows = [];
     // ... your extraction logic ...

     // Format for CSV output
     rows.forEach((row, index) => {
       row.ID = formatId(DATASET_KEY, index + 1);
       row.problem = cleanText(row.problem);
       row.solution = cleanText(row.solution);
       // ... standardize other columns ...
     });

     // Write standardized CSV
     const csvPath = getDatasetProcessedCsvPath(DATASET_KEY);
     await writeCsv(csvPath, rows, { clear: true });

     console.log(`✓ Extracted ${rows.length} rows to ${csvPath}`);
   }

   main().catch(console.error);
   ```

3. **Add JSDoc header describing parsing logic**

4. **Run the extractor:**

```pwsh
node datasets/scripts/extract_my_source.js
```

### Option C: CSV/JSON File Extraction

**When to use:** Data provided as downloadable files

1. **Create directory:** `datasets/raw/my_source/`
2. **Place raw file:** `datasets/raw/my_source/data.csv` (or .json, .xlsx)
3. **Create extraction script:** `datasets/scripts/extract_my_source.js`

```js
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import {
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  formatId,
  cleanText,
  CSV_COLUMNS,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = 'my_source';

async function main() {
  const rawDir = getDatasetRawDir(DATASET_KEY);
  const inputPath = path.join(rawDir, 'data.csv');

  // Read and parse CSV
  const fileContent = fs.readFileSync(inputPath, 'utf-8');
  const records = parse(fileContent, { columns: true });

  // Transform to standard format
  const rows = records.map((record, index) => ({
    ID: formatId(DATASET_KEY, index + 1),
    problem: cleanText(record.problem_field || ''),
    solution: cleanText(record.solution_field || ''),
    materials: record.materials || '',
    circular_strategy: record.strategy || '',
    category: record.category || '',
    impact: record.impact || '',
    source_url: 'https://example.com',
    metadata_json: JSON.stringify({
      original_id: record.id,
      // ... other metadata ...
    }),
  }));

  // Write to processed/
  const csvPath = getDatasetProcessedCsvPath(DATASET_KEY);
  await writeCsv(csvPath, rows, { clear: true });

  console.log(`✓ Processed ${rows.length} records`);
}

main().catch(console.error);
```

### Option D: API Data Fetching

**When to use:** Data available via REST or GraphQL API

```js
import axios from 'axios';
import {
  DATASET_LOOKUP,
  getDatasetProcessedCsvPath,
  writeCsv,
  formatId,
  cleanText,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = 'my_source';

async function main() {
  const dataset = DATASET_LOOKUP[DATASET_KEY];
  const apiUrl = dataset.urls.api; // From registry

  // Fetch via API
  const response = await axios.get(apiUrl, {
    params: { limit: 1000, sort: '-date' },
    timeout: 10000,
  });

  const records = response.data.results;

  // Transform to standard CSV format
  const rows = records.map((record, index) => ({
    ID: formatId(DATASET_KEY, index + 1),
    problem: cleanText(record.problem),
    solution: cleanText(record.solution),
    // ... map other fields ...
  }));

  const csvPath = getDatasetProcessedCsvPath(DATASET_KEY);
  await writeCsv(csvPath, rows, { clear: true });

  console.log(`✓ Fetched and processed ${rows.length} records`);
}

main().catch(console.error);
```

## Step 3: Standardize CSV Format

All datasets must follow the same CSV structure for pipeline compatibility:

### CSV Schema

**Header (unquoted):**

```txt
ID,problem,solution,materials,circular_strategy,category,impact,source_url,metadata_json
```

**Data rows (fully quoted):**

```csv
"c2c_00001","Product certification system for cradle-to-cradle design principles","Implement material tracking and lifecycle assessment standards","plastics,metals,textiles","design_for_recycling","product_design","Enables circular material flows","https://c2ccertified.org","{\"certifications\": \"C2C Gold\", \"region\": \"global\"}"
```

### Column Definitions

| Column              | Type   | Required | Notes                                                                |
| ------------------- | ------ | -------- | -------------------------------------------------------------------- |
| `ID`                | String | Yes      | Unique identifier: `prefix_NNNNN` (use `formatId()` helper)          |
| `problem`           | String | Yes      | Describe the circular economy challenge (20+ chars)                  |
| `solution`          | String | Yes      | Describe the proposed solution approach (20+ chars)                  |
| `materials`         | String | No       | Comma-separated material types (e.g., \"plastics,metals\")           |
| `circular_strategy` | String | No       | R-strategy: reduce, reuse, repair, refurbish, recycle, recover, etc. |
| `category`          | String | No       | Industry/sector category                                             |
| `impact`            | String | No       | Environmental or economic impact metrics                             |
| `source_url`        | String | No       | URL to original source/case study                                    |
| `metadata_json`     | String | No       | Additional structured data as JSON object                            |

### ID Format

Use the `formatId()` helper from datasetsUtils.js:

```js
import { formatId, ID_DIGITS } from '#utils/datasetsUtils.js';

// With ID_DIGITS=5 (default)
formatId('c2c', 1); // → 'c2c_00001'
formatId('c2c', 42); // → 'c2c_00042'
formatId('c2c', 100000); // → 'c2c_100000' (auto-expands beyond 5 digits)
```

**Why use the helper?** It handles overflow automatically and keeps IDs consistent across all datasets.

### Text Sanitization

Use `cleanText()` from datasetsUtils.js for CSV compatibility:

```js
import { cleanText } from '#utils/datasetsUtils.js';

cleanText('Problem: \"Waste\" in\\nSupply chains');
// → 'Problem: Waste in Supply chains'
```

This removes:

- Surrounding whitespace
- Newlines and tabs
- Double quotes
- Other problematic CSV characters

### CSV Writing with Standard Options

```js
import { writeCsv, CSV_COLUMNS, STRINGIFY_OPTIONS } from '#utils/datasetsUtils.js';

// Write with automatic formatting
await writeCsv(csvPath, rows, { clear: true });

// rows is an array of objects with CSV_COLUMNS keys
// STRINGIFY_OPTIONS ensures proper quoting and escaping
```

## Step 4: Register Dataset Scripts with Orchestrator

The `pipeline/run_datasets_scripts.js` orchestrator can run all scripts automatically:

```pwsh
# Run ALL extraction scripts first, then scraper scripts
node pipeline/run_datasets_scripts.js

# Or via npm
npm run datasets-scripts
```

The orchestrator:

1. Discovers all `datasets/scripts/extract_*.js` files
2. Runs them sequentially, aborting on first error
3. Then discovers all `datasets/scripts/scrape_*.js` files
4. Runs them sequentially

Add your script and it will be included automatically (no registration needed).

## Step 5: Verify Output

After running your dataset script:

```pwsh
# Check if processed CSV was created
ls datasets/processed/my_source_processed.csv

# Verify header row
head -n 1 datasets/processed/my_source_processed.csv

# Count rows
(cat datasets/processed/my_source_processed.csv | Measure-Object -Line).Lines - 1
```

Expected output:

```powershell
ID,problem,solution,materials,circular_strategy,category,impact,source_url,metadata_json
"my_src_00001","Problem description","Solution description",...
```

## Step 6: Test the Pipeline

After creating your dataset script, test the full pipeline:

```pwsh
# Merge all datasets (including new one)
npm run merge

# Chunk the merged data
npm run chunk

# Generate embeddings (test mode)
npm run embed -- --dry-run

# Dry-run storage to verify JSON format
npm run store -- --dry-run
```

All stages should complete without errors.

## Documentation Best Practices

### File-Level Headers (Required)

Every script needs a clear header block:

```js
/**
 * extract_my_source.js
 *
 * Extracts circular economy case studies from My Data Source database.
 * Parses structured product/solution pairs with environmental metrics.
 *
 * Features:
 *   - Batch processing of 100+ records
 *   - Quality scoring based on data completeness
 *   - Deduplication by source URL
 *   - Metadata enrichment with category assignments
 *
 * Usage:
 *   node extract_my_source.js                  # Normal run
 *   node extract_my_source.js --append         # Add to existing CSV
 *
 * Input:
 *   - datasets/raw/my_source/input.xlsx
 *
 * Output:
 *   - datasets/processed/my_source_processed.csv
 *
 * Dependencies:
 *   - xlsx (for Excel parsing)
 *   - utils/datasetsUtils.js (for path helpers and CSV writing)
 */
```

### Function Documentation

For key functions, add JSDoc comments:

```js
/**
 * Scores a record based on data completeness and relevance.
 * @param {Object} record - The data record to score
 * @param {string} record.problem - Problem description
 * @param {string} record.solution - Solution description
 * @returns {number} Quality score from 0-100
 * @throws {Error} If required fields are missing
 */
function scoreRecord(record) {
  // implementation...
}
```

### Examples to Reference

Look at existing well-documented scripts:

- `scrape_c2c.js` – Puppeteer pagination with backup
- `extract_epa_tri.js` – Multi-dimensional CSV with quality scoring
- `extract_cgr_2025.js` – PDF text extraction with structured output

  > npm run datasets-scripts

  ```pwsh
  # This will run all extraction and scraping scripts
  ```

## Step 2: Optional - Transform & Extract

**If source data is unstructured** (e.g., extracted from PDF, messy export):

### Using Dataset Scripts

1. **Create transformation script** in `datasets/scripts/`:

   ```pwsh
   # Transform source data to problem/solution pairs
   # (JavaScript code - same for all shells)
   import fs from 'fs';
   import { parse } from 'csv-parse/sync';

   const raw = parse(fs.readFileSync('input.csv'), { columns: true });
   const transformed = raw.map((row) => ({
     problem: row['field_describing_problem'] || row['description'],
     solution: row['field_describing_solution'] || row['approach'],
     materials: row['materials'] || '',
     circular_strategy: extractStrategy(row),
     category: row['category'] || 'General',
     impact: row['impact'] || 'Not specified',
     source_url: row['url'] || '',
   }));

   fs.writeFileSync('output.csv', formatAsCSV(transformed));
   ```

2. **Run transformation:**

   ```pwsh
   node datasets/scripts/transform_new_source.js
   ```

3. **Output:** `datasets/raw/new_source/transformed.csv` (or use path helpers)

### If Using GenAI Extraction

For complex documents (case studies, PDFs), use Claude/ChatGPT to extract problem/solution pairs:

```python
# Python script to extract from text using Claude API
import anthropic

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-3-sonnet-20240229",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": f"""Extract problem and solution from this text.
Return CSV format: problem,solution,materials,strategy,category,impact,source_url

Text: {document_text}"""
        }
    ]
)
```

## Step 3: Standardize Format

All datasets must match this format before processing:

### Required Columns

```csv
ID,problem,solution,materials,circular_strategy,category,impact,source_url,metadata_json
```

### Field Specifications

- **ID:** Unique identifier. The project default uses 5 digits (controlled by the `ID_DIGITS` constant in `datasetsUtils.js`) and is formatted as `prefix_NNNNN` (e.g., `new_00001`). Use `formatId()` from `datasetsUtils.js` to generate IDs consistently.
- **problem:** ≥20 chars, clear description of circular economy challenge
- **solution:** ≥20 chars, actionable approach to address problem
- **materials:** List of materials involved (empty if N/A)
- **circular_strategy:** R-strategy (Rethink, Reduce, Reuse, Repair, Recycle, Recover)
- **category:** Industry/domain (Construction, Fashion, Waste, etc.)
- **impact:** Quantified or qualitative impact (e.g., "90% waste reduction", "500 tons CO2 saved")
- **source_url:** URL to original source (empty if N/A)

### Example CSV

```csv
ID,problem,solution,materials,circular_strategy,category,impact,source_url,metadata_json
"new_00001","Urban construction creates 500M tons waste annually","Implement modular building systems for deconstruction and reuse","Steel, Concrete, Wood","Reuse","Construction","60% waste reduction","https://example.com/case1",""
"new_00002","Fashion industry produces 92M tons textile waste","Design fast-fashion for durability and end-of-life recycling","Polyester, Cotton, Wool","Recycle","Fashion","80% textile recovery","https://example.com/case2",""
```

### How to Standardize

1. **Manual editing:** If dataset is small (<500 rows)
   - Open in Excel/Google Sheets
   - Map source columns to standard format
   - Ensure quotes around all data cells
   - Export as CSV

2. **Programmatic:** If dataset is large (>500 rows)
   - Create standardization script
   - Map source columns → standard columns
   - Validate ID format and generate if needed
   - Write to CSV with proper quoting

3. **Validation script:**

   ```pwsh
   node datasets/scripts/validate_csv.js datasets/raw/new_source/data.csv
   # Checks: headers match, quotes consistent, IDs unique
   ```

## Step 4: Move to Processed

Once standardized, move to processed directory:

```pwsh
# Move standardized CSV
Move-Item datasets/raw/new_source/data.csv datasets/processed/new_source.csv

# Or if using a specific prefix
Move-Item datasets/raw/new_source/data.csv datasets/processed/new_data.csv
```

### File Naming Convention

- **processed/** filename should be: `{prefix}_cases.csv` or `{prefix}_data.csv` or `{prefix}_registry.csv`
- Examples: `new_data.csv`, `new_cases.csv`, `new_registry.csv`

## Step 5: Register in Configuration

**Note:** The merge script automatically discovers all CSV files in `datasets/processed/` and `datasets/manual_entries/`, so no manual configuration is required. Just place your standardized CSV in one of those directories.

If you want to track the dataset metadata (source URL, documentation, etc.) for reference, add an entry to the DATASETS registry in `utils/datasetsUtils.js` (optional, for documentation purposes only).

## Step 6: Run the Merge

### If Adding a Full New Dataset

1. Standardize the CSV in `datasets/processed/` format
2. Run merge command:

```pwsh
npm run merge    # Merges all processed/*.csv and manual_entries.csv
```

The merge script automatically discovers all CSV files in both directories.

### If Adding Just a Few Records

1. **Add to:** `datasets/manual_entries/manual_entries.csv`
2. **Run merge:**

   ```pwsh
   npm run merge  # Merges manual_entries.csv with all processed/*.csv files
   ```

## Step 7: Full Pipeline

Once dataset is prepared:

```pwsh
npm run merge    # Merge new dataset into combined_input.csv (duplicates removed automatically)
npm run chunk    # Split into semantic chunks
npm run embed    # Generate embeddings
npm run store    # Store embeddings in Supabase (datasets/out/embedded_chunks.json → documents); add -- --archives or set USE_DOCUMENTS_ARCHIVES_TABLE=true to target archives output/table
```

Or run complete pipeline:

```pwsh
npm run populate  # Runs: merge → chunk → embed → store
```

## Step 8: Validation & Quality Checks

### Pre-Pipeline Checks

1. **Check file exists:**

   ```pwsh
   Get-ChildItem datasets/processed/new_data.csv | Format-List FullName, Length
   ```

2. **Check format:**

   ```pwsh
   Get-Content datasets/processed/new_data.csv -TotalCount 2
   # Should show: header row (unquoted) + first data row (quoted)
   ```

3. **Check row count:**

   ```pwsh
   (Get-Content datasets/processed/new_data.csv | Measure-Object -Line).Lines
   ```

4. **Validate CSV:**

   ```pwsh
   node datasets/scripts/check_csv.js datasets/processed/new_data.csv
   ```

### Post-Pipeline Checks

After running `npm run merge`:

```pwsh
# Check combined_input.csv includes new records
Select-String "new_00001" datasets/out/combined_input.csv

# Check row count increases
(Get-Content datasets/out/combined_input.csv | Measure-Object -Line).Lines
```

If you ran the merge command with `-- --archives` then inspect the
archives output instead:

```pwsh
Select-String "new_00001" datasets/archives/combined_input.csv
```

## Common Issues & Fixes

### Issue: New dataset not appearing in ingest

**Problem:** Merge script doesn't recognize new CSV location

**Fix:**

1. Verify file is in `datasets/processed/` or `datasets/manual_entries/`
2. Ensure filename ends with `.csv`
3. Check for permission issues: `Get-ChildItem -Force datasets/processed/`

## 4. Re-run: `npm run merge`

### Issue: ID format validation errors

**Problem:** IDs not in `prefix_NNNNN` format

**Fix:**

1. Generate IDs programmatically before CSV write
2. Ensure IDs are unique per dataset
3. Use 5-digit zero-padded numbers: `new_00001`, `new_00002`, `new_00100`

### Issue: Problem/solution fields missing

**Problem:** Source data doesn't have these explicit columns

**Fix:**

1. Ensure CSV is placed in `datasets/processed/`
2. Map available columns to problem/solution
3. Or manually create these fields before standardizing

### Issue: Chunking produces wrong output

**Problem:** Combined CSV has parsing errors

**Fix:**

1. Check quotes are consistent throughout
2. Verify header row is unquoted
3. Verify all data rows are quoted
4. Check for embedded newlines in fields (may need escaping)

## Testing New Dataset Integration

### End-to-End Test

```pwsh
# 1. Place new dataset
Copy-Item my_data.csv datasets/processed/

# 2. Merge datasets
npm run merge

# 3. Check merged output
Select-String "my_001" datasets/out/combined_input.csv

# 4. Chunk
npm run chunk

# 5. Verify chunks.json - filter chunks by source_id containing "my_" and show first 5
$chunks = Get-Content datasets/out/chunks.json | ConvertFrom-Json
$chunks | Where-Object { $_.metadata.source_id -like '*my_*' } | Select-Object -First 5 | ConvertTo-Json

# 6. Generate embeddings (dry-run first)
npm run embed -- --dry-run

# 7. Store in Supabase (dry-run first)
npm run store -- --dry-run

# 8. Full embed and store
npm run embed
npm run store
```

## Summary: Dataset Integration Workflow

1. ✓ Source data (web scrape, PDF extract, direct file)
2. ✓ Transform/Extract if needed
3. ✓ Standardize format (headers, quoting, IDs)
4. ✓ Move to `datasets/processed/` or add to `datasets/manual_entries/`
5. ✓ Run merge: `npm run merge`
6. ✓ Verify in combined_input.csv
7. ✓ Continue with chunking and embedding: `npm run populate`
8. ✓ Verify in Supabase

That's it! Your dataset is now available for RAG retrieval.
