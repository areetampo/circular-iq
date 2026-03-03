/**
 * extract_data_europa.js
 *
 * Extracts sustainability and environmental policy data from European Commission
 * (Data Europa) PDF reports. Promotes EU-wide environmental data and SDG indicators.
 * Processes high-level policy context and ecosystem accounting frameworks
 * from European Union data repositories.
 *
 * Features:
 *   - PDF text extraction with page limits (max 20 pages)
 *   - Semantic chunking based on paragraph breaks (>300 chars)
 *   - Batch translation from French to English with caching and fallback
 *   - Google Translate API integration with error resilience
 *   - CSV parsing support for multi-format data sources
 *   - Centralized CSV writing with metadata preservation
 *   - Configurable translation toggle for testing
 *
 * Usage:
 *   ENABLE_TRANSLATION=true node extract_data_europa.js     # with translation
 *   ENABLE_TRANSLATION=false node extract_data_europa.js    # skip translation
 *
 * Input: PDF and CSV files from raw data directory
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Requires: Google Translate API access (for batch translation)
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import translate from 'google-translate-api-x';
import {
  formatId,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetOutputPath,
  writeCsv,
} from '#utils/datasetsUtils.js';
import { fileURLToPath } from 'url';

const DATASET_KEY = DATASET_KEYS.dataeu;
const rawDir = getDatasetRawDir(DATASET_KEY);
const outputFile = getDatasetOutputPath(DATASET_KEY);

// Translation toggle – set to false to skip translation (useful for testing)
const ENABLE_TRANSLATION = true;
const translationCache = new Map();

/**
 * Batch translates an array of French texts to English.
 * Uses caching and falls back to original text on failure.
 */
async function translateBatchFrenchToEnglish(texts) {
  if (!ENABLE_TRANSLATION) return texts;

  const toTranslate = texts.filter((t) => t && t.trim());
  if (toTranslate.length === 0) return texts;

  try {
    const results = await translate(toTranslate, {
      from: 'fr',
      to: 'en',
      forceBatch: true, // use batch endpoint for efficiency
      client: 'gtx', // helps avoid 403 errors
    });
    // Map results and cache them
    const translated = results.map((r) => r.text);
    toTranslate.forEach((orig, idx) => {
      translationCache.set(orig.trim(), translated[idx]);
    });
    return translated;
  } catch (err) {
    console.warn(`Batch translation failed: ${err.message}`);
    return texts; // fallback to original
  }
}

/**
 * PDF Processing – extracts semantic text from high-level reports.
 */
async function processPDF(filePath, fileName) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';
  const pageLimit = Math.min(pdfDoc.numPages, 20);

  for (let i = 1; i <= pageLimit; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  const chunks = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 300);

  return chunks.slice(0, 20).map((text) => ({
    problem: `Foundational Context: Sustainability and Ecosystem challenges from ${fileName}`,
    solution: text.substring(0, 450).replace(/\s+/g, ' ').trim() + '...',
    materials: 'Environmental Indicators / Policy',
    circular_strategy: 'Scientific & Statistical Framework',
    category: fileName.includes('643') ? 'Ecosystem Accounting' : 'SDG Monitoring',
    impact: 'Established EU/International baseline for measuring environmental progress',
    source_url: `file://raw/data_europa/${fileName}`,
    metadata_json: JSON.stringify({ source: fileName, total_pages: pdfDoc.numPages }),
  }));
}

/**
 * CSV Processing
 */
function parseCSV(filePath, delimiter = ';') {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter,
    relax_column_count: true,
    relax_quotes: true,
  });
}

async function detectDelimiter(filePath) {
  const sample = await fs.promises.readFile(filePath, 'utf8').then((text) => text.split('\n')[0]);
  return sample.includes(';') ? ';' : ',';
}

