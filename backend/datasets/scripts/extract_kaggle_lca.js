
/**
 * extract_kaggle_lca.js - Life cycle assessment (LCA) data extraction
 *
 * Processes multi-source LCA data from Kaggle datasets in CSV format with automatic delimiter
 * detection (comma or semicolon). Identifies key environmental impact indicators and generates
 * insights about product life cycles, material flows, and circular potential.
 *
 * Features:
 *   • Automatic CSV delimiter detection (comma or semicolon)
 *   • UTF-8 BOM handling (removes byte-order marks from headers)
 *   • Flexible column name matching across multiple datasets
 *   • LCA impact category identification (energy, water, emissions, etc.)
 *   • Problem/solution generation based on product life cycle stages
 *   • **Quality scoring based on original data completeness** (replaces random sampling)
 *   • Automatic ID generation with dataset key prefix
 *   • Centralized CSV writing with directory creation and file locking
 *
 * Usage:
 *   node extract_kaggle_lca.js
 *
 * Input: LCA CSV files from Kaggle (various formats with flexible delimiter)
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Target rows: TARGET_ROWS (default 300) highest‑quality rows
 * Scope: Covers product-level LCA data with environmental impact metrics
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

const DATASET_KEY = DATASET_KEYS.kaggle;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(rawDir);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(rawDir, file),
);
verifyPathsExist(inputFiles);

// Target total rows
const TARGET_ROWS = 300;

// ---------- Helper: compute quality score based on original data ----------
/**
 * Computes a quality score for a row by counting non‑empty, non‑null fields
 * in the original metadata (stored in metadata_json).
 * @param {Object} row - The transformed row object containing metadata_json.
 * @returns {number} - Number of meaningful fields in the original data.
 */
function computeQualityScoreFromMetadata(row) {
  try {
    const original = JSON.parse(row.metadata_json);
    let count = 0;
    for (const [key, value] of Object.entries(original)) {
      if (
        value &&
        typeof value === 'string' &&
        value.trim() !== '' &&
        !/^(n\/?a|na|-)$/i.test(value.trim())
      ) {
        count++;
      } else if (value && typeof value === 'number' && !isNaN(value)) {
        count++;
      }
    }
    return count;
  } catch {
    // If JSON parsing fails, return 0 (should not happen)
    return 0;
  }
}

async function detectDelimiter(filePath) {
  const sample = await fs.promises.readFile(filePath, 'utf8').then((text) => text.split('\n')[0]);
  return sample.includes(';') ? ';' : ',';
}

function parseCSV(filePath, delimiter = ',') {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: (header) => header.map((h) => h.replace(/^\ufeff/, '').trim()),
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
  });
}

// ---------- Handlers ----------
async function handleCarbonCatalogueProduct(filePath) {
  const delimiter = await detectDelimiter(filePath);
  const rows = parseCSV(filePath, delimiter);
  return rows
    .filter(
      (row) =>
        row['*Stage-level CO2e available'] === 'Yes' &&
        row["Product's carbon footprint (PCF, kg CO2e)"] &&
        parseFloat(row["Product's carbon footprint (PCF, kg CO2e)"]) > 0,
    )
    .map((row) => {
      const pcf = row["Product's carbon footprint (PCF, kg CO2e)"];
      const reason = row['Company-reported reason for change'];
      // Build a meaningful solution
      let solution = '';
      if (reason && reason.trim() !== '' && reason !== 'N/a') {
        solution = cleanText(reason);
      } else {
        // Generic but contextual solution based on circular strategy
        const strategy =
          row['*EndOfLife CO2e (fraction of total PCF)'] &&
          parseFloat(row['*EndOfLife CO2e (fraction of total PCF)']) > 0
            ? 'End‑of‑life recycling potential'
            : 'Carbon footprint reduction';
        if (strategy === 'End‑of‑life recycling potential') {
          solution = `Design for recyclability and establish take‑back programs for this product. The product has a reported carbon footprint of ${pcf} kg CO₂e, with significant end‑of‑life emissions.`;
        } else {
          solution = `Implement measures to reduce the carbon footprint, such as energy efficiency improvements, material substitution, or supply chain optimisation. Current carbon footprint is ${pcf} kg CO₂e.`;
        }
      }

      return {
        problem: cleanText(
          `High carbon footprint of ${row["Company's sector"] || 'product'} ${row['Product name (and functional unit)'] || ''}`.trim(),
        ),
        solution: solution,
        materials: cleanText(row['Product weight (kg)'] ? `${row['Product weight (kg)']} kg` : ''),
        circular_strategy:
          row['*EndOfLife CO2e (fraction of total PCF)'] &&
          parseFloat(row['*EndOfLife CO2e (fraction of total PCF)']) > 0
            ? 'End‑of‑life recycling potential'
            : 'Carbon footprint reduction',
        category: cleanText(
          row["Company's sector"] || row["Company's GICS Industry Group"] || 'General',
        ),
        impact: cleanText(`${pcf} kg CO₂e`),
        source_url: 'https://www.kaggle.com/datasets/unsdsn/global-carbon-catalogue',
        metadata_json: JSON.stringify(row),
      };
    });
}

