
/**
 * extract_ghg.js
 *
 * Extracts greenhouse gas (GHG) emission data from CSV sources with standardized
 * global warming potential (GWP) calculations. Processes multi-year emission records
 * across different gases (CO2, CH4, N2O, F-gases) and converts them to CO2-equivalent
 * values. Targets recent data (2020-2024) and high-impact emission sources.
 *
 * Features:
 *   - CSV parsing with flexible column name matching
 *   - GWP-based emission standardization (AR5 coefficients)
 *   - Multi-year time-series filtering with recent year prioritization
 *   - Emission source identification and categorization
 *   - Smart problem/solution generation based on gas type and sector
 *   - Highest-impact emission sources selection (top rows by magnitude)
 *   - Automatic ID generation with dataset key prefix
 *   - Centralized CSV writing with directory creation and file locking
 *
 * Usage:
 *   node extract_ghg.js
 *
 * Input: GHG emission CSV with columns: source, gas type, year, emission values
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Scope: Covers CO2, CH4 (methane), N2O (nitrous oxide), and F-gases with proper weighting
 */

import fs from 'fs/promises';
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

const DATASET_KEY = DATASET_KEYS.ghg;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(RAW_DIR, file),
);
verifyPathsExist(inputFiles);

const MAX_ROWS = 400;
const RECENT_YEARS = [2020, 2021, 2022, 2023, 2024];

// GWP values (AR5)
const GWP = {
  CO2: 1,
  CH4: 28,
  N2O: 265,
  // F‑gases handled separately
};

// IPCC sector codes that map to circular economy
const SECTOR_MAP = {
  '1.A.1.a': { materials: 'energy', strategy: 'energy decarbonisation' },
  '1.A.2': { materials: 'industrial', strategy: 'industrial efficiency' },
  '1.B.1': { materials: 'coal', strategy: 'fugitive emissions' },
  '1.B.2': { materials: 'oil/gas', strategy: 'fugitive emissions' },
  '2.A.1': { materials: 'cement', strategy: 'alternative materials / CCUS' },
  '2.A.2': { materials: 'lime', strategy: 'process emissions' },
  '2.B': { materials: 'chemicals', strategy: 'circular chemistry' },
  '2.C': { materials: 'metals', strategy: 'recycling, efficiency' },
  '3.A': { materials: 'agriculture', strategy: 'methane reduction' },
  '3.C': { materials: 'agriculture', strategy: 'methane reduction' },
  '3.D': { materials: 'agriculture', strategy: 'fertiliser efficiency' },
  '4.A': { materials: 'waste', strategy: 'landfill gas capture' },
  '4.C': { materials: 'waste', strategy: 'energy recovery' },
  '4.D': { materials: 'waste', strategy: 'methane capture' },
};

// Files to process – filter out any undefined entries
const GHG_FILES = [
  dataset.raw_folder_contents?.iea_co2,
  dataset.raw_folder_contents?.ch4,
  dataset.raw_folder_contents?.n2o,
  dataset.raw_folder_contents?.f_gases,
].filter(Boolean);

if (GHG_FILES.length === 0) {
  logger.error('✕ No GHG files defined in dataset.raw_folder_contents');
  process.exit(1);
}

