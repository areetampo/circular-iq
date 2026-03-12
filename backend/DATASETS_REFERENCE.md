# Datasets Reference: Complete Integration Guide

Complete reference for all 34 datasets integrated into the circular economy system, datasetsUtils.js utilities, and processing pipeline documentation.

## Quick Links

- **Dataset Registry:** All metadata in `backend/utils/datasetsUtils.js` (DATASETS array)
- **Path Constants:** Centralized filesystem paths in `datasetsUtils.js`
- **Processing Scripts:** `datasets/scripts/scrape_*.js` (Puppeteer) and `extract_*.js` (parsers)
- **Pipeline Guide:** See [PIPELINE_RUNNING.md](PIPELINE_RUNNING.md) for execution
- **Adding Datasets:** See [PIPELINE_ADDING_DATASETS.md](PIPELINE_ADDING_DATASETS.md) for setup

## Script Documentation Standards

All dataset extraction and scraping scripts follow comprehensive documentation conventions:

### File-Level Headers (Required)

Each script (`datasets/scripts/scrape_*.js` and `datasets/scripts/extract_*.js`) includes a JSDoc header block with:

- **Purpose:** What dataset is extracted and from where
- **Features:** Key capabilities (pagination, parsing method, backup support, etc.)
- **Usage:** How to run the script with CLI flags
  - `--show` (scrapers only): Debug with visible browser window
  - `--use-backup`: Rebuild from saved backup CSV (scrapers only)
  - `--append`: Add new rows to existing CSV with sequential IDs
- **Input/Output:** File paths and formats for sources and outputs
- **Dependencies:** Required APIs, Python scripts, special libraries

### Function Documentation

Key functions include JSDoc comments:

```javascript
/**
 * Fetches and parses data from source
 * @param {string} url - The source URL
 * @returns {Promise<Array>} Array of parsed records
 * @throws {Error} If fetch fails
 */
async function fetchData(url) { ... }
```

**IDE Support:** Browse function signatures using Ctrl+Space (autocomplete) in your editor.

### Example Scripts

- `scrape_c2c.js` – Cradle-to-Cradle certified products (Puppeteer pagination)
- `extract_cgr_2025.js` – Circularity Gap Report PDF extraction
- `extract_epa_tri.js` – EPA pollution data with multi-dimensional scoring
- `scrape_ecesp.js` – European circular economy practices (dynamic pagination)
- `extract_fashion_transparency.js` – Supply chain transparency analysis
- `scrape_metabolic.js` – Metabolic publications with multi-format handling

## datasetsUtils.js: Centralized Utilities

The `utils/datasetsUtils.js` module is the single source of truth for all dataset operations. It provides:

### Path Constants

Used throughout scripts instead of hardcoded relative paths:

```javascript
import {
  BACKEND_ROOT,
  DATASETS_DIR,
  DATASETS_RAW_DIR,
  DATASETS_PROCESSED_DIR,
  DATASETS_MANUAL_ENTRIES_DIR,
  DATASETS_SCRIPTS_DIR,
  DATASETS_ARCHIVES_DIR,
  DATASETS_SCRAPE_BACKUP_DIR,
  DATASETS_OUTPUT_DIR,
  COMBINED_INPUT_CSV,
  CHUNKS_JSON,
  EMBEDDED_CHUNKS_JSONL,
  STORED_DOCUMENTS_JSONL,
} from '#utils/datasetsUtils.js';
```

### Dataset Registry

**DATASETS Array:** Contains 34 registered datasets (see registry table below) with:

- `key`: Unique identifier (e.g., 'c2c', 'emf', 'refed')
- `name`: Human-readable title
- `raw_folder`: Raw data directory under `datasets/raw/` (null if web-sourced)
- `processed_csv`: Output CSV filename in `datasets/processed/`
- `scrape_script`: Path to Puppeteer scraper (null if not scraped)
- `extract_script`: Path to extraction script (null if not extracted)
- `source_url`: Primary source/homepage URL (null for private datasets)
- `urls`: Object with additional API/config URLs keyed by purpose
- `raw_folder_contents`: Maps descriptive property names to actual filenames
- `scrape_backup_folder`: Folder name inside `archives/scrape_backup/` for recovery
- `prefix`: Auto-generated from key (e.g., 'c2c\_')

**DATASET_LOOKUP:** Quick lookup by key:

```javascript
import { DATASET_LOOKUP } from '#utils/datasetsUtils.js';
const ds = DATASET_LOOKUP['emf'];
// ds.name → 'EMF Case Studies'
// ds.processed_csv → 'emf_case_studies.csv'
```

