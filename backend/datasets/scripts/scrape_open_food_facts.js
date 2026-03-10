/* global process */

/**
 * scrape_open_food_facts.js - Enhanced version generating problem‑solution pairs
 *
 * Focuses on products with poor Ecoscore ratings (D and E) and uses their detailed
 * environmental data to construct actionable circular economy problems and solutions.
 *
 * Features:
 *   • Targeted search for low Ecoscore products
 *   • API pagination with error handling
 *   • Intelligent problem/solution generation based on packaging, ingredients, and certifications
 *   • Backup system with recovery mode
 *   • Detailed logging to dataset‑specific log file
 *
 * Usage:
 *   node scrape_open_food_facts.js                 # normal run
 *   node scrape_open_food_facts.js --use-backup    # rebuild final CSV from backup
 *   node scrape_open_food_facts.js --clear-logs    # clear the log file before starting
 *   node scrape_open_food_facts.js --append-processed  # append to processed CSV
 *   node scrape_open_food_facts.js --append-backup     # append to backup instead of clearing
 */

import { fileURLToPath } from 'url';
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
const MAX_PAGES_TO_FETCH = 50; // 50
const TARGET_ROWS = 250;
const BACKUP_INTERVAL = 3;

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, MAX_PAGES_TO_FETCH);

/**
 * Fetch one page of results from Open Food Facts API.
 */
