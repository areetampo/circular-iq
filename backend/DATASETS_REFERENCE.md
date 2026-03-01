# Current Datasets Reference

Reference guide for all datasets currently integrated into the system.

## Dataset Inventory

| ID  | Key        | Prefix      | Processed CSV                              | Source Type | Parsing Method | Key Features                                 |
| --- | ---------- | ----------- | ------------------------------------------ | ----------- | -------------- | -------------------------------------------- |
| 1   | `c2c`      | `c2c_`      | c2c_registry.csv                           | Scraper     | Puppeteer      | Cradle-to-Cradle certified products          |
| 2   | `cgr`      | `cgr_`      | cgr_2025_processed.csv                     | PDF Extract | PDF Parser     | Circularity Gap Report 2025                  |
| 3   | `dataeu`   | `dataeu_`   | data_europa_processed.csv                  | CSV/PDF     | Multiformat    | EU statistics & policy documents             |
| 4   | `ecesp`    | `ecesp_`    | ecesp_good_practices_processed.csv         | Scraper     | Puppeteer      | European Circular Economy Platform practices |
| 5   | `emf`      | `emf_`      | emf_case_studies.csv                       | Scraper     | Puppeteer      | Ellen MacArthur Foundation case studies      |
| 6   | `env`      | `env_`      | environmental_sustainability_processed.csv | CSV Extract | CSV parsing    | Environmental sustainability indicators      |
| 7   | `epa`      | `epa_`      | epa_tri_processed.csv                      | CSV Extract | CSV parsing    | EPA Toxic Release Inventory                  |
| 8   | `eulac`    | `eulac_`    | eulac_case_studies_processed.csv           | PDF Extract | PDF Parser     | EU-LAC circular economy case studies         |
| 9   | `eurostat` | `eurostat_` | eurostat_processed.csv                     | CSV Extract | CSV parsing    | Eurostat circular economy indicators         |
| 10  | `fashion`  | `fashion_`  | fashion_transparency_processed.csv         | PDF/CSV     | Multiformat    | Fashion transparency & supply chain data     |
| 11  | `ghg`      | `ghg_`      | ghg_emissions_processed.csv                | CSV Extract | CSV parsing    | Global greenhouse gas emissions              |
| 12  | `gewm`     | `gewm_`     | global_ewaste_monitor_processed.csv        | PDF/CSV     | Python script  | Global E-waste generation & recycling data   |
| 13  | `gtg`      | `gtg_`      | greentechguardians_processed.csv           | JSONL/CSV   | Multi-source   | Student-submitted circular solutions         |
| 14  | `kaggle`   | `kaggle_`   | kaggle_lca_processed.csv                   | Excel/CSV   | Multiformat    | Life cycle assessment data                   |
| 15  | `mnd`      | `mnd_`      | mendeley_processed.csv                     | Excel/CSV   | Multiformat    | Peer-reviewed research papers                |
| 16  | `oecd`     | `oecd_`     | oecd_processed.csv                         | CSV Extract | CSV parsing    | OECD circular economy indicators             |
| 17  | `obf`      | `obf_`      | open_beauty_facts_processed.csv            | Scraper     | Puppeteer      | Beauty & personal care product data          |
| 18  | `off`      | `off_`      | open_food_facts_processed.csv              | Scraper     | Puppeteer      | Food product ingredient & nutrition data     |
| 19  | `opf`      | `opf_`      | open_products_facts_processed.csv          | Scraper     | Puppeteer      | General product sustainability metrics       |
| 20  | `sei`      | `sei_`      | sei_construction_processed.csv             | PDF Extract | PDF Parser     | Circular construction & deconstruction cases |
| 21  | `unep`     | `unep_`     | unep_processed.csv                         | CSV Extract | CSV parsing    | UNEP material flows & waste management       |
| 22  | `wbcsd`    | `wbcsd_`    | wbcsd_processed.csv                        | PDF Extract | PDF Parser     | WBCSD circular economy case studies          |
| 23  | `wbp`      | `wbp_`      | world_bank_projects_processed.csv          | JSON/API    | API parsing    | World Bank sustainable development projects  |

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
   └─ npm run merge / npm run merge:archives
      ├─ Merges all datasets/processed/*.csv files
      ├─ Merges datasets/manual_entries/manual_entries.csv
      ├─ Validates headers and formatting
      └─ Output is read-only

5. Semantic Chunks (datasets/out/chunks.json or datasets/archives/chunks.json)
   └─ npm run chunk / npm run chunk:archives
      ├─ Splits rows into semantic chunks (500 chars max)
      ├─ Preserves problem/solution context
      ├─ Extracts metadata
      └─ Output is read-only

6. Vector Embeddings (datasets/out/embedded_chunks.json or datasets/archives/embedded_chunks.json)
   └─ npm run embed / npm run embed:archives
      ├─ Generates OpenAI embeddings (text-embedding-3-small)
      ├─ Saves embedded vectors with metadata
      └─ Output is read-only

7. Database Storage (Supabase)
   └─ Storage commands
      ├─ `npm run store` - Reads `datasets/out/embedded_chunks.json` and stores embeddings into the primary `documents` table (used by production queries).
      ├─ `npm run store:archives` - Reads `datasets/archives/embedded_chunks.json` and stores embeddings into `documents_archives` (archive/testing dataset; same schema as `documents`).
      └─ Both tables share the same schema and indexing (see `database/sql/01_vector_infrastructure.sql`).
```

**Note:** The `--archives` (or `--archive`) flag only affects output location (out/ vs archives/). Both normal and archives runs merge the same source files.

## Dataset Sources by Category

### Scraper-based Datasets (Puppeteer automation)

> **Tip:** all Puppeteer scraper scripts import shared helpers from
> `#utils/datasetsUtils.js` which provide standard launch/viewport/user-agent
> options. Browsers are headless by default; add `--show` when running the
> script if you need to watch the page for troubleshooting.
>
> ```bash
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
  └─ npm run merge
      ├── Merges all datasets/processed/*.csv
      ├── Applies dataset-specific field mappings
      └─ Deduplicates by (problem + solution)

4. Semantic Chunks (datasets/out/chunks.json)
   └─ npm run chunk
      ├─ Splits rows into semantic chunks (500 chars max)
      ├─ Preserves problem/solution context
      └─ Includes source metadata

5. Vector Embeddings (datasets/out/embedded_chunks.json)
   └─ npm run embed
      ├─ Generates OpenAI embeddings
      ├─ Saves embedded vectors with metadata
      └─ Ready for storage in database

6. Database Storage (Supabase documents table)
   └─ npm run store
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
  getDatasetOutputPath,
  ensureDir,
} from '#utils/datasetsUtils.js';
import fs from 'fs';
import path from 'path';

const DATASET_KEY = 'xyz'; // your dataset key
// ... your scraping logic ...
const finalRows = data.map((r, idx) => ({
  ID: formatId(`${DATASET_KEY}_`, idx + 1),
  problem: r.problem,
  solution: r.solution,
  materials: r.materials || '',
  circular_strategy: r.strategy || '',
  category: r.category || '',
  impact: r.impact || '',
  source_url: r.url || '',
  metadata_json: JSON.stringify(r.metadata || {}),
}));

const OUTPUT_FILE = getDatasetOutputPath(DATASET_KEY);
await ensureDir(path.dirname(OUTPUT_FILE));
const csvOut = stringify(finalRows, STRINGIFY_OPTIONS);
await fs.promises.writeFile(OUTPUT_FILE, csvOut);
await fs.promises.chmod(OUTPUT_FILE, 0o444); // Read-only
```

**For extraction (CSV/PDF/API):**

- Use `getDatasetRawDir(DATASET_KEY)` to find raw files
- Use `getDatasetOutputPath(DATASET_KEY)` for output CSV path
- Always use `STRINGIFY_OPTIONS` for consistent formatting
- Always make output read-only with `chmod(file, 0o444)`

### 2. (Optional) Register in Dataset Registry

If you want to track dataset metadata for documentation, add an entry to the `DATASETS` array in `utils/datasetsUtils.js`:

```javascript
{
  key: 'xyz',                              // unique identifier
  name: 'Full Dataset Name',               // display name
  raw_folder: 'xyz_raw_folder_name',       // folder under datasets/raw/ (or null)
  processed_csv: 'xyz_processed.csv',      // output CSV filename
  scrape_script: path.join(..., 'scrape_xyz.js'),    // script path (or null)
  extract_script: path.join(..., 'extract_xyz.js'),  // script path (or null)
  source_url: 'https://source.example.com',          // homepage URL
  urls: { /* additional resource URLs */ },
  raw_folder_contents: { /* enumerate files */ },
   archive_csv: 'xyz_scrape_backup.csv',              // for scrapers only (or null)
}
```

This is optional - the merge script auto-discovers all CSVs regardless.

### 3. Run the Script

```bash
# From backend/ directory
node datasets/scripts/extract_xyz.js  # or scrape_xyz.js
```

### 4. Verify Output

```bash
# Check generated CSV
head datasets/processed/xyz_processed.csv

# Check file permissions (should be read-only)
ls -la datasets/processed/xyz_processed.csv
```

### 5. Run Merge & Pipeline

The merge script automatically discovers your new CSV:

```bash
npm run merge     # Auto-discovers xyz_processed.csv + manual_entries.csv
npm run chunk     # Create semantic chunks
npm run embed     # Generate embeddings
npm run store     # Store in Supabase
```

Or use the complete pipeline:

```bash
npm run populate  # Full pipeline: merge → chunk → embed → store
```