**DATASET_KEYS:** Constant keys to avoid typos:

```javascript
import { DATASET_KEYS } from '#utils/datasetsUtils.js';
console.log(DATASET_KEYS.c2c); // 'c2c'
```

### Path Helper Functions

Always use these instead of constructing paths manually:

```javascript
// Get raw data directory (auto-creates if needed)
const rawDir = getDatasetRawDir('epa');
// → /absolute/path/datasets/raw/epa_tri

// Get processed CSV path
const csvPath = getDatasetProcessedCsvPath('emf');
// → /absolute/path/datasets/processed/emf_case_studies.csv

// Get backup folder (for scrapers with recovery)
const backupFolder = getDatasetBackupFolderPath('c2c');
// → /absolute/path/datasets/archives/scrape_backup/c2c_scrape_backup

// Get backup CSV path
const backupCsv = getDatasetBackupCsvPath('c2c');
// → /absolute/path/.../c2c_scrape_backup/c2c_scrape_backup.csv

// Get backup log file
const logsPath = getDatasetScrapeLogsPath('c2c');
// → /absolute/path/.../c2c_scrape_backup/c2c_logs.txt
```

### File Management Utilities

**Directory and File Creation:**

```javascript
// Create directory recursively
await ensureDir(dirPath);

// Assert file/directory exists (throws if missing)
assertFileExists(filePath, 'Configuration');
assertDirExists(dirPath, 'Data folder');

// Create file synchronously if missing
ensureFileSync(filePath);
```

**File Writing with Automatic Locking:**

```javascript
// Write CSV (automatically unlocks, writes, re-locks)
await writeCsv(csvPath, rows, { clear: true });
// clear: true → truncates file on first write (for batch stages)
// Automatically handles permission changes (chmod 0o644 → 0o444)

// Write JSON
await writeJson(jsonPath, data);

// Write JSONL (one JSON object per line)
await writeJsonl(jsonlPath, objects);

// Prepare directory and file before write
await prepareWrite(filePath, { clear: false });
// Returns unlocked file ready for writing
```

**Backup Management:**

```javascript
// Read backup CSV (for recovery mode)
const backupRows = await readBackupCsv(key);

// Append rows to archive
await appendToArchive(archiveCsvPath, rows);

// Add timestamped log entries
await appendLogs(logsPath, 'Data batch 3 saved');
await clearLogs(logsPath);
```

### Backup & Recovery System

**createBackupHelper():** For batched writes during long scrapes:

```javascript
import { createBackupHelper } from '#utils/datasetsUtils.js';

const backup = createBackupHelper(
  'c2c', // Dataset key
  3, // Flush every 3 pages
  true, // Clear on start
);

// During scrape loop:
for (const page of pages) {
  const rows = await scrapePage(page);
  await backup.add(rows); // Auto-flushes every 3 pages
  console.log(`✅ Page ${page}: ${rows.length} rows`);
}
await backup.flush(); // Final flush
```

**isBackupRecoveryMode():** Check for `--use-backup` flag:

```javascript
if (isBackupRecoveryMode()) {
  console.log('♻️ BACKUP RECOVERY MODE...');
  // Rebuild from saved backup instead of scraping
  const rows = await readBackupCsv('c2c');
  // ... process and write final CSV
}
```

### Text Processing & ID Generation

```javascript
import { cleanText, formatId, ID_DIGITS } from '#utils/datasetsUtils.js';

// Sanitize CSV text (remove quotes, newlines, etc.)
const clean = cleanText('Problem: "Waste"\n');
// → 'Problem: Waste'

// Generate zero-padded IDs
const id = formatId('c2c', 42); // With ID_DIGITS=5
// → 'c2c_00042'

// Auto-increment IDs with overflow handling
const id2 = formatId('wrap', 100000); // Exceeds 5 digits
// → 'wrap_100000'  (automatic expansion, no padding)

// Use ID_DIGITS constant in your own logic
const padding = String(index).padStart(ID_DIGITS, '0');
```

### CSV Format Standards

**CSV_COLUMNS:** Standard header for all datasets:

```javascript
import { CSV_COLUMNS, STRINGIFY_OPTIONS } from '#utils/datasetsUtils.js';

// Create header row
const headers = CSV_COLUMNS;
// → ['ID', 'problem', 'solution', 'materials', ...]

// Write using standard options
const csv = stringify(rows, STRINGIFY_OPTIONS);
// Automatically quoted, proper escaping, etc.
```

