
/**
 * Aggregates Eurostat waste and circular-material CSVs into processed CSV.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';

import {
    cleanText,
    DATASET_KEYS,
    DATASET_LOOKUP,
    ensureDir,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const DATASET_KEY = DATASET_KEYS.eurostat;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(rawDir);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(rawDir, file),
);
verifyPathsExist(inputFiles);

const MIN_YEAR = 2019;
const MAX_ROWS_PER_DATASET = 100;

if (!dataset.raw_folder_contents) {
  logger.error('✕ dataset.raw_folder_contents is missing – check your dataset definition.');
  process.exit(1);
}

const datasets = [
  {
    key: 'material_use',
    indicator: 'Circular material use rate',
    materials: 'all materials',
    circular_strategy: 'circular material use',
    category: 'Circular economy indicator',
    unit: '%',
    keepYears: 3,
    short: 'cmu',
    source_url: 'https://ec.europa.eu/eurostat/databrowser/view/cei_srm030/default/table?lang=en',
  },
  {
    key: 'dmc_per_capita',
    indicator: 'Domestic material consumption per capita',
    materials: 'total material use',
    circular_strategy: 'material consumption',
    category: 'Material flow accounts',
    unit: 'tonnes per capita',
    keepYears: 3,
    short: 'dmc',
    source_url: 'https://ec.europa.eu/eurostat/databrowser/view/ten00137/default/table?lang=en',
  },
  {
    key: 'waste',
    indicator: 'Recycling rate of all waste excluding major mineral waste',
    materials: 'all waste',
    circular_strategy: 'recycling',
    category: 'Waste management',
    unit: '%',
    keepYears: 2,
    short: 'recycling',
    source_url: 'https://ec.europa.eu/eurostat/databrowser/view/cei_wm010/default/table?lang=en',
  },
  {
    key: 'linear_1',
    indicator: 'Generation of municipal waste per capita',
    materials: 'municipal waste',
    circular_strategy: 'waste prevention',
    category: 'Waste management',
    unit: 'kg per capita',
    keepYears: 3,
    short: 'waste_per_capita',
    source_url: 'https://ec.europa.eu/eurostat/databrowser/view/cei_pc031/default/table?lang=en',
  },
  {
    key: 'linear_2',
    indicator: 'Generation of waste excluding major mineral wastes per GDP unit',
    materials: 'waste (excl. major mineral)',
    circular_strategy: 'resource efficiency',
    category: 'Waste management',
    unit: 'kg per thousand euro (chain linked 2010)',
    keepYears: 3,
    short: 'waste_per_gdp',
    source_url: 'https://ec.europa.eu/eurostat/databrowser/view/cei_pc032/default/table?lang=en',
  },
].map((ds) => ({
  ...ds,
  file: dataset.raw_folder_contents[ds.key],
}));

// ==================== PARSERS ====================

/**
 * Parse wide-format Eurostat files such as `TIME, 2013, , 2014, , ...`.
 * These files rarely contain quoted commas, so line-splitting is safe.
 *
 * @param {string[]} lines - Non-empty CSV lines from the Eurostat file.
 * @param {number} headerIndex - Index of the `TIME` header row.
 * @returns {Array<{country: string, year: number, value: number}>} Normalized rows parsed from paired year/value columns.
 */
function parseWide(lines, headerIndex) {
  const headerCols = lines[headerIndex].split(',');
  const years = [];
  for (let i = 1; i < headerCols.length; i += 2) {
    years.push(headerCols[i]?.trim());
  }

  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.startsWith('Special value') ||
      line.startsWith('Observation flags') ||
      line.startsWith(':')
    )
      break;

    const cols = line.split(',');
    const country = cols[0]?.trim();
    if (!country) continue;

    let colIdx = 1;
    for (let y = 0; y < years.length; y++) {
      const year = parseInt(years[y]);
      const valueStr = cols[colIdx]?.trim();
      const flag = cols[colIdx + 1]?.trim();
      colIdx += 2;

      if (valueStr && valueStr !== ':' && year >= MIN_YEAR && !['b', 'd', 'C'].includes(flag)) {
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          rows.push({ country, year, value });
        }
      }
    }
  }
  return rows;
}

/**
 * Parse long‑format Eurostat files using csv-parse to handle quoted commas.
 * Returns an array of { country, year, value }.
 *
 * @param {string} content - Raw Eurostat CSV content.
 * @returns {Array<{country: string, year: number, value: number}>} Normalized long-format rows.
 * @throws {Error} If required long-format columns are absent.
 */
