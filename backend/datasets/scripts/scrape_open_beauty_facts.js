/**
 * scrape_open_beauty_facts.js
 *
 * Scrapes beauty and personal care products from the Open Beauty Facts API.
 * Focuses on extracting products aligned with circular economy principles
 * (refillable, sustainable packaging, eco-friendly, etc.) with detailed
 * environmental scorecards (Ecoscore rating).
 *
 * Features:
 *   - Keyword-based search targeting circular economy attributes
 *   - API pagination with graceful handling of non-existent pages
 *   - Per-product detail extraction (company, category, ingredients, packaging, Ecoscore)
 *   - Intelligent problem/solution mapping based on detected attributes
 *   - Backup system: incremental batch-level backup with recovery mode
 *   - Quality filtering based on content completeness
 *   - Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_open_beauty_facts.js                 # normal run
 *   node scrape_open_beauty_facts.js --use-backup    # rebuild final CSV from backup
 *   node scrape_open_beauty_facts.js --clear-logs    # clear the log file before starting
 *
 * For detailed logs, see the path printed at the start of the run.
 * Note: Requires active internet connection to access Open Beauty Facts API
 */

import { fileURLToPath } from 'url';
import {
  formatId,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetProcessedCsvPath,
  writeCsv,
  hasAppendFlag,
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.obf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// Configuration
const BASE_URL = dataset.urls.search;
const PRODUCT_URL_BASE = dataset.urls.product;
const TARGET_ROWS = 250; // Desired final rows
const BACKUP_INTERVAL = 3; // Flush backup every 3 pages
const CLEAR_BACKUP_ON_START = true;

// each entry can override the paging parameters that were previously
// global constants. this mirrors the pattern used in scrape_c2c.js and
// scrape_wrap.js so that we can tune individual keywords without touching
// the shared defaults.
const KEYWORDS = [
  { keyword: 'refillable', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'glass', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  {
    keyword: 'microplastic-free',
    START_PAGE: 1,
    END_PAGE: 50,
    PAGE_SIZE: 200,
    MAX_PAGES_TO_FETCH: 50,
  },
  { keyword: 'recycled', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'recyclable', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'reuse', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'biodegradable', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'compostable', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'eco-friendly', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'sustainable', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'plastic-free', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'zero waste', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'aluminum', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
  { keyword: 'paper', START_PAGE: 1, END_PAGE: 50, PAGE_SIZE: 200, MAX_PAGES_TO_FETCH: 50 },
];

// Calculate total maximum pages across all keywords and initialize backup helper
const TOTAL_MAX_PAGES = KEYWORDS.reduce((sum, kw) => sum + kw.MAX_PAGES_TO_FETCH, 0);
const APPEND = hasAppendFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START,
  TOTAL_MAX_PAGES,
);

/**
 * Fetch a single page of products from Open Beauty Facts API.
 */
async function fetchPage(searchTerms, page, pageSize = 200) {
  const params = new URLSearchParams({
    search_terms: searchTerms,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: pageSize,
    page: page,
  });

  const url = `${BASE_URL}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (response.status === 500 || response.status === 404) {
      await appendLogs(DATASET_KEY, `  → No more products (HTTP ${response.status})`);
      return [];
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.products || [];
  } catch (err) {
    await appendLogs(DATASET_KEY, `  → Error fetching page: ${err.message}`);
    return [];
  }
}

function transformProduct(product) {
  const categories = product.categories || product.categories_en || '';
  const ingredients = product.ingredients_text || '';
  const packaging = product.packaging || product.packaging_text || '';
  const ecoscoreGrade = product.ecoscore_grade || '';
  const ecoscoreScore = product.ecoscore_score;
  const code = product.code;

  const combinedText = (packaging + ' ' + ingredients + ' ' + (product.labels || '')).toLowerCase();

  let problem = 'Packaging-related environmental impact';
  let strategy = 'General';
  let solution = '';

  if (combinedText.includes('microplastic') || combinedText.includes('microplastic-free')) {
    problem = 'Microplastics or microbead contamination in formulations';
    if (combinedText.includes('microplastic-free')) {
      strategy = 'Safe Chemistry';
      solution = 'Formulated without microplastics to prevent environmental harm';
    }
  } else if (combinedText.includes('glass bottle')) {
    problem = 'Single-use plastic packaging';
    strategy = 'Refillable Model';
    solution = 'Glass bottle reduces plastic use and supports reuse/refill';
  } else if (combinedText.includes('refillable') || combinedText.includes('refill')) {
    problem = 'Single-use packaging waste';
    strategy = 'Refillable Model';
    solution = 'Refillable packaging or refill program reduces single-use waste';
  } else if (combinedText.includes('recycled')) {
    strategy = 'Recycled Materials';
    solution = 'Contains recycled content to reduce virgin material use';
  } else if (combinedText.includes('biodegradable') || combinedText.includes('compostable')) {
    strategy = 'Biodegradable / Compostable';
    solution = 'Materials designed to break down naturally';
  } else if (combinedText.includes('eco-friendly')) {
    strategy = 'Eco-friendly design';
    solution = 'Product designed with environmental considerations';
  }

  if (strategy === 'General') {
    if (packaging.toLowerCase().includes('glass')) {
      strategy = 'Glass packaging';
      solution = 'Glass is infinitely recyclable';
    } else if (packaging.toLowerCase().includes('plastic')) {
      strategy = 'Plastic packaging – needs improvement';
      solution = 'Consider alternative materials or recycled content';
    }
  }

  const impactParts = [];
  if (ecoscoreGrade) impactParts.push(`Ecoscore grade: ${ecoscoreGrade}`);
  if (ecoscoreScore) impactParts.push(`Ecoscore score: ${ecoscoreScore}`);
  const impact = impactParts.join(' · ') || 'No impact data';

  const sourceUrl = `${PRODUCT_URL_BASE}/${code}`;

  return {
    problem,
    solution,
    materials: packaging,
    circular_strategy: strategy,
    category: categories.split(',')[0]?.trim() || 'Beauty product',
    impact,
    source_url: sourceUrl,
    metadata_json: JSON.stringify(product),
  };
}

async function fetchAllForKeyWord({
  keyword,
  PAGE_SIZE = 200,
  START_PAGE = 1,
  END_PAGE = 50,
  MAX_PAGES_TO_FETCH: keywordFallback = 50,
}) {
  const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + keywordFallback - 1);
  const all = [];
  for (let page = START_PAGE; page <= FINAL_FETCH_PAGE; page++) {
    const products = await fetchPage(keyword, page, PAGE_SIZE);
    if (products.length === 0) break;

    const transformed = products
      .map(transformProduct)
      .filter((p) => p.problem && (p.materials || p.category));
    all.push(...transformed);

    // Log page details to backup log
    await appendLogs(
      DATASET_KEY,
      `Keyword "${keyword}" page ${page}: got ${products.length} raw, kept ${transformed.length} (total so far: ${all.length})`,
    );

    try {
      await backup.add(transformed);
    } catch (e) {
      const errMsg = `⚠️ Backup add failed for ${keyword} page ${page}: ${e.message}`;
      console.warn(errMsg);
      await appendLogs(DATASET_KEY, errMsg);
    }

    if (page === keywordFallback) {
      const limitMsg = `⚠️ Reached fallback max pages (${keywordFallback}) for keyword "${keyword}" – stopping.`;
      console.warn(limitMsg);
      await appendLogs(DATASET_KEY, limitMsg);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return all;
}

async function rebuildFromBackup() {
  console.log(`♻️ BACKUP RECOVERY MODE: Building final CSV from saved backup content...`);

  try {
    await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = `⚠️ No backup content found. Cannot rebuild output.`;
      console.warn(msg);
      await appendLogs(DATASET_KEY, msg);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no data) ---\n`);
      return;
    }

    console.log(`📖 Processing ${backupRows.length} backup rows...`);
    await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    // Apply the same filter as live scrape
    let filtered = backupRows.filter((row) => row.problem && (row.materials || row.category));

    if (filtered.length === 0) {
      console.warn(`⚠️ No valid rows after filtering.`);
      await appendLogs(DATASET_KEY, `⚠️ No valid rows – output file unchanged.`);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    // Deduplicate by source_url (keep first occurrence)
    const uniqueMap = new Map();
    for (const row of filtered) {
      if (!uniqueMap.has(row.source_url)) {
        uniqueMap.set(row.source_url, row);
      }
    }
    let uniqueRows = Array.from(uniqueMap.values());

    if (uniqueRows.length > TARGET_ROWS) {
      uniqueRows = uniqueRows.slice(0, TARGET_ROWS);
    }

    console.log(`✅ Selected ${uniqueRows.length} high-quality rows from backup`);
    await appendLogs(
      DATASET_KEY,
      `Selected ${uniqueRows.length} rows after filtering and deduplication.`,
    );

    const finalRows = uniqueRows.map((row, idx) => {
      const metadataJson =
        typeof row.metadata_json === 'string' ? row.metadata_json : JSON.stringify(row);
      return {
        ID: formatId(DATASET_KEY, idx + 1),
        problem: row.problem || '',
        solution: row.solution || '',
        materials: row.materials || '',
        circular_strategy: row.circular_strategy || '',
        category: row.category || '',
        impact: row.impact || '',
        source_url: row.source_url || '',
        metadata_json: metadataJson,
      };
    });

    await writeCsv(outputFile, finalRows, APPEND);
    console.log(
      `\n✨ Successfully rebuilt ${finalRows.length} Open Beauty Facts products from backup`,
    );
    console.log(`📁 Saved to: ${outputFile}`);
    await appendLogs(
      DATASET_KEY,
      `✅ Recovery complete. Wrote ${finalRows.length} rows to ${outputFile}`,
    );
    await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    console.error('❌ Error rebuilding from backup:', error.message);
    await appendLogs(DATASET_KEY, `❌ Recovery failed: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Recovery aborted ---\n`);
    throw error;
  }
}

