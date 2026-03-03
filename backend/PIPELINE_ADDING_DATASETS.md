# Data Pipeline: Adding & Processing New Datasets

Complete guide for sourcing, preparing, and integrating new circular economy datasets into the system.

## Overview

> **Filesystem behaviour:** all backend scripts (pipeline & dataset) will
> automatically create any missing output directories before writing data. On
> the very first write they touch an empty file so that the presence of the
> output path is guaranteed, and after a script completes the generated file is
> marked read-only. When a stage produces multiple batches (embeddings,
> backups) the target file is cleared at the start of the run and remains locked
> between writes; the file is also repeatedly flushed during the processing loop
> so you can inspect progress mid‑flight. Scripts that append data (scrapers,
> dry‑run storage) will temporarily unlock the file on each write.

> New datasets go through a lifecycle:

```
Source (Web/File) → Extract/Transform → Standardize Format → Process → Merge → Pipeline
```

## Step 1: Source Your Data

npm run merge

**When to use:** Data is on a website without direct download

1. **Identify target:** Website URL, data format (table, JSON, PDF)

2. **Create scraper script** in `datasets/scripts/`:

   ```javascript
   // datasets/scripts/scrape_new_source.js
   import axios from 'axios';
   import { parse } from 'csv-parse/sync';
   import fs from 'fs';
   import path from 'path';
   // use canonical path constants instead of hard‑coding strings
   import { DATASETS_RAW_DIR } from '#utils/datasetsUtils.js';

   const url = 'https://example.com/data';
   const response = await axios.get(url);
   const data = parse(response.data, { columns: true });

   // write into the raw folder using the constant
   fs.writeFileSync(path.join(DATASETS_RAW_DIR, 'new_source', 'data.csv'), data);
   ```

   > **Note:** if your scraper uses Puppeteer you can import
   > `getBrowserLaunchOptions`, `getViewportOptions`, `getUserAgentOptions`
   > and `getExtraHttpHeaders` from `#utils/datasetsUtils.js`. These helpers
   > centralize common settings and support the `--show` CLI flag which
   > toggles a visible browser window for debugging:
   >
   > ```bash
   > node datasets/scripts/scrape_new_source.js --show
   > ```
   >
   > **Implementing Backup & Recovery:** to add robustness against network
   > interruptions, import `createBackupHelper`, `isBackupRecoveryMode`, and
   > `readBackupCsv` from `#utils/datasetsUtils.js`. These enable:
   >
   > - Saving intermediate results every N pages to `datasets/archives/scrape_backup/`
   > - Automatic console logging for feedback (✅ Backup saved, ⚠️️️ Backup failed)
   > - Rebuild mode: `node script.js --use-backup` rebuilds final CSV from saved backups
   >
   > Example pattern in your scraper:
   >
   > ```javascript
   > import {
   >   createBackupHelper,
   >   isBackupRecoveryMode,
   >   readBackupCsv,
   >   writeCsv,
   >   getDatasetOutputPath,
   > } from '#utils/datasetsUtils.js';
   >
   > const BACKUP_INTERVAL = 3; // flush every 3 pages
   > const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, true);
   >
   > async function main() {
   >   if (isBackupRecoveryMode()) {
   >     console.log('♻️ BACKUP RECOVERY MODE...');
   >     await rebuildFromBackup();
   >     return;
   >   }
   >
   >   // Normal scraping loop:
   >   for (const page of pages) {
   >     const rows = await scrapePage(page);
   >     await backup.add(rows); // auto-flushes every 3 calls
   >   }
   >   await backup.flush(); // final flush
   >   await writeCsv(outputPath, finalRows);
   > }
   > ```
   >
   > See the existing scrapers (scrape_c2c.js, scrape_ecesp.js, etc.) for full examples.

### Script Documentation Best Practices

When creating new extraction or scraping scripts, follow these documentation conventions to keep the codebase maintainable:

> **File-level header:** Add a JSDoc block at the top of every script describing:
>
> - **Purpose:** What dataset is extracted and from where
> - **Features:** Key capabilities (pagination, parsing method, backup support, etc.)
> - **Usage:** How to run the script, including CLI flags (e.g., `--show`, `--use-backup`)
> - **Input/Output:** File paths and formats for data sources and outputs
> - **Dependencies:** External requirements (APIs, Python scripts, special libraries)
>
> Example:
>
> ```javascript
> /**
>  * scrape_my_source.js
>  *
>  * Scrapes circular economy data from My Data Source registry.
>  * Extracts product details including certifications and environmental metrics.
>  *
>  * Features:
>  *   - Pagination handling with retry logic
>  *   - Per-product detail extraction
>  *   - Quality scoring based on data completeness
>  *   - Backup system with recovery mode
>  *
>  * Usage:
>  *   node scrape_my_source.js                 # normal run
>  *   node scrape_my_source.js --use-backup    # rebuild from backup
>  *   node scrape_my_source.js --show          # show browser window
>  *
>  * For detailed logs, see the path printed at the start of the run.
>  */
> ```

