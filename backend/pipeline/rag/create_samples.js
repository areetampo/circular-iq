/**
 * Samples rows from `combined_input.csv` per dataset limits (`DATASET_LIMITS`, `--all`).
 */

import fs from 'fs';

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

import {
  ARCHIVES_COMBINED_INPUT_CSV,
  ARCHIVES_COMBINED_INPUT_FINAL_CSV,
  ARCHIVES_TEST_COMBINED_INPUT_CSV,
  ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV,
  CSV_COLUMNS,
  DATASET_KEYS,
  OUT_COMBINED_INPUT_CSV,
  OUT_COMBINED_INPUT_FINAL_CSV,
  OUT_TEST_COMBINED_INPUT_CSV,
  OUT_TEST_COMBINED_INPUT_FINAL_CSV,
  STRINGIFY_OPTIONS,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

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
 * Per-dataset row caps for sample generation; missing dataset keys fall back to `DEFAULT_ROWS`.
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
 * Global switch for bypassing per-dataset row caps.
 *
 * @type {boolean}
 */
const TAKE_ALL = process.argv.includes('--all');

/** Default rows for dataset prefixes not listed above; `0` skips unknown prefixes. */
const DEFAULT_ROWS = 0;
// ==========================

/**
 * Samples records by dataset prefix while preserving input order.
 *
 * @param {Array<Record<string, string>>} records - Parsed CSV records with an `ID` field like `c2c_00001`.
 * @returns {{ sampledRecords: Array<Record<string, string>>, datasetCounters: Record<string, number> }} Sampled rows plus per-dataset inclusion counts.
 * @throws {TypeError} If a record is missing the required `ID` field.
 */
function sampleRecordsByDataset(records) {
  const datasetCounters = {};
  const sampledRecords = [];

  for (const record of records) {
    const id = record.ID;

    // Prefixes can contain underscores, so only the trailing numeric suffix is removed.
    const prefix = id.split('_').slice(0, -1).join('_');

    if (!datasetCounters[prefix]) {
      datasetCounters[prefix] = 0;
    }

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
      logger.info(
        {},
        'TAKE_ALL is enabled. Ignoring limits and extracting all rows from all datasets',
      );

    logger.info({ INPUT_FILE }, 'Reading input file');
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

    logger.info(
      { datasetCounters, outputFile: OUTPUT_FILE, rowCount: sampledRecords.length },
      'Sample extraction complete',
    );
  } catch (error) {
    logger.error({ error }, 'Error during sample extraction');
  }
})();
