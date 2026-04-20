
/**
 * extract_data_europa.js – Final version (includes PDF indicator extraction)
 *
 * Extracts from European Commission (Data Europa) CSV datasets and PDF reports.
 * Generates business‑oriented problem‑solution pairs from:
 *   - French project registry (Pays de la Loire) – after translation
 *   - Eurostat recycling and hazardous waste statistics
 *   - SDG monitoring and ecosystem accounting PDFs (extracted as indicator rows)
 *
 * Features:
 *   • Batch translation (French → English) with caching
 *   • Problem statements framed as business challenges
 *   • Tailored solutions for statistics and indicators
 *   • PDF indicator extraction with theme classification
 *   • CSV writing via `writeCsv` (unquoted header, quoted data – already correct)
 *
 * Usage:
 *   ENABLE_TRANSLATION=true node extract_data_europa.js
 *
 * Input: CSV and PDF files in raw data directory
 * Output: datasets/processed/dataeu_processed.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';
import translate from 'google-translate-api-x';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';


import {
  DATASET_KEYS,
  DATASET_LOOKUP,
  getDatasetProcessedCsvPath,
  getDatasetRawDir,
  verifyPathsExist,
  writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const DATASET_KEY = DATASET_KEYS.dataeu;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(rawDir);
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(rawDir, file),
);
verifyPathsExist(inputFiles);

// Translation toggle
const ENABLE_TRANSLATION = true;
const translationCache = new Map();

// Mapping French domain names to problem templates (for project registry)
const PROBLEM_TEMPLATES = {
  'éducation des citoyens à la consommation responsable': (city) =>
    `Need to raise awareness about responsible consumption among citizens in ${city}.`,
  'boucle alimentaire/biologique': (city) =>
    `Local food system lacks circularity and sustainability in ${city}.`,
  'filières locales de matériaux et filières de valorisation matière': (city) =>
    `Material recovery and local material supply chains need development in ${city}.`,
  "allongement de la durée d'usage (réemploi, réutilisation, réparation)": (city) =>
    `Lack of reuse, repair, and lifespan extension services for products in ${city}.`,
  'écoconception de biens, équipements ou services': (city) =>
    `Need for eco‑design of goods and services to reduce environmental footprint in ${city}.`,
};
const DEFAULT_PROBLEM_TEMPLATE = (city) =>
  `Circular economy challenges need to be addressed in ${city}.`;

// Country code to name mapping (for statistics)
const COUNTRY_NAMES = {
  AL: 'Albania',
  AT: 'Austria',
  BA: 'Bosnia and Herzegovina',
  BE: 'Belgium',
  BG: 'Bulgaria',
  CH: 'Switzerland',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DE: 'Germany',
  DK: 'Denmark',
  EE: 'Estonia',
  EL: 'Greece',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  HR: 'Croatia',
  HU: 'Hungary',
  IE: 'Ireland',
  IS: 'Iceland',
  IT: 'Italy',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  ME: 'Montenegro',
  MK: 'North Macedonia',
  MT: 'Malta',
  NL: 'Netherlands',
  NO: 'Norway',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  RS: 'Serbia',
  SE: 'Sweden',
  SI: 'Slovenia',
  SK: 'Slovakia',
  TR: 'Turkey',
  XK: 'Kosovo',
  EU27_2020: 'European Union (27)',
};

// Theme mapping for PDF indicator extraction
const PDF_THEMES = [
  {
    name: 'ecosystem_extent',
    keywords: ['forest area', 'ecosystem extent', 'land cover', 'built-up', 'urbanisation'],
    solution:
      'Strengthen land‑use planning, protect natural areas, and integrate green infrastructure.',
    materials: 'Land / Ecosystems',
    circular_strategy: 'Land stewardship',
  },
  {
    name: 'ecosystem_condition',
    keywords: [
      'soil erosion',
      'drought',
      'water quality',
      'condition',
      'degradation',
      'phosphorus',
      'nitrogen',
    ],
    solution:
      'Adopt sustainable land management practices, restore degraded areas, and reduce pollution.',
    materials: 'Soil, Water',
    circular_strategy: 'Restoration, Pollution control',
  },
  {
    name: 'biodiversity',
    keywords: ['bird', 'butterfly', 'species', 'protected area', 'conservation', 'habitat'],
    solution:
      'Expand protected areas, restore habitats, and integrate biodiversity into sectoral policies.',
    materials: 'Biodiversity',
    circular_strategy: 'Conservation',
  },
  {
    name: 'climate',
    keywords: ['carbon', 'emissions', 'GHG', 'sequestration', 'climate'],
    solution:
      'Enhance carbon sinks through reforestation, peatland restoration, and climate‑smart agriculture.',
    materials: 'Carbon',
    circular_strategy: 'Climate mitigation',
  },
  {
    name: 'waste',
    keywords: ['waste', 'recycling', 'landfill', 'circular economy'],
    solution:
      'Improve separate collection, invest in recycling infrastructure, and promote circular design.',
    materials: 'Mixed waste',
    circular_strategy: 'Recycle, Recover',
  },
];
const DEFAULT_PDF_THEME = {
  name: 'general',
  solution:
    'Implement evidence‑based policies and investments to address environmental challenges.',
  materials: 'Environmental indicators',
  circular_strategy: 'Policy & monitoring',
};

/**
 * Batch translates an array of French texts to English.
 */
