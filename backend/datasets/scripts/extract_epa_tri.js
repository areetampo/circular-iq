
/**
 * Extracts EPA TRI facility pollution data scored for CE opportunities.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';

import {
    cleanText,
    DATASET_KEYS,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const DATASET_KEY = DATASET_KEYS.epa;
const rawDir = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(rawDir);

const inputFile = path.join(rawDir, '2024_us.csv');
verifyPathsExist([inputFile]);
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// Target number of rows to output
const TARGET_ROWS = 200;

// Weights for each dimension (must sum to 1)
const WEIGHTS = {
  totalRelease: 0.4, // pollution severity
  recoveryScore: 0.35, // circular activity
  disposalRatio: 0.25, // inefficiency
};

/**
 * Safely parse numeric values, removing commas and handling empty strings.
 *
 * @param {unknown} v - CSV cell value that may include commas or be blank.
 * @returns {number} Parsed number, or `0` when the cell is empty or invalid.
 */
function num(v) {
  if (!v) return 0;
  return parseFloat(String(v).replace(/,/g, '').trim()) || 0;
}

/**
 * Find a column key that contains all of the given substrings (case-insensitive).
 *
 * @param {string[]} keys - Header names from the parsed CSV.
 * @param {...string} substrings - Required substrings that must all appear in the header.
 * @returns {string|undefined} Matching header key, or `undefined` when none match.
 */
function findColumn(keys, ...substrings) {
  return keys.find((k) => substrings.every((sub) => k.toLowerCase().includes(sub.toLowerCase())));
}

async function main() {
  // 1. Read and parse CSV
  let raw;
  try {
    raw = await fs.readFile(inputFile, 'utf-8');
  } catch (error) {
    logger.error({ inputFile }, 'Input file not found');
    throw error;
  }

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  logger.info({ count: records.length }, 'Parsed TRI records');

  // 2. Detect key columns dynamically
  const keys = Object.keys(records[0] || {});
  if (keys.length === 0) {
    throw new Error('CSV appears to be empty or has no columns');
  }

  const facilityCol = findColumn(keys, 'facility');
  const stateCol = findColumn(keys, 'state');
  const naicsCol = findColumn(keys, 'naics');
  const chemicalCol = findColumn(keys, 'chemical');
  const totalReleaseCol = findColumn(keys, 'total', 'release');
  const recycleCol = findColumn(keys, 'recycl');
  const energyCol = findColumn(keys, 'energy');
  const treatCol = findColumn(keys, 'treat');
  const disposalCol = findColumn(keys, 'disposal');

  // Verify required columns exist
  const required = { facilityCol, chemicalCol, totalReleaseCol };
  const missing = Object.entries(required)
    .filter(([_, val]) => !val)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }

  // 3. Enrich rows with computed fields
  const enriched = records
    .map((r) => {
      const totalRelease = num(r[totalReleaseCol]);
      const recycled = num(r[recycleCol]);
      const energy = num(r[energyCol]);
      const treated = num(r[treatCol]);
      const disposed = num(r[disposalCol]);

      return {
        facility: r[facilityCol],
        state: r[stateCol] || '',
        naics: r[naicsCol] || '',
        chemical: r[chemicalCol],
        totalRelease,
        recycled,
        energy,
        treated,
        disposed,
        recoveryScore: recycled + energy,
        disposalRatio: totalRelease > 0 ? disposed / totalRelease : 0,
      };
    })
    .filter((r) => r.chemical && r.totalRelease > 0); // basic quality filter

  logger.info({ count: enriched.length }, 'Usable rows (chemical + release > 0)');

  // 4. Compute normalized scores for each dimension
  const maxTotalRelease = Math.max(...enriched.map((r) => r.totalRelease));
  const maxRecoveryScore = Math.max(...enriched.map((r) => r.recoveryScore));
  const maxDisposalRatio = Math.max(...enriched.map((r) => r.disposalRatio));

  const scored = enriched.map((r) => {
    const normTotal = r.totalRelease / maxTotalRelease;
    const normRecovery = r.recoveryScore / maxRecoveryScore;
    const normDisposal = r.disposalRatio / maxDisposalRatio;

    const combinedScore =
      WEIGHTS.totalRelease * normTotal +
      WEIGHTS.recoveryScore * normRecovery +
      WEIGHTS.disposalRatio * normDisposal;

    return { ...r, combinedScore };
  });

  // 5. Sort by combined score descending and take top TARGET_ROWS
  const topRows = scored.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, TARGET_ROWS);

  logger.info({ count: topRows.length }, 'Selected top rows by combined score');

  // 6. Transform to standard format
  const processed = topRows.map((r) => {
    const problem = `${r.facility} in ${r.state} released ${r.totalRelease.toLocaleString()} lbs of ${r.chemical}.`;
    const solution = `Implement pollution prevention, material substitution, and closed‑loop recovery to reduce toxic releases and increase recycling (currently ${r.recycled.toLocaleString()} lbs recycled, ${r.energy.toLocaleString()} lbs energy recovery).`;
    const strategy = 'Pollution Prevention / Circular Economy';

    return {
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: r.chemical,
      circular_strategy: strategy,
      category: 'Toxic Release Inventory',
      impact: `${r.totalRelease.toLocaleString()} lbs`,
      source_url: 'https://www.epa.gov/toxics-release-inventory-tri-program',
      metadata_json: JSON.stringify({
        facility: r.facility,
        state: r.state,
        naics: r.naics,
        total_release_lbs: r.totalRelease,
        recycled_lbs: r.recycled,
        energy_recovery_lbs: r.energy,
        treated_lbs: r.treated,
        disposed_lbs: r.disposed,
        combined_score: r.combinedScore,
      }),
    };
  });

  // 8. Write output
  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, processed);
  logger.info(
    {
      writtenCount: writeResult.writtenCount,
      outputPath: OUTPUT_PATH,
      duplicateCount: writeResult.duplicateCount
    },
    'Successfully wrote records to output path'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    logger.error({ error }, '\n✕ Fatal error');
    process.exit(1);
  });
}
