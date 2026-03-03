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
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendBackupLog,
  clearBackupLog,
  getDatasetBackupLogPath,
  getDatasetProcessedCsvPath,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.opf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// Configuration
const BASE_URL = dataset.urls.search;
const PRODUCT_URL_BASE = dataset.urls.product;
const PAGE_SIZE = 200;
const MAX_PAGES_FALLBACK = 50; //50 Maximum pages per keyword (or combined)
const TARGET_ROWS = 250; // Desired final rows
const BACKUP_INTERVAL = 3; // Flush backup every 3 pages
const CLEAR_BACKUP_ON_START = true;
const MIN_PROBLEM_WORDS = 5; // Minimum words in problem to keep a row
const MIN_SOLUTION_WORDS = 5; // Minimum words in solution to keep a row

// Backup helper
const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START,
  MAX_PAGES_FALLBACK,
);

// Keyword mapping to circular strategies and problem/solution templates
const KEYWORD_CONFIG = [
  {
    keywords: ['refillable', 'refill', 'rechargeable'],
    strategy: 'Refillable',
    problem: 'Single-use packaging waste',
    solution: 'Refillable system reduces single-use packaging',
  },
  {
    keywords: ['recycled', 'post-consumer', 'recycled content'],
    strategy: 'Recycled Materials',
    problem: 'High virgin material footprint',
    solution: 'Contains recycled content to reduce virgin material use',
  },
  {
    keywords: ['fsc', 'forest stewardship council', 'sustainable forestry'],
    strategy: 'Sustainable Sourcing (FSC)',
    problem: 'Unsustainable sourcing of paper/wood materials',
    solution: 'FSC-certified materials for responsible forestry',
  },
  {
    keywords: ['modular', 'reparable', 'repairable', 'spare parts'],
    strategy: 'Modular Design',
    problem: 'Difficult-to-repair or single-use product parts',
    solution: 'Modular components enable repair and reuse',
  },
  {
    keywords: ['biodegradable', 'compostable', 'home compostable'],
    strategy: 'Biodegradable/Compostable',
    problem: 'End-of-life waste persistence',
    solution: 'Biodegradable/compostable materials reduce long-term waste',
  },
  {
    keywords: ['reusable', 'reuse', 'returnable'],
    strategy: 'Reusable',
    problem: 'High consumption of disposable items',
    solution: 'Reusable design reduces waste and resource use',
  },
  {
    keywords: ['eco', 'green', 'sustainable', 'environmentally friendly'],
    strategy: 'General Sustainable',
    problem: 'General environmental impact',
    solution: 'Product with broad sustainability attributes',
  },
];

// Default fallback
const FALLBACK_STRATEGY = 'General';
const FALLBACK_PROBLEM = 'Packaging-related environmental impact';
const FALLBACK_SOLUTION = 'Product with potential circular attributes';

/**
 * Fetch a page of results for a given search term.
 * Returns empty array if the page doesn't exist (HTTP 500 or 404).
 */