async function translateBatchFrenchToEnglish(texts) {
  if (!ENABLE_TRANSLATION) return texts;

  const toTranslate = texts.filter((t) => t && t.trim());
  if (toTranslate.length === 0) return texts;

  try {
    const results = await translate(toTranslate, {
      from: 'fr',
      to: 'en',
      forceBatch: true,
      client: 'gtx',
    });
    const translated = results.map((r) => r.text);
    toTranslate.forEach((orig, idx) => {
      translationCache.set(orig.trim(), translated[idx]);
    });
    logger.info({ count: translated.length }, 'Translated texts from French to English');
    return translated;
  } catch (err) {
    logger.warn({ error: err.message }, 'Batch translation failed');
    return texts; // fallback to original
  }
}

/**
 * Detect CSV delimiter by looking at first line.
 */
async function detectDelimiter(filePath) {
  const sample = await fs.promises.readFile(filePath, 'utf8').then((text) => text.split('\n')[0]);
  return sample.includes(';') ? ';' : ',';
}

/**
 * Parse CSV with given delimiter.
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

/**
 * Transform rows from French project registry.
 */
async function transformProjectRows(rows) {
  if (rows.length === 0) return [];

  const problems = rows.map((row) => row["Domaine d'action"] || '');
  const solutions = rows.map((row) => row['Description du projet'] || '');

  const [translatedProblems, translatedSolutions] = await Promise.all([
    translateBatchFrenchToEnglish(problems),
    translateBatchFrenchToEnglish(solutions),
  ]);

  const transformed = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const domainFr = row["Domaine d'action"] || '';
    const city = row['﻿Ville'] || row.Ville || 'the region';
    const domainEn = translatedProblems[i] || 'local sustainability challenge';

    // Choose template based on original French domain (more reliable)
    const templateKey =
      Object.keys(PROBLEM_TEMPLATES).find((key) =>
        domainFr.toLowerCase().includes(key.toLowerCase()),
      ) || null;

    let problem;
    if (templateKey) {
      problem = PROBLEM_TEMPLATES[templateKey](city);
    } else {
      problem = DEFAULT_PROBLEM_TEMPLATE(city);
    }

    transformed.push({
      problem,
      solution: translatedSolutions[i] || 'Project description not available.',
      materials: domainEn, // use translated domain as material indicator
      circular_strategy: 'Regional Circular Initiative',
      category: 'Project Registry (France)',
      impact: 'On‑the‑ground implementation of circular practices',
      source_url: row['pages web de la structure'] || '',
      metadata_json: JSON.stringify(row),
    });
  }

  return transformed;
}

/**
 * Transform Eurostat recycling/hazardous waste rows.
 */
function transformStatRows(rows, type) {
  const latestPerGeo = new Map();
  rows.forEach((row) => {
    const geo = row.geo;
    const year = parseInt(row.TIME_PERIOD, 10);
    if (!geo || !row.OBS_VALUE || isNaN(year)) return;
    const existing = latestPerGeo.get(geo);
    if (!existing || year > existing.year) latestPerGeo.set(geo, { row, year });
  });

  const transformed = [];

  for (const { row } of latestPerGeo.values()) {
    const countryCode = row.geo;
    const countryName = COUNTRY_NAMES[countryCode] || countryCode;
    const value = row.OBS_VALUE;
    const year = row.TIME_PERIOD;

    let problem, solution, materials, circularStrategy;

    if (type === 'recycling') {
      problem = `In ${countryName}, only ${value}% of municipal waste is recycled, far below circular economy targets.`;
      solution =
        'Expand separate collection, invest in sorting facilities, and launch public awareness campaigns to boost recycling rates.';
      materials = 'Municipal solid waste';
      circularStrategy = 'Recycle';
    } else {
      // hazardous waste
      problem = `Hazardous waste treatment capacity in ${countryName} is limited (${value}% treated safely), posing environmental and health risks.`;
      solution =
        'Develop specialised treatment infrastructure and enforce strict regulations for hazardous waste management.';
      materials = 'Hazardous substances';
      circularStrategy = 'Safe Treatment';
    }

    transformed.push({
      problem,
      solution,
      materials,
      circular_strategy: circularStrategy,
      category: 'Eurostat Circular Economy Indicators',
      impact: `Current rate: ${value}% (${year})`,
      source_url: 'https://ec.europa.eu/eurostat',
      metadata_json: JSON.stringify(row),
    });
  }

  return transformed;
}

