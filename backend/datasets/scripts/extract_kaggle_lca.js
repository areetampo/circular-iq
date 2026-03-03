/**
 * extract_kaggle_lca.js
 *
 * Extracts life cycle assessment (LCA) data from Kaggle datasets. Processes
 * multi-source LCA data (CSV format) with automatic delimiter detection (comma or semicolon).
 * Identifies key environmental impact indicators and generates insights about
 * product life cycles, material flows, and circular potential.
 *
 * Features:
 *   - Automatic CSV delimiter detection (comma or semicolon)
 *   - UTF-8 BOM handling (removes byte-order marks from headers)
 *   - Flexible column name matching across multiple datasets
 *   - LCA impact category identification (energy, water, emissions, etc.)
 *   - Problem/solution generation based on product life cycle stages
 *   - Row-level sampling for large LCA datasets
 *   - Automatic ID generation with dataset key prefix
 *   - Centralized CSV writing with directory creation and file locking
 *
 * Usage:
 *   node extract_kaggle_lca.js
 *
 * Input: LCA CSV files from Kaggle (various formats with flexible delimiter)
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Sampling: Adjustable target row count (TARGET_ROWS)
 * Scope: Covers product-level LCA data with environmental impact metrics
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetOutputPath,
  writeCsv,
} from '#utils/datasetsUtils.js';
import { fileURLToPath } from 'url';

const DATASET_KEY = DATASET_KEYS.kaggle;
const rawDir = getDatasetRawDir(DATASET_KEY);
const outputFile = getDatasetOutputPath(DATASET_KEY);

// Target total rows
const TARGET_ROWS = 500;

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

// ---------- Efficient random sampler (partial shuffle) ----------
function randomSample(arr, maxSize) {
  if (arr.length <= maxSize) return arr;
  const result = [];
  const n = arr.length;
  // Reservoir sampling: take first maxSize, then randomly replace
  for (let i = 0; i < maxSize; i++) {
    result.push(arr[i]);
  }
  for (let i = maxSize; i < n; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < maxSize) {
      result[j] = arr[i];
    }
  }
  return result;
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
    .map((row) => ({
      problem: cleanText(
        `High carbon footprint of ${row["Company's sector"] || 'product'} ${row['Product name (and functional unit)'] || ''}`.trim(),
      ),
      solution: cleanText(
        row['Product detail'] ||
          row['Product name (and functional unit)'] ||
          'Carbon footprint data',
      ),
      materials: cleanText(row['Product weight (kg)'] ? `${row['Product weight (kg)']} kg` : ''),
      circular_strategy:
        row['*EndOfLife CO2e (fraction of total PCF)'] &&
        parseFloat(row['*EndOfLife CO2e (fraction of total PCF)']) > 0
          ? 'End‑of‑life recycling potential'
          : 'Carbon footprint reduction',
      category: cleanText(
        row["Company's sector"] || row["Company's GICS Industry Group"] || 'General',
      ),
      impact: cleanText(`${row["Product's carbon footprint (PCF, kg CO2e)"]} kg CO₂e`),
      source_url: 'https://www.kaggle.com/datasets/unsdsn/global-carbon-catalogue',
      metadata_json: JSON.stringify(row),
    }));
}

async function handleGLEAM(filePath) {
  const delimiter = await detectDelimiter(filePath);
  const rows = parseCSV(filePath, delimiter);
  return rows
    .filter((row) => row.Region && row['Animal species'])
    .map((row) => ({
      problem: cleanText(
        `Livestock emissions in ${row.Region} (${row['Animal species']}, ${row.Production_system || 'aggregated'})`,
      ),
      solution: cleanText(
        `Commodity: ${row.Commodity || 'mixed'} – emission intensity ${row['Emission Intensity (kg CO2e per kg protein)'] || 'N/A'} kg CO₂e/kg protein`,
      ),
      materials: cleanText(row['Animal species']),
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
    }));
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
    .map((row) => ({
      problem: cleanText(
        parseFloat(row.Sustainability_Score) > 70
          ? `Sustainable product: ${row.Product_Type}`
          : `Unsustainable product: ${row.Product_Type}`,
      ),
      solution: cleanText(
        `Sustainability score ${row.Sustainability_Score} – CO₂: ${row.CO2_Emissions_kg} kg, Waste: ${row.Waste_Generated_kg} kg`,
      ),
      materials: cleanText(`${row.Raw_Material_Usage_kg} kg raw materials`),
      circular_strategy:
        parseFloat(row['Renewable_Energy_%']) > 50 ? 'Renewable energy use' : 'Efficiency measures',
      category: cleanText(row.Product_Type),
      impact: cleanText(`${row.CO2_Emissions_kg} kg CO₂, ${row.Waste_Generated_kg} kg waste`),
      source_url: 'https://www.kaggle.com/datasets/shrutibhatia99/green-supply-chain-dataset',
      metadata_json: JSON.stringify(row),
    }));
}

// ---------- Main ----------
async function main() {
  const dataset = DATASET_LOOKUP[DATASET_KEY];
  // Ensure required file keys exist
  const requiredKeys = ['product_lca', 'livestock', 'supply_chain'];
  for (const key of requiredKeys) {
    if (!dataset.raw_folder_contents?.[key]) {
      console.warn(`⚠️️️  Missing raw_folder_contents.${key} – check dataset definition.`);
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
      console.warn(`⚠️️️  Skipping undefined file.`);
      continue;
    }
    const filePath = path.join(rawDir, file.name);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️️️  File not found: ${filePath} – skipping.`);
      continue;
    }
    console.log(`📄 Processing ${file.name} ...`);
    try {
      const rows = await file.handler(filePath);
      allRows.push(...rows);
      console.log(`   → ${rows.length} high‑quality rows.`);
    } catch (err) {
      console.error(`❌ Error processing ${file.name}:`, err);
    }
  }

  console.log(`\n📊 Total high‑quality rows collected: ${allRows.length}`);

  if (allRows.length === 0) {
    console.log('❌ No data processed. Exiting.');
    return;
  }

  const finalRows = randomSample(allRows, TARGET_ROWS);
  console.log(`🎯 Selected ${finalRows.length} rows (target: ${TARGET_ROWS}).`);

  // Assign sequential IDs
  const rowsWithIds = finalRows.map((row, idx) => ({
    ...row,
    ID: formatId(`${DATASET_KEY}_`, idx + 1),
  }));

  await writeCsv(outputFile, rowsWithIds);
  console.log(`✅ Successfully wrote ${rowsWithIds.length} rows to ${outputFile}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Error in main execution:', err.message);
    process.exit(1);
  });
}
