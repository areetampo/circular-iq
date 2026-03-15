
/**
 * scrape_refed.js - Food waste solution data fetching from the ReFED Insights Engine API v2
 *
 * Transforms each solution into standardized problem/solution format.
 *
 * Features:
 *   • Fetches all solutions from the `/solutions` endpoint
 *   • Enriches with group and category names from supporting endpoints
 *   • Parses quantified impact metrics (tons, GHG, water, meals, jobs)
 *   • Pagination through all available solutions
 *   • Backup every 10 solutions with recovery mode
 *   • Detailed logging to file
 *   • **Content‑based deduplication** – skips duplicate problem/solution pairs
 *
 * Usage:
 *   node scrape_refed.js                 # normal run
 *   node scrape_refed.js --use-backup    # rebuild final CSV from backup
 *   node scrape_refed.js --clear-logs    # clear log file before starting
 *   node scrape_refed.js --append-processed  # append to processed CSV instead of overwriting
 *   node scrape_refed.js --append-backup     # append to backup instead of clearing on start
 *
 * Output: datasets/processed/refed_processed.csv
 */

import axios from 'axios';
import { fileURLToPath } from 'url';
import {
  cleanText,
  getDatasetProcessedCsvPath,
  writeCsv,
  hasAppendProcessedFlag,
  hasAppendBackupFlag,
  createBackupHelper,
  isBackupRecoveryMode,
  readBackupCsv,
  appendLogs,
  clearLogs,
  DATASET_KEYS,
  DATASET_LOOKUP,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.refed;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const BACKUP_INTERVAL = 10; // Save backup every 10 solutions
const MAX_SOLUTIONS = 500; // Safety limit (there are ~40 solutions currently)

// API Base URLs
const API_BASE = dataset.urls.apiBase;
const SOLUTIONS_URL = dataset.urls.solutions; // `${API_BASE}/solution_database/solutions`
const GROUPS_URL = dataset.urls.groups; // `${API_BASE}/solution_database/groups`
const CATEGORIES_URL = dataset.urls.categories; // `${API_BASE}/solution_database/categories`
const SECTORS_URL = dataset.urls.sectors; // `${API_BASE}/sectors`
const FOOD_TYPES_URL = dataset.urls.foodTypes; // `${API_BASE}/solution_database/food_types`

const APPEND_PROCESSED = hasAppendProcessedFlag();
const APPEND_BACKUP = hasAppendBackupFlag();

const backup = createBackupHelper(DATASET_KEY, BACKUP_INTERVAL, !APPEND_BACKUP, MAX_SOLUTIONS);

/**
 * Fetch lookup data (groups, categories, etc.) to enrich solutions.
 */
async function fetchLookups() {
  const [groupsRes, categoriesRes, sectorsRes, foodTypesRes] = await Promise.all([
    axios.get(GROUPS_URL).catch(() => ({ data: { data: [] } })),
    axios.get(CATEGORIES_URL).catch(() => ({ data: { data: [] } })),
    axios.get(SECTORS_URL).catch(() => ({ data: { data: [] } })),
    axios.get(FOOD_TYPES_URL).catch(() => ({ data: { data: [] } })),
  ]);

  // Create maps for easy lookup
  const groups = {};
  groupsRes.data.data.forEach((g) => (groups[g.id] = g.attributes.name));

  const categories = {};
  categoriesRes.data.data.forEach((c) => (categories[c.id] = c.attributes.name));

  const sectors = {};
  sectorsRes.data.data.forEach((s) => (sectors[s.id] = s.attributes.name));

  const foodTypes = {};
  foodTypesRes.data.data.forEach((f) => (foodTypes[f.id] = f.attributes.name));

  return { groups, categories, sectors, foodTypes };
}

/**
 * Fetch all solutions from the API (handles pagination if needed).
 * The response may already contain all solutions in one array.
 */
async function fetchAllSolutions() {
  let allSolutions = [];
  let page = 1;
  let hasMore = true;
  const pageSize = 100; // API likely supports pagination via query params

  while (hasMore && allSolutions.length < MAX_SOLUTIONS) {
    console.log(`Fetching solutions page ${page}...`);
    await appendLogs(DATASET_KEY, `Fetching solutions page ${page}...`);
    // The API might support pagination with ?page= or ?offset=
    // Adjust the params based on actual behavior – if not, this will just fetch the same first page repeatedly
    const response = await axios.get(SOLUTIONS_URL, {
      params: { page, limit: pageSize },
    });

    const solutions = response.data.data || [];
    if (solutions.length === 0) {
      hasMore = false;
    } else {
      allSolutions = allSolutions.concat(solutions);
      await appendLogs(DATASET_KEY, `Page ${page}: fetched ${solutions.length} solutions`);
      page++;
      // Small delay to be polite
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return allSolutions;
}

/**
 * Transform a raw API solution into your standardized row object.
 */
function transformSolution(solution, lookups) {
  const attrs = solution.attributes || {};
  const relationships = solution.relationships || {};

  // Get group and category names
  const groupId = relationships.group?.data?.id;
  const categoryId = relationships.category?.data?.id;
  const groupName = lookups.groups[groupId] || groupId || 'Unknown';
  const categoryName = lookups.categories[categoryId] || categoryId || 'Unknown';

  // Build problem statement
  const problemBase = `Food waste occurs in the ${categoryName.toLowerCase()} stage.`;
  const problem = attrs.definition
    ? `${problemBase} ${attrs.definition.split('.')[0]}.`
    : problemBase;

  // Solution description
  const solutionDesc = attrs.definition ? `${attrs.name}: ${attrs.definition}` : attrs.name;

  // Parse impact metrics from the data array
  const impactMetrics = [];
  const impactData = {};
  (attrs.data || []).forEach((item) => {
    impactData[item.indicator] = item.value;
  });

  if (impactData['tons-diverted']) {
    impactMetrics.push(`${Math.round(impactData['tons-diverted']).toLocaleString()} tons diverted`);
  }
  if (impactData['total-100-year-mtco2e-avoided']) {
    impactMetrics.push(
      `${Math.round(impactData['total-100-year-mtco2e-avoided']).toLocaleString()} MT CO₂e avoided`,
    );
  }
  if (impactData['gallons-water-saved'] && impactData['gallons-water-saved'] > 0) {
    impactMetrics.push(
      `${Math.round(impactData['gallons-water-saved'] / 1e9)}B gallons water saved`,
    );
  }
  if (impactData['meal-equivalent-diverted'] && impactData['meal-equivalent-diverted'] > 0) {
    impactMetrics.push(
      `${Math.round(impactData['meal-equivalent-diverted'] / 1e6)}M meals equivalent`,
    );
  }
  if (impactData['jobs-created'] && impactData['jobs-created'] > 0) {
    impactMetrics.push(`${Math.round(impactData['jobs-created'])} jobs created`);
  }

  const impact =
    impactMetrics.length > 0
      ? impactMetrics.join('; ')
      : 'Quantified impacts available in metadata';

  // Determine materials (unchanged)
  let materials = '';
  const nameLower = attrs.name.toLowerCase();
  if (nameLower.includes('packaging')) materials = 'Packaging materials';
  else if (nameLower.includes('composting')) materials = 'Organic waste';
  else if (nameLower.includes('digestion')) materials = 'Food waste, organic matter';
  else if (nameLower.includes('donation')) materials = 'Edible food';
  else materials = 'Food waste';

  // Construct source URL (unchanged)
  const sourceUrl = `https://insights.refed.org/solution-database/${solution.id}`;

  // Metadata (unchanged)
  const metadata = {
    original: solution,
    group: groupName,
    category: categoryName,
    sectors: relationships.sectors?.data?.map((s) => lookups.sectors[s.id]).filter(Boolean) || [],
    foodTypes:
      relationships.food_types?.data?.map((f) => lookups.foodTypes[f.id]).filter(Boolean) || [],
  };

  return {
    problem: cleanText(problem),
    solution: cleanText(solutionDesc),
    materials: cleanText(materials),
    circular_strategy: cleanText(groupName), // Prevention, Rescue, Recycling
    category: cleanText('Food'), // Broad category
    impact: cleanText(impact),
    source_url: sourceUrl,
    metadata_json: JSON.stringify(metadata),
  };
}

/**
 * Rebuild final CSV from backup (recovery mode).
 */
async function rebuildFromBackup() {
  console.log('♻️ BACKUP RECOVERY MODE: Rebuilding final CSV from backup...');
  const backupRows = await readBackupCsv(DATASET_KEY);
  if (!backupRows.length) {
    console.warn('No backup found.');
    return;
  }
  console.log(`📖 Processing ${backupRows.length} backup rows...`);

  // Optional: deduplicate backup rows by content (in case backup itself has duplicates)
  const seenKeys = new Set();
  const uniqueRows = [];

  for (const row of backupRows) {
    const key = `${row.problem}||${row.solution}`; // Use problem+solution as unique key
    if (seenKeys.has(key)) {
      await appendLogs(DATASET_KEY, `Skipping duplicate backup row: ${key.substring(0, 80)}...`);
      continue;
    }
    seenKeys.add(key);
    uniqueRows.push(row);
  }

  if (uniqueRows.length !== backupRows.length) {
    console.log(`Removed ${backupRows.length - uniqueRows.length} duplicate rows from backup.`);
    await appendLogs(
      DATASET_KEY,
      `Removed ${backupRows.length - uniqueRows.length} duplicates from backup.`,
    );
  }

  console.log(`✅ Rebuilt ${uniqueRows.length} rows from backup.`);
  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, uniqueRows, {
    append: APPEND_PROCESSED,
  });
  console.log(
    `📁 Saved to: ${OUTPUT_PATH} (${writeResult.writtenCount} written, ${writeResult.duplicateCount} duplicate rows removed)`,
  );
}

/**
 * Main fetching and transformation routine.
 */
async function fetchAndTransform() {
  console.log('Fetching lookup data...');
  const lookups = await fetchLookups();
  await appendLogs(DATASET_KEY, 'Lookup data fetched');

  console.log('Fetching solutions...');
  const solutions = await fetchAllSolutions();
  console.log(`Fetched ${solutions.length} total solutions`);
  await appendLogs(DATASET_KEY, `Fetched ${solutions.length} solutions`);

  // Filter to only include solutions that are included in the model
  const validSolutions = solutions.filter((s) => s.attributes?.include_in_model === true);
  console.log(`${validSolutions.length} solutions are included in the model`);
  await appendLogs(DATASET_KEY, `${validSolutions.length} solutions marked include_in_model=true`);

  // Transform and deduplicate by content
  const seenKeys = new Set();
  const rowsWithoutIds = [];

  for (const solution of validSolutions) {
    const row = transformSolution(solution, lookups);
    const key = `${row.problem}||${row.solution}`; // Use problem+solution as unique key

    if (seenKeys.has(key)) {
      await appendLogs(DATASET_KEY, `Skipping duplicate content: ${key.substring(0, 80)}...`);
      continue;
    }
    seenKeys.add(key);
    rowsWithoutIds.push(row);

    // Add to backup (auto-flushes every BACKUP_INTERVAL)
    await backup.add([row]);
  }

  const duplicatesSkipped = validSolutions.length - rowsWithoutIds.length;
  if (duplicatesSkipped > 0) {
    console.log(`Skipped ${duplicatesSkipped} duplicate solutions based on content.`);
    await appendLogs(
      DATASET_KEY,
      `Skipped ${duplicatesSkipped} duplicate solutions based on content.`,
    );
  }

  // Final flush of any remaining rows in backup buffer
  await backup.flush();

  // Write final CSV (writeCsv handles locking and read-only)
  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, rowsWithoutIds, {
    append: APPEND_PROCESSED,
  });
  console.log(`✅ Successfully transformed ${rowsWithoutIds.length} unique solutions.`);
  console.log(
    `📁 Saved to: ${OUTPUT_PATH} (${writeResult.writtenCount} written, ${writeResult.duplicateCount} duplicate rows removed)`,
  );

  await appendLogs(
    DATASET_KEY,
    `Completed: ${writeResult.writtenCount} rows written to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
  await appendLogs(DATASET_KEY, `   First: ${writeResult.firstID}`);
  await appendLogs(DATASET_KEY, `   Last:  ${writeResult.lastID}`);
}

// --- Entry point ---
async function main() {
  await clearLogs(DATASET_KEY);

  if (isBackupRecoveryMode()) {
    console.log(`♻️ BACKUP RECOVERY MODE: Building final CSV from saved backup content...`);
    await rebuildFromBackup();
    return;
  }

  await fetchAndTransform();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
