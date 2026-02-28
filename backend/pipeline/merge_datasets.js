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
  COMBINED_INPUT_CSV,
  DATASETS_PROCESSED_DIR,
  DATASETS_MANUAL_ENTRIES_DIR,
  ARCHIVES_COMBINED_INPUT_CSV,
} from '#utils/datasetsUtils.js';

// allow writing to archives instead of normal output for a "run archives" variant
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');
const OUTPUT_FILE = useArchive ? ARCHIVES_COMBINED_INPUT_CSV : COMBINED_INPUT_CSV; // central constant (datasets/out/combined_input.csv)

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
function mergeCsvFiles() {
  console.log('\n' + '='.repeat(70));
  console.log('Circular Economy Dataset Merger');
  console.log('Merging CSV files from processed/ and manual_entries/ folders');
  console.log('='.repeat(70));

  // Verify directories exist
  if (!fs.existsSync(INPUT_PROCESSED_DIR)) {
    console.error(`✗ ERROR: Directory '${INPUT_PROCESSED_DIR}' not found`);
    process.exit(1);
  }

  if (!fs.existsSync(INPUT_MANUAL_ENTRIES_DIR)) {
    console.error(`✗ ERROR: Directory '${INPUT_MANUAL_ENTRIES_DIR}' not found`);
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
        console.log(`  ⚠ ${fileName} - Empty file, skipping`);
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

  // Write output
  if (totalRecords === 0) {
    console.error('\n✗ ERROR: No records were merged!');
    process.exit(1);
  }

  try {
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = [expectedHeader, ...mergedRows].join('\n');
    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
    // ensure file is read-only to prevent accidental edits
    try {
      fs.chmodSync(OUTPUT_FILE, 0o444);
    } catch (_chmodErr) {
      // chmod might fail on Windows depending on permissions; ignore
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
      console.warn('⚠ WARNING: Output file has less than 2 lines (header + data)');
    }

    const headerLine = lines[0];
    const sampleLine = lines[1] || 'No data rows';

    console.log(`✓ Header: ${headerLine.substring(0, 80)}${headerLine.length > 80 ? '...' : ''}`);
    console.log(`✓ Sample:  ${sampleLine.substring(0, 80)}${sampleLine.length > 80 ? '...' : ''}`);
    console.log(`✓ Total lines: ${lines.length}`);
  } catch (error) {
    console.warn(`⚠ Validation warning: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(30));
  console.log('MERGE COMPLETE');
  console.log('='.repeat(30));
  console.log(`Output file: ${path.basename(OUTPUT_FILE)}`);
  console.log(`Total records: ${totalRecords}`);
  console.log('\nNext steps:');
  console.log('  1. Review combined_input.csv for quality');
  console.log('  2. Run: npm run chunk');
  console.log('  3. Run: npm run embed');
  console.log('  4. Run: npm run store');
  console.log('='.repeat(30) + '\n');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    mergeCsvFiles();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

export { mergeCsvFiles };
