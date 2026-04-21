
/**
 * extract_oecd.js - OECD Environmental Data Extraction
 *
 * Samples and processes OECD environmental data CSVs (municipal waste, material use, etc.)
 * to generate a condensed dataset of high-value rows for analysis. Applies keyword filtering,
 * year filtering, and selects the top MAX_ROWS based on a quality score.
 *
 * Features:
 *   • CSV parsing via csv-parse/sync
 *   • Statistical data extraction and sampling
 *   • Multi-dataset consolidation with consistent formatting
 *   • Automatic ID generation with dataset key prefix
 *   • Quality scoring to keep only the best rows
 *
 * Usage:
 *   node extract_oecd.js [datasetKey|all]
 *
 * Input: CSV files in datasets/raw/oecd/
 * Output: CSV with standardized columns in datasets/processed/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';

import {
    cleanText,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const DATASET_KEY = DATASET_KEYS.oecd;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);

verifyPathsExist(rawDir);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(rawDir, file),
);
verifyPathsExist(inputFiles);

// --- NEW: Maximum number of rows to keep in final output (adjust as needed) ---
const MAX_ROWS = 300;

// --- Sampling fraction still reduces processing load; set to 1.0 if you want to consider all rows ---
const SAMPLE_FRACTION = 0.04; // 4% sampling to reduce processing time; keep as is or set to 1.0
const TARGET_COUNTRIES = []; // empty = all countries

// --- Configuration for each dataset ---
const datasets = {
  municipal: {
    input: path.join(rawDir, dataset.raw_folder_contents.municipal_waste),
    columns: {
      country: ['REF_AREA', 'Reference area', 'Country'],
      year: ['TIME_PERIOD', 'Time period', 'Year'],
      variable: ['MEASURE', 'Measure'],
      value: ['OBS_VALUE', 'Observation value'],
      unit: ['UNIT_MEASURE', 'Unit of measure'],
    },
    requiredFields: ['country', 'year', 'variable', 'value'],
    minYear: 2015,
    relevantKeywords: ['recycl', 'recovery', 'generat', 'compost'],
    mapRow: (fields, originalRow) => {
      const { country, year, variable, value, unit = '' } = fields;
      const num = parseFloat(value);
      const vLow = variable.toLowerCase();
      let problem,
        solution,
        impact,
        circular_strategy = 'Waste Management',
        materials = 'mixed';
      if (vLow.includes('recycl')) {
        circular_strategy = 'Recycling';
        problem = `Municipal waste recycling rate in ${country} was ${num}${unit} in ${year}.`;
        solution = `Increasing separate collection and investing in recycling infrastructure can improve this rate.`;
        impact = `A recycling rate of ${num}${unit} diverts waste from landfill and saves resources.`;
      } else if (vLow.includes('generat')) {
        circular_strategy = 'Waste Prevention';
        problem = `${country} generated ${num}${unit} of municipal waste per capita in ${year}.`;
        solution = `Adopting circular economy principles like eco‑design and reuse can reduce waste generation.`;
        impact = `Reducing waste generation lowers environmental pressure and disposal costs.`;
      } else if (vLow.includes('compost') || vLow.includes('digestion')) {
        circular_strategy = 'Biological Treatment';
        problem = `Only ${num}${unit} of municipal waste was composted in ${country} (${year}).`;
        solution = `Expanding composting programs can turn organic waste into valuable soil amendment.`;
        impact = `Composting reduces methane emissions from landfills and returns nutrients to soil.`;
      } else {
        problem = `In ${country} (${year}), ${num}${unit} of municipal waste was treated by ${variable}.`;
        solution = `Shifting treatment toward recycling and recovery would enhance circularity.`;
        impact = `Current treatment mix affects resource recovery and emissions.`;
      }
      return {
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: cleanText(materials),
        circular_strategy: cleanText(circular_strategy),
        category: 'Circular Economy',
        impact: cleanText(impact),
        source_url: dataset.source_url,
        metadata_json: JSON.stringify(originalRow),
        // Add year and country for scoring later
        _year: parseInt(year, 10),
        _country: country,
        _variable: variable,
      };
    },
  },

  streams: {
    input: path.join(rawDir, dataset.raw_folder_contents.selected_streams),
    columns: {
      country: ['REF_AREA', 'Reference area', 'Country'],
      year: ['TIME_PERIOD', 'Time period', 'Year'],
      stream: ['MATERIAL', 'Materials'],
      measure: ['MEASURE', 'Measure'],
      value: ['OBS_VALUE', 'Observation value'],
      unit: ['UNIT_MEASURE', 'Unit of measure'],
    },
    requiredFields: ['country', 'year', 'stream', 'measure', 'value'],
    minYear: 2015,
    relevantKeywords: ['plastic', 'e-waste', 'packaging', 'recycl', 'recovery'],
    mapRow: (fields, originalRow) => {
      const { country, year, stream, measure, value, unit = '' } = fields;
      const num = parseFloat(value);
      const sLow = stream.toLowerCase();
      const mLow = measure.toLowerCase();
      let materials = 'mixed';
      if (sLow.includes('plastic')) materials = 'plastics';
      else if (sLow.includes('e-waste')) materials = 'e-waste';
      else if (sLow.includes('packaging')) materials = 'packaging';
      let circular_strategy = 'Waste Management';
      if (mLow.includes('recycl')) circular_strategy = 'Recycling';
      else if (mLow.includes('recovery')) circular_strategy = 'Recovery';
      else if (mLow.includes('generat')) circular_strategy = 'Waste Prevention';
      const problem = `${stream} in ${country}: ${measure} was ${num}${unit} in ${year}.`;
      const solution = `Improving collection and treatment infrastructure for ${stream} can increase circularity.`;
      const impact = `This value indicates the current state of ${measure.toLowerCase()} for ${stream}.`;
      return {
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: cleanText(materials),
        circular_strategy: cleanText(circular_strategy),
        category: 'Circular Economy',
        impact: cleanText(impact),
        source_url: dataset.source_url,
        metadata_json: JSON.stringify(originalRow),
        _year: parseInt(year, 10),
        _country: country,
        _variable: measure,
      };
    },
  },

  capmf: {
    input: path.join(rawDir, dataset.raw_folder_contents.capmf),
    columns: {
      country: ['REF_AREA', 'Reference area', 'Country'],
      year: ['TIME_PERIOD', 'Time period', 'Year'],
      policyName: ['CLIM_ACT_POL', 'Climate actions and policies'],
      stringency: ['OBS_VALUE', 'Observation value'],
    },
    requiredFields: ['country', 'year', 'policyName', 'stringency'],
    minYear: 2020,
    relevantKeywords: ['waste', 'recycl'],
    mapRow: (fields, originalRow) => {
      const { country, year, policyName, stringency } = fields;
      const num = parseFloat(stringency);
      const problem = `Policy stringency for "${policyName}" in ${country} was ${num} (scale 0-6) in ${year}.`;
      const solution = `Strengthening this policy could improve circular economy outcomes.`;
      const impact = `Higher stringency indicates stronger incentives for emissions reductions and resource efficiency.`;
      return {
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: 'mixed',
        circular_strategy: 'Policy',
        category: 'Circular Economy Policy',
        impact: cleanText(impact),
        source_url: dataset.source_url,
        metadata_json: JSON.stringify(originalRow),
        _year: parseInt(year, 10),
        _country: country,
        _variable: policyName,
      };
    },
  },
};

// --- Helper to get field ---
function getField(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== '') return row[name];
  }
  return null;
}

// --- NEW: Quality scoring function ---
// Customize this to reflect what you consider "high quality".
// Higher score = better row.
function scoreRow(row) {
  let score = 0;

  // 1. Recent year is better (up to 100 points, linear scale from minYear to 2025)
  const currentYear = new Date().getFullYear();
  const minYear = 2015; // we already filtered rows >= minYear
  const yearRange = currentYear - minYear;
  if (row._year) {
    const yearScore = ((row._year - minYear) / yearRange) * 100;
    score += Math.min(100, Math.max(0, yearScore));
  }

  // 2. Keyword relevance: if the problem/variable contains specific high‑priority words, add bonus
  const text = (row.problem + ' ' + row._variable).toLowerCase();
  const priorityKeywords = ['recycl', 'circular', 'recovery', 'compost', 'plastic'];
  for (const kw of priorityKeywords) {
    if (text.includes(kw)) score += 20;
  }

  // 3. Optional: prefer certain countries (e.g., larger economies) - here just a small bonus for EU/US
  const highPriorityCountries = [
    'United States',
    'Germany',
    'France',
    'United Kingdom',
    'Japan',
    'China',
  ];
  if (highPriorityCountries.includes(row._country)) score += 10;

  return score;
}

// --- Process dataset (unchanged) ---
function processDataset(datasetKey) {
  const cfg = datasets[datasetKey];
  if (!cfg) return [];

  logger.info({ datasetKey }, 'Processing dataset');
  logger.info({ input: cfg.input }, 'Input file');

  if (!fs.existsSync(cfg.input)) {
    logger.error({ input: cfg.input }, 'Input file not found');
    return [];
  }

  const content = fs.readFileSync(cfg.input, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true, delimiter: ',' });

  logger.info({ total: records.length }, 'Total rows in file');

  const processed = [];
  const skipped = [];

  for (const row of records) {
    const fields = {};
    for (const [key, possible] of Object.entries(cfg.columns)) {
      fields[key] = getField(row, possible);
    }

    // Required fields
    let missing = false;
    for (const req of cfg.requiredFields) {
      if (!fields[req]) {
        skipped.push({ row, reason: `Missing required field: ${req}` });
        missing = true;
        break;
      }
    }
    if (missing) continue;

    // Year
    const yearNum = parseInt(fields.year, 10);
    if (isNaN(yearNum) || yearNum < cfg.minYear) {
      skipped.push({ row, reason: `Year ${fields.year} < ${cfg.minYear}` });
      continue;
    }

    // Numeric value (handle both 'value' and 'stringency')
    const valueField = fields.value || fields.stringency;
    if (!valueField || isNaN(parseFloat(valueField))) {
      skipped.push({ row, reason: 'Missing or non-numeric value' });
      continue;
    }

    // Country filter (if list provided)
    if (TARGET_COUNTRIES.length > 0 && !TARGET_COUNTRIES.includes(fields.country)) {
      skipped.push({ row, reason: `Country ${fields.country} not in target list` });
      continue;
    }

    // Keyword filter
    if (cfg.relevantKeywords && cfg.relevantKeywords.length > 0) {
      const textToCheck = Object.values(fields).join(' ').toLowerCase();
      const hasKeyword = cfg.relevantKeywords.some((kw) => textToCheck.includes(kw));
      if (!hasKeyword) {
        skipped.push({ row, reason: 'No relevant keyword' });
        continue;
      }
    }

    // Sampling (still applied to reduce processing load)
    if (SAMPLE_FRACTION < 1.0 && Math.random() > SAMPLE_FRACTION) {
      skipped.push({ row, reason: 'Random sampling skipped' });
      continue;
    }

    const mapped = cfg.mapRow(fields, row);
    if (mapped) processed.push(mapped);
    else skipped.push({ row, reason: 'Mapping returned null' });
  }

  logger.info({ processed: processed.length }, 'Processed rows');
  logger.info({ skipped: skipped.length }, 'Skipped rows');

  return processed;
}

async function writeCombined(rows) {
  if (rows.length === 0) {
    logger.info('No rows to write.');
    return;
  }

  // --- NEW: Sort by quality score and keep top MAX_ROWS ---
  logger.info({ total: rows.length }, 'Total rows after processing');
  logger.info({ maxRows: MAX_ROWS }, 'Selecting top rows based on quality score');

  // Compute scores
  const withScores = rows.map((row) => ({ row, score: scoreRow(row) }));
  // Sort descending by score
  withScores.sort((a, b) => b.score - a.score);
  // Take top MAX_ROWS
  const topRows = withScores.slice(0, MAX_ROWS).map((item) => item.row);

  logger.info({ selected: topRows.length }, 'Selected rows');

  const finalRows = topRows.map((row) => ({
    problem: row.problem || '',
    solution: row.solution || '',
    materials: row.materials || '',
    circular_strategy: row.circular_strategy || '',
    category: row.category || '',
    impact: row.impact || '',
    source_url: row.source_url || '',
    metadata_json: row.metadata_json || '',
  }));

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  logger.info(
    {
      outputPath: OUTPUT_PATH,
      writtenCount: writeResult.writtenCount,
      duplicateCount: writeResult.duplicateCount
    },
    'Combined output written (duplicate rows removed)'
  );
}

// --- Main function ---
async function main() {
  const args = process.argv.slice(2);
  let datasetsToProcess = [];

  if (args.length === 0 || args[0].toLowerCase() === 'all') {
    datasetsToProcess = Object.keys(datasets);
    logger.info('Processing all OECD datasets...');
  } else {
    const key = args[0].toLowerCase();
    if (datasets[key]) datasetsToProcess = [key];
    else {
      logger.error(
        {
          unknownKey: key,
          availableDatasets: Object.keys(datasets).join(', ')
        },
        'Unknown dataset. Available options listed'
      );
      process.exit(1);
    }
  }

  let allRows = [];
  for (const key of datasetsToProcess) {
    const rows = processDataset(key);
    allRows = allRows.concat(rows);
  }

  await writeCombined(allRows);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error({ err: err.message }, 'Fatal error');
    process.exit(1);
  });
}
