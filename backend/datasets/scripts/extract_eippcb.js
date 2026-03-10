/* global process */

/**
 * extract_eippcb.js - Hybrid extraction for EIPPCB BAT Conclusions and BREFs
 *
 * Filters for the top 300 highest-quality rows based on quantified impacts.
 *
 * Usage:
 *   node extract_eippcb.js
 *
 * Input: multiple PDF files specified in dataset.raw_folder_contents
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  DATASET_KEYS,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';

const require = createRequire(import.meta.url);
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.eippcb;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(RAW_DIR, file),
);
verifyPathsExist(inputFiles);

const LIMIT_ROWS = 300; // Filter to top 300

/**
 * Build PDF_METADATA dynamically from dataset configuration
 */
function buildPdfMetadata() {
  const metadata = [];
  const urlsMap = dataset.urls || {};
  const filesMap = dataset.raw_folder_contents || {};

  // Map from file key to urls key (they should correspond)
  const keyMapping = {
    iron_and_steel_production_2012: 'iron_and_steel',
    manufacture_of_glass_2012: 'glass',
    non_ferrous_metals_industries_2016: 'non_ferrous_metals',
    production_of_cement_lime_and_magnesium_oxide_2013: 'cement_lime_mgo',
    production_of_pulp_paper_and_board_2014: 'pulp_paper_board',
    textiles_industry_2022: 'textiles',
    waste_treatment_2018: 'waste_treatment',
    ceramic_manufacturing_bref_2007: 'ceramic_manufacturing',
    surface_treatment_bref_2006: 'surface_treatment',
  };

  for (const [fileKey, relPath] of Object.entries(filesMap)) {
    const urlKey = keyMapping[fileKey];
    const urlData = urlsMap[urlKey] || {};
    metadata.push({
      relPath,
      sector: urlData.sector || 'Unknown Sector',
      type: urlData.type || 'Unknown Type',
      sourceUrl: urlData.sourceUrl || '',
    });
  }

  return metadata;
}

const PDF_METADATA = buildPdfMetadata();

/**
 * Quality Scorer: Prioritizes rows with quantified emission levels and rich descriptions.
 */
function calculateQualityScore(row) {
  let score = 0;

  // Give a huge boost to rows with actual numbers and units
  if (row.impact.includes('BAT-AEL:')) score += 100;
  score += Math.min(row.solution.length / 10, 50);
  return score;
}

async function extractTextFromPdf(pdfPath) {
  const dataBuffer = await fs.promises.readFile(pdfPath);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(dataBuffer),
    useSystemFonts: true,
  });
  const pdfDocument = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(' ') + ' ';
  }
  return fullText.replace(/\s+/g, ' '); // Normalize spaces
}

async function processFile(meta) {
  const fullPath = path.join(RAW_DIR, meta.relPath);
  if (!fs.existsSync(fullPath)) return [];

  const text = await extractTextFromPdf(fullPath);
  const results = [];

  // Pattern: Finds "BAT X." or "X. BAT"
  const batRegex = /(?:BAT\s+(\d+)\.|(\d+)\.\s+BAT)/gi;
  let match;
  let matches = [];

  while ((match = batRegex.exec(text)) !== null) {
    matches.push({ num: match[1] || match[2], index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = matches[i + 1] ? matches[i + 1].index : text.length;

    const rawSection = text.substring(start, end).trim();

    // 1. Better Solution Truncation (End at a full sentence)
    let solutionText = rawSection.substring(0, 1000);
    const lastPeriod = solutionText.lastIndexOf('.');
    if (lastPeriod > 200) solutionText = solutionText.substring(0, lastPeriod + 1);

    // 2. Intelligent Strategy Mapping
    let strategy = 'Pollution Prevention';
    if (/recycl|reuse|re-use|recovery/i.test(solutionText)) {
      strategy = 'Resource Recovery';
    } else if (/efficiency|reduction|minimise/i.test(solutionText)) {
      strategy = 'Resource Efficiency';
    }

    // 3. Robust Impact Extraction: Prioritize standard units, avoid reference levels
    const impactMatch = rawSection.match(
      /(?:<|≤|to)\s*(\d+(?:\.\d+)?\s*(?:mg\/Nm³|g\/t|kg\/h|mg\/l|kg\/ADt|g\/Nm³))/i,
    );

    const impact = impactMatch
      ? `BAT-AEL: ${impactMatch[1]}` // Use capture group to get just the value
      : 'Targeted reduction of industrial emissions per EU compliance standards.';

    const row = {
      problem: cleanText(
        `Environmental impact and resource inefficiency in ${meta.sector} production processes.`,
      ),
      solution: cleanText(solutionText),
      materials: meta.sector.split(',')[0].trim(),
      circular_strategy: strategy,
      category: meta.sector,
      impact: cleanText(impact),
      source_url: meta.sourceUrl,
      metadata_json: JSON.stringify({
        source: meta.relPath,
        bat_index: matches[i].num,
        type: meta.type,
      }),
    };

    results.push({ ...row, _score: calculateQualityScore(row) });
  }
  return results;
}

async function main() {
  let allScoredRows = [];

  for (const meta of PDF_METADATA) {
    console.log(`Extracting: ${meta.sector}...`);
    const rows = await processFile(meta);
    console.log(`  → ${rows.length} rows.`);
    allScoredRows.push(...rows);
  }

  // Filter: Sort by score and take top 300
  const finalRows = allScoredRows
    .sort((a, b) => b._score - a._score)
    .slice(0, LIMIT_ROWS)
    .map((row) => {
      const { _score, ...cleanRow } = row;
      return cleanRow;
    });

  await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  console.log(
    `✅ Extraction Complete. Processed ${allScoredRows.length} total, saved top ${finalRows.length} high-quality rows.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Error during extraction:', err);
    process.exit(1);
  });
}