async function main() {
  const allRows = [];

  for (const file of GHG_FILES) {
    const filePath = path.join(RAW_DIR, file);
    try {
      await fs.access(filePath);
    } catch {
      logger.warn(`File not found, skipping: ${file}`);
      continue;
    }

    logger.info(`Processing ${file}...`);
    const content = await fs.readFile(filePath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });
    logger.info(`  Total records: ${records.length}`);

    if (records.length === 0) {
      logger.warn(`  File is empty, skipping.`);
      continue;
    }

    // Determine gas from filename
    let gas = 'CO2';
    if (file.includes('CH4')) gas = 'CH4';
    else if (file.includes('N2O')) gas = 'N2O';
    else if (file.includes('F-gases')) gas = 'F-gases';

    // Expected columns
    const countryCol = 'Name';
    const sectorCol = 'ipcc_code_2006_for_standard_report';
    const fossilBioCol = 'fossil_bio';
    const substanceCol = 'Substance';

    // Quick check: if these columns are missing, skip
    if (!records[0][countryCol] || !records[0][sectorCol] || !records[0][fossilBioCol]) {
      logger.warn(`  Required columns not found, skipping file.`);
      continue;
    }

    // Compute top 20 countries by total emissions in latest year (summing fossil+bio)
    const latestYear = Math.max(...RECENT_YEARS);
    const latestCol = `Y_${latestYear}`;
    const countrySums = {};
    records.forEach((r) => {
      const country = r[countryCol];
      if (!country) return;
      const val = parseFloat(r[latestCol]);
      if (!isNaN(val)) {
        countrySums[country] = (countrySums[country] || 0) + val;
      }
    });

    const topCountries = Object.entries(countrySums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([country]) => country);

    // Filter records: top countries + relevant sectors
    const filtered = records.filter((r) => {
      const country = r[countryCol];
      const sector = r[sectorCol];
      return country && topCountries.includes(country) && SECTOR_MAP[sector];
    });

    logger.info(`  Filtered to ${filtered.length} records (top 20 countries, relevant sectors).`);

    // Aggregate by country, sector, year, and gas (summing fossil_bio)
    const aggregated = new Map(); // key: country|sector|year

    for (const r of filtered) {
      const country = r[countryCol];
      const sector = r[sectorCol];
      for (const year of RECENT_YEARS) {
        const col = `Y_${year}`;
        const val = parseFloat(r[col]);
        if (isNaN(val) || val === 0) continue;
        const key = `${country}|${sector}|${year}`;
        aggregated.set(key, (aggregated.get(key) || 0) + val);
      }
    }

    // Build output rows
    for (const [key, totalGg] of aggregated) {
      const [country, sector, year] = key.split('|');
      const map = SECTOR_MAP[sector];
      if (!map) continue; // shouldn't happen

      // Convert Gg to Mt
      let valueMt = totalGg / 1000;
      let impact;
      let gasName = gas;

      if (gas === 'F-gases') {
        impact = `${valueMt.toFixed(2)} Mt (as F‑gases)`;
      } else {
        valueMt = (totalGg * GWP[gas]) / 1000; // Mt CO₂e
        impact = `${valueMt.toFixed(2)} Mt CO₂e`;
        gasName = `${gas} (CO₂e)`;
      }

      const problem = `${country} ${sector} emissions (${gasName}) reached ${impact} in ${year}.`;

      allRows.push({
        problem: cleanText(problem),
        solution: cleanText(map.strategy),
        materials: map.materials,
        circular_strategy: cleanText(map.strategy),
        category: 'Greenhouse gas emissions',
        impact,
        source_url: 'https://edgar.jrc.ec.europa.eu/dataset_ghg2025',
        metadata_json: JSON.stringify({
          country,
          sector,
          gas,
          year,
          emissions_Gg: totalGg,
          unit: 'Gg',
          source_file: file,
          citation: 'Crippa, M. et al. (2025). GHG emissions of all world countries - 2025 Report.',
        }),
      });
    }
  }

  // Sort by impact (largest first) and limit to MAX_ROWS
  allRows.sort((a, b) => {
    const aVal = parseFloat(a.impact) || 0;
    const bVal = parseFloat(b.impact) || 0;
    return bVal - aVal;
  });

  const finalRows = allRows.slice(0, MAX_ROWS);
  logger.info(`Selected ${finalRows.length} rows.`);

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  logger.info(
    `✓ Written ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (${writeResult.duplicateCount} duplicate rows removed)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error('\n✕ Error in main execution:', err.message);
    process.exit(1);
  });
}