**Header:** ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json

### Web Scraping Utilities (Puppeteer)

For Puppeteer-based scrapers:

```javascript
import {
  getBrowserLaunchOptions,
  getViewportOptions,
  getUserAgentOptions,
  getExtraHttpHeaders,
  randomDelay,
} from '#utils/datasetsUtils.js';

// Launch browser with standardized options
const browser = await puppeteer.launch(getBrowserLaunchOptions());

// Set viewport (all scrapers use same dimensions)
const page = await browser.newPage();
await page.setViewport(getViewportOptions());

// Set user agent (pools of rotating agents)
const ua = getUserAgentOptions();
await page.setUserAgent(ua);

// Set HTTP headers (helps with bot detection)
await page.setExtraHTTPHeaders(getExtraHttpHeaders());

// Random delays between requests (prevents blocking)
await page.goto(url);
await page.waitForTimeout(randomDelay());
```

## File I/O Behavior (Unified)

All scripts use datasetsUtils.js helpers for consistent file handling:

1. **Directory Creation:** Parent directories created automatically
2. **First Write:** Empty file created so path exists immediately
3. **Permission Management:** Files unlocked before write, re-locked after
4. **Batch Handling:** Multi-stage outputs cleared once, flushed repeatedly with locking
5. **Scraper Backups:** Intermediate saves to `datasets/archives/scrape_backup/`
6. **Final Output:** Processed CSVs written to `datasets/processed/`

## Scraper Backup & Recovery Mode

All Puppeteer scraper scripts save intermediate results to backup CSV files during execution to protect against interrupted connections or user cancellation.

### Backup Behavior

- **Location:** `datasets/archives/scrape_backup/<dataset_key>_scrape_backup/<dataset_key>_scrape_backup.csv`
- **Interval:** Every 3 pages for pagination-based scrapers (configurable via `BACKUP_INTERVAL`)
- **Contents:** Per-page/per-interval rows in the same standardized format as final CSV
- **Clearing:** Backup file is automatically cleared on the first write (`CLEAR_BACKUP_ON_START = true`)
- **Locking:** Files are marked read-only after each flush to prevent manual interference
- **Logs:** Each backup folder contains `<dataset_key>_logs.txt` with timestamped backup activity

### Recovery Mode

If a scrape is interrupted (connection timeout, user cancellation), you can rebuild the final CSV from saved backup content using the `--use-backup` flag:

```pwsh
# Current execution:
node datasets/scripts/scrape_c2c.js

# Interrupted? Rebuild final CSV from backup:
node datasets/scripts/scrape_c2c.js --use-backup
```

**What happens in recovery mode:**

1. Script skips web fetching entirely
2. Reads all rows from `datasets/archives/scrape_backup/<dataset_key>_scrape_backup/<dataset_key>_scrape_backup.csv`
3. Applies the same filtering/deduplication logic as normal run
4. Writes final CSV to `datasets/processed/<dataset_key>_processed.csv`

You can also run scraper scripts with `--append` to add new rows to an existing CSV. This will renumber any `ID`/`id` values so they continue from the last row.

**Console feedback during backup saves:**

```
✅ Backup: Saved 45 rows from page 3
⚠️️️ Backup add failed at page 2: [error reason]
```

**Recovery mode output:**

```
♻️ BACKUP RECOVERY MODE: Building final CSV from saved backup content...
📖 Processing 135 backup rows...
✅ Selected 42 high-quality rows from backup
✨ Successfully rebuilt 42 C2C products from backup
📁 Saved to: /path/to/datasets/processed/c2c_registry.csv
```

### Supported Scrapers with Backup & Recovery

Currently implemented for:

- `scrape_c2c.js` – Cradle-to-Cradle certified products
- `scrape_circle_knowledge_hub.js` – Circle Economy case studies
- `scrape_ecesp.js` – ECESP good practices
- `scrape_emf.js` – Ellen MacArthur Foundation case studies
- `scrape_fashion_innovation.js` – Fashion for Good innovators
- `scrape_kalundborg.js` – Kalundborg industrial symbiosis cases
- `scrape_metabolic.js` – Metabolic publications
- `scrape_open_beauty_facts.js` – Beauty product data
- `scrape_open_food_facts.js` – Food product data
- `scrape_open_products_facts.js` – General product data
- `scrape_refed.js` – ReFED food waste solutions
- `scrape_remanufacturing_eu.js` – Remanufacturing case studies
- `scrape_wrap.js` – WRAP resources and case studies