async function main() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  console.log(`Scraping OBF. Detailed logs: ${logFilePath}`);

  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. BASE_URL: ${BASE_URL}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
  );

  let allProducts = [];
  const pagesProcessed = [];
  const productMap = new Map(); // deduplicate by source_url across all keywords

  // Fetch each keyword with its individual paging parameters
  console.log('🔍 Fetching per keyword with individual parameters...');
  for (const kw of KEYWORDS) {
    const FINAL_FETCH_PAGE = Math.min(kw.END_PAGE, kw.START_PAGE + kw.MAX_PAGES_TO_FETCH - 1);
    console.log(`\n📦 Keyword: "${kw.keyword}" (PAGES: ${kw.START_PAGE}-${FINAL_FETCH_PAGE})`);
    const products = await fetchAllForKeyWord(kw);
    for (const p of products) {
      if (!productMap.has(p.source_url)) {
        productMap.set(p.source_url, p);
      }
    }
    console.log(`   → Unique total so far: ${productMap.size}`);
    pagesProcessed.push(kw.keyword);
  }
  allProducts = Array.from(productMap.values());

  if (allProducts.length === 0) {
    console.log('❌ No products fetched. Exiting.');
    await appendLogs(DATASET_KEY, `⚠️ No products fetched.`);
    await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
    return;
  }

  console.log(`\n📊 Total unique products fetched: ${allProducts.length}`);
  await appendLogs(DATASET_KEY, `Total raw products collected: ${allProducts.length}`);

  let transformed = allProducts.filter((p) => p.problem && (p.materials || p.category));

  if (transformed.length > TARGET_ROWS) {
    transformed = transformed.slice(0, TARGET_ROWS);
  }

  console.log(`✨ Kept ${transformed.length} high‑quality rows.`);
  await appendLogs(DATASET_KEY, `After filtering: kept ${transformed.length} rows.`);

  const finalRows = transformed.map((row, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    problem: row.problem || '',
    solution: row.solution || '',
    materials: row.materials || '',
    circular_strategy: row.circular_strategy || '',
    category: row.category || '',
    impact: row.impact || '',
    source_url: row.source_url || '',
    metadata_json: row.metadata_json,
  }));

  await writeCsv(outputFile, finalRows, APPEND);
  await backup.flush();

  const summary = `✅ Scrape complete. Wrote ${finalRows.length} rows to ${outputFile}. Pages/Keywords processed: ${pagesProcessed.join(', ')}.`;
  console.log(summary);

  const firstRow = finalRows[0];
  const lastRow = finalRows[finalRows.length - 1];

  await appendLogs(DATASET_KEY, summary);
  await appendLogs(
    DATASET_KEY,
    `   First: ${firstRow.ID} | ${firstRow.problem.substring(0, 50)}...`,
  );
  await appendLogs(DATASET_KEY, `   Last:  ${lastRow.ID} | ${lastRow.problem.substring(0, 50)}...`);
  await appendLogs(DATASET_KEY, `\n--- End of run ---\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(async () => {
      await appendLogs(DATASET_KEY, '✅ Run completed successfully.');
    })
    .catch(async (err) => {
      console.error('\n❌ Fatal error:', err.message);
      await appendLogs(DATASET_KEY, `❌ Fatal error: ${err.message}`);
      process.exit(1);
    });
}