/**
 * Extract text from a PDF (first N pages).
 */
async function extractPDFText(filePath, maxPages = 30) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = Math.min(pdf.numPages, maxPages);
  let fullText = '';
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return fullText;
}

/**
 * Classify a sentence into a theme based on keywords.
 */
function classifyPDFTheme(sentence) {
  const lower = sentence.toLowerCase();
  for (const theme of PDF_THEMES) {
    if (theme.keywords.some((kw) => lower.includes(kw))) {
      return theme;
    }
  }
  return DEFAULT_PDF_THEME;
}

/**
 * Extract statistics from a sentence (percentages, years, etc.).
 */
function extractPDFStats(sentence) {
  const statsRegex =
    /([0-9]+(\.[0-9]+)?\s?(%|billion|million|Gt|tonnes|tons|t\/ha|years?|km2|hectares))/gi;
  return sentence.match(statsRegex) || [];
}

/**
 * Process a PDF and extract indicator‑based rows.
 */
async function processPDFIndicators(filePath, fileName) {
  logger.info({ fileName }, 'Processing PDF for indicators');
  const text = await extractPDFText(filePath, 30);
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 50);

  const rows = [];
  for (const sentence of sentences) {
    const stats = extractPDFStats(sentence);
    if (stats.length === 0) continue;
    // Skip sentences that are obviously not about EU or country data
    if (sentence.includes('Table') || sentence.includes('Figure') || sentence.includes('Source:'))
      continue;

    const theme = classifyPDFTheme(sentence);
    // Build a problem statement
    const firstStat = stats[0];
    const shortSentence = sentence.length > 120 ? sentence.substring(0, 120) + '…' : sentence;
    const problem = `In the EU, ${shortSentence} This poses challenges for meeting environmental targets.`;
    const impact = stats.join(', ');

    rows.push({
      problem,
      solution: theme.solution,
      materials: theme.materials,
      circular_strategy: theme.circular_strategy,
      category: fileName.includes('63329')
        ? 'SDG 15 Monitoring'
        : fileName.includes('643')
          ? 'Ecosystem Accounting'
          : fileName.includes('071')
            ? 'SDG Progress'
            : 'PDF Indicators',
      impact,
      source_url: `file://raw/data_europa/${fileName}`,
      metadata_json: JSON.stringify({
        extracted_stats: stats,
        snippet: sentence.substring(0, 200),
      }),
    });
  }

  return rows;
}

/**
 * Main orchestrator.
 */
async function main() {
  let allRows = [];
  const files = fs.readdirSync(rawDir);

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    logger.info({ file }, 'Processing file');

    if (file.endsWith('.csv')) {
      const delimiter = await detectDelimiter(filePath);
      const rows = parseCSV(filePath, delimiter);
      if (rows.length === 0) continue;

      if (file.includes('cei_wm011')) {
        const statRows = transformStatRows(rows, 'recycling');
        allRows = allRows.concat(statRows);
      } else if (file.includes('sdg_12_41')) {
        const statRows = transformStatRows(rows, 'hazardous');
        allRows = allRows.concat(statRows);
      } else if (file.includes('projets')) {
        // French project registry
        const projectRows = await transformProjectRows(rows);
        allRows = allRows.concat(projectRows);
      } else {
        logger.info('  ⏭️ Skipping unknown CSV');
      }
    } else if (file.endsWith('.pdf')) {
      // Process PDFs for indicator rows
      const pdfRows = await processPDFIndicators(filePath, file);
      allRows = allRows.concat(pdfRows);
    }
  }

  // Deduplicate by problem + solution (simple heuristic)
  const unique = [];
  const seen = new Set();
  for (const row of allRows) {
    const key = row.problem.slice(0, 100) + (row.solution ? row.solution.slice(0, 100) : '');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }

  const finalRows = unique.map((r) => ({
    problem: r.problem || '',
    solution: r.solution || '',
    materials: r.materials || '',
    circular_strategy: r.circular_strategy || '',
    category: r.category || '',
    impact: r.impact || '',
    source_url: r.source_url || '',
    metadata_json: typeof r.metadata_json === 'string' ? r.metadata_json : JSON.stringify(r),
  }));

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  logger.info({ count: finalRows.length }, 'Successfully unified files into high-quality rows');
  logger.info(
    { outputPath: OUTPUT_PATH, written: writeResult.writtenCount, duplicates: writeResult.duplicateCount },
    'Saved to output file'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    logger.error('\nFatal Error during extraction:', err.message);
    process.exit(1);
  });
}