## Complete Dataset Inventory (34 Datasets)

All datasets are registered in `backend/utils/datasetsUtils.js` (`DATASETS` array). This is the authoritative source of truth.

### Dataset Registry Table

| #   | Key                    | Dataset Name                       | Type                 | Source                                                           |
| --- | ---------------------- | ---------------------------------- | -------------------- | ---------------------------------------------------------------- |
| 1   | `c2c`                  | Cradle-to-Cradle Registry          | Puppeteer Scrape     | https://c2ccertified.org/certified-products                      |
| 2   | `cgr`                  | Circularity Gap Report 2025        | PDF Extract          | https://www.circularity-gap.world/2025                           |
| 3   | `circle_knowledge_hub` | Circle Economy Knowledge Hub       | Puppeteer Scrape     | https://knowledge-hub.circle-economy.com/cases                   |
| 4   | `dataeu`               | Data Europa                        | Mixed (CSV + PDF)    | https://data.europa.eu/                                          |
| 5   | `ecesp`                | ECESP Good Practices               | Puppeteer Scrape     | https://circulareconomy.europa.eu/platform/en/good-practices     |
| 6   | `eippcb`               | EIPPCB BAT Conclusions & BREFs     | PDF Extract          | https://bureau-industrial-transformation.jrc.ec.europa.eu/       |
| 7   | `emf`                  | EMF Case Studies                   | Puppeteer Scrape     | https://www.ellenmacarthurfoundation.org/explore                 |
| 8   | `env`                  | Environmental Sustainability       | CSV Extract          | UNDP HDR (manual download)                                       |
| 9   | `epa`                  | EPA TRI (Toxics Release Inventory) | CSV Extract          | https://www.epa.gov/toxics-release-inventory-tri-program         |
| 10  | `eulac`                | EULAC Case Studies                 | PDF Extract          | EU-LAC Partnership                                               |
| 11  | `eurostat`             | Eurostat Indicators                | CSV Extract          | https://ec.europa.eu/eurostat                                    |
| 12  | `fashion_innovation`   | Fashion for Good Innovation        | Puppeteer Scrape     | https://www.fashionforgood.com/innovation-platform-2/innovators/ |
| 13  | `fashion_transparency` | Fashion Transparency Index         | Mixed (PDF + CSV)    | WikiRate / Apparel Coalition                                     |
| 14  | `ghg`                  | GHG Emissions (EDGAR/IEA)          | CSV Extract          | UN Environment Programme                                         |
| 15  | `gewm`                 | Global E-Waste Monitor 2024        | PDF Extract          | https://ewastemonitor.info/                                      |
| 16  | `gtg`                  | Greentech Guardians                | Mixed (CSV + JSONL)  | AI EarthHack                                                     |
| 17  | `ifixit`               | iFixit Repairability Scores        | CSV Extract          | https://www.ifixit.com/repairability                             |
| 18  | `kaggle`               | Kaggle LCA                         | CSV Extract          | Kaggle                                                           |
| 19  | `kalundborg`           | Kalundborg Symbiosis               | Puppeteer Scrape     | https://www.symbiosis.dk/en/category/case/                       |
| 20  | `metabolic`            | Metabolic Open Reports             | Mixed (Scrape + PDF) | https://www.metabolic.nl/publications/                           |
| 21  | `mnd`                  | Mendeley Data                      | Excel/CSV Extract    | Mendeley Data (institutional)                                    |
| 22  | `oecd`                 | OECD Statistics                    | CSV Extract          | https://data-explorer.oecd.org/                                  |
| 23  | `obf`                  | Open Beauty Facts                  | Puppeteer Scrape     | https://world.openbeautyfacts.org/                               |
| 24  | `off`                  | Open Food Facts                    | Puppeteer Scrape     | https://world.openfoodfacts.org/                                 |
| 25  | `opf`                  | Open Products Facts                | Puppeteer Scrape     | https://world.openproductsfacts.org/                             |
| 26  | `refed`                | ReFED Food Waste Solutions         | API Fetch            | https://insights.refed.org/solution-database                     |
| 27  | `rema`                 | Remanufacturing EU                 | Mixed (Scrape + PDF) | https://www.remanufacturing.eu                                   |
| 28  | `sei`                  | SEI Construction Cases             | PDF Extract          | https://www.wbcsd.org/                                           |
| 29  | `unep`                 | UNEP Material Flows & Waste        | CSV Extract          | https://www.unep.org/                                            |
| 30  | `wbcsd`                | WBCSD Business Cases               | PDF Extract          | https://www.wbcsd.org/                                           |
| 31  | `wbp`                  | World Bank Projects                | API + CSV Extract    | https://search.worldbank.org/api/v2/projects                     |
| 32  | `wrap`                 | WRAP Resources & Cases             | Mixed (Scrape + PDF) | https://www.wrap.ngo                                             |

