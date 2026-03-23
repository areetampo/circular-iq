
/**
 * scrape_open_beauty_facts.js - Beauty and personal care products scraping
 *
 * Scrapes from the Open Beauty Facts API. Focuses on extracting products aligned with circular
 * economy principles (refillable, sustainable packaging, eco-friendly, etc.) with detailed
 * environmental scorecards (Ecoscore rating).
 *
 * Features:
 *   • Keyword-based search targeting circular economy attributes
 *   • API pagination with graceful handling of non-existent pages
 *   • Per-product detail extraction (company, category, ingredients, packaging, Ecoscore)
 *   • Intelligent problem/solution mapping based on detected attributes
 *   • Backup system: incremental batch-level backup with recovery mode
 *   • Quality filtering based on content completeness
 *   • Detailed logging to dataset-specific log file
 *
 * Usage:
 *   node scrape_open_beauty_facts.js                 # normal run
 *   node scrape_open_beauty_facts.js --use-backup    # rebuild final CSV from backup
 *   node scrape_open_beauty_facts.js --clear-logs    # clear the log file before starting
 *   node scrape_open_beauty_facts.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_open_beauty_facts.js --append-backup     # append to backup instead of clearing on start
 *
 * For detailed logs, see the path printed at the start of the run.
 * Note: Requires active internet connection to access Open Beauty Facts API
 */

import {
    appendLogs,
    cleanText,
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
import { fileURLToPath } from 'url';

const DATASET_KEY = DATASET_KEYS.obf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// Configuration
const BASE_URL = dataset.urls.search;
const PRODUCT_URL_BASE = dataset.urls.product;
const TARGET_ROWS = 250; // Desired final rows
const BACKUP_INTERVAL = 3; // Flush backup every 3 pages

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
const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();
const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, TOTAL_MAX_PAGES);

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

/**
 * Transform a raw product into a standardized row for the CSV.
 * Always returns non‑empty problem and solution, enriched with detected circular attributes.
 */
