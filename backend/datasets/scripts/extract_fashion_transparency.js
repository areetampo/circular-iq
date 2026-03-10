/* global process */

/**
 * extract_fashion_transparency.js - Supply chain transparency and environmental accountability extraction
 *
 * Processes data from the Fashion Transparency Index (FTI). Extracts company-level transparency
 * scores, environmental impact assessments, and knowledge assessments from both CSV and PDF sources.
 * Focuses on identifying transparency gaps and circular economy improvement opportunities in the
 * fashion and apparel industry.
 *
 * Features:
 *   • Multi-source data extraction (CSV and PDF)
 *   • PDF text parsing with page-level precision
 *   • Dual scoring systems: Overall transparency index + environmental knowledge assessment
 *   • Company-level aggregation with deduplication
 *   • Configurable row limits and data filtering
 *   • Smart problem/solution generation based on transparency gaps
 *   • Automatic ID generation with dataset key prefix
 *   • Centralized CSV writing with directory creation and file locking
 *
 * Usage:
 *   node extract_fashion_transparency.js
 *
 * Input: Fashion Transparency Index data files (CSV with company scores, PDF with supplementary data)
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Configuration: Max rows limit (MAX_ROWS) and year/scope definitions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.fashion_transparency;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const rawDir = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(rawDir);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(rawDir, file),
);
verifyPathsExist(inputFiles);

const MAX_ROWS = 500;
const YEAR = 2025;

// ---------- Overall score dataset ----------
const scoreDataset = {
  indicator: 'Fashion Transparency Index score',
  materials: 'apparel and footwear',
  circular_strategy: 'supply chain transparency',
  category: 'Fashion industry transparency',
  unit: '%',
  short: 'transparency',
  source_url: 'https://wikirate.org/Fashion_Revolution+Fashion_Transparency_Index_2025',
};

// ---------- Granular indicators (without the "Fashion Revolution+" prefix) ----------
const relevantMetrics = [
  'Decarbonisation Commitment',
  'Target to phase-out combustion of coal on-site at finished garment manufacturing factories',
  'Target to phase-out combustion of coal on-site at material processing/manufacturing facilities',
  'Renewable Energy Target (Supply Chain)',
  'Renewable Electricity Target (Supply Chain)',
  'Discloses manufacturing facilities (specific location)',
  'Discloses processing facilities (specific location)',
  'Just Transition Commitment',
  'Percentage of Executive Pay Linked to Carbon Reduction',
  'Supplier Incentives to Improve Environmental Impacts',
  'Annual carbon footprint or GHG emissions in Scopes 1&2',
  'Annual value chain/scope 3 carbon footprint',
];

// Helper to strip the "Fashion Revolution+" prefix if present
function stripMetricPrefix(metric) {
  return metric.replace(/^Fashion Revolution\+/, '').trim();
}

// ---------- Helper: parse CSV with csv-parse ----------
function parseCSVFile(filePath, expectedColumns, options = {}) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content
    .split('\n')
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n');

  try {
    const records = parse(lines, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: options.relax_column_count || false,
    });
    return records.filter((row) => expectedColumns.every((col) => col in row));
  } catch (err) {
    console.warn(`Warning: Could not parse ${filePath}: ${err.message}`);
    return [];
  }
}

// ---------- Parse overall score CSV ----------
function parseScoreCSV(filePath) {
  const rows = parseCSVFile(filePath, ['Company', 'Year', 'Value']);
  return rows
    .map((row) => ({
      company: row.Company,
      year: parseInt(row.Year),
      value: parseFloat(row.Value),
    }))
    .filter((r) => !isNaN(r.year) && !isNaN(r.value));
}

// ---------- Parse granular indicator CSV ----------
function parseInputCSV(filePath) {
  const rows = parseCSVFile(filePath, ['Metric', 'Company', 'Year', 'Value']);
  const matched = rows.filter((row) => {
    const metric = stripMetricPrefix(row.Metric);
    return relevantMetrics.includes(metric) && ['Yes', 'No'].includes(row.Value);
  });
  console.log(`  Raw granular rows: ${rows.length}, matched: ${matched.length}`);
  return matched
    .map((row) => ({
      metric: stripMetricPrefix(row.Metric),
      company: row.Company,
      year: parseInt(row.Year),
      value: row.Value,
    }))
    .filter((r) => !isNaN(r.year));
}

// ---------- PDF extraction (unchanged) ----------
async function extractPDFText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const loadingTask = pdfjs.getDocument({ data: Uint8Array.from(dataBuffer) });
  const pdfDocument = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

async function extractPDFInsights(filePath) {
  const text = await extractPDFText(filePath);
  const insights = [];

  function extractListAfterHeading(heading, maxLines = 30) {
    const idx = text.indexOf(heading);
    if (idx === -1) return [];
    const after = text.slice(idx + heading.length);
    const lines = after.split('\n').slice(0, maxLines);
    const brands = [];
    for (const line of lines) {
      if (line.includes('BRAND') || line.includes('SCORING') || line.includes('RESULTS')) break;
      const parts = line
        .split(/\s{2,}|,/)
        .map((s) => s.trim())
        .filter((s) => s && s.length > 1);
      brands.push(...parts);
    }
    return brands;
  }

  // Zero traceability (page 35)
  const zeroTrace = extractListAfterHeading('BRANDS SCORING ZERO IN THE TRACEABILITY SECTION');
  zeroTrace.forEach((brand) => {
    insights.push({
      type: 'zero_traceability',
      brand,
      problem: `${brand} scores zero in the traceability section, indicating no public disclosure of supplier lists.`,
      impact: '0% (Traceability)',
    });
  });

  // Zero decarbonisation (page 68)
  const zeroDecarb = extractListAfterHeading('BRANDS SCORING ZERO IN THE DECARBONISATION SECTION');
  zeroDecarb.forEach((brand) => {
    insights.push({
      type: 'zero_decarbonisation',
      brand,
      problem: `${brand} scores zero in the decarbonisation section, meaning no public disclosure of emissions, targets, or clean heat strategies.`,
      impact: '0% (Decarbonisation)',
    });
  });

  // Highest scoring (page 22)
  const highestSection = text.indexOf('HIGHEST SCORING BRANDS');
  if (highestSection !== -1) {
    const after = text.slice(
      highestSection + 'HIGHEST SCORING BRANDS'.length,
      highestSection + 500,
    );
    const lines = after.split('\n').slice(0, 10);
    for (const line of lines) {
      const match = line.match(/([A-Za-z][A-Za-z\s&]+?)\s+(\d{1,3})%/);
      if (match) {
        insights.push({
          type: 'highest_scoring',
          brand: match[1].trim(),
          problem: `${match[1].trim()} is among the highest‑scoring brands in the What Fuels Fashion? 2025 report.`,
          impact: `${match[2]}% (Overall)`,
        });
      }
    }
  }

  // Lowest scoring (page 22)
  const lowestSection = text.indexOf('LOWEST SCORING BRANDS');
  if (lowestSection !== -1) {
    const after = text.slice(lowestSection + 'LOWEST SCORING BRANDS'.length, lowestSection + 500);
    const lines = after.split('\n').slice(0, 20);
    for (const line of lines) {
      const match = line.match(/([A-Za-z][A-Za-z\s&]+?)\s+(\d{1,3})%/);
      if (match) {
        insights.push({
          type: 'lowest_scoring',
          brand: match[1].trim(),
          problem: `${match[1].trim()} is among the lowest‑scoring brands in the What Fuels Fashion? 2025 report.`,
          impact: `${match[2]}% (Overall)`,
        });
      }
    }
  }

  const seen = new Set();
  return insights.filter((i) => {
    if (seen.has(i.brand)) return false;
    seen.add(i.brand);
    return true;
  });
}

// ---------- Main ----------
async function main() {
  // <-- fixed duplicate async
  if (!fs.existsSync(rawDir)) {
    console.error(`❌ Raw folder not found: ${rawDir}`);
    process.exit(1);
  }

  // ---- 1. Overall scores ----
  const scoreFile = dataset.raw_folder_contents.scoreFile;
  const scorePath = path.join(rawDir, scoreFile);
  let scoreRows = [];
  if (fs.existsSync(scorePath)) {
    console.log(`Reading overall scores from ${scoreFile}`);
    scoreRows = parseScoreCSV(scorePath);
    console.log(`  Found ${scoreRows.length} rows.`);
  } else {
    console.warn(`Score file not found: ${scorePath}`);
  }

  // ---- 2. Granular indicators ----
  const inputFile = dataset.raw_folder_contents.inputFile;
  const inputPath = path.join(rawDir, inputFile);
  let inputRows = [];
  if (fs.existsSync(inputPath)) {
    console.log(`Reading granular indicators from ${inputFile}`);
    inputRows = parseInputCSV(inputPath);
    console.log(`  Found ${inputRows.length} relevant granular indicator records.`);
  } else {
    console.warn(`Granular file not found, skipping.`);
  }

  // ---- 3. PDF insights ----
  const pdfFile = dataset.raw_folder_contents.what_fuels_fashion_report;
  const pdfPath = path.join(rawDir, pdfFile);
  let pdfInsights = [];
  if (fs.existsSync(pdfPath)) {
    console.log(`Extracting insights from PDF...`);
    try {
      pdfInsights = await extractPDFInsights(pdfPath);
      console.log(`  Found ${pdfInsights.length} PDF insights.`);
    } catch (err) {
      console.error(`  Error extracting PDF: ${err.message}`);
    }
  } else {
    console.warn(`PDF file not found, skipping.`);
  }

  // ---- 4. Build output rows (without custom IDs) ----
  const allOutputRows = [];

  // 4a. Overall score rows
  for (const r of scoreRows) {
    const scorePercent = (r.value * 10).toFixed(1);
    const impact = `${scorePercent}%`;

    let problem = `${r.company} scored ${impact} in the Fashion Transparency Index ${r.year}. `;
    if (scorePercent >= 70) {
      problem += 'This brand demonstrates strong transparency practices.';
    } else if (scorePercent >= 40) {
      problem += 'This brand shows moderate transparency but has significant room for improvement.';
    } else if (scorePercent >= 10) {
      problem += 'This brand has very limited transparency.';
    } else {
      problem += 'This brand provides virtually no transparency about its supply chain.';
    }

    const solution =
      'Increase supply chain transparency by publishing tier 1–3 supplier lists, disclosing audit results, reporting on decarbonisation efforts (coal phase‑out, electrification, renewable energy targets), and adopting a Just Transition framework with worker engagement.';

    allOutputRows.push({
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: scoreDataset.materials,
      circular_strategy: scoreDataset.circular_strategy,
      category: scoreDataset.category,
      impact: cleanText(impact),
      source_url: scoreDataset.source_url,
      metadata_json: JSON.stringify({
        brand: r.company,
        year: r.year,
        raw_value: r.value,
        score_percent: parseFloat(scorePercent),
        unit: scoreDataset.unit,
        dataset_type: 'overall_score',
        source: 'Fashion Revolution / Wikirate',
      }),
    });
  }

  // 4b. Granular indicator rows
  for (const r of inputRows) {
    const brand = r.company;
    const year = r.year;
    const disclosed = r.value === 'Yes';

    const problem = disclosed
      ? `${brand} discloses information on "${r.metric}" in ${year}.`
      : `${brand} does NOT disclose information on "${r.metric}" in ${year}.`;

    const impact = disclosed ? 'Disclosed' : 'Not disclosed';
    const solution =
      'Improve transparency by publicly disclosing this metric in line with industry best practices and regulatory expectations.';

    allOutputRows.push({
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials: 'apparel and footwear',
      circular_strategy: 'supply chain transparency',
      category: 'Fashion industry transparency',
      impact: cleanText(impact),
      source_url: 'https://wikirate.org/Fashion_Revolution+Fashion_Transparency_Index_2025',
      metadata_json: JSON.stringify({
        brand,
        year,
        metric: r.metric,
        value: r.value,
        dataset_type: 'granular_indicator',
        source: 'Fashion Revolution / Wikirate',
      }),
    });
  }

  // 4c. PDF insight rows
  for (const insight of pdfInsights) {
    allOutputRows.push({
      problem: cleanText(insight.problem),
      solution: 'Refer to the What Fuels Fashion? report for full details and recommended actions.',
      materials: 'apparel and footwear',
      circular_strategy: 'supply chain transparency',
      category: 'Fashion industry transparency',
      impact: cleanText(insight.impact),
      source_url: 'https://fashionrevolution.org/what-fuels-fashion/',
      metadata_json: JSON.stringify({
        brand: insight.brand,
        year: YEAR,
        insight_type: insight.type,
        source: 'What Fuels Fashion? report 2025',
      }),
    });
  }

  // ---- 5. Sort and limit ----
  allOutputRows.sort((a, b) => {
    // Safely parse metadata
    let aMeta, bMeta;
    try {
      aMeta = JSON.parse(a.metadata_json);
      bMeta = JSON.parse(b.metadata_json);
    } catch {
      return 0;
    }
    const aType = aMeta.dataset_type || aMeta.insight_type || '';
    const bType = bMeta.dataset_type || bMeta.insight_type || '';
    if (aType === 'overall_score' && bType !== 'overall_score') return -1;
    if (aType !== 'overall_score' && bType === 'overall_score') return 1;
    if (aType === 'granular_indicator' && bType !== 'granular_indicator') return -1;
    if (aType !== 'granular_indicator' && bType === 'granular_indicator') return 1;
    return 0;
  });

  const finalRows = allOutputRows.slice(0, MAX_ROWS);
  console.log(`Selected ${finalRows.length} rows for output (limit: ${MAX_ROWS}).`);

  // ---- 6. Write CSV ----
  await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  console.log(`✅ ${finalRows.length} rows Written to ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
