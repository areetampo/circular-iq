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
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendBackupLog,
  clearBackupLog,
  getDatasetBackupLogPath,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.obf;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const outputFile = getDatasetProcessedCsvPath(DATASET_KEY);

// Configuration
const BASE_URL = dataset.urls.search;
const PRODUCT_URL_BASE = dataset.urls.product;
const PAGE_SIZE = 200;
const MAX_PAGES_FALLBACK = 50; //50 Maximum number of pages per keyword (or combined search)
const TARGET_ROWS = 250; // Desired final rows
const BACKUP_INTERVAL = 3; // Flush backup every 3 pages
const CLEAR_BACKUP_ON_START = true;

const backup = createBackupHelper(
  DATASET_KEY,
  BACKUP_INTERVAL,
  CLEAR_BACKUP_ON_START,
  MAX_PAGES_FALLBACK,
);

const KEYWORDS = [
  'refillable',
  'glass',
  'microplastic-free',
  'recycled',
  'recyclable',
  'reuse',
  'biodegradable',
  'compostable',
  'eco-friendly',
  'sustainable',
  'plastic-free',
  'zero waste',
  'aluminum',
  'paper',
];

/**
 * Fetch a single page of products from Open Beauty Facts API.
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

async function fetchAllForKeyWord(keyword) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES_FALLBACK; page++) {
    const products = await fetchPage(keyword, page);
    if (products.length === 0) break;

    const transformed = products
      .map(transformProduct)
      .filter((p) => p.problem && (p.materials || p.category));
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

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return all;
}

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

    // Apply the same filter as live scrape
    let filtered = backupRows.filter((row) => row.problem && (row.materials || row.category));

    if (filtered.length === 0) {
      console.warn(`⚠️ No valid rows after filtering.`);
      await appendBackupLog(DATASET_KEY, `⚠️ No valid rows – output file unchanged.`);
      await appendBackupLog(DATASET_KEY, `\n--- End of recovery run (no output) ---\n`);
      return;
    }

    // Deduplicate by source_url (keep first occurrence)
    const uniqueMap = new Map();
    for (const row of filtered) {
      if (!uniqueMap.has(row.source_url)) {
        uniqueMap.set(row.source_url, row);
      }
    }
    const uniqueRows = Array.from(uniqueMap.values());

    if (uniqueRows.length > TARGET_ROWS) {
      uniqueRows = uniqueRows.slice(0, TARGET_ROWS);
    }

    console.log(`✅ Selected ${uniqueRows.length} high-quality rows from backup`);
    await appendBackupLog(
      DATASET_KEY,
      `Selected ${uniqueRows.length} rows after filtering and deduplication.`,
    );

    const finalRows = uniqueRows.map((row, idx) => {
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
      `\n✨ Successfully rebuilt ${finalRows.length} Open Beauty Facts products from backup`,
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
  console.log(`Scraping OBF. Detailed logs: ${logFilePath}`);

  await appendBackupLog(
    DATASET_KEY,
    `🚀 Scrape started. BASE_URL: ${BASE_URL}, MAX_PAGES_FALLBACK: ${MAX_PAGES_FALLBACK}, TARGET_ROWS: ${TARGET_ROWS}, BACKUP_INTERVAL: ${BACKUP_INTERVAL}, CLEAR_BACKUP_ON_START: ${CLEAR_BACKUP_ON_START}`,
  );

  let allProducts = [];
  const pagesProcessed = [];

  // Combined search
  try {
    const combined = [];
    for (let page = 1; page <= MAX_PAGES_FALLBACK; page++) {
      const products = await fetchPage(KEYWORDS.join(' '), page);
      if (products.length === 0) break;

      const transformed = products
        .map(transformProduct)
        .filter((p) => p.problem && (p.materials || p.category));
      combined.push(...transformed);

      // Log page details to backup log
      await appendBackupLog(
        DATASET_KEY,
        `Combined search page ${page}: got ${products.length} raw, kept ${transformed.length} (total so far: ${combined.length})`,
      );

      if (transformed.length > 0) {
        try {
          await backup.add(transformed);
        } catch (e) {
          const errMsg = `⚠️ Backup add failed for combined page ${page}: ${e.message}`;
          console.warn(errMsg);
          await appendBackupLog(DATASET_KEY, errMsg);
        }
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

  // Per‑keyword fallback
  if (allProducts.length === 0) {
    console.log('🔍 Fetching per keyword...');
    const productMap = new Map(); // deduplicate by source_url

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

  let transformed = allProducts.filter((p) => p.problem && (p.materials || p.category));

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
    metadata_json: row.metadata_json,
  }));

  await writeCsv(outputFile, finalRows);
  await backup.flush();

  const summary = `✅ Scrape complete. Wrote ${finalRows.length} rows to ${outputFile}. Pages/Keywords processed: ${pagesProcessed.join(', ')}.`;
  console.log(summary);
  await appendBackupLog(DATASET_KEY, summary);
  await appendBackupLog(DATASET_KEY, `\n--- End of run ---\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