### Summary Statistics

- **Total Datasets:** 34 registered datasets
- **Scraper-based (Puppeteer):** 13 datasets
  - c2c, circle_knowledge_hub, ecesp, emf, fashion_innovation, kalundborg, metabolic, obf, off, opf, refed, rema (partial), wrap (partial)
- **PDF-based Extraction:** 8 datasets
  - cgr, eippcb, eulac, gewm, metabolic (partial), sei, wbcsd, wrap (partial)
- **CSV-based Extraction:** 9 datasets
  - dataeu, env, epa, eurostat, ifixit, kaggle, mnd, oecd, unep
- **API-based:** 2 datasets
  - refed, wbp
- **Mixed/Multi-format:** 5 datasets
  - dataeu, fashion_transparency, gtg, metabolic, wrap

> **New in Registry:** Expanded dataset support includes `metabolic` (with both scraping and PDF extraction), and improved documentation for all extraction scripts.

> **Note:** To add a new dataset, add an entry to the `DATASETS` array in
> `backend/utils/datasetsUtils.js` and create a corresponding extraction script.
> The pipeline will automatically discover the processed CSV when merging.

## Data Format Standard

All datasets in `backend/datasets/processed/` and `backend/datasets/manual_entries/` follow this standardized format:

**Header (unquoted):**

```
ID,problem,solution,materials,circular_strategy,category,impact,source_url,metadata_json
```

**Data rows (fully quoted):**

```
"gtg_00001","problem description","solution approach","material list","R-strategy","category","impact metrics","https://source.url",""
```

**ID Format:** `prefix_NNNNN` where NNNNN is zero-padded to 5 digits by default (controlled by `ID_DIGITS` in `datasetsUtils.js`), e.g., `c2c_00001`, `emf_00042`, `manual_00001`.

## Data Flow Through the Pipeline

All datasets follow this standardized processing pipeline:

```
1. Raw Source Data (datasets/raw/*)
   └─ Extracted/scraped via script (datasets/scripts/*.js)
      ├─ datasets/scripts/scrape_*.js    (Puppeteer web scraping)
      ├─ datasets/scripts/extract_*.js   (CSV/PDF/API parsing)
      └─ [Optional scrape backup CSV written to datasets/archives/scrape_backup/]

2. Processed CSV Output (datasets/processed/*)
   └─ Standardized format with columns:
      ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json

3. Manual Entries (datasets/manual_entries/manual_entries.csv)
   └─ User-added problem/solution pairs (same standardized format)

4. Combined Input CSV (datasets/out/combined_input.csv or datasets/archives/combined_input.csv)
   └─ `npm run merge` – defaults to `out/`; include `-- --archives` to write the
      same merged file into the archives folder.
      ├─ Merges all datasets/processed/*.csv files
      ├─ Merges datasets/manual_entries/manual_entries.csv
      ├─ Validates headers and formatting
      └─ Output is read-only

5. Semantic Chunks (datasets/out/chunks.json or datasets/archives/chunks.json)
   └─ `npm run chunk` – defaults to `out/`; include `-- --archives` to write the
      same chunks into the archives folder.
      ├─ Splits rows into semantic chunks (500 chars max)
      ├─ Preserves problem/solution context
      ├─ Extracts metadata
      └─ Output is read-only

6. Vector Embeddings (datasets/out/embedded_chunks.json or datasets/archives/embedded_chunks.json)
   └─ `npm run embed` – writes to `out/` by default; pass `-- --archives` to
      target the archives output location.
      ├─ Generates OpenAI embeddings (text-embedding-3-small)
      ├─ Saves embedded vectors with metadata
      └─ Output is read-only

7. Database Storage (Supabase)
   └─ Storage commands
      ├─ `npm run store` - Reads `datasets/out/embedded_chunks.json` and stores
         embeddings into the primary `documents` table (used by production
         queries).  To operate on the archive outputs/table either pass
         `-- --archives` to the script or set `USE_DOCUMENTS_ARCHIVES_TABLE=true`.
      └─ Both `documents` and `documents_archives` share the same schema and
         indexing (see `database/sql/01_vector_infrastructure.sql`).
```

