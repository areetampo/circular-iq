/**
 * CSV Dataset Merger
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
  console.log('\n' + '='.repeat(20));
  console.log('Merging CSV files from processed/ and manual_entries/ folders');
  console.log('='.repeat(20));

  // Verify directories exist
  try {
    assertDirExists(INPUT_PROCESSED_DIR, 'processed datasets directory');
  } catch (err) {
    console.error(`✗ ERROR: ${err.message}`);
    process.exit(1);
  }

  try {
    assertDirExists(INPUT_MANUAL_ENTRIES_DIR, 'manual entries directory');
  } catch (err) {
    console.error(`✗ ERROR: ${err.message}`);
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
  } catch (error) {
    console.error(`✗ ERROR: Failed to list CSV files: ${error.message}`);
    process.exit(1);
  }

  if (csvFiles.length === 0) {
    console.error('✗ ERROR: No CSV files found in processed/ or manual_entries/');
    process.exit(1);
  }

  console.log(`\n✓ Found ${csvFiles.length} CSV files to merge:`);
  csvFiles.forEach((f) => {
    console.log(`  - ${path.relative(process.cwd(), f)}`);
  });

  // Merge files
  console.log('\nMerging files...');

  const mergedRows = [];
  let expectedHeader = null;
  let totalRecords = 0;

  for (const filePath of csvFiles) {
    const fileName = path.basename(filePath);

    try {
      const { header, rows } = readCsvFile(filePath);

      if (!header) {
        console.log(`  ‼ ${fileName} - Empty file, skipping`);
        continue;
      }

      // Verify header consistency (first file sets the expected header)
      if (!expectedHeader) {
        expectedHeader = header;
        console.log(`  ✓ Header: ${header.substring(0, 80)}...`);
      }

      // Add all data rows
      const fileRecordCount = rows.length;
      mergedRows.push(...rows);
      totalRecords += fileRecordCount;

      console.log(`  ✓ ${fileName} - Added ${fileRecordCount} records`);
    } catch (error) {
      console.error(`  ✗ ERROR processing ${fileName}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(`\nTotal records collected: ${totalRecords}`);

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
    console.log(
      `✓ Removed ${totalDuplicatesRemoved} duplicate row${totalDuplicatesRemoved === 1 ? '' : 's'} based on content (excluding ID) and renumbered IDs within each dataset prefix`,
    );
  }

  mergedRows.length = 0;
  mergedRows.push(...dedupedRows);
  totalRecords = mergedRows.length;

  // Write output
  if (totalRecords === 0) {
    console.error('\n✗ ERROR: No records were merged!');
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
    console.log(`\n✓ Merged file created: ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  } catch (error) {
    console.error(`✗ ERROR: Failed to write output: ${error.message}`);
    process.exit(1);
  }

  // Validation
  console.log('\nValidating output...');

  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      console.warn('‼ WARNING: Output file has less than 2 lines (header + data)');
    }

    const headerLine = lines[0];
    const sampleLine = lines[1] || 'No data rows';

    console.log(`✓ Header: ${headerLine.substring(0, 80)}${headerLine.length > 80 ? '...' : ''}`);
    console.log(`✓ Sample:  ${sampleLine.substring(0, 80)}${sampleLine.length > 80 ? '...' : ''}`);
    console.log(`✓ Total lines: ${lines.length}`);
  } catch (error) {
    console.warn(`‼ Validation warning: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(30));
  console.log('MERGE COMPLETE');
  console.log('='.repeat(30));
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Total records: ${totalRecords}`);
  console.log('\nNext steps:');
  console.log('  1. Review combined_input.csv for quality');
  console.log('  2. Run: npm run chunk');
  console.log('  3. Run: npm run embed');
  console.log('  4. Run: npm run store');
  console.log(
    '  5. use --archives flag to write to archives/ instead of datasets/out/ for a "run archives" variant',
  );
  console.log('='.repeat(30) + '\n');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await mergeCsvFiles();
    } catch (error) {
      console.error('\n✕ Fatal error:', error.message);
      process.exit(1);
    }
  })();
}

export { mergeCsvFiles };