function parseLong(content) {
  // Parse the entire CSV content into an array of objects.
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true, // some rows may have missing trailing commas
  });

  if (records.length === 0) return [];

  // Identify the correct column names (they vary slightly between files)
  const sample = records[0];
  const keys = Object.keys(sample);

  const countryKey = keys.find((k) => /geopolitical entity|country|geo/i.test(k));
  const yearKey = keys.find((k) => /time_period|year/i.test(k));
  const valueKey = keys.find((k) => /obs_value|value/i.test(k));
  const flagKey = keys.find((k) => /obs_flag|flag/i.test(k));

  if (!countryKey || !yearKey || !valueKey) {
    throw new Error(`Required columns not found in long‑format file`);
  }

  const rows = [];
  for (const row of records) {
    const country = row[countryKey]?.trim();
    const year = parseInt(row[yearKey]?.trim());
    const valueStr = row[valueKey]?.trim();
    const flag = flagKey ? row[flagKey]?.trim() : '';

    if (
      country &&
      !isNaN(year) &&
      valueStr &&
      valueStr !== ':' &&
      year >= MIN_YEAR &&
      !['b', 'd', 'C'].includes(flag)
    ) {
      const value = parseFloat(valueStr);
      if (!isNaN(value)) {
        rows.push({ country, year, value });
      }
    }
  }
  return rows;
}

/**
 * Detect format and delegate to the appropriate parser.
 *
 * @param {string} filePath - Eurostat CSV file path to inspect and parse.
 * @returns {Array<{country: string, year: number, value: number}>} Normalized Eurostat rows.
 * @throws {Error} If the file has no recognizable Eurostat header.
 */
function parseEurostatCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let headerIndex = -1;
  let format = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('TIME')) {
      headerIndex = i;
      format = 'wide';
      break;
    } else if (line.startsWith('STRUCTURE')) {
      headerIndex = i;
      format = 'long';
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error(`Could not find header line (starting with TIME or STRUCTURE) in ${filePath}`);
  }

  // For long format, use the robust csv-parse parser.
  if (format === 'long') {
    return parseLong(content);
  } else {
    return parseWide(lines, headerIndex);
  }
}

// ==================== MAIN ====================

async function main() {
  await ensureDir(path.dirname(OUTPUT_PATH));
  let allRows = [];

  for (const ds of datasets) {
    if (!ds.file) {
      logger.warn({ key: ds.key }, 'No file defined for dataset key, skipping');
      continue;
    }

    const filePath = path.join(rawDir, ds.file);
    if (!fs.existsSync(filePath)) {
      logger.warn({ filePath }, 'File not found, skipping');
      continue;
    }

    logger.info({ file: ds.file }, 'Processing file');
    let rows;
    try {
      rows = parseEurostatCSV(filePath);
    } catch (error) {
      logger.error({ file: ds.file, error }, 'Error parsing file');
      continue;
    }

    if (rows.length === 0) {
      logger.warn({ file: ds.file }, 'No valid rows extracted from file');
      continue;
    }

    // Keep only the most recent `keepYears` per country
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.country]) grouped[r.country] = [];
      grouped[r.country].push(r);
    }

    let selected = [];
    for (const country in grouped) {
      grouped[country].sort((a, b) => b.year - a.year);
      selected.push(...grouped[country].slice(0, ds.keepYears));
    }

    selected.sort((a, b) => b.year - a.year);
    selected = selected.slice(0, MAX_ROWS_PER_DATASET);

    for (const r of selected) {
      const impact = ds.unit === '%' ? `${r.value}%` : `${r.value} ${ds.unit}`;
      const problem = `${r.country} recorded a ${ds.indicator} of ${impact} in ${r.year}.`;
      const solution =
        'Strengthen circular economy policies, increase material efficiency, scale recycling systems, and improve resource productivity.';

      allRows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: ds.materials,
        circular_strategy: ds.circular_strategy,
        category: ds.category,
        impact: cleanText(impact),
        source_url: ds.source_url,
        metadata_json: JSON.stringify({
          country: r.country,
          year: r.year,
          value: r.value,
          unit: ds.unit,
          dataset: ds.file,
          source: 'Eurostat',
        }),
      });
    }
  }

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, allRows);
  logger.info(
    {
      writtenCount: writeResult.writtenCount,
      outputPath: OUTPUT_PATH,
      duplicateCount: writeResult.duplicateCount
    },
    'Written curated rows to output path'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    logger.error({ error }, '\n✕ Fatal error');
    process.exit(1);
  });
}
