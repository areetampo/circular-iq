/**
 * Merges `datasets/processed/*.csv` and manual entries into `combined_input.csv`.
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

// This merge step always reads standard dataset folders; archive snapshots are produced later.
const test = process.argv.includes('--test');
const OUTPUT_FILE = test ? OUT_TEST_COMBINED_INPUT_CSV : OUT_COMBINED_INPUT_CSV;

const INPUT_PROCESSED_DIR = DATASETS_PROCESSED_DIR;
const INPUT_MANUAL_ENTRIES_DIR = DATASETS_MANUAL_ENTRIES_DIR;

/**
 * Reads header + raw row lines without csv-parse because processed files are already quoted.
 *
 * @param {string} filePath - CSV file to read as UTF-8 text.
 * @returns {{header: string|null, rows: string[]}} Header row plus non-empty data rows.
 * @throws {Error} If the file cannot be read from disk.
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
 * Concatenates processed and manual CSV rows into the selected combined input file.
 * Exits the process on missing directories or read failures.
 */
async function mergeCsvFiles() {
  logger.info('starting CSV merge from processed and manual_entries folders');

  try {
    assertDirExists(INPUT_PROCESSED_DIR, 'processed datasets directory');
  } catch (error) {
    logger.error({ error }, 'Processed directory missing');
    process.exit(1);
  }

  try {
    assertDirExists(INPUT_MANUAL_ENTRIES_DIR, 'manual entries directory');
  } catch (error) {
    logger.error({ error }, 'Manual entries directory missing');
    process.exit(1);
  }

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
  } catch (error) {
    logger.error({ error }, 'Failed to list CSV files');
    process.exit(1);
  }

  if (csvFiles.length === 0) {
    logger.error('No CSV files found in processed or manual_entries');
    process.exit(1);
  }

  logger.info({ count: csvFiles.length }, 'Found CSV files for merge');

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

      // The first non-empty file defines the output header for all merged rows.
      if (!expectedHeader) {
        expectedHeader = header;
        logger.info({ fileName }, 'Set CSV header');
      }

      const fileRecordCount = rows.length;
      mergedRows.push(...rows);
      totalRecords += fileRecordCount;

      logger.info({ fileName, recordCount: fileRecordCount }, 'Added records from file');
    } catch (error) {
      logger.error({ fileName, error }, 'Error processing file');
      process.exit(1);
    }
  }

  logger.info({ totalRecords }, 'Total records collected');

  // Remove duplicates based on row content (excluding ID) and renumber IDs within each dataset prefix
  const groupedByPrefix = new Map();
  for (const row of mergedRows) {
    const parts = row.split(',');
    const id = parts[0].replace(/"/g, '');
    const content = parts.slice(1).join(',');

    // Dataset prefixes can contain underscores, so strip only the trailing numeric suffix.
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
    // Preserve source order before renumbering each dataset prefix.
    rows.sort((a, b) => a.number - b.number);

    // Deduplicate within each dataset so different sources do not suppress similar rows.
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

    // Keep each dataset's IDs compact after duplicate removal.
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

  if (totalRecords === 0) {
    logger.error('No records were merged');
    process.exit(1);
  }

  try {
    await prepareWrite(OUTPUT_FILE, { clear: true });
    const output = [expectedHeader, ...mergedRows].join('\n');
    await fs.promises.writeFile(OUTPUT_FILE, output, 'utf8');
    try {
      await fs.promises.chmod(OUTPUT_FILE, 0o444);
    } catch {
      // Some platforms ignore POSIX-style read-only permissions.
    }
    logger.info({ file: path.relative(process.cwd(), OUTPUT_FILE) }, 'Merged file created');
  } catch (error) {
    logger.error({ error }, 'Failed to write output');
    process.exit(1);
  }

  logger.info('Validating output');

  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      logger.warn('Output file has fewer than 2 lines');
    }

    logger.info({ totalLines: lines.length }, 'Validation complete');
  } catch (error) {
    logger.warn({ error }, 'Validation error');
  }

  logger.info({ outputFile: OUTPUT_FILE, totalRecords }, 'merge complete');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await mergeCsvFiles();
    } catch (error) {
      logger.error({ error }, 'Fatal error');
      process.exit(1);
    }
  })();
}

export { mergeCsvFiles };