**Note:** The `--archives` (or `--archive`) flag only affects output location (out/ vs archives/). Both normal and archives runs merge the same source files.

## Dataset Sources by Category

### Scraper-based Datasets (Puppeteer automation)

> **Tip:** all Puppeteer scraper scripts import shared helpers from
> `#utils/datasetsUtils.js` which provide standard launch/viewport/user-agent
> options. Browsers are headless by default; add `--show` when running the
> script if you need to watch the page for troubleshooting.
>
> ```pwsh
> node datasets/scripts/scrape_emf.js          # headless (no UI)
> node datasets/scripts/scrape_emf.js --show   # open Chromium window
> ```

**C2C Registry** – `c2c` key

- Source: https://c2ccertified.org/certified-products
- Method: Puppeteer page scraping
- Scrape backup: `datasets/archives/scrape_backup/c2c_scrape_backup.csv`
- Returns: Certified products with specifications

**ECESP Good Practices** – `ecesp` key

- Source: https://circulareconomy.europa.eu/platform/en/good-practices
- Method: Puppeteer pagination scraping
- Scrape backup: `datasets/archives/scrape_backup/ecesp_good_practices_scrape_backup.csv`
- Returns: European circular economy best practices

**EMF Case Studies** – `emf` key

- Source: https://www.ellenmacarthurfoundation.org/explore?sortBy=dateDesc&contentType=CaseStudy
- Method: Puppeteer with pagination
- Scrape backup: `datasets/archives/scrape_backup/emf_scrape_backup.csv`
- Returns: Foundation-curated circular business models

**Open Beauty Facts** – `obf` key

- Source: https://world.openbeautyfacts.org/
- Method: Puppeteer product search + detail pages
- Scrape backup: `datasets/archives/scrape_backup/obf_scrape_backup.csv`
- Returns: Beauty product ingredients & sustainability

**Open Food Facts** – `off` key

- Source: https://world.openfoodfacts.org/
- Method: Puppeteer product search + detail pages
- Scrape backup: `datasets/archives/scrape_backup/off_scrape_backup.csv`
- Returns: Food product nutrition & environmental data

**Open Products Facts** – `opf` key

- Source: https://world.openproductsfacts.org/
- Method: Puppeteer product search + detail pages
- Scrape backup: `datasets/archives/scrape_backup/opf_scrape_backup.csv`
- Returns: General product sustainability information

### PDF-based Extraction (PDF parsers)

**CGR 2025** – `cgr` key

- Source: https://www.circularity-gap.world/2025
- Input: `datasets/raw/circularity_gap_report/cgr_2025.pdf`
- Method: PDF text extraction using pdfjs-dist
- Returns: Global circularity metrics & country-level analysis

**Data Europa** – `dataeu` key

- Source: https://data.europa.eu/
- Inputs: Eurostat CSVs + multiple EU policy PDFs
- Method: Mixed (CSV parsing + PDF extraction)
- Returns: EU statistics, projects, and policy contexts

**EULAC Case Studies** – `eulac` key

- Source: https://www.ellenmacarthurfoundation.org/ (partner)
- Input: `datasets/raw/eulac_case_studies/eulac_case_studies.pdf`
- Method: PDF text extraction using pdfjs-dist
- Returns: 7 EU-LAC circular economy initiatives

**SEI Construction** – `sei` key

- Source: https://www.wbcsd.org/
- Inputs: 17 SEI construction case study PDFs
- Method: PDF extraction using pdfjs-dist
- Returns: Circular deconstruction & building design cases

**WBCSD Cases** – `wbcsd` key

- Source: https://www.wbcsd.org/
- Inputs: 24+ industry case study PDFs
- Method: PDF text extraction
- Returns: Business circular strategy implementations

### CSV-based Extraction

**Environmental Sustainability** – `env` key

- Source: UNDP HDR (manual download)
- Input: `datasets/raw/environmental_sustainability/environmental_sustainability.csv`
- Method: CSV parsing + geographic filtering
- Returns: Country-level sustainability indicators

**EPA TRI** – `epa` key

- Source: https://www.epa.gov/toxics-release-inventory-tri-program
- Inputs: `2024_us.csv`, `chemical_transfer.csv`
- Method: CSV parsing + risk classification
- Returns: Facility-level toxic release & recovery data

**Eurostat** – `eurostat` key

- Source: https://ec.europa.eu/eurostat
- Inputs: 5+ Eurostat circular economy indicator CSVs
- Method: CSV parsing + aggregation
- Returns: EU waste management & material efficiency metrics