async function transformCSVRows(rows, type) {
  const transformed = [];

  if (type === 'recycling' || type === 'hazardous') {
    const latestPerGeo = new Map();
    rows.forEach((row) => {
      const geo = row.geo;
      const year = parseInt(row.TIME_PERIOD, 10);
      if (!geo || !row.OBS_VALUE || isNaN(year)) return; // guard missing geo
      const existing = latestPerGeo.get(geo);
      if (!existing || year > existing.year) latestPerGeo.set(geo, { row, year });
    });

    for (const { row } of latestPerGeo.values()) {
      transformed.push({
        problem: type === 'recycling' ? 'Municipal waste recovery' : 'Hazardous waste management',
        solution: `In ${row.geo}, the ${type} efficiency rate was recorded at ${row.OBS_VALUE}% (${row.TIME_PERIOD}).`,
        materials: type === 'recycling' ? 'Municipal solid waste' : 'Hazardous substances',
        circular_strategy: type === 'recycling' ? 'Material Recovery' : 'Safe Treatment',
        category: 'Eurostat Circular Economy Indicators',
        impact: `Current Rate: ${row.OBS_VALUE}%`,
        source_url: 'https://ec.europa.eu/eurostat',
        metadata_json: JSON.stringify(row),
      });
    }
  } else if (type === 'projects') {
    // Collect rows that have a project description
    const rowsToTranslate = rows.filter((row) => row['Description du projet']);

    if (rowsToTranslate.length > 0) {
      const problems = rowsToTranslate.map((row) => row["Domaine d'action"] || '');
      const solutions = rowsToTranslate.map((row) => row['Description du projet']);

      // Batch translate all problems and solutions in parallel
      const [translatedProblems, translatedSolutions] = await Promise.all([
        translateBatchFrenchToEnglish(problems),
        translateBatchFrenchToEnglish(solutions),
      ]);

      // Build transformed rows
      for (let i = 0; i < rowsToTranslate.length; i++) {
        const row = rowsToTranslate[i];
        transformed.push({
          problem: translatedProblems[i] || 'Localized sustainability challenge',
          solution: translatedSolutions[i],
          materials: translatedProblems[i], // reuse translated problem
          circular_strategy: 'Regional Circular Initiative',
          category: 'Project Registry (France)',
          impact: 'On-the-ground implementation of circular practices',
          source_url: row['pages web de la structure'] || '',
          metadata_json: JSON.stringify(row),
        });
      }
    }
  }

  return transformed;
}

/**
 * Main Orchestrator
 */
async function main() {
  let allRows = [];
  const files = fs.readdirSync(rawDir);

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    console.log(`📂 Processing: ${file}`);

    if (file.endsWith('.csv')) {
      const type = file.includes('cei_wm011')
        ? 'recycling'
        : file.includes('sdg_12_41')
          ? 'hazardous'
          : 'projects';
      const delimiter = await detectDelimiter(filePath);
      const rows = parseCSV(filePath, delimiter);
      const transformed = await transformCSVRows(rows, type);
      allRows = allRows.concat(transformed);
    } else if (file.endsWith('.pdf')) {
      const pdfRows = await processPDF(filePath, file);
      allRows = allRows.concat(pdfRows);
    }
  }

  const finalRows = allRows.map((r, idx) => ({
    ID: formatId(DATASET_KEY + '_', idx + 1),
    problem: r.problem || '',
    solution: r.solution || '',
    materials: r.materials || '',
    circular_strategy: r.circular_strategy || '',
    category: r.category || '',
    impact: r.impact || '',
    source_url: r.source_url || r.sourceUrl || '',
    metadata_json: typeof r.metadata_json === 'string' ? r.metadata_json : JSON.stringify(r),
  }));

  await writeCsv(outputFile, finalRows);
  console.log(`\n✨ Successfully unified files into ${finalRows.length} high-quality rows.`);
  console.log(`📁 Saved to: ${outputFile}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal Error during extraction:', err.message);
    process.exit(1);
  });
}
