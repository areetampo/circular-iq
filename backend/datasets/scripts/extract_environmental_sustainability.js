
/**
 * extract_environmental_sustainability.js - Environmental sustainability indicators and country-level extraction
 *
 * Processes environmental performance data from UN/UNDP environmental databases. Filters out
 * aggregate regions and focuses on specific country records with quantified environmental metrics.
 * Scores countries by data completeness and selects top performers.
 *
 * Features:
 *   • CSV parsing with automatic column detection
 *   • Aggregation filtering (removes region-level aggregates to focus on countries)
 *   • Quality scoring based on completeness of environmental data (non-null fields)
 *   • Top N selection after comprehensive sorting by score
 *   • Automatic ID generation with dataset key prefix
 *   • Centralized CSV writing with directory creation
 *   • Conflict resolution via stable sorting order
 *
 * Usage:
 *   node extract_environmental_sustainability.js
 *
 * Input: CSV file with country environmental indicators (Location, various environmental metrics)
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Note: Aggregate regions like 'World', 'Arab States', regional groups are excluded
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';

import {
    DATASET_KEYS,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const DATASET_KEY = DATASET_KEYS.env;
const rawDir = getDatasetRawDir(DATASET_KEY);
const INPUT_FILE = path.join(rawDir, 'environmental_sustainability.csv');
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

verifyPathsExist([INPUT_FILE]);
const MAX_RECORDS = 100;

const aggregateNames = new Set([
  'Arab States',
  'East Asia and the Pacific',
  'Europe and Central Asia',
  'Latin America and the Caribbean',
  'South Asia',
  'Sub-Saharan Africa',
  'Developing countries',
  'World',
  'High human development',
  'Medium human development',
  'Low human development',
  'Very high human development',
]);

async function main() {
  // 1. Check file existence and read
  let raw;
  try {
    raw = await fs.readFile(INPUT_FILE, 'utf-8');
  } catch (err) {
    logger.error({ inputFile: INPUT_FILE }, 'Input file not found');
    throw err;
  }

  const records = parse(raw, { columns: true, skip_empty_lines: true });
  logger.info({ count: records.length }, 'Raw records');

  // 2. Filter out aggregate regions
  const filteredRecords = records.filter((r) => r.Location && !aggregateNames.has(r.Location));
  logger.info({ count: filteredRecords.length }, 'After removing aggregates');

  // 3. Score by completeness and pick top 50
  const scoredRows = filteredRecords
    .map((r) => {
      const nonEmptyFields = Object.values(r).filter((v) => v && v !== '' && v !== '..').length;
      return { data: r, score: nonEmptyFields };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RECORDS);

  logger.info({ count: scoredRows.length }, 'Selected top rows by completeness');

  // 4. Transform to standard format
  const processed = scoredRows.map(({ data: r }) => {
    const loc = r.Location;
    const co2 = r['Carbon dioxide emissions per capita (tonnes) 2011'] || '0';
    const fossil = r['Primary energy supply Fossil fuels (% of total) 2012'] || 'N/A';
    const renew = r['Primary energy supply Renewable sources (% of total) 2012'] || 'N/A';

    return {
      problem: `High reliance on non-renewable energy and carbon emissions in ${loc}.`,
      solution: `Transitioning energy mix (Current: ${fossil}% Fossil, ${renew}% Renewable) to reduce the carbon footprint of ${co2} tonnes per capita.`,
      materials: 'Energy infrastructure, Fossil fuels, Renewables',
      circular_strategy: 'Resource Efficiency / Energy Transition',
      category: 'Country Sustainability Profile',
      impact: co2,
      source_url: 'https://hdr.undp.org/data-center',
      metadata_json: JSON.stringify(r),
    };
  });

  // 6. Write output (helper creates directory, handles locking)
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
  main().catch((err) => {
    logger.error({ error: err.message }, '✕ Fatal error');
    process.exit(1);
  });
}