**GHG Emissions** – `ghg` key

- Source: EDGAR, IEA (UN Environment Programme)
- Inputs: 8 emissions CSV files (1970–2024)
- Method: CSV parsing + country-level aggregation
- Returns: Historical greenhouse gas by sector & country

**OECD** – `oecd` key

- Source: https://data-explorer.oecd.org/
- Inputs: Municipal waste, waste streams, CAPMF CSVs
- Method: CSV parsing + indicator mapping
- Returns: OECD member resource efficiency metrics

**UNEP** – `unep` key

- Source: https://www.unep.org/resources/global-waste-management-outlook-2024
- Inputs: Material flows, global flows, GMWO consolidated CSVs
- Method: CSV parsing + country aggregation
- Returns: Global waste generation & material footprint

### Multiformat Extraction

**Fashion Transparency Index** – `fashion` key

- Source: https://apparelcoalition.org/ + WikiRate
- Inputs: PDF reports + WikiRate CSV exports
- Method: Mixed (PDF + CSV parsing)
- Returns: Brand transparency scores & supply chain practices

**Global E-Waste Monitor 2024** – `gewm` key

- Source: https://ewastemonitor.info/
- Inputs: Embedded Python script extracts from PDF using camelot
- Method: camelot PDF table extraction via Python subprocess
- Returns: Country-level e-waste generation, collection, recycling

**Mendeley Data** – `mnd` key

- Source: Mendeley Data (institutional)
- Inputs: 5+ Excel/CSV research datasets
- Method: XLSX parsing + data merging
- Returns: LCA data, sustainability frameworks, research findings

**Kaggle LCA** – `kaggle` key

- Source: Kaggle (public datasets)
- Inputs: Product LCA, livestock emissions, supply chain CSVs
- Method: CSV parsing + life cycle aggregation
- Returns: Product-level and sector-level LCA metrics

**Greentech Guardians** – `gtg` key

- Source: AI EarthHack + internal JSONL exports
- Inputs: `AI_EarthHack_Dataset.csv` + multiple JSONL files
- Method: Mixed (CSV + JSONL parsing)
- Returns: Student-submitted circular solutions with priority weighting

### API-based Extraction

**World Bank Projects** – `wbp` key

- Source: https://search.worldbank.org/api/v2/projects
- Method: REST API JSON + secondary PDF reports
- Inputs: Basic & detailed project JSON endpoints
- Returns: Sustainable development projects with WB sector classification

## Data Flow Through the Pipeline

All datasets follow this standardized processing pipeline:

```
1. Raw Source Data (datasets/raw/*)
   └─ Extracted via script (datasets/scripts/*.js)
      ├─ datasets/scripts/scrape_*.js    (Puppeteer web scraping)
      ├─ datasets/scripts/extract_*.js   (CSV/PDF/API parsing)
      └─ [Optional archive CSV written]

2. Processed CSV Output (datasets/processed/*)
   └─ Standardized columns:
      ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json

3. Common Input CSV (datasets/out/combined_input.csv)
  └─ npm run merge    # use `-- --archives` to target archives output
      ├── Merges all datasets/processed/*.csv
      ├── Applies dataset-specific field mappings
      └─ Deduplicates by (problem + solution)

4. Semantic Chunks (datasets/out/chunks.json)
   └─ npm run chunk    # use `-- --archives` to target archives output
      ├─ Splits rows into semantic chunks (500 chars max)
      ├─ Preserves problem/solution context
      └─ Includes source metadata

5. Vector Embeddings (datasets/out/embedded_chunks.json)
   └─ npm run embed    # use `-- --archives` to target archives output
      ├─ Generates OpenAI embeddings
      ├─ Saves embedded vectors with metadata
      └─ Ready for storage in database

6. Database Storage (Supabase documents table)
   └─ npm run store    # add `-- --archives` or set USE_DOCUMENTS_ARCHIVES_TABLE=true
      ├─ Stores embeddings + metadata in documents table
      ├─ Indexes for semantic search
      └─ Enables RAG retrieval
   └─ npm run store -- --dry-run (optional)
      ├─ Writes to datasets/out/stored_documents.jsonl instead
      ├─ Useful for testing without Supabase
      └─ File maintained as read-only for durability
```

## Adding a New Dataset

To add a new dataset to the system:

### 1. Create Processing Script

Create either a **scraper script** (for web data) or **extraction script** (for files) in `datasets/scripts/`:

