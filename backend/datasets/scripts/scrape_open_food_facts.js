/* global process */

/**
 * scrape_open_food_facts.js - Food and beverage products scraping from Open Food Facts API
 *
 * Focuses on products with poor Ecoscore ratings (D and E grades) to identify food system
 * environmental challenges and circular economy improvement opportunities. Extracts corporate
 * food waste issues, packaging sustainability, and ingredient sourcing.
 *
 * Features:
 *   • Targeted search for low Ecoscore products (environmental impact baseline)
 *   • API pagination with error handling
 *   • Per-product detail extraction (categories, ingredients, packaging, Ecoscore, Nutriscore)
 *   • Intelligent problem/solution mapping based on environmental performance metrics
 *   • Backup system: incremental batch-level backup with recovery mode
 *   • Quality filtering for significant environmental impact cases
 *   • Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_open_food_facts.js                 # normal run
 *   node scrape_open_food_facts.js --use-backup    # rebuild final CSV from backup
 *   node scrape_open_food_facts.js --clear-logs    # clear the log file before starting
 *   node scrape_open_food_facts.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_open_food_facts.js --append-backup     # append to backup instead of clearing on start
 *
 * For detailed logs, see the path printed at the start of the run.
 * Note: Requires active internet connection to access Open Food Facts API
 */
import {
  formatId,
  DATASET_LOOKUP,
  DATASET_KEYS,
  writeCsv,
  hasAppendProcessedFlag,
  hasAppendBackupFlag,
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  getDatasetScrapeLogsPath,
  getDatasetProcessedCsvPath,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.off;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// Configuration
const BASE_URL = dataset.urls.search;
const PRODUCT_URL_BASE = dataset.urls.product;
const PAGE_SIZE = 100;
const START_PAGE = 1;
const END_PAGE = 50;
const MAX_PAGES_TO_FETCH = 50; // Maximum number of pages to fetch
const TARGET_ROWS = 250; // Desired final rows
const BACKUP_INTERVAL = 3; // Flush backup every 3 pages
const CLEAR_BACKUP_ON_START = true;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START && !APPEND_BACKUP,
  MAX_PAGES_TO_FETCH,
);

/**
 * Fetch one page of results from Open Food Facts API.
 * @param {number} page - Page number (1-indexed)
 * @returns {Promise<Array>} - Array of product objects
 */
