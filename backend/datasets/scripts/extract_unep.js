/**
 * extract_unep.js
 *
 * Extracts environmental impact and waste management data from United Nations
 * Environment Programme (UNEP) datasets. Processes CSV data streams with event-based
 * parsing for efficient handling of large environmental databases. Focuses on
 * global environmental statistics and pollution/waste indicators.
 *
 * Features:
 *   - Stream-based CSV parsing for memory-efficient processing of large files
 *   - Event-driven row processing with callback patterns
 *   - Multi-file aggregation with configurable target row limits
 *   - UNEP environmental indicator classification and mapping
 *   - Pollution and waste stream categorization
 *   - Smart problem/solution generation based on environmental metrics
 *   - Skip list support for filtering specific rows/regions
 *   - Automatic ID generation with dataset key prefix
 *   - Centralized CSV writing with directory creation and file locking
 *
 * Usage:
 *   node extract_unep.js
 *
 * Input: CSV files with UNEP environmental indicators
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Configuration: Target row count (TARGET_ROWS), regional filters, environmental indicators
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
} from '#utils/datasetsUtils.js';
import { fileURLToPath } from 'url';

const DATASET_KEY = DATASET_KEYS.unep;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const TARGET_ROWS = 400;

// ----------------------------------------------------------------------
// Helper: process a CSV file with stream + events, collecting results
// ----------------------------------------------------------------------
function processCSV(filePath, rowCallback, options = {}) {
  return new Promise((resolve, reject) => {
    const results = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      ...options,
    });

    fs.createReadStream(filePath)
      .pipe(parser)
      .on('data', (row) => {
        const processed = rowCallback(row);
        if (processed) results.push(processed);
      })
      .on('error', reject)
      .on('end', () => resolve(results));
  });
}

// ----------------------------------------------------------------------
// 1. Material Flows (wide format, years as columns)
// ----------------------------------------------------------------------
async function processMaterialFlows(filePath) {
  return processCSV(filePath, (row) => {
    const value = parseFloat(row['2024']);
    if (isNaN(value) || value <= 0) return null;

    const country = row.Country || 'Global';
    const category = row.Category || 'Materials';
    const flowName = row['Flow name'] || 'Extraction';
    const unit = row['Flow unit'] || 'tonnes';

    const problem = `${flowName} of ${category.toLowerCase()} in ${country} is at linear capacity.`;
    const solution = `Implement circular ${category.toLowerCase()} strategies in ${country}.`;
    const impact = `Total 2024 flow: ${value.toLocaleString()} ${unit}.`;

    return {
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: cleanText(category),
      circular_strategy: 'Resource Efficiency',
      category: 'Macro-Economic Material Flow',
      impact: cleanText(impact),
      source_url: dataset.urls?.irp || '',
      metadata_json: JSON.stringify(row),
      _scoreValue: value,
    };
  });
}

// ----------------------------------------------------------------------
// 2. GWMO Consolidated (CSV with comment rows at top)
// ----------------------------------------------------------------------
async function processGWMO(filePath) {
  // Read the file to find the header line number
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/);
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Region')) {
      headerLineIndex = i;
      break;
    }
  }
  if (headerLineIndex === -1) throw new Error('Could not find header row in GWMO CSV');

  // Process from the header line onward
  return processCSV(
    filePath,
    (row) => {
      const country = row['Name'] || row['Country'];
      if (!country) return null;

      const msw2020Str = row['2020']?.replace(/[ ,]/g, '');
      const msw2020 = parseFloat(msw2020Str);
      if (isNaN(msw2020) || msw2020 <= 0) return null;

      const recycling = parseFloat(row['Recycling']) || 0;
      const landfill = parseFloat(row['Landfill']) || 0;
      const thermal = parseFloat(row['Thermal']) || 0;

      const impactParts = [`MSW generated 2020: ${msw2020} thousand tonnes`];
      if (recycling > 0) impactParts.push(`Recycling: ${recycling}%`);
      if (landfill > 0) impactParts.push(`Landfill: ${landfill}%`);
      if (thermal > 0) impactParts.push(`Thermal: ${thermal}%`);

      const problem = `Municipal solid waste generation in ${country} is high and growing.`;
      const solution = `Adopt circular economy strategies: reduce, reuse, recycle.`;
      const impact = impactParts.join('; ');

      return {
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'Municipal Solid Waste',
        circular_strategy: recycling > 0 ? 'Recycling' : 'Waste Reduction',
        category: 'Waste Management',
        impact: cleanText(impact),
        source_url: dataset.urls?.gmwo || '',
        metadata_json: JSON.stringify(row),
        _scoreValue: msw2020,
      };
    },
    { from_line: headerLineIndex + 1 },
  ); // start at the header line
}

// ----------------------------------------------------------------------
// 3. Countries MSW summary (CSV)
// ----------------------------------------------------------------------
async function processCountriesMSW(filePath) {
  return processCSV(filePath, (row) => {
    const country = row.Country;
    if (!country) return null;

    const msw2020 = parseFloat(row['MSW 2020']?.replace(/,/g, ''));
    if (isNaN(msw2020) || msw2020 <= 0) return null;

    const perCapita = parseFloat(row['MSW kg/per capita/day 2020']);
    const gdp = parseFloat(row['GDP per capita (PPP international USD)']?.replace(/,/g, ''));
    const urban = parseFloat(row['Urbanization rate (%)']);

    const impact = `MSW 2020: ${msw2020} thousand tonnes; per capita: ${perCapita} kg/day; GDP per capita: ${gdp || 'N/A'} USD; Urbanization: ${urban || 'N/A'}%`;

    const problem = `Waste generation in ${country} is significant and expected to increase.`;
    const solution = `Implement integrated waste management and circular economy policies.`;

    return {
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: 'Municipal Solid Waste',
      circular_strategy: 'Waste Management',
      category: 'Waste Indicators',
      impact: cleanText(impact),
      source_url: dataset.urls?.gmwo || '',
      metadata_json: JSON.stringify(row),
      _scoreValue: msw2020,
    };
  });
}

// ----------------------------------------------------------------------
// 4. Material Footprint per capita (world only)
// ----------------------------------------------------------------------
async function processMaterialFootprint(filePath) {
  return processCSV(filePath, (row) => {
    const year = parseInt(row.Year);
    if (year < 2015) return null;

    const footprint = parseFloat(
      row[
        '12.2.1 - Material footprint per capita, by type of raw material (tonnes) - EN_MAT_FTPRPC'
      ],
    );
    if (isNaN(footprint) || footprint <= 0) return null;

    const problem = `Global material footprint per capita reached ${footprint} tonnes in ${year}, indicating unsustainable resource use.`;
    const solution = `Promote resource efficiency, circular economy, and sustainable consumption.`;
    const impact = `Material footprint per capita: ${footprint} tonnes (${year})`;

    return {
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: 'All materials',
      circular_strategy: 'Resource Efficiency',
      category: 'Material Footprint',
      impact: cleanText(impact),
      source_url: dataset.urls?.sdg || '',
      metadata_json: JSON.stringify(row),
      _scoreValue: footprint,
    };
  });
}

// ----------------------------------------------------------------------
// Main: process all files, then filter top TARGET_ROWS by score
// ----------------------------------------------------------------------
async function main() {
  console.log(`🔍 Scanning ${RAW_DIR}...`);

  // Ensure raw folder exists
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌ Raw directory not found: ${RAW_DIR}`);
    process.exit(1);
  }

  const fileHandlers = [
    { name: dataset.raw_folder_contents?.global_flows, handler: processMaterialFlows },
    { name: dataset.raw_folder_contents?.gwmo, handler: processGWMO },
    { name: dataset.raw_folder_contents?.countries_msw, handler: processCountriesMSW },
    { name: dataset.raw_folder_contents?.material_footprint, handler: processMaterialFootprint },
  ].filter((fh) => fh.name); // only include defined files

  if (fileHandlers.length === 0) {
    console.error('❌ No file handlers defined – check dataset.raw_folder_contents');
    process.exit(1);
  }

  let allResults = [];

  for (const fh of fileHandlers) {
    const filePath = path.join(RAW_DIR, fh.name);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️️️  File not found: ${fh.name} – skipping.`);
      continue;
    }

    console.log(`📄 Processing ${fh.name}...`);
    try {
      const results = await fh.handler(filePath);
      console.log(`   ✅ Extracted ${results.length} records.`);
      allResults.push(...results);
    } catch (err) {
      console.error(`   ❌ Error processing ${fh.name}:`, err.message);
    }
  }

  if (allResults.length === 0) {
    console.log('❌ No data extracted.');
    return;
  }

  // --- Score and select top TARGET_ROWS ---
  const scored = allResults.map((r) => ({
    ...r,
    score: Math.log(r._scoreValue + 1), // log scale to balance magnitude
  }));

  scored.sort((a, b) => b.score - a.score);
  const topRows = scored.slice(0, TARGET_ROWS);

  console.log(`\n🎯 Selected top ${topRows.length} rows by quality score.`);

  // Remove temporary fields and add ID
  const final = topRows.map(({ _scoreValue, score, ...rest }, idx) => ({
    ID: formatId(DATASET_KEY, idx + 1),
    ...rest,
  }));

  // writeCsv handles directory creation, clearing and read-only locking
  await writeCsv(OUTPUT_PATH, final);
  console.log(`✅ Success! Wrote ${final.length} records to ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
