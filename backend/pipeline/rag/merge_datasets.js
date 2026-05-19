/**
 * @module merge_datasets
 * @description Merges per-dataset processed CSVs into a single combined_input.csv.
 *
 * Merges all standardized CSV files from datasets/processed/ and datasets/manual_entries/
 * into a single combined_input.csv file, preserving the quoted format.
 *
 * Usage: node merge_datasets.js
 * Run from: backend/datasets/ directory or with proper paths
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  assertDirExists,
  DATASETS_MANUAL_ENTRIES_DIR,
  DATASETS_PROCESSED_DIR,
  OUT_COMBINED_INPUT_CSV,
  OUT_TEST_COMBINED_INPUT_CSV,
  prepareWrite,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

// merge datasets already has a combined_input.csv so --archives flag isnt present for merge_datasets.js
const test = process.argv.includes('--test');
const OUTPUT_FILE = test ? OUT_TEST_COMBINED_INPUT_CSV : OUT_COMBINED_INPUT_CSV;

// inputs always come from the standard dataset directories; the archives flag
// only affects where the output is written (see ARCHIVES_COMBINED_INPUT_CSV).
const INPUT_PROCESSED_DIR = DATASETS_PROCESSED_DIR;
const INPUT_MANUAL_ENTRIES_DIR = DATASETS_MANUAL_ENTRIES_DIR;

/**
 * Parse a simple CSV file (assuming already properly formatted)
 * Reads header and data rows as-is without re-parsing
 */
function readCsvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return { header: null, rows: [] };
    }

    return {
      header: lines[0],
      rows: lines.slice(1),
    };
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

/**
 * Main merge function
 */
async function mergeCsvFiles() {
  logger.info('starting CSV merge from processed and manual_entries folders');

  // Verify directories exist
  try {
    assertDirExists(INPUT_PROCESSED_DIR, 'processed datasets directory');
  } catch (err) {
    logger.error({ err }, 'Processed directory missing');
    process.exit(1);
  }

  try {
    assertDirExists(INPUT_MANUAL_ENTRIES_DIR, 'manual entries directory');
  } catch (err) {
    logger.error({ err }, 'Manual entries directory missing');
    process.exit(1);
  }

  // Collect CSV files
  let csvFiles = [];
  try {
    const processedFiles = fs
      .readdirSync(INPUT_PROCESSED_DIR)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => path.join(INPUT_PROCESSED_DIR, f));

    const manualFiles = fs
      .readdirSync(INPUT_MANUAL_ENTRIES_DIR)
      .filter((f) => f.endsWith('.csv'))
      .map((f) => path.join(INPUT_MANUAL_ENTRIES_DIR, f));

    csvFiles = [...processedFiles, ...manualFiles];
  } catch (err) {
    logger.error({ err }, 'Failed to list CSV files');
    process.exit(1);
  }

  if (csvFiles.length === 0) {
    logger.error('No CSV files found in processed or manual_entries');
    process.exit(1);
  }

  logger.info({ count: csvFiles.length }, 'Found CSV files for merge');

  // Merge files
  logger.info('Starting CSV file merge');

  const mergedRows = [];
  let expectedHeader = null;
  let totalRecords = 0;

  for (const filePath of csvFiles) {
    const fileName = path.basename(filePath);

    try {
      const { header, rows } = readCsvFile(filePath);

      if (!header) {
        logger.warn({ fileName }, 'Empty file, skipping');
        continue;
      }

      // Verify header consistency (first file sets the expected header)
      if (!expectedHeader) {
        expectedHeader = header;
        logger.info({ fileName }, 'Set CSV header');
      }

      // Add all data rows
      const fileRecordCount = rows.length;
      mergedRows.push(...rows);
      totalRecords += fileRecordCount;

      logger.info({ fileName, recordCount: fileRecordCount }, 'Added records from file');
    } catch (err) {
      logger.error({ fileName, err }, 'Error processing file');
      process.exit(1);
    }
  }

  logger.info({ totalRecords }, 'Total records collected');

  // Remove duplicates based on row content (excluding ID) and renumber IDs within each dataset prefix
  const groupedByPrefix = new Map();
  for (const row of mergedRows) {
    const parts = row.split(',');
    const id = parts[0].replace(/"/g, ''); // Remove quotes from ID
    const content = parts.slice(1).join(','); // Everything after ID

    // Extract prefix (e.g., "c2c_", "circle_knowledge_hub_")
    const idParts = id.split('_');
    const prefix = idParts.slice(0, -1).join('_') + '_';
    const number = parseInt(idParts[idParts.length - 1]);

    if (!groupedByPrefix.has(prefix)) {
      groupedByPrefix.set(prefix, []);
    }
    groupedByPrefix.get(prefix).push({ id, content, number, originalRow: row });
  }

  const dedupedRows = [];
  let totalDuplicatesRemoved = 0;

  for (const [prefix, rows] of groupedByPrefix) {
    // Sort by original number to maintain order
    rows.sort((a, b) => a.number - b.number);

    // Remove duplicates based on content
    const contentSet = new Set();
    const uniqueRows = [];
    for (const row of rows) {
      if (!contentSet.has(row.content)) {
        contentSet.add(row.content);
        uniqueRows.push(row);
      } else {
        totalDuplicatesRemoved++;
      }
    }

    // Renumber IDs sequentially
    uniqueRows.forEach((row, index) => {
      const newNumber = (index + 1).toString().padStart(5, '0');
      const newId = prefix + newNumber;
      const newRow = `"${newId}",${row.content}`;
      dedupedRows.push(newRow);
    });
  }

  if (totalDuplicatesRemoved > 0) {
    logger.info({ count: totalDuplicatesRemoved }, 'Duplicates removed');
  }

  mergedRows.length = 0;
  mergedRows.push(...dedupedRows);
  totalRecords = mergedRows.length;

  // Write output
  if (totalRecords === 0) {
    logger.error('No records were merged');
    process.exit(1);
  }

  try {
    // ensure parent dir (touch on first use) and wipe existing contents
    await prepareWrite(OUTPUT_FILE, { clear: true });
    const output = [expectedHeader, ...mergedRows].join('\n');
    await fs.promises.writeFile(OUTPUT_FILE, output, 'utf8');
    try {
      await fs.promises.chmod(OUTPUT_FILE, 0o444);
    } catch {
      // ignore chmod errors on some platforms
    }
    logger.info({ file: path.relative(process.cwd(), OUTPUT_FILE) }, 'Merged file created');
  } catch (err) {
    logger.error({ err }, 'Failed to write output');
    process.exit(1);
  }

  // Validation
  logger.info('Validating output');

  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      logger.warn('Output file has fewer than 2 lines');
    }

    logger.info({ totalLines: lines.length }, 'Validation complete');
  } catch (err) {
    logger.warn({ err }, 'Validation error');
  }

  // Summary
  logger.info({ outputFile: OUTPUT_FILE, totalRecords }, 'merge complete');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await mergeCsvFiles();
    } catch (err) {
      logger.error({ err }, 'Fatal error');
      process.exit(1);
    }
  })();
}

export { mergeCsvFiles };