async function fetchPage(page) {
  const params = new URLSearchParams({
    search_terms: '',
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: PAGE_SIZE,
    page: page,
    ecoscore_grade: 'e', // only products with worst ecoscore
  });

  const url = `${BASE_URL}?${params.toString()}`;
  await appendLogs(DATASET_KEY, `Fetching page ${page}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.products || [];
}

/**
 * Clean and extract relevant fields from a product object.
 */
function transformProduct(product) {
  const categories = product.categories || '';
  const ingredients = product.ingredients_text || '';
  const packaging = product.packaging || '';
  const ecoscoreGrade = product.ecoscore_grade || 'unknown';
  const ecoscoreScore = product.ecoscore_score;
  const carbonFootprint = product.carbon_footprint;
  const nutriscore = product.nutriscore_grade;
  const novaGroup = product.nova_group;
  const code = product.code;

  let problem = `Poor environmental performance`;
  if (ecoscoreGrade === 'e') {
    problem = `Ecoscore E product: high environmental impact`;
  } else if (ecoscoreGrade === 'd') {
    problem = `Ecoscore D product: moderate‑high impact`;
  }

  const solutionParts = [];
  if (categories) solutionParts.push(`Categories: ${categories}`);
  if (packaging) solutionParts.push(`Packaging: ${packaging}`);
  if (ingredients) {
    const shortIngredients = ingredients.substring(0, 100) + (ingredients.length > 100 ? '…' : '');
    solutionParts.push(`Ingredients: ${shortIngredients}`);
  }
  const solution = solutionParts.join(' · ') || 'No detailed information';

  let circularStrategy = 'General';
  if (
    packaging.toLowerCase().includes('recyclable') ||
    packaging.toLowerCase().includes('recycle')
  ) {
    circularStrategy = 'Recyclable packaging';
  } else if (
    packaging.toLowerCase().includes('reusable') ||
    packaging.toLowerCase().includes('reuse')
  ) {
    circularStrategy = 'Reusable packaging';
  } else if (
    ingredients.toLowerCase().includes('organic') ||
    categories.toLowerCase().includes('organic')
  ) {
    circularStrategy = 'Organic production';
  } else if (ecoscoreGrade === 'e') {
    circularStrategy = 'Needs improvement – high impact';
  }

  const impactParts = [];
  if (ecoscoreScore) impactParts.push(`Ecoscore score: ${ecoscoreScore}`);
  if (carbonFootprint) impactParts.push(`Carbon footprint: ${carbonFootprint}`);
  if (nutriscore) impactParts.push(`Nutriscore: ${nutriscore}`);
  if (novaGroup) impactParts.push(`NOVA group: ${novaGroup}`);
  const impact = impactParts.join(' · ') || 'No impact data';

  const sourceUrl = `${PRODUCT_URL_BASE}/${code}`;

  return {
    problem,
    solution,
    materials: packaging,
    circular_strategy: circularStrategy,
    category: categories.split(',')[0]?.trim() || 'Food product',
    impact,
    source_url: sourceUrl,
    metadata_json: JSON.stringify(product),
  };
}

/**
 * Rebuild final CSV from backup content.
 * Used when --use-backup flag is passed to script.
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

    // Apply the same strict filter as live scrape
    let transformed = backupRows.filter((p) => {
      const hasName = p.problem && p.problem !== 'Poor environmental performance';
      const hasCategory = p.category && p.category !== 'Food product';
      const hasPackaging = p.materials && p.materials.length > 10;
      const hasScore = p.impact.includes('Ecoscore score');
      return hasName && hasCategory && hasPackaging && hasScore;
    });

    if (transformed.length === 0) {
      console.warn(`⚠️ No rows passed the filter.`);
      await appendLogs(DATASET_KEY, `⚠️ No rows passed the filter.`);
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

    await writeCsv(outputFile, finalRows, APPEND_PROCESSED);
    console.log(
      `\n✨ Successfully rebuilt ${finalRows.length} Open Food Facts products from backup`,
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
  console.log(`Scraping OFF. Detailed logs: ${logFilePath}`);

  const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. BASE_URL: ${BASE_URL}, PAGES: ${START_PAGE}-${FINAL_FETCH_PAGE}, MAX_PAGES_TO_FETCH: ${MAX_PAGES_TO_FETCH}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
  );

  const allProducts = [];
  const pagesScraped = [];

  for (let page = START_PAGE; page <= FINAL_FETCH_PAGE; page++) {
    try {
      const products = await fetchPage(page);
      if (products.length === 0) {
        await appendLogs(DATASET_KEY, 'No more products found.');
        break;
      }

      // Transform and filter immediately for backup
      const pageRows = products
        .map(transformProduct)
        .filter((p) => p.problem && (p.materials || p.category));

      // Log page details to backup log
      await appendLogs(
        DATASET_KEY,
        `Page ${page}: got ${products.length} raw, kept ${pageRows.length} rows (total so far: ${allProducts.length + products.length})`,
      );

      // Add to backup helper (per page)
      try {
        await backup.add(pageRows);
      } catch (e) {
        const errMsg = `⚠️ Backup add failed for page ${page}: ${e.message}`;
        console.warn(errMsg);
        await appendLogs(DATASET_KEY, errMsg);
      }

      allProducts.push(...products);
      pagesScraped.push(page);

      if (page === FINAL_FETCH_PAGE) {
        const limitMsg = `⚠️ Reached final fetch page (${FINAL_FETCH_PAGE}) – stopping.`;
        console.warn(limitMsg);
        await appendLogs(DATASET_KEY, limitMsg);
        break;
      }

      // Polite delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      const errMsg = `❌ Failed to fetch page ${page}: ${err.message}`;
      console.error(errMsg);
      await appendLogs(DATASET_KEY, errMsg);
      break;
    }
  }

  if (allProducts.length === 0) {
    console.log('❌ No products fetched. Exiting.');
    await appendLogs(DATASET_KEY, `⚠️ No products fetched.`);
    await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
    return;
  }

  // Transform all products
  let transformed = allProducts.map(transformProduct);

  // Apply strict filter
  transformed = transformed.filter((p) => {
    const hasName = p.problem && p.problem !== 'Poor environmental performance';
    const hasCategory = p.category && p.category !== 'Food product';
    const hasPackaging = p.materials && p.materials.length > 10;
    const hasScore = p.impact.includes('Ecoscore score');
    return hasName && hasCategory && hasPackaging && hasScore;
  });

  if (transformed.length > TARGET_ROWS) {
    transformed = transformed.slice(0, TARGET_ROWS);
  }

  await appendLogs(DATASET_KEY, `After filtering: kept ${transformed.length} rows.`);

  // Prepare final rows with proper IDs
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

  await writeCsv(outputFile, finalRows, APPEND_PROCESSED);
  await backup.flush(); // ensure any remaining buffer is written

  const summary = `✅ Scrape complete. Wrote ${finalRows.length} rows to ${outputFile}. Pages scraped: ${pagesScraped.join(', ')}.`;
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
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
