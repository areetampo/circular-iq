/**
 * Extract Samples Script
 *
 * Extracts a sample of rows from the combined input CSV file,
 * limiting to a specified number of rows per dataset prefix.
 *
 * INPUT: combined_input.csv (merged from all datasets/processed/*.csv files)
 * OUTPUT: combined_input_sample.csv with sampled rows
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import {
  CSV_COLUMNS,
  STRINGIFY_OPTIONS,
  COMBINED_INPUT_CSV,
  COMBINED_INPUT_SAMPLE_CSV,
} from '#utils/datasetsUtils.js';

// ===== Configuration =====
const INPUT_FILE = COMBINED_INPUT_CSV;
const OUTPUT_FILE = COMBINED_INPUT_SAMPLE_CSV;
const ROWS_PER_DATASET = 5;
// ==========================

/**
 * Sample records from the dataset, limiting rows per dataset prefix
 * @param {Array} records - Parsed CSV records
 * @returns {Object} Object containing sampledRecords array and datasetCounters object
 */
function sampleRecordsByDataset(records) {
  const datasetCounters = {};
  const sampledRecords = [];

  for (const record of records) {
    const id = record.ID;
    // Extract prefix (e.g., 'c2c' from 'c2c_00001')
    const prefix = id.split('_')[0];

    // Initialize counter for new prefixes
    if (!datasetCounters[prefix]) {
      datasetCounters[prefix] = 0; // 0 based indexing
    }

    // If we haven't reached the limit for this prefix, add the row
    if (datasetCounters[prefix] < ROWS_PER_DATASET) {
      sampledRecords.push(record);
      datasetCounters[prefix]++;
    }
  }

  return { sampledRecords, datasetCounters };
}

/**
 * Main execution function
 * Loads the full dataset, samples rows per dataset, and saves the sample
 */
(async () => {
  try {
    console.log(`Reading ${INPUT_FILE}...`);
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');

    // Parse CSV using standard options
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    // Sample records by dataset prefix
    const { sampledRecords, datasetCounters } = sampleRecordsByDataset(records);

    // Convert sampled records back to CSV
    const csvOutput = stringify(sampledRecords, {
      ...STRINGIFY_OPTIONS,
      header: true,
      columns: CSV_COLUMNS,
    });

    fs.writeFileSync(OUTPUT_FILE, csvOutput);

    console.log(`Successfully saved ${sampledRecords.length} rows to ${OUTPUT_FILE}`);
    console.log('Breakdown per dataset:', datasetCounters);
  } catch (error) {
    console.error('Error processing CSV:', error);
  }
})();