async function handleGLEAM(filePath) {
  const delimiter = await detectDelimiter(filePath);
  const rows = parseCSV(filePath, delimiter);
  return rows
    .filter((row) => row.Region && row['Animal species'])
    .map((row) => {
      const intensity = row['Emission Intensity (kg CO2e per kg protein)'] || 'N/A';
      const species = row['Animal species'];
      const region = row.Region;
      const solution = `Adopt sustainable livestock management practices, including improved manure management, feed efficiency, and pasture management, to reduce emissions from ${species} in ${region}. Current emission intensity is ${intensity} kg CO₂e/kg protein.`;

      return {
        problem: cleanText(
          `Livestock emissions in ${region} (${species}, ${row.Production_system || 'aggregated'})`,
        ),
        solution: cleanText(solution),
        materials: cleanText(species),
        circular_strategy:
          row['Manure management, N2O (kg CO2e)'] &&
          parseFloat(row['Manure management, N2O (kg CO2e)']) > 0
            ? 'Manure management'
            : 'Feed efficiency',
        category: 'Livestock Emissions',
        impact: cleanText(
          `${parseFloat(row['Total GHG emissions (kg CO2e)'] || 0).toFixed(0)} kg CO₂e total`,
        ),
        source_url: 'https://www.fao.org/gleam/en/',
        metadata_json: JSON.stringify(row),
      };
    });
}

async function handleGreenSupplyChain(filePath) {
  const delimiter = await detectDelimiter(filePath);
  const rows = parseCSV(filePath, delimiter);
  return rows
    .filter((row) => {
      const score = parseFloat(row.Sustainability_Score);
      const co2 = parseFloat(row.CO2_Emissions_kg);
      return !isNaN(score) && (score > 70 || score < 30) && co2 > 0;
    })
    .map((row) => {
      const score = parseFloat(row.Sustainability_Score);
      const co2 = row.CO2_Emissions_kg;
      const waste = row.Waste_Generated_kg;
      const renewable = row['Renewable_Energy_%'] || 0;
      const productType = row.Product_Type;

      const problem =
        score > 70
          ? `Sustainable product: ${productType}`
          : `Unsustainable product: ${productType}`;

      const solution = `Improve sustainability performance by reducing CO₂ emissions (currently ${co2} kg), minimising waste (${waste} kg), and increasing renewable energy use (${renewable}%). Consider material efficiency and circular design principles.`;

      return {
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials: cleanText(`${row.Raw_Material_Usage_kg} kg raw materials`),
        circular_strategy:
          parseFloat(row['Renewable_Energy_%']) > 50
            ? 'Renewable energy use'
            : 'Efficiency measures',
        category: cleanText(productType),
        impact: cleanText(`${co2} kg CO₂, ${waste} kg waste`),
        source_url: 'https://www.kaggle.com/datasets/shrutibhatia99/green-supply-chain-dataset',
        metadata_json: JSON.stringify(row),
      };
    });
}

// ---------- Main ----------
async function main() {
  const dataset = DATASET_LOOKUP[DATASET_KEY];
  // Ensure required file keys exist
  const requiredKeys = ['product_lca', 'livestock', 'supply_chain'];
  for (const key of requiredKeys) {
    if (!dataset.raw_folder_contents?.[key]) {
      logger.warn({ key }, 'Missing raw_folder_contents key');
    }
  }

  const allRows = [];
  const files = [
    {
      name: dataset.raw_folder_contents.product_lca,
      handler: handleCarbonCatalogueProduct,
    },
    { name: dataset.raw_folder_contents.livestock, handler: handleGLEAM },
    { name: dataset.raw_folder_contents.supply_chain, handler: handleGreenSupplyChain },
  ];

  for (const file of files) {
    if (!file.name) {
      logger.warn({}, 'Skipping undefined file');
      continue;
    }
    const filePath = path.join(rawDir, file.name);
    if (!fs.existsSync(filePath)) {
      logger.warn({ filePath }, 'File not found, skipping');
      continue;
    }
    logger.info({ fileName: file.name }, 'Processing file');
    try {
      const rows = await file.handler(filePath);
      // Compute quality score for each row and add to collection
      for (const row of rows) {
        row._qualityScore = computeQualityScoreFromMetadata(row);
        allRows.push(row);
      }
      logger.info({ count: rows.length }, 'High-quality rows processed');
    } catch (err) {
      logger.error({ fileName: file.name, error: err }, 'Error processing file');
    }
  }

  logger.info({ total: allRows.length }, 'Total rows collected');

  if (allRows.length === 0) {
    logger.info('✕ No data processed. Exiting.');
    return;
  }

  // Sort by quality score (descending) and select top TARGET_ROWS
  const finalRows = allRows.sort((a, b) => b._qualityScore - a._qualityScore).slice(0, TARGET_ROWS);

  logger.info({ selected: finalRows.length, target: TARGET_ROWS }, 'Selected highest-quality rows');
  const minScore = Math.min(...finalRows.map((r) => r._qualityScore));
  const maxScore = Math.max(...finalRows.map((r) => r._qualityScore));
  logger.info({ minScore, maxScore }, 'Quality score range');

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  logger.info(
    { written: writeResult.writtenCount, outputPath: OUTPUT_PATH, duplicates: writeResult.duplicateCount },
    'Successfully wrote rows to output file'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error('\n✕ Error in main execution:', err.message, err.stack);
    process.exit(1);
  });
}
