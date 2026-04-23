
/**
 * scrape_open_products_facts.js – Expanded version
 *
 * Searches for products with circular economy attributes using a wider set of keywords.
 * Each keyword group defines its own pagination limits.
 * Results are deduplicated and filtered for quality.
 *
 * Changes from original:
 *   • Broader keyword groups (more general sustainability terms)
 *   • Increased MAX_PAGES_TO_FETCH from 20 to 50 per group
 *   • Relaxed MIN_PROBLEM_WORDS / MIN_SOLUTION_WORDS from 5 to 3
 *   • Added additional circular strategies (e.g., "Plastic Free", "Zero Waste")
 *
 * Usage:
 *   node scrape_open_products_facts.js                 # normal run
 *   node scrape_open_products_facts.js --use-backup    # rebuild final CSV from backup
 *   node scrape_open_products_facts.js --clear-logs    # clear the log file before starting
 *   node scrape_open_products_facts.js --append-processed  # append to processed CSV
 *   node scrape_open_products_facts.js --append-backup     # append to backup instead of clearing
 */

import { fileURLToPath } from 'url';

import {
    appendLogs,
    clearLogs,
    createBackupHelper,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getDatasetProcessedCsvPath,
    getDatasetScrapeLogsPath,
    hasAppendBackupFlag,
    hasAppendProcessedFlag,
    isBackupRecoveryMode,
    readBackupCsv,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const DATASET_KEY = DATASET_KEYS.opf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// ================== CONFIGURATION ==================
const API_BASE = dataset.urls.apiBase;
const PRODUCT_URL_BASE = dataset.urls.productUrlBase;
const TARGET_ROWS = 500; // increased target
const BACKUP_INTERVAL = 3;
const MIN_PROBLEM_WORDS = 3; // relaxed from 5
const MIN_SOLUTION_WORDS = 3; // relaxed from 5
const REQUEST_DELAY_MS = 1000;
const MAX_RETRIES = 3;
const FALLBACK_STRATEGY = 'General';
const FALLBACK_PROBLEM = 'Packaging-related environmental impact';
const FALLBACK_SOLUTION = 'Product with potential circular attributes';

const REQUESTED_FIELDS = [
  'code',
  'product_name',
  'categories',
  'packaging',
  'labels',
  'ecoscore_grade',
  'ecoscore_score',
  'carbon-footprint_100g',
  'nutriscore_grade',
].join(',');

// Expanded keyword groups with more general terms
const KEYWORD_CONFIG = [
  // Original refillable group
  {
    keywords: ['refillable', 'refill', 'rechargeable'],
    strategy: 'Refillable',
    problem: 'Single-use packaging waste',
    solution: 'Refillable system reduces single-use packaging',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50, // increased from 20
  },
  // Recycled / post-consumer
  {
    keywords: ['recycled', 'post-consumer', 'recycled content', 'recyclable'],
    strategy: 'Recycled Materials',
    problem: 'High virgin material footprint',
    solution: 'Contains recycled content or is recyclable, reducing virgin material use',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // FSC / sustainable forestry
  {
    keywords: ['fsc', 'forest stewardship council', 'sustainable forestry', 'wood', 'paper'],
    strategy: 'Sustainable Sourcing (FSC)',
    problem: 'Unsustainable sourcing of paper/wood materials',
    solution: 'FSC-certified materials for responsible forestry',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Modular / repairable
  {
    keywords: ['modular', 'reparable', 'repairable', 'spare parts', 'durable'],
    strategy: 'Modular Design',
    problem: 'Difficult-to-repair or short-lived product parts',
    solution: 'Modular components enable repair, reuse, and longer life',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Biodegradable / compostable
  {
    keywords: ['biodegradable', 'compostable', 'home compostable', 'oxodegradable'],
    strategy: 'Biodegradable/Compostable',
    problem: 'End-of-life waste persistence',
    solution: 'Biodegradable/compostable materials reduce long-term waste',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Reusable / returnable
  {
    keywords: ['reusable', 'reuse', 'returnable', 'multi-use'],
    strategy: 'Reusable',
    problem: 'High consumption of disposable items',
    solution: 'Reusable design reduces waste and resource use',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Plastic free / zero waste
  {
    keywords: ['plastic free', 'no plastic', 'zero waste', 'package free'],
    strategy: 'Plastic Free / Zero Waste',
    problem: 'Plastic pollution and packaging waste',
    solution: 'Product avoids plastic or aims for zero waste',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // General sustainable / eco-friendly
  {
    keywords: [
      'eco',
      'green',
      'sustainable',
      'environmentally friendly',
      'eco-friendly',
      'environmental',
      'sustainable packaging',
      'organic',
      'clean',
    ],
    strategy: 'General Sustainable',
    problem: 'General environmental impact',
    solution: 'Product with broad sustainability attributes',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Added: Recyclable / recyclability
  {
    keywords: ['recyclable', 'recycling'],
    strategy: 'Recyclable',
    problem: 'End-of-life disposal issues',
    solution: 'Product is designed to be recyclable',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Added: Reduced packaging
  {
    keywords: ['reduced packaging', 'minimal packaging', 'lightweight'],
    strategy: 'Reduce',
    problem: 'Excessive packaging waste',
    solution: 'Uses reduced or minimal packaging',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Added: Energy efficient (maybe for electronics)
  {
    keywords: ['energy efficient', 'low energy', 'energy saving'],
    strategy: 'Energy Efficiency',
    problem: 'High energy consumption during use',
    solution: 'Energy-efficient design reduces operational footprint',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
  // Added: Water efficient
  {
    keywords: ['water efficient', 'water saving', 'low water'],
    strategy: 'Water Efficiency',
    problem: 'High water usage',
    solution: 'Water-efficient product reduces water consumption',
    PAGE_SIZE: 50,
    START_PAGE: 1,
    END_PAGE: 50,
    MAX_PAGES_TO_FETCH: 50,
  },
];

// Calculate total max pages for backup helper
const TOTAL_MAX_PAGES = KEYWORD_CONFIG.reduce((sum, cfg) => sum + cfg.MAX_PAGES_TO_FETCH, 0);
const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();

const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, TOTAL_MAX_PAGES);

// ================== HELPER FUNCTIONS ==================

/**
 * Fetch a page of results for a given search term using the v2 API.
 * Returns { products, pageCount }.
 */
async function fetchPage(searchTerms, page, pageSize = 50) {
  const url = new URL(API_BASE);
  url.searchParams.set('search_terms', searchTerms);
  url.searchParams.set('page', page);
  url.searchParams.set('page_size', pageSize);
  url.searchParams.set('fields', REQUESTED_FIELDS);
  url.searchParams.set('json', '1');

  await appendLogs(DATASET_KEY, `Fetching: ${url.toString()}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'CircularEconomyAuditor/1.0 (bot; +https://yourdomain.com)',
        },
      });

      if (response.status === 429) {
        const wait = 2000 * attempt;
        await appendLogs(DATASET_KEY, `  → Rate limited, waiting ${wait}ms (attempt ${attempt})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.products)) {
        await appendLogs(DATASET_KEY, `  → Unexpected response format (no products array)`);
        return { products: [], pageCount: 0 };
      }

      return {
        products: data.products,
        pageCount: data.page_count || 0,
      };
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      await appendLogs(DATASET_KEY, `  → Attempt ${attempt} failed: ${err.message}`);
      if (isLastAttempt) {
        return { products: [], pageCount: 0 };
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return { products: [], pageCount: 0 };
}

/**
 * Fetch all pages for a single keyword config.
 */
async function fetchAllForKeyWord(config) {
  const {
    keywords,
    strategy,
    problem,
    solution,
    PAGE_SIZE = 200,
    START_PAGE = 1,
    END_PAGE = 50,
    MAX_PAGES_TO_FETCH = 50,
  } = config;

  const searchTerm = keywords.join(' ');
  const maxPage = Math.min(END_PAGE, START_PAGE + MAX_PAGES_TO_FETCH - 1);
  const allRows = [];
  let currentPage = START_PAGE;
  let totalPages = Infinity;

  while (currentPage <= maxPage && currentPage <= totalPages) {
    const { products, pageCount } = await fetchPage(searchTerm, currentPage, PAGE_SIZE);

    if (products.length === 0) break;

    const transformed = products
      .filter((p) => p && p.code)
      .map((p) => transformProduct(p, { strategy, problem, solution, keywords }))
      .filter((row) => row.problem && row.solution && row.materials && row.category);

    allRows.push(...transformed);

    await appendLogs(
      DATASET_KEY,
      `Keyword "${searchTerm}" page ${currentPage}: got ${products.length} raw, kept ${transformed.length} (total so far: ${allRows.length})`,
    );

    // Pass the whole batch to backup helper
    if (transformed.length > 0) {
      await backup.add(transformed);
    }

    if (pageCount > 0) totalPages = pageCount;
    if (currentPage >= totalPages) break;
    currentPage++;

    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  if (currentPage > maxPage) {
    logger.warn({MAX_PAGES_TO_FETCH, searchTerm}, "reached max pages to fetch for searchTerm, stopping");
    await appendLogs(DATASET_KEY, `! Reached max pages (${MAX_PAGES_TO_FETCH}) for keyword "${searchTerm}" – stopping.`);
  }

  return allRows;
}

/**
 * Transform a raw product object into a CSV row.
 */
function transformProduct(product, config) {
  const { strategy, problem, solution, keywords } = config;
  const categories = product.categories || '';
  const packaging = product.packaging || '';
  const labels = product.labels || '';
  const productName = product.product_name || 'Unknown product';
  const code = product.code;

  const finalProblem = problem
    ? `${problem} for ${productName}`
    : `${FALLBACK_PROBLEM} for ${productName}`;
  const finalSolution = solution
    ? `${solution}. ${productName} exhibits this circular attribute.`
    : `${FALLBACK_SOLUTION} (${productName})`;

  let impact = 'No specific impact data available';
  if (product.ecoscore_grade) {
    impact = `Eco-Score: ${product.ecoscore_grade} (score: ${product.ecoscore_score || 'N/A'})`;
  } else if (product['carbon-footprint_100g']) {
    impact = `Carbon footprint: ${product['carbon-footprint_100g']} g CO₂/100g`;
  } else if (product.nutriscore_grade) {
    impact = `Nutri-Score: ${product.nutriscore_grade}`;
  }

  return {
    problem: finalProblem,
    solution: finalSolution,
    materials: packaging,
    circular_strategy: strategy,
    category: categories.split(',')[0]?.trim() || 'Product',
    impact,
    source_url: `${PRODUCT_URL_BASE}/${code}`,
    metadata_json: JSON.stringify(product),
  };
}

/**
 * Quality filter: problem and solution must have enough words.
 * (Now using relaxed thresholds: 3 words minimum)
 */
function isHighQuality(row) {
  const problemWords = (row.problem || '').split(/\s+/).length;
  const solutionWords = (row.solution || '').split(/\s+/).length;
  return problemWords >= MIN_PROBLEM_WORDS && solutionWords >= MIN_SOLUTION_WORDS;
}
/**
 * Rebuild final CSV from backup content (unchanged).
 */
async function rebuildFromBackup() {
  logger.info('BACKUP RECOVERY MODE: Building final CSV from saved backup content');

  try {
    await appendLogs(
      DATASET_KEY,
      '♻️ RECOVERY MODE: Rebuilding from backup started.',
    );

    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = '! No backup content found. Cannot rebuild output.';
      logger.warn(msg);
      await appendLogs(DATASET_KEY, msg);
      await appendLogs(
        DATASET_KEY,
        '\n--- End of recovery run (no data) ---\n',
      );
      return;
    }

    logger.info({ count: backupRows.length }, 'Processing backup rows');
    await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    let transformed = backupRows.filter(isHighQuality);

    if (transformed.length === 0) {
      logger.warn('No valid rows after filtering');
      await appendLogs(
        DATASET_KEY,
        '‼ No valid rows – output file unchanged.',
      );
      await appendLogs(
        DATASET_KEY,
        '\n--- End of recovery run (no output) ---\n',
      );
      return;
    }

    if (transformed.length > TARGET_ROWS) {
      transformed = transformed.slice(0, TARGET_ROWS);
    }

  logger.info({ count: transformed.length }, 'Selected high-quality rows from backup');
    await appendLogs(
      DATASET_KEY,
      `Selected ${transformed.length} rows after filtering.`,
    );

    const finalRows = transformed.map((row, idx) => {
      const metadataJson =
        typeof row.metadata_json === 'string'
          ? row.metadata_json
          : JSON.stringify(row);

      return {
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

    logger.info({ count: finalRows.length }, 'Rebuilt Open Products Facts products from backup');
    const writeResult = await writeCsv(DATASET_KEY, outputFile, finalRows, {
      append: APPEND_PROCESSED,
    });
    logger.info(
      { outputPath: outputFile, written: writeResult.writtenCount, duplicates: writeResult.duplicateCount },
      'Saved to output file'
    );
    await appendLogs(
      DATASET_KEY,
      `✓ Recovery complete. Wrote ${writeResult.writtenCount} rows to ${outputFile} (duplicate rows removed: ${writeResult.duplicateCount})`,
    );
    await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    logger.error({ error }, '✕ Error rebuilding from backup');
    await appendLogs(DATASET_KEY, `✕ Recovery failed: ${error.message}`);
    await appendLogs(DATASET_KEY, `\n--- Recovery aborted ---\n`);
    throw error;
  }
}

// ================== MAIN SCRAPING FUNCTION ==================

async function main() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    await rebuildFromBackup();
    return;
  }

  const logFilePath = getDatasetScrapeLogsPath(DATASET_KEY);
  logger.info({ logFilePath }, 'Scraping OPF');

  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. API_BASE: ${API_BASE}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}`,
  );

  logger.info('Fetching per keyword config with individual parameters...');
  const productMap = new Map();

  for (const config of KEYWORD_CONFIG) {
    const display = config.keywords.join(', ');
    const maxPage = Math.min(config.END_PAGE, config.START_PAGE + config.MAX_PAGES_TO_FETCH - 1);
    logger.info(
    {
      keywordGroup: display,
      startPage: config.START_PAGE,
      endPage: maxPage
    },
    'Processing keyword group'
  );

    const rows = await fetchAllForKeyWord(config);
    for (const row of rows) {
      const key = row.source_url;
      if (!productMap.has(key)) {
        productMap.set(key, row);
      }
    }
    logger.info({ count: productMap.size }, 'Unique total so far');
  }

  await backup.flush();

  if (productMap.size === 0) {
    logger.info('No products fetched. Exiting.');
    await appendLogs(DATASET_KEY, `‼ No products fetched.`);
    await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
    return;
  }

  const allProducts = Array.from(productMap.values());
  logger.info({ count: allProducts.length }, 'Total unique products fetched');
  await appendLogs(DATASET_KEY, `Total raw products collected: ${allProducts.length}`);

  let highQuality = allProducts.filter(isHighQuality);

  if (highQuality.length > TARGET_ROWS) {
    highQuality = highQuality.slice(0, TARGET_ROWS);
  }

  logger.info({ count: highQuality.length }, 'Kept high-quality rows');
  await appendLogs(DATASET_KEY, `After filtering: kept ${highQuality.length} rows.`);

  const finalRows = highQuality.map((row) => ({
    problem: row.problem || '',
    solution: row.solution || '',
    materials: row.materials || '',
    circular_strategy: row.circular_strategy || '',
    category: row.category || '',
    impact: row.impact || '',
    source_url: row.source_url || '',
    metadata_json: row.metadata_json,
  }));

  const writeResult = await writeCsv(DATASET_KEY, outputFile, finalRows, {
    append: APPEND_PROCESSED,
  });

  const summary = `✓ Scrape complete. Wrote ${writeResult.writtenCount} rows to ${outputFile} (duplicate rows removed: ${writeResult.duplicateCount}).`;
  logger.info(
    { writtenCount: writeResult.writtenCount, outputFile, duplicateCount: writeResult.duplicateCount },
    '✓ Scrape complete. Wrote rows to outputFile (duplicate rows removed).'
  );

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
    logger.error({ err }, '\n✕ Fatal error');
    process.exit(1);
  });
}