async function fetchPage(searchTerms, page) {
  const params = new URLSearchParams({
    search_terms: searchTerms,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: PAGE_SIZE,
    page: page,
  });

  const url = `${BASE_URL}?${params.toString()}`;
  await appendBackupLog(DATASET_KEY, `Fetching: ${url}`);

  try {
    const response = await fetch(url);
    if (response.status === 500 || response.status === 404) {
      await appendBackupLog(DATASET_KEY, `  → No more products (HTTP ${response.status})`);
      return [];
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.products || [];
  } catch (err) {
    await appendBackupLog(DATASET_KEY, `  → Error fetching page: ${err.message}`);
    return [];
  }
}

/**
 * Fetch all pages for a single keyword, up to MAX_PAGES_FALLBACK.
 */
async function fetchAllForKeyWord(keyword) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES_FALLBACK; page++) {
    const products = await fetchPage(keyword, page);
    if (products.length === 0) break;

    const transformed = products
      .map(transformProduct)
      .filter((p) => p.problem && p.solution && p.materials && p.category);
    all.push(...transformed);

    // Log page details to backup log
    await appendBackupLog(
      DATASET_KEY,
      `Keyword "${keyword}" page ${page}: got ${products.length} raw, kept ${transformed.length} (total so far: ${all.length})`,
    );

    try {
      await backup.add(transformed);
    } catch (e) {
      const errMsg = `⚠️ Backup add failed for ${keyword} page ${page}: ${e.message}`;
      console.warn(errMsg);
      await appendBackupLog(DATASET_KEY, errMsg);
    }

    if (page === MAX_PAGES_FALLBACK) {
      const limitMsg = `⚠️ Reached fallback max pages (${MAX_PAGES_FALLBACK}) for keyword "${keyword}" – stopping.`;
      console.warn(limitMsg);
      await appendBackupLog(DATASET_KEY, limitMsg);
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
    await appendBackupLog(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = `⚠️ No backup content found. Cannot rebuild output.`;
      console.warn(msg);
      await appendBackupLog(DATASET_KEY, msg);
      await appendBackupLog(DATASET_KEY, `\n--- End of recovery run (no data) ---\n`);
      return;
    }

    console.log(`📖 Processing ${backupRows.length} backup rows...`);
    await appendBackupLog(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    // Apply the same filtering as live scrape
    let transformed = backupRows.filter(isHighQuality);

    if (transformed.length === 0) {
      console.warn(`⚠️ No valid rows after filtering.`);
      await appendBackupLog(DATASET_KEY, `⚠️ No valid rows – output file unchanged.`);
      await appendBackupLog(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    if (transformed.length > TARGET_ROWS) {
      transformed = transformed.slice(0, TARGET_ROWS);
    }

    console.log(`✅ Selected ${transformed.length} high-quality rows from backup`);
    await appendBackupLog(DATASET_KEY, `Selected ${transformed.length} rows after filtering.`);

    const finalRows = transformed.map((row, idx) => {
      const metadataJson =
        typeof row.metadata_json === 'string' ? row.metadata_json : JSON.stringify(row);
      return {
        ID: formatId(`${DATASET_KEY}_`, idx + 1),
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

    await writeCsv(outputFile, finalRows);
    console.log(
      `\n✨ Successfully rebuilt ${finalRows.length} Open Products Facts products from backup`,
    );
    console.log(`📁 Saved to: ${outputFile}`);
    await appendBackupLog(
      DATASET_KEY,
      `✅ Recovery complete. Wrote ${finalRows.length} rows to ${outputFile}`,
    );
    await appendBackupLog(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    console.error('❌ Error rebuilding from backup:', error.message);
    await appendBackupLog(DATASET_KEY, `❌ Recovery failed: ${error.message}`);
    await appendBackupLog(DATASET_KEY, `\n--- Recovery aborted ---\n`);
    throw error;
  }
}

async function main() {
  await clearBackupLog(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetBackupLogPath(DATASET_KEY);
  console.log(`Scraping OPF. Detailed logs: ${logFilePath}`);

  await appendBackupLog(
    DATASET_KEY,
    `🚀 Scrape started. BASE_URL: ${BASE_URL}, MAX_PAGES_FALLBACK: ${MAX_PAGES_FALLBACK}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
  );

  console.log('🔍 Attempting combined keyword search...');
  let allProducts = [];
  const pagesProcessed = [];

  // Combined search
  try {
    const combined = [];
    for (let page = 1; page <= MAX_PAGES_FALLBACK; page++) {
      const products = await fetchPage(KEYWORDS.join(' '), page);
      if (products.length === 0) break;

      const transformed = products.map(transformProduct).filter(isHighQuality);
      combined.push(...transformed);

      // Log page details to backup log
      await appendBackupLog(
        DATASET_KEY,
        `Combined search page ${page}: got ${products.length} raw, kept ${transformed.length} (total so far: ${combined.length})`,
      );

      try {
        await backup.add(transformed);
      } catch (e) {
        const errMsg = `⚠️ Backup add failed for combined page ${page}: ${e.message}`;
        console.warn(errMsg);
        await appendBackupLog(DATASET_KEY, errMsg);
      }

      if (transformed.length > 0) {
        pagesProcessed.push(`combined-${page}`);
      }

      if (page === MAX_PAGES_FALLBACK) {
        const limitMsg = `⚠️ Reached fallback max pages (${MAX_PAGES_FALLBACK}) for combined search – stopping.`;
        console.warn(limitMsg);
        await appendBackupLog(DATASET_KEY, limitMsg);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if (combined.length > 0) {
      allProducts = combined;
      console.log(`✅ Combined search returned ${allProducts.length} products.`);
    } else {
      console.log('⚠️ Combined search returned 0 products. Falling back to per‑keyword fetching.');
    }
  } catch (err) {
    const errMsg = `⚠️ Combined search failed: ${err.message}`;
    console.warn(errMsg);
    await appendBackupLog(DATASET_KEY, errMsg);
  }

  // If combined search didn't work, fetch per keyword
  if (allProducts.length === 0) {
    console.log('🔍 Fetching per keyword...');
    const productMap = new Map(); // deduplicate by source_url (contains product code)

    for (const keyword of KEYWORDS) {
      console.log(`\n📦 Keyword: "${keyword}"`);
      const products = await fetchAllForKeyWord(keyword);
      for (const p of products) {
        if (!productMap.has(p.source_url)) {
          productMap.set(p.source_url, p);
        }
      }
      console.log(`   → Unique total so far: ${productMap.size}`);
      pagesProcessed.push(keyword);
    }
    allProducts = Array.from(productMap.values());
  }

  if (allProducts.length === 0) {
    console.log('❌ No products fetched. Exiting.');
    await appendBackupLog(DATASET_KEY, `⚠️ No products fetched.`);
    await appendBackupLog(DATASET_KEY, `\n--- End of run (no output) ---\n`);
    return;
  }

  console.log(`\n📊 Total unique products fetched: ${allProducts.length}`);
  await appendBackupLog(DATASET_KEY, `Total raw products collected: ${allProducts.length}`);

  // Apply final quality filter and limit
  let transformed = allProducts.filter(isHighQuality);

  if (transformed.length > TARGET_ROWS) {
    transformed = transformed.slice(0, TARGET_ROWS);
  }

  console.log(`✨ Kept ${transformed.length} high‑quality rows.`);
  await appendBackupLog(DATASET_KEY, `After filtering: kept ${transformed.length} rows.`);

  const finalRows = transformed.map((row, idx) => ({
    ID: formatId(`${DATASET_KEY}_`, idx + 1),
    problem: row.problem || '',
    solution: row.solution || '',
    materials: row.materials || '',
    circular_strategy: row.circular_strategy || '',
    category: row.category || '',
    impact: row.impact || '',
    source_url: row.source_url || '',
    metadata_json: row.metadata_json, // already a JSON string
  }));

  await writeCsv(outputFile, finalRows);
  await backup.flush(); // ensure any remaining buffer is written

  const summary = `✅ Scrape complete. Wrote ${finalRows.length} rows to ${outputFile}. Pages/Keywords processed: ${pagesProcessed.join(', ')}.`;
  console.log(summary);
  await appendBackupLog(DATASET_KEY, summary);
  await appendBackupLog(DATASET_KEY, `\n--- End of run ---\n`);
}

// Extract the KEYWORDS array from the config (for combined search)
const KEYWORDS = KEYWORD_CONFIG.flatMap((cfg) => cfg.keywords);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