async function fetchPage(page) {
  const params = new URLSearchParams({
    search_terms: '',
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: PAGE_SIZE,
    page: page,
    ecoscore_grade: 'd,e', // include both D and E grades
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
 * Intelligent transformation of a product into a problem‑solution pair.
 * Uses ecoscore_data to identify specific environmental issues and suggest improvements.
 */
function transformProduct(product) {
  const categories = product.categories || '';
  const ingredients = product.ingredients_text || '';
  const packaging = product.packaging || '';
  const ecoscoreGrade = product.ecoscore_grade || 'unknown';
  const ecoscoreScore = product.ecoscore_score;
  const ecoscoreData = product.ecoscore_data || {};
  const nutriscore = product.nutriscore_grade;
  const novaGroup = product.nova_group;
  const code = product.code;

  // --- Analyze environmental issues ---
  const issues = [];
  const improvements = [];

  // Packaging analysis from ecoscore_data.adjustments.packaging
  const packagingAdj = ecoscoreData.adjustments?.packaging;
  const packagings = packagingAdj?.packagings || [];

  if (packagings.length > 0) {
    packagings.forEach((p) => {
      const material = p.material || 'unknown material';
      const recycling = p.recycling || '';
      const shape = p.shape || '';

      // Check if material is flagged as non‑recyclable
      if (recycling && recycling.includes('recycle')) {
        // recyclable – good, but may still have other issues
      } else {
        issues.push(`${material} is not recyclable`);
        improvements.push(`replace ${material} with a recyclable alternative`);
      }

      // Identify problematic material types
      if (material.includes('plastic') && !recycling.includes('recycle')) {
        issues.push('single‑use plastic');
        improvements.push('switch to reusable or compostable packaging');
      }
      if (material.includes('multi') || material.includes('composite')) {
        issues.push('complex multi‑layer packaging');
        improvements.push('simplify to mono‑material for better recyclability');
      }
    });
  } else if (packaging) {
    // Fallback: simple keyword analysis on the packaging field
    if (
      packaging.toLowerCase().includes('plastic') &&
      !packaging.toLowerCase().includes('recyclable')
    ) {
      issues.push('non‑recyclable plastic');
      improvements.push('use recyclable plastic');
    }
    if (
      packaging.toLowerCase().includes('multi') ||
      packaging.toLowerCase().includes('composite')
    ) {
      issues.push('multi‑layer packaging');
      improvements.push('switch to mono‑material');
    }
  }

  // Ingredient origin analysis
  const originsAdj = ecoscoreData.adjustments?.origins_of_ingredients;
  if (originsAdj?.warning === 'origins_are_100_percent_unknown') {
    issues.push('ingredients of unknown origin');
    improvements.push(
      'source ingredients with certified sustainable origins (e.g., Fair Trade, Rainforest Alliance)',
    );
  }

  // Production system analysis (lack of certification)
  const productionAdj = ecoscoreData.adjustments?.production_system;
  if (productionAdj?.warning === 'no_label') {
    issues.push('no sustainability certification');
    improvements.push('obtain sustainability certification (e.g., organic, Rainforest Alliance)');
  }

  // Threatened species (e.g., palm oil)
  const threatened = ecoscoreData.adjustments?.threatened_species;
  if (threatened?.ingredient) {
    issues.push(`contains ${threatened.ingredient} linked to deforestation`);
    improvements.push(`source certified sustainable ${threatened.ingredient}`);
  }

  // Carbon footprint – if ecoscoreScore is very low, note it
  if (ecoscoreScore && ecoscoreScore < 30) {
    issues.push('very high carbon footprint');
    improvements.push('reduce carbon footprint by optimising logistics and using renewable energy');
  }

  // --- Construct the problem description ---
  const mainCategory = categories.split(',')[0]?.trim() || 'Food product';
  let problem = '';
  if (issues.length > 0) {
    // Capitalise first letter and join issues
    const issueList = issues.map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(', ');
    problem = `${mainCategory} product with ${issueList}.`;
  } else {
    // Fallback based on ecoscore grade
    if (ecoscoreGrade === 'e') {
      problem = `${mainCategory} product with very high environmental impact (Ecoscore E).`;
    } else if (ecoscoreGrade === 'd') {
      problem = `${mainCategory} product with moderate‑high environmental impact (Ecoscore D).`;
    } else {
      problem = `${mainCategory} product with poor environmental performance.`;
    }
  }

  // --- Construct the solution description ---
  let solution = '';
  if (improvements.length > 0) {
    solution = `Improve sustainability by: ${improvements.join('; ')}.`;
  } else {
    // Generic circular economy advice
    solution =
      'Implement circular economy principles: reduce, reuse, recycle, and redesign packaging.';
  }

  // --- Determine circular strategy ---
  let circularStrategy = 'General';
  if (improvements.some((i) => i.includes('recyclable'))) {
    circularStrategy = 'Design for recycling';
  } else if (improvements.some((i) => i.includes('reusable'))) {
    circularStrategy = 'Reuse';
  } else if (improvements.some((i) => i.includes('compostable'))) {
    circularStrategy = 'Composting';
  } else if (issues.some((i) => i.includes('single‑use'))) {
    circularStrategy = 'Reduce';
  } else if (threatened) {
    circularStrategy = 'Sustainable sourcing';
  } else if (originsAdj?.warning) {
    circularStrategy = 'Traceability & certification';
  }

  // --- Impact summary ---
  const impactParts = [];
  if (ecoscoreScore) impactParts.push(`Ecoscore score: ${ecoscoreScore}`);
  if (ecoscoreGrade) impactParts.push(`Ecoscore grade: ${ecoscoreGrade}`);
  if (nutriscore) impactParts.push(`Nutriscore: ${nutriscore}`);
  if (novaGroup) impactParts.push(`NOVA group: ${novaGroup}`);
  const impact = impactParts.join(' · ') || 'No impact data';

  const sourceUrl = `${PRODUCT_URL_BASE}/${code}`;

  return {
    problem: problem.trim(),
    solution: solution.trim(),
    materials: packaging,
    circular_strategy: circularStrategy,
    category: mainCategory,
    impact,
    source_url: sourceUrl,
    metadata_json: JSON.stringify(product),
  };
}

/**
 * Rebuild final CSV from backup content (recovery mode).
 */
async function rebuildFromBackup() {
  console.log(`♻️ BACKUP RECOVERY MODE: Building final CSV from saved backup...`);
  await appendLogs(DATASET_KEY, `♻️ Recovery mode started.`);

  try {
    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = `⚠️ No backup found.`;
      console.warn(msg);
      await appendLogs(DATASET_KEY, msg);
      return;
    }

    console.log(`📖 Processing ${backupRows.length} backup rows...`);
    await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    // Apply the same quality filter as live scrape
    let transformed = backupRows.filter((p) => {
      return p.problem && p.problem.length > 20 && p.solution && p.solution.length > 20;
    });

    if (transformed.length === 0) {
      console.warn(`⚠️ No rows passed the filter.`);
      await appendLogs(DATASET_KEY, `⚠️ No rows passed the filter.`);
      return;
    }

    if (transformed.length > TARGET_ROWS) {
      transformed = transformed.slice(0, TARGET_ROWS);
    }

    const finalRows = transformed.map((row, idx) => ({
      ID: formatId(DATASET_KEY, idx + 1),
      problem: row.problem || '',
      solution: row.solution || '',
      materials: row.materials || '',
      circular_strategy: row.circular_strategy || '',
      category: row.category || '',
      impact: row.impact || '',
      source_url: row.source_url || '',
      metadata_json:
        typeof row.metadata_json === 'string' ? row.metadata_json : JSON.stringify(row),
    }));

    await writeCsv(outputFile, finalRows, APPEND_PROCESSED);
    console.log(`\n✨ Successfully rebuilt ${finalRows.length} products from backup`);
    console.log(`📁 Saved to: ${outputFile}`);
    await appendLogs(DATASET_KEY, `✅ Recovery complete. Wrote ${finalRows.length} rows.`);
    await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    console.error('❌ Error rebuilding from backup:', error.message);
    await appendLogs(DATASET_KEY, `❌ Recovery failed: ${error.message}`);
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
  console.log(`Scraping Open Food Facts. Detailed logs: ${logFilePath}`);

  const FINAL_FETCH_PAGE = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. Pages: ${START_PAGE}-${FINAL_FETCH_PAGE}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}`,
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

      // Transform each product for this page
      const pageRows = products.map(transformProduct).filter((p) => p.problem && p.solution);

      await appendLogs(
        DATASET_KEY,
        `Page ${page}: got ${products.length} raw, kept ${pageRows.length} rows after transformation.`,
      );

      // Add to backup (per page)
      await backup.add(pageRows);

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
    return;
  }

  // Transform all products (including those from backup may have been saved already, but we need final list)
  let transformed = allProducts.map(transformProduct);

  // Apply a stricter filter: problem and solution must be at least 20 characters
  transformed = transformed.filter((p) => p.problem.length >= 20 && p.solution.length >= 20);

  // Limit to target rows
  if (transformed.length > TARGET_ROWS) {
    transformed = transformed.slice(0, TARGET_ROWS);
  }

  await appendLogs(DATASET_KEY, `After filtering: kept ${transformed.length} rows.`);

  // Assign final IDs
  const finalRows = transformed.map((row, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    problem: row.problem,
    solution: row.solution,
    materials: row.materials,
    circular_strategy: row.circular_strategy,
    category: row.category,
    impact: row.impact,
    source_url: row.source_url,
    metadata_json: row.metadata_json,
  }));

  await writeCsv(outputFile, finalRows, APPEND_PROCESSED);
  await backup.flush(); // ensure any remaining buffer is written

  const summary = `✅ Scrape complete. Wrote ${finalRows.length} rows to ${outputFile}. Pages scraped: ${pagesScraped.join(', ')}.`;
  console.log(summary);

  if (finalRows.length > 0) {
    const firstRow = finalRows[0];
    const lastRow = finalRows[finalRows.length - 1];
    await appendLogs(DATASET_KEY, summary);
    await appendLogs(
      DATASET_KEY,
      `   First: ${firstRow.ID} | ${firstRow.problem.substring(0, 50)}...`,
    );
    await appendLogs(
      DATASET_KEY,
      `   Last:  ${lastRow.ID} | ${lastRow.problem.substring(0, 50)}...`,
    );
  }
  await appendLogs(DATASET_KEY, `\n--- End of run ---\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