function transformProduct(product) {
  const categories = product.categories || product.categories_en || '';
  const ingredients = product.ingredients_text || '';
  const packaging = product.packaging || product.packaging_text || '';
  const ecoscoreGrade = product.ecoscore_grade || '';
  const ecoscoreScore = product.ecoscore_score;
  const code = product.code;
  const productName = product.product_name || '';
  const labels = product.labels || '';
  const brands = product.brands || '';

  const combinedText = (
    packaging +
    ' ' +
    ingredients +
    ' ' +
    labels +
    ' ' +
    productName
  ).toLowerCase();

  // Detect circular economy attributes
  const attributes = {
    refillable: /refill|refillable/.test(combinedText),
    recycled: /recycled/.test(combinedText),
    recyclable: /recyclable/.test(combinedText),
    biodegradable: /biodegradable/.test(combinedText),
    compostable: /compostable/.test(combinedText),
    microplasticFree: /microplastic-free|microplastics? free/.test(combinedText),
    ecoFriendly: /eco-?friendly|sustainable/.test(combinedText),
    plasticFree: /plastic-free/.test(combinedText),
    zeroWaste: /zero waste/.test(combinedText),
    glass: /glass/.test(packaging.toLowerCase()) || combinedText.includes('glass'),
    aluminum: /aluminum|aluminium/.test(combinedText),
    paper: /paper/.test(combinedText),
  };

  const categoryFirst = categories.split(',')[0]?.trim() || 'Beauty product';
  const productDesc = productName ? `"${productName}"` : categoryFirst;

  // Build problem – specific to the product and its attributes
  let problem;
  if (attributes.microplasticFree) {
    problem = `Microplastics in beauty products contribute to environmental contamination.`;
  } else if (attributes.refillable) {
    problem = `Single-use packaging waste from ${categoryFirst} products.`;
  } else if (attributes.recycled || attributes.recyclable) {
    problem = `Use of virgin materials in ${categoryFirst} packaging leads to resource depletion.`;
  } else if (attributes.biodegradable || attributes.compostable) {
    problem = `Non-biodegradable packaging for ${categoryFirst} contributes to landfill waste.`;
  } else if (attributes.plasticFree) {
    problem = `Plastic pollution from ${categoryFirst} packaging.`;
  } else if (attributes.glass) {
    problem = `Heavy glass packaging for ${categoryFirst} increases transport emissions.`;
  } else if (attributes.aluminum) {
    problem = `Energy-intensive production of aluminum packaging for ${categoryFirst}.`;
  } else if (attributes.paper) {
    problem = `Deforestation risk from paper packaging for ${categoryFirst}.`;
  } else {
    // Generic problem based on packaging material if available
    if (packaging.toLowerCase().includes('plastic')) {
      problem = `The ${categoryFirst} product ${productDesc} uses plastic packaging that may cause waste.`;
    } else if (packaging.toLowerCase().includes('glass')) {
      problem = `The ${categoryFirst} product ${productDesc} uses glass packaging with high transport footprint.`;
    } else {
      problem = `The ${categoryFirst} product ${productDesc} may have environmental impacts from its packaging.`;
    }
  }

  // Determine circular strategy and solution based on attributes
  let strategy, solution;
  if (attributes.refillable) {
    strategy = 'Reuse / Refill';
    solution =
      'Implement refillable packaging systems or offer refill programs to reduce single-use waste.';
  } else if (attributes.recycled) {
    strategy = 'Recycled Content';
    solution = 'Use recycled materials (e.g., recycled PET, HDPE) to reduce virgin plastic demand.';
  } else if (attributes.recyclable) {
    strategy = 'Design for Recycling';
    solution = 'Design packaging to be fully recyclable and provide clear recycling instructions.';
  } else if (attributes.biodegradable || attributes.compostable) {
    strategy = 'Biodegradable / Compostable Materials';
    solution =
      'Switch to certified biodegradable or compostable packaging that breaks down safely.';
  } else if (attributes.microplasticFree) {
    strategy = 'Safe Chemistry';
    solution = 'Reformulate products to eliminate microplastics and use natural alternatives.';
  } else if (attributes.ecoFriendly) {
    strategy = 'Eco-friendly Design';
    solution =
      'Adopt eco-design principles, such as reducing material use and optimizing for recyclability.';
  } else if (attributes.plasticFree) {
    strategy = 'Plastic-Free Packaging';
    solution = 'Replace plastic with alternative materials like glass, aluminum, or paper.';
  } else if (attributes.zeroWaste) {
    strategy = 'Zero Waste';
    solution = 'Adopt zero-waste packaging and encourage product reuse.';
  } else if (attributes.glass) {
    strategy = 'Glass Packaging';
    solution = 'Glass is infinitely recyclable; ensure collection and recycling infrastructure.';
  } else if (attributes.aluminum) {
    strategy = 'Aluminum Packaging';
    solution = 'Aluminum is highly recyclable; use recycled content to further reduce impact.';
  } else if (attributes.paper) {
    strategy = 'Paper Packaging';
    solution = 'Use sustainably sourced paper and design for recyclability.';
  } else {
    // No specific attribute – fallback based on packaging material
    if (packaging.toLowerCase().includes('plastic')) {
      strategy = 'Plastic Reduction';
      solution =
        'Consider switching to recycled plastic, alternative materials, or refillable systems.';
    } else if (packaging.toLowerCase().includes('glass')) {
      strategy = 'Glass Packaging';
      solution = 'Glass is recyclable; use recycled glass and lightweight designs.';
    } else {
      strategy = 'General Circular Economy';
      solution = 'Explore opportunities to reduce, reuse, and recycle packaging materials.';
    }
  }

  // Guarantee solution is never empty
  if (!solution) {
    solution =
      'Adopt circular economy principles: reduce material use, increase recycled content, and design for recyclability.';
  }

  // Build impact string from ecoscore
  let impact = 'No impact data';
  if (ecoscoreGrade) {
    const gradeMap = {
      a: 'low environmental impact',
      b: 'moderate environmental impact',
      c: 'average environmental impact',
      d: 'high environmental impact',
      e: 'very high environmental impact',
      unknown: 'unknown environmental impact',
    };
    const gradeDesc = gradeMap[ecoscoreGrade.toLowerCase()] || `grade ${ecoscoreGrade}`;
    impact = `Ecoscore: ${ecoscoreGrade.toUpperCase()} (${gradeDesc})`;
    if (ecoscoreScore) {
      impact += ` · Score: ${ecoscoreScore}`;
    }
  }

  const sourceUrl = `${PRODUCT_URL_BASE}/${code}`;

  return {
    problem: cleanText(problem),
    solution: cleanText(solution),
    materials: cleanText(packaging),
    circular_strategy: cleanText(strategy),
    category: cleanText(categoryFirst),
    impact: cleanText(impact),
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
      const errMsg = `‼ Backup add failed for ${keyword} page ${page}: ${e.message}`;
      logger.warn(errMsg);
      await appendLogs(DATASET_KEY, errMsg);
    }

    if (page === keywordFallback) {
      const limitMsg = `‼ Reached fallback max pages (${keywordFallback}) for keyword "${keyword}" – stopping.`;
      logger.warn(limitMsg);
      await appendLogs(DATASET_KEY, limitMsg);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return all;
}

async function rebuildFromBackup() {
  logger.info(`♻️ BACKUP RECOVERY MODE: Building final CSV from saved backup content...`);

  try {
    await appendLogs(DATASET_KEY, `♻️ RECOVERY MODE: Rebuilding from backup started.`);

    const backupRows = await readBackupCsv(DATASET_KEY);
    if (backupRows.length === 0) {
      const msg = `‼ No backup content found. Cannot rebuild output.`;
      logger.warn(msg);
      await appendLogs(DATASET_KEY, msg);
      await appendLogs(DATASET_KEY, `\n--- End of recovery run (no data) ---\n`);
      return;
    }

    logger.info(`📖 Processing ${backupRows.length} backup rows...`);
    await appendLogs(DATASET_KEY, `Read ${backupRows.length} backup rows.`);

    // Apply the same filter as live scrape
    let filtered = backupRows.filter((row) => row.problem && (row.materials || row.category));

    if (filtered.length === 0) {
      logger.warn(`‼ No valid rows after filtering.`);
      await appendLogs(DATASET_KEY, `‼ No valid rows – output file unchanged.`);
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

    logger.info(`✓ Selected ${uniqueRows.length} high-quality rows from backup`);
    await appendLogs(
      DATASET_KEY,
      `Selected ${uniqueRows.length} rows after filtering and deduplication.`,
    );

    const finalRows = uniqueRows.map((row) => {
      const metadataJson =
        typeof row.metadata_json === 'string' ? row.metadata_json : JSON.stringify(row);
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

    logger.info(`\n✨ Rebuilt ${finalRows.length} Open Beauty Facts products from backup`);
    const writeResult = await writeCsv(DATASET_KEY, outputFile, finalRows, {
      append: APPEND_PROCESSED,
    });
    logger.info(
      `📁 Saved to: ${outputFile} (${writeResult.writtenCount} written, ${writeResult.duplicateCount} duplicate rows removed)`,
    );
    await appendLogs(
      DATASET_KEY,
      `✓ Recovery complete. Wrote ${writeResult.writtenCount} rows to ${outputFile} (duplicate rows removed: ${writeResult.duplicateCount})`,
    );
    await appendLogs(DATASET_KEY, `\n--- End of recovery run ---\n`);
  } catch (error) {
    logger.error('✕ Error rebuilding from backup:', error.message);
    await appendLogs(DATASET_KEY, `✕ Recovery failed: ${error.message}`);
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
  logger.info(`Scraping OBF. Detailed logs: ${logFilePath}`);

  await appendLogs(
    DATASET_KEY,
    `🚀 Scrape started. BASE_URL: ${BASE_URL}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}`,
  );

  let allProducts = [];
  const pagesProcessed = [];
  const productMap = new Map(); // deduplicate by source_url across all keywords

  // Fetch each keyword with its individual paging parameters
  logger.info('🔍 Fetching per keyword with individual parameters...');
  for (const kw of KEYWORDS) {
    const FINAL_FETCH_PAGE = Math.min(kw.END_PAGE, kw.START_PAGE + kw.MAX_PAGES_TO_FETCH - 1);
    logger.info(`\n📦 Keyword: "${kw.keyword}" (PAGES: ${kw.START_PAGE}-${FINAL_FETCH_PAGE})`);
    const products = await fetchAllForKeyWord(kw);
    for (const p of products) {
      if (!productMap.has(p.source_url)) {
        productMap.set(p.source_url, p);
      }
    }
    logger.info(`   → Unique total so far: ${productMap.size}`);
    pagesProcessed.push(kw.keyword);
  }
  allProducts = Array.from(productMap.values());

  if (allProducts.length === 0) {
    logger.info('✕ No products fetched. Exiting.');
    await appendLogs(DATASET_KEY, `‼ No products fetched.`);
    await appendLogs(DATASET_KEY, `\n--- End of run (no output) ---\n`);
    return;
  }

  logger.info(`\n📊 Total unique products fetched: ${allProducts.length}`);
  await appendLogs(DATASET_KEY, `Total raw products collected: ${allProducts.length}`);

  let transformed = allProducts.filter((p) => p.problem && (p.materials || p.category));

  if (transformed.length > TARGET_ROWS) {
    transformed = transformed.slice(0, TARGET_ROWS);
  }

  logger.info(`✨ Kept ${transformed.length} high‑quality rows.`);
  await appendLogs(DATASET_KEY, `After filtering: kept ${transformed.length} rows.`);

  const finalRows = transformed.map((row, idx) => ({
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
  await backup.flush();

  const summary = `✓ Scrape complete. Wrote ${writeResult.writtenCount} rows to ${outputFile} (duplicate rows removed: ${writeResult.duplicateCount}). Pages/Keywords processed: ${pagesProcessed.join(', ')}.`;
  logger.info(summary);

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
    logger.error('\n✕ Fatal error:', err.message);
    process.exit(1);
  });
}