**For web scraping:**

```javascript
import {
  STRINGIFY_OPTIONS,
  formatId,
  getDatasetProcessedCsvPath,
  ensureDir,
} from '#utils/datasetsUtils.js';
import fs from 'fs';
import path from 'path';

const DATASET_KEY = 'xyz'; // your dataset key
// ... your scraping logic ...
const finalRows = data.map((r, idx) => ({
  ID: formatId(DATASET_KEY, idx + 1),
  problem: r.problem,
  solution: r.solution,
  materials: r.materials || '',
  circular_strategy: r.strategy || '',
  category: r.category || '',
  impact: r.impact || '',
  source_url: r.url || '',
  metadata_json: JSON.stringify(r.metadata || {}),
}));

const OUTPUT_FILE = getDatasetProcessedCsvPath(DATASET_KEY);
await ensureDir(path.dirname(OUTPUT_FILE));

// make sure the file exists empty on first write and unlock if previously read-only
if (!fs.existsSync(OUTPUT_FILE)) {
  await fs.promises.writeFile(OUTPUT_FILE, '');
} else {
  await fs.promises.chmod(OUTPUT_FILE, 0o644).catch(() => {});
}

const csvOut = stringify(finalRows, STRINGIFY_OPTIONS);
await fs.promises.writeFile(OUTPUT_FILE, csvOut);
await fs.promises.chmod(OUTPUT_FILE, 0o444); // Read-only
```

**For extraction (CSV/PDF/API):**

- Use `getDatasetRawDir(DATASET_KEY)` to find raw files
- Use `getDatasetProcessedCsvPath(DATASET_KEY)` for output CSV path
- Always use `STRINGIFY_OPTIONS` for consistent formatting
- Always make output read-only with `chmod(file, 0o444)`

### 2. (Optional) Register in Dataset Registry

If you want to track dataset metadata for documentation, add an entry to the `DATASETS` array in `utils/datasetsUtils.js`. The object schema has expanded over time and now includes fields for raw folder contents, source URLs, and the backup folder name used by scrapers:

```javascript
{
  key: 'xyz',                              // unique short identifier used for prefixes
  name: 'Full Dataset Name',               // human-friendly title
  raw_folder: 'xyz_raw_folder_name',       // directory under datasets/raw/ (or null)
  processed_csv: 'xyz_processed.csv',      // output CSV filename in datasets/processed/
  scrape_script: path.join(DATASETS_SCRIPTS_DIR, 'scrape_xyz.js'),    // script path or null
  extract_script: path.join(DATASETS_SCRIPTS_DIR, 'extract_xyz.js'),  // script path or null
  source_url: 'https://source.example.com',          // main homepage or API endpoint
  urls: { /* optional: additional named URLs the script may use */ },
  raw_folder_contents: { /* optional: enumerate every file in raw_folder */ },
  scrape_backup_folder: 'xyz_scrape_backup',          // subfolder inside archives/scrape_backup (or null)
}
```

All other pipeline stages automatically discover processed CSV files, so registering datasets is purely for documentation and convenience.

This is optional - the merge script auto-discovers all CSVs regardless.

### 3. Run the Script

```pwsh
# From backend/ directory
node datasets/scripts/extract_xyz.js  # or scrape_xyz.js
```

> **Tip:** instead of invoking each file manually you can run **all** of the
> dataset generation scripts in one go. The helper runner lives at
> `backend/pipeline/run_datasets_scripts.js` and is wired to the convenience
> npm script below. It executes `extract_*.js` files first, followed by
> `scrape_*.js`, stopping immediately if any step fails.
>
> ```pwsh
> npm run datasets-scripts      # runs the pipeline runner
> # or
> node pipeline/run_datasets_scripts.js
> ```

### 4. Verify Output

```pwsh
# Check generated CSV
Get-Content datasets/processed/xyz_processed.csv -TotalCount 1

# Check file permissions (should be read-only)
Get-Item datasets/processed/xyz_processed.csv | Select-Object FullName, @{Name='ReadOnly';Expression={$_.Attributes -match 'ReadOnly'}}
```

### 5. Run Merge & Pipeline

The merge script automatically discovers your new CSV:

```pwsh
npm run merge     # Auto-discovers xyz_processed.csv + manual_entries.csv
npm run chunk     # Create semantic chunks
npm run embed     # Generate embeddings
npm run store     # Store in Supabase
```

Or use the complete pipeline:

```pwsh
npm run populate  # Full pipeline: merge → chunk → embed → store
```
