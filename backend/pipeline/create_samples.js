/* global process */

/**
 * Create Samples Script
 *
 * Extracts a specific number of rows from the combined input CSV file
 * based on a per-dataset configuration.
 *
 * INPUT: combined_input.csv
 * OUTPUT: combined_input_sample.csv
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import {
  CSV_COLUMNS,
  STRINGIFY_OPTIONS,
  DATASET_KEYS,
  ARCHIVES_COMBINED_INPUT_CSV,
  ARCHIVES_TEST_COMBINED_INPUT_CSV,
  ARCHIVES_COMBINED_INPUT_FINAL_CSV,
  ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV,
  OUT_COMBINED_INPUT_CSV,
  OUT_TEST_COMBINED_INPUT_CSV,
  OUT_COMBINED_INPUT_FINAL_CSV,
  OUT_TEST_COMBINED_INPUT_FINAL_CSV,
} from '#utils/datasetsUtils.js';

// ===== Configuration =====
const archives = process.argv.includes('--archives');
const test = process.argv.includes('--test');

const INPUT_FILE = archives
  ? test
    ? ARCHIVES_TEST_COMBINED_INPUT_CSV
    : ARCHIVES_COMBINED_INPUT_CSV
  : test
    ? OUT_TEST_COMBINED_INPUT_CSV
    : OUT_COMBINED_INPUT_CSV;
const OUTPUT_FILE = archives
  ? test
    ? ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV
    : ARCHIVES_COMBINED_INPUT_FINAL_CSV
  : test
    ? OUT_TEST_COMBINED_INPUT_FINAL_CSV
    : OUT_COMBINED_INPUT_FINAL_CSV;

/**
 * Define how many top rows to keep for each dataset.
 * If a dataset key is not listed here, it will use the DEFAULT_ROWS.
 */
const DATASET_LIMITS = {
  [DATASET_KEYS.c2c]: 5,
  [DATASET_KEYS.cgr]: 5,
  [DATASET_KEYS.circle_knowledge_hub]: 5,
  [DATASET_KEYS.dataeu]: 5,
  [DATASET_KEYS.ecesp]: 5,
  [DATASET_KEYS.eippcb]: 5,
  [DATASET_KEYS.emf]: 5,
  [DATASET_KEYS.env]: 5,
  [DATASET_KEYS.epa]: 5,
  [DATASET_KEYS.eulac]: 5,
  [DATASET_KEYS.eurostat]: 5,
  [DATASET_KEYS.fashion_innovation]: 5,
  [DATASET_KEYS.fashion_transparency]: 5,
  [DATASET_KEYS.ghg]: 5,
  [DATASET_KEYS.gewm]: 5,
  [DATASET_KEYS.gtg]: 100,
  [DATASET_KEYS.ifixit]: 5,
  [DATASET_KEYS.kaggle]: 5,
  [DATASET_KEYS.kalundborg]: 5,
  [DATASET_KEYS.metabolic]: 5,
  [DATASET_KEYS.mnd]: 5,
  [DATASET_KEYS.oecd]: 5,
  [DATASET_KEYS.obf]: 5,
  [DATASET_KEYS.off]: 5,
  [DATASET_KEYS.opf]: 5,
  [DATASET_KEYS.refed]: 5,
  [DATASET_KEYS.rema]: 5,
  [DATASET_KEYS.sei]: 5,
  [DATASET_KEYS.unep]: 5,
  [DATASET_KEYS.wbcsd]: 5,
  [DATASET_KEYS.wbp]: 5,
  [DATASET_KEYS.wrap]: 5,
};

/**
 * Global Switch:
 * If true, ignore limits and take every row from every dataset.
 * If false, apply the limits defined in DATASET_LIMITS.
 */
const TAKE_ALL = process.argv.includes('--all');

const DEFAULT_ROWS = 0; // Set to 0 to skip any dataset not explicitly listed
// ==========================

/**
 * Sample records from the dataset based on custom limits per prefix
 * @param {Array} records - Parsed CSV records
 * @returns {Object} Object containing sampledRecords array and datasetCounters object
 */
function sampleRecordsByDataset(records) {
  const datasetCounters = {};
  const sampledRecords = [];

  for (const record of records) {
    const id = record.ID;

    // Extract prefix (e.g., 'c2c' from 'c2c_00001')
    // or, 'abc_xyz' from 'abc_xyz_00001'
    const prefix = id.split('_').slice(0, -1).join('_');

    // Initialize counter for new prefixes
    if (!datasetCounters[prefix]) {
      datasetCounters[prefix] = 0;
    }

    // Logic: If TAKE_ALL is true, bypass limit check.
    // Otherwise, check if current count is under the specific limit.
    const limit = DATASET_LIMITS[prefix] !== undefined ? DATASET_LIMITS[prefix] : DEFAULT_ROWS;

    if (TAKE_ALL || datasetCounters[prefix] < limit) {
      sampledRecords.push(record);
      datasetCounters[prefix]++;
    }
  }

  return { sampledRecords, datasetCounters };
}

(async () => {
  try {
    if (TAKE_ALL)
      console.log(
        '⚠️ TAKE_ALL is enabled. Ignoring limits and extracting all rows from all datasets...',
      );

    console.log(`Reading ${INPUT_FILE}...`);
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    const { sampledRecords, datasetCounters } = sampleRecordsByDataset(records);

    const csvOutput = stringify(sampledRecords, {
      ...STRINGIFY_OPTIONS,
      header: true,
      columns: CSV_COLUMNS,
    });

    fs.writeFileSync(OUTPUT_FILE, csvOutput);

    console.log(`\nExtraction Complete!`);
    console.log('Breakdown by dataset:', datasetCounters);
    console.log(`Saved ${sampledRecords.length} rows to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error during sample extraction:', error, error.message, error.stack);
  }
})();
