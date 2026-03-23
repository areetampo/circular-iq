
/**
 * extract_gewm.js
 *
 * Extracts Global E-Waste Monitor (GEWM) data on electronic waste streams and management
 * practices across world regions. Uses an embedded Python extraction script (invoked via
 * child_process) to parse PDF or complex data sources, then post-processes the results
 * into structured CSV format with regional waste management insights.
 *
 * Features:
 *   - Cross-language processing: Node.js wrapper with embedded Python extraction
 *   - System command execution (subprocess) for Python script invocation
 *   - CSV parsing with automatic column name matching
 *   - Regional-level data aggregation and validation
 *   - E-waste generation and management metric extraction
 *   - Smart problem/solution generation for waste reduction strategies
 *   - Automatic ID generation with dataset key prefix
 *   - Centralized CSV writing with directory creation and file locking
 *   - Buffer handling for binary/encoded data
 *
 * Usage:
 *   node extract_gewm.js
 *
 * Input: GEWM data files (CSV or complex formats processed by embedded Python)
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Dependencies: Python installation required for embedded extraction script
 * Regions: Asia, Europe, Africa, Americas, Oceania
 */

import {
    cleanText,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { Buffer } from 'buffer';
import { exec } from 'child_process';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

const DATASET_KEY = DATASET_KEYS.gewm;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const RAW_CSV = path.join(RAW_DIR, dataset.raw_folder_contents.data);
const REPORT_PDF = path.join(RAW_DIR, dataset.raw_folder_contents.report);

// Verify input PDF exists
verifyPathsExist([RAW_CSV, REPORT_PDF]);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// Known region names to identify data rows (as they appear in the PDF)
const REGIONS = new Set(['Asia', 'Europe', 'Africa', 'Americas', 'Oceania']);

// ----------------------------------------------------------------------
// Embedded Python extraction script (as a string)
// ----------------------------------------------------------------------
const PYTHON_SCRIPT = `
import camelot
import pandas as pd
from pathlib import Path

pdf_path = r"${RAW_DIR.replace(/\\/g, '\\\\')}\\\\${dataset.raw_folder_contents.report}"
output_path = Path(r"${RAW_CSV.replace(/\\/g, '\\\\')}")

# Extract tables from pages 122-137 (adjust if needed)
tables = camelot.read_pdf(pdf_path, pages='122-137', flavor='stream')

print(f"Number of tables found: {len(tables)}")

if len(tables) > 0:
    combined_df = pd.concat([table.df for table in tables], ignore_index=True)
    combined_df.to_csv(output_path, index=False, header=False)
    print(f"Extraction complete. Saved to {output_path}")
else:
    print("No tables found. Check page range or try flavor='stream'.")
`;

// ----------------------------------------------------------------------
// Helper to parse European-style numbers (comma as decimal)
// ----------------------------------------------------------------------
function parseEuropeanNumber(str) {
  if (!str || str === 'N/A' || str === 'N/A*') return NaN;
  // Replace comma with dot and remove any non‑numeric characters except dot and minus
  const cleaned = str.replace(/,/g, '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

// ----------------------------------------------------------------------
// Run the embedded Python extraction using a cross‑platform command
// ----------------------------------------------------------------------
async function runPythonExtraction() {
  logger.info('Running embedded Python extraction...');

  // Check if python is available
  try {
    await execPromise('py --version');
  } catch {
    throw new Error(
      'Python is not installed or not in PATH. Please install Python and ensure it is accessible.',
    );
  }

  // Check if camelot is installed
  try {
    await execPromise('py -c "import camelot"');
  } catch {
    logger.warn(
      '‼ ️ Camelot is not installed. Attempting to install it (this may take a moment)...',
    );
    try {
      await execPromise('py -m pip install camelot-py[cv]');
    } catch (pipError) {
      throw new Error(
        `Failed to install camelot. Please install it manually: pip install camelot-py[cv], Error: ${pipError.message}`,
      );
    }
  }

  // Encode the Python script in base64 to avoid escaping issues
  const base64Script = Buffer.from(PYTHON_SCRIPT, 'utf8').toString('base64');

  // Command that decodes and executes the script (works on all platforms)
  const command = `py -c "import base64; exec(base64.b64decode('${base64Script}').decode())"`;

  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) logger.error('Python stderr:', stderr);
    logger.info('Python stdout:', stdout);
    logger.info('✓ Python extraction completed.');
  } catch (error) {
    logger.error('✕ Error running Python script:', error.message);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Clean the raw CSV into the final format (now async)
// ----------------------------------------------------------------------
async function cleanData() {
  logger.info('Reading raw CSV...');
  const raw = fs.readFileSync(RAW_CSV, 'utf8');
  const rows = parse(raw, {
    skip_empty_lines: false,
    trim: true,
    relax_column_count: true,
  });

  const countries = [];
  let current = null;
  let refLines = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((cell) => !cell || cell.trim() === '')) continue;

    const firstCell = row[0]?.trim() || '';
    // Skip headers and table titles
    if (
      firstCell.includes('Table') ||
      firstCell.includes('COUNTRY') ||
      firstCell.includes('Annex') ||
      firstCell.includes('REFERENCE') ||
      firstCell.includes('GENERATED')
    ) {
      continue;
    }

    const region = row[1]?.trim() || '';
    const isRegion = REGIONS.has(region);

    if (isRegion) {
      // New country row
      if (current) {
        current.reference = refLines.join(' ').trim();
        countries.push(current);
      }
      current = {
        country: firstCell,
        region,
        gen_million: row[2]?.trim() || '',
        gen_per_capita: row[3]?.trim() || '',
        collected: row[4]?.trim() || '',
        legislation: row[6]?.trim() || '',
        epr: row[7]?.trim() || '',
        collection_target: row[8]?.trim() || '',
        recycling_target: row[9]?.trim() || '',
      };
      refLines = [row[5]?.trim() || ''];
    } else {
      if (!current) continue;

      if (firstCell && !region) {
        // Continuation of country name
        current.country += ' ' + firstCell;
      } else {
        // Continuation of reference
        const refPart = row.filter((c) => c && c.trim()).join(' ');
        if (refPart) refLines.push(refPart);
      }
    }
  }
  if (current) {
    current.reference = refLines.join(' ').trim();
    countries.push(current);
  }

  logger.info(`Parsed ${countries.length} raw country entries.`);

  // Deduplicate by country name
  const countryMap = new Map();
  for (const c of countries) {
    countryMap.set(c.country, c);
  }
  const uniqueCountries = Array.from(countryMap.values());
  logger.info(`After deduplication: ${uniqueCountries.length} unique countries.`);

  if (uniqueCountries.length === 0) {
    logger.warn('‼ ️ No countries found. The CSV might be empty or misparsed.');
    return;
  }

  // Map to standard format
  const mapped = uniqueCountries.map((c) => {
    const genMillion = parseEuropeanNumber(c.gen_million) || 0;
    const genPerCapita = parseEuropeanNumber(c.gen_per_capita) || 0;
    const collected = parseEuropeanNumber(c.collected) || 0;
    const rate = genMillion > 0 ? ((collected / genMillion) * 100).toFixed(1) : '?';

    const problem = `E-waste management in ${c.country}`;
    const solution = `Recycling rate: ${collected.toFixed(1)} million kg collected (${rate}%). Legislation: ${c.legislation || ''}, EPR: ${c.epr || ''}.`;
    const impact = `${genMillion.toFixed(0)} million kg total, ${genPerCapita.toFixed(1)} kg per capita`;

    const metadata = {
      country: c.country,
      region: c.region,
      ewaste_generated_million_kg: genMillion.toString(),
      ewaste_kg_per_capita: genPerCapita.toString(),
      collected_million_kg: collected.toString(),
      legislation: c.legislation,
      epr: c.epr,
      collection_target: c.collection_target,
      recycling_target: c.recycling_target,
      reference: c.reference,
    };

    return {
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: 'electronics, metals, plastics',
      circular_strategy: c.legislation === 'Yes' ? 'Policy/Regulation' : '',
      category: 'E-waste',
      impact: cleanText(impact),
      source_url: 'https://ewastemonitor.info/',
      metadata_json: JSON.stringify(metadata),
    };
  });

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, mapped); // now allowed inside async function
  logger.info(
    `✓ Final cleaned CSV written to ${OUTPUT_PATH} with ${writeResult.writtenCount} rows (${writeResult.duplicateCount} duplicate rows removed).`,
  );
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------
async function main() {
  // Ensure raw directory exists
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  // Step 1: Run embedded Python extraction
  await runPythonExtraction();

  // Step 2: Clean the data (now awaited)
  verifyPathsExist(RAW_CSV);
  await cleanData();
}

main().catch((err) => {
  logger.error('Unhandled error:', err);
  process.exit(1);
});
