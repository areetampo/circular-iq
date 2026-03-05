/**
 * scrape_open_products_facts.js
 *
 * Scrapes products from the Open Products Journal (Open Products Facts) API.
 * Searches for products with circular economy attributes (refillable, recycled materials,
 * sustainable sourcing, modular design, biodegradable, reusable) and extracts
 * detailed product information with environmental impact assessments.
 *
 * Features:
 *   - Keyword-based search targeting specific circular economy strategies
 *   - Intelligent keyword-to-strategy mapping (refillable, recycled, FSC, modular, etc.)
 *   - API pagination with graceful handling of search result limits
 *   - Per-product detail extraction (company, category, packaging, ingredients, certifications)
 *   - Contextual problem/solution generation based on detected attributes
 *   - Quality filtering based on content completeness (minimum word counts)
 *   - Backup system: incremental batch-level backup with recovery mode
 *   - Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_open_products_facts.js                 # normal run
 *   node scrape_open_products_facts.js --use-backup    # rebuild final CSV from backup
 *   node scrape_open_products_facts.js --clear-logs    # clear the log file before starting
 *
 * For detailed logs, see the path printed at the start of the run.
 * Note: Requires active internet connection to access Open Products Facts API
 */

import { fileURLToPath } from 'url';
import {
  formatId,
  DATASET_LOOKUP,
  DATASET_KEYS,
  writeCsv,
  hasAppendFlag,
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
  getDatasetProcessedCsvPath,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.opf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// Configuration
const BASE_URL = dataset.urls.search;
const PRODUCT_URL_BASE = dataset.urls.product;
const TARGET_ROWS = 250; // Desired final rows
const BACKUP_INTERVAL = 3; // Flush backup every 3 pages
const CLEAR_BACKUP_ON_START = true;
const MIN_PROBLEM_WORDS = 5; // Minimum words in problem to keep a row
const MIN_SOLUTION_WORDS = 5; // Minimum words in solution to keep a row

// Keyword mapping to circular strategies and problem/solution templates
// Each keyword group can define its own pagination parameters.
const KEYWORD_CONFIG = [
  {
    keywords: ['refillable', 'refill', 'rechargeable'],
    strategy: 'Refillable',
    problem: 'Single-use packaging waste',
    solution: 'Refillable system reduces single-use packaging',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  {
    keywords: ['recycled', 'post-consumer', 'recycled content'],
    strategy: 'Recycled Materials',
    problem: 'High virgin material footprint',
    solution: 'Contains recycled content to reduce virgin material use',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  {
    keywords: ['fsc', 'forest stewardship council', 'sustainable forestry'],
    strategy: 'Sustainable Sourcing (FSC)',
    problem: 'Unsustainable sourcing of paper/wood materials',
    solution: 'FSC-certified materials for responsible forestry',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  {
    keywords: ['modular', 'reparable', 'repairable', 'spare parts'],
    strategy: 'Modular Design',
    problem: 'Difficult-to-repair or single-use product parts',
    solution: 'Modular components enable repair and reuse',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  {
    keywords: ['biodegradable', 'compostable', 'home compostable'],
    strategy: 'Biodegradable/Compostable',
    problem: 'End-of-life waste persistence',
    solution: 'Biodegradable/compostable materials reduce long-term waste',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  {
    keywords: ['reusable', 'reuse', 'returnable'],
    strategy: 'Reusable',
    problem: 'High consumption of disposable items',
    solution: 'Reusable design reduces waste and resource use',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  {
    keywords: ['eco', 'green', 'sustainable', 'environmentally friendly'],
    strategy: 'General Sustainable',
    problem: 'General environmental impact',
    solution: 'Product with broad sustainability attributes',
    PAGE_SIZE: 200,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
];

// Calculate total maximum pages across all keyword configs and initialize backup helper
const TOTAL_MAX_PAGES = KEYWORD_CONFIG.reduce((sum, cfg) => sum + cfg.MAX_PAGES_TO_FETCH, 0);
const APPEND = hasAppendFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START,
  TOTAL_MAX_PAGES,
);

// Default fallback
const FALLBACK_STRATEGY = 'General';
const FALLBACK_PROBLEM = 'Packaging-related environmental impact';
const FALLBACK_SOLUTION = 'Product with potential circular attributes';

/**
 * Fetch a page of results for a given search term.
 * Returns empty array if the page doesn't exist (HTTP 500 or 404).
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
  await appendLogs(DATASET_KEY, `Fetching: ${url}`);

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

/**
 * Fetch all pages for a single keyword config.
 */
async function fetchAllForKeyWord(config) {
  const {
    keywords,
    PAGE_SIZE = 200,
    START_PAGE = 1,
    END_PAGE = 50,
    MAX_PAGES_TO_FETCH: keywordFallback = 50,
  } = config;
  const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + keywordFallback - 1);
  const searchTerm = keywords.join(' ');
  const all = [];
  for (let page = START_PAGE; page <= FINAL_FETCH_PAGE; page++) {
    const products = await fetchPage(searchTerm, page, PAGE_SIZE);

    if (products.length === 0) break;

    const transformed = products
      .map(transformProduct)
      .filter((p) => p.problem && p.solution && p.materials && p.category);
    all.push(...transformed);

    // Log page details to backup log
    await appendLogs(
      DATASET_KEY,
      `Keyword "${searchTerm}" page ${page}: got ${products.length} raw, kept ${transformed.length} (total so far: ${all.length})`,
    );

    try {
      await backup.add(transformed);
    } catch (e) {
      const errMsg = `⚠️ Backup add failed for ${searchTerm} page ${page}: ${e.message}`;
      console.warn(errMsg);
      await appendLogs(DATASET_KEY, errMsg);
    }

    if (page === keywordFallback) {
      const limitMsg = `⚠️ Reached fallback max pages (${keywordFallback}) for keyword "${searchTerm}" – stopping.`;
      console.warn(limitMsg);
      await appendLogs(DATASET_KEY, limitMsg);
    }

    await new Promise((resolve) => setTimeout(resolve, 300)); // be polite
  }
  return all;
}

/**
 * Normalize text: lower case, remove extra spaces.
 */
function normalizeText(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Check if a keyword (or any of its variants) appears in a text.
 */
function containsKeyword(text, keywordList) {
  const normalized = normalizeText(text);
  return keywordList.some((kw) => normalized.includes(kw.toLowerCase()));
}

/**
 * Generate a descriptive problem/solution pair based on product data.
 */
function generateProblemSolution(product, combinedText) {
  // Try to find the first matching keyword config
  for (const config of KEYWORD_CONFIG) {
    if (containsKeyword(combinedText, config.keywords)) {
      // Use product name to add specificity
      const productName = product.product_name || 'the product';
      const specificProblem = `${config.problem} for ${productName}`;
      const specificSolution = `${config.solution}. ${productName} exhibits this circular attribute.`;
      return {
        strategy: config.strategy,
        problem: specificProblem,
        solution: specificSolution,
      };
    }
  }

  // Fallback: use product name to create a more specific generic entry
  const productName = product.product_name || 'product';
  return {
    strategy: FALLBACK_STRATEGY,
    problem: `Environmental impact of ${productName}`,
    solution: `Product (${productName}) with potential circular attributes based on its packaging and labels.`,
  };
}

/**
 * Extract a meaningful impact statement from product data.
 */
function generateImpact(product) {
  if (product.ecoscore_grade) {
    return `Eco-Score: ${product.ecoscore_grade} (score: ${product.ecoscore_score || 'N/A'})`;
  }
  if (product['carbon-footprint_100g']) {
    return `Carbon footprint: ${product['carbon-footprint_100g']} g CO₂/100g`;
  }
  if (product.nutriscore_grade) {
    return `Nutri-Score: ${product.nutriscore_grade}`;
  }
  return 'No specific impact data available';
}

/**
 * Transform a raw product object into a row for our CSV.
 */
function transformProduct(product) {
  const categories = product.categories || product.categories_en || '';
  const packaging = product.packaging || product.packaging_text || '';
  const labels = product.labels || product.labels_en || '';
  const productName = product.product_name || '';
  const code = product.code;

  // Combine multiple fields for keyword matching
  const combinedText = [productName, categories, packaging, labels].join(' ');

  const { strategy, problem, solution } = generateProblemSolution(product, combinedText);
  const impact = generateImpact(product);
  const sourceUrl = `${PRODUCT_URL_BASE}/${code}`;
  const category = categories.split(',')[0]?.trim() || 'Product';

  return {
    problem,
    solution,
    materials: packaging,
    circular_strategy: strategy,
    category,
    impact,
    source_url: sourceUrl,
    metadata_json: JSON.stringify(product),
  };
}

/**
 * Filter out rows that are too generic or short.
 */
function isHighQuality(row) {
  const problemWords = (row.problem || '').split(/\s+/).length;
  const solutionWords = (row.solution || '').split(/\s+/).length;
  return (
    problemWords >= MIN_PROBLEM_WORDS &&
    solutionWords >= MIN_SOLUTION_WORDS &&
    row.materials &&
    row.category
  );
}

/**
 * Rebuild final CSV from backup content.
 */
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

    // Apply the same filtering as live scrape
    let transformed = backupRows.filter(isHighQuality);

    if (transformed.length === 0) {
      console.warn(`⚠️ No valid rows after filtering.`);
      await appendLogs(DATASET_KEY, `⚠️ No valid rows – output file unchanged.`);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    if (transformed.length > TARGET_ROWS) {
      transformed = transformed.slice(0, TARGET_ROWS);
    }

    console.log(`✅ Selected ${transformed.length} high-quality rows from backup`);
    await appendLogs(DATASET_KEY, `Selected ${transformed.length} rows after filtering.`);

    const finalRows = transformed.map((row, idx) => {
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
      `\n✨ Successfully rebuilt ${finalRows.length} Open Products Facts products from backup`,
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
  console.log(`Scraping OPF. Detailed logs: ${logFilePath}`);

  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. BASE_URL: ${BASE_URL}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
  );

  console.log('🔍 Fetching per keyword config with individual parameters...');
  let allProducts = [];
  const pagesProcessed = [];
  const productMap = new Map(); // deduplicate by source_url across all configs

  // Fetch each keyword config with its individual paging parameters
  for (const config of KEYWORD_CONFIG) {
    const display = config.keywords.join(', ');
    const FINAL_FETCH_PAGE = Math.min(
      config.END_PAGE,
      config.START_PAGE + config.MAX_PAGES_TO_FETCH - 1,
    );
    console.log(
      `\n📦 Keyword group: "${display}" (PAGES: ${config.START_PAGE}-${FINAL_FETCH_PAGE})`,
    );
    const products = await fetchAllForKeyWord(config);
    for (const p of products) {
      if (!productMap.has(p.source_url)) {
        productMap.set(p.source_url, p);
      }
    }
    console.log(`   → Unique total so far: ${productMap.size}`);
    pagesProcessed.push(display);
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

  // Apply final quality filter and limit
  let transformed = allProducts.filter(isHighQuality);

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
    metadata_json: row.metadata_json, // already a JSON string
  }));

  await writeCsv(outputFile, finalRows, APPEND);
  await backup.flush(); // ensure any remaining buffer is written

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

// Extract the KEYWORDS array from the config (for combined search)
const KEYWORDS = KEYWORD_CONFIG.flatMap((cfg) => cfg.keywords);

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