> **Function documentation:** Add JSDoc comments to key functions with parameter and return types:
>
> ```javascript
> /**
>  * Score items based on completeness and relevance metrics.
>  * @param {string} description - Item description text
>  * @param {number} dataCompleteness - Percentage of available fields (0-100)
>  * @returns {number} Quality score from 0 to 100
>  */
> function scoreItem(description, dataCompleteness) {
>   // implementation...
> }
> ```
>
> Refer to [DATASETS_REFERENCE.md](DATASETS_REFERENCE.md#script-documentation) for examples of well-documented scripts like `scrape_c2c.js` and `extract_cgr_2025.js`.

3. **Run scraper:**

   ```bash
   node datasets/scripts/scrape_new_source.js
   ```

> **Tip:** when you have multiple extractor/scraper scripts in the project
> you don't need to invoke them one at a time. A runner script exists at
> `backend/pipeline/run_datasets_scripts.js` which will sequentially execute
> all `extract_*.js` scripts before the `scrape_*.js` ones and will exit on
> the first error. You can call it directly or via the npm shortcut:

```bash
npm run datasets-scripts
```

> **When to use:** Data is in PDF documents

1. **Use Puppeteer + PDF parser** (already in dependencies)

2. **Create extraction script:**

   ```javascript
   import pdfParser from 'pdf-parse';
   import fs from 'fs';

   const pdf = await pdfParser(fs.readFileSync('file.pdf'));
   const text = pdf.text;
   // Parse text into problem/solution structure
   ```

3. **Convert extracted data to CSV** with headers matching standard format

4. **Output:** CSV in `datasets/raw/new_source/`

### Option C: Direct File Upload

**When to use:** Data provided as CSV/JSON file

1. **Create directory:** `datasets/raw/new_source/` (or use `DATASETS_RAW_DIR` constant) 2. **Place file:** `datasets/raw/new_source/data.csv` 3. **Create README:** `datasets/raw/new_source/README.md` describing the source

## Step 2: Optional - Transform & Extract

**If source data is unstructured** (e.g., extracted from PDF, messy export):

### Using Dataset Scripts

1. **Create transformation script** in `datasets/scripts/`:

   ```javascript
   // Transform source data to problem/solution pairs
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

   ```bash
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
   ```bash
   node datasets/scripts/validate_csv.js datasets/raw/new_source/data.csv
   # Checks: headers match, quotes consistent, IDs unique
   ```

## Step 4: Move to Processed

Once standardized, move to processed directory:

```bash
# Move standardized CSV
mv datasets/raw/new_source/data.csv datasets/processed/new_source.csv

# Or if using a specific prefix
mv datasets/raw/new_source/data.csv datasets/processed/new_data.csv
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

```bash
npm run merge    # Merges all processed/*.csv and manual_entries.csv
```

The merge script automatically discovers all CSV files in both directories.

### If Adding Just a Few Records

1. **Add to:** `datasets/manual_entries/manual_entries.csv`
2. **Run merge:**
   ```bash
   npm run merge  # Merges manual_entries.csv with all processed/*.csv files
   ```

## Step 8: Full Pipeline

Once dataset is prepared:

```bash
npm run merge    # Merge new dataset into combined_input.csv
npm run chunk    # Split into semantic chunks
npm run embed    # Generate embeddings
npm run store    # Store embeddings in Supabase (datasets/out/embedded_chunks.json → documents)
npm run store:archives  # Store archive embeddings (datasets/archives/embedded_chunks.json → documents_archives)
```

Or run complete pipeline:

```bash
npm run populate  # Runs: merge → chunk → embed → store
```

## Step 9: Validation & Quality Checks

### Pre-Pipeline Checks

1. **Check file exists:**

   ```bash
   ls -lh datasets/processed/new_data.csv
   ```

2. **Check format:**

   ```bash
   head -2 datasets/processed/new_data.csv
   # Should show: header row (unquoted) + first data row (quoted)
   ```

3. **Check row count:**

   ```bash
   wc -l datasets/processed/new_data.csv
   ```

4. **Validate CSV:**
   ```bash
   node datasets/scripts/check_csv.js datasets/processed/new_data.csv
   ```

### Post-Pipeline Checks

After running `npm run merge`:

```bash
# Check combined_input.csv includes new records
grep "new_00001" datasets/out/combined_input.csv

# Check row count increases
wc -l datasets/out/combined_input.csv
```

Or if using archives mode:

```bash
grep "new_00001" datasets/archives/combined_input.csv
```

## Common Issues & Fixes

### Issue: New dataset not appearing in ingest

**Problem:** Merge script doesn't recognize new CSV location

**Fix:**

1. Verify file is in `datasets/processed/` or `datasets/manual_entries/`
2. Ensure filename ends with `.csv`
3. Check for permission issues: `ls -la datasets/processed/`

# 4. Re-run: `npm run merge`

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

```bash
# 1. Place new dataset
cp my_data.csv datasets/processed/

# 2. Merge datasets
npm run merge

# 3. Check merged output
grep "my_001" datasets/out/combined_input.csv

# 4. Chunk
npm run chunk

# 5. Verify chunks.json
jq '.\[] | select(.metadata.source_id | contains("my_"))' datasets/out/chunks.json | head -5

# 6. Generate embeddings (dry-run first)
npm run embed -- --dry-run

# 7. Store in Supabase (dry-run first)
npm run store -- --dry-run

# 8. Full embed and store
npm run embed
npm run store
```

## Summary: Dataset Integration Workflow

1. ✅ Source data (web scrape, PDF extract, direct file)
2. ✅ Transform/Extract if needed
3. ✅ Standardize format (headers, quoting, IDs)
4. ✅ Move to `datasets/processed/` or add to `datasets/manual_entries/`
5. ✅ Run merge: `npm run merge`
6. ✅ Verify in combined_input.csv
7. ✅ Continue with chunking and embedding: `npm run populate`
8. ✅ Verify in Supabase

That's it! Your dataset is now available for RAG retrieval.
