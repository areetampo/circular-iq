/**
 * extract_cgr_2025.js - Circularity Gap Report 2025 Insights
 *
 * Extracts insights and statistics from the Circularity Gap Report (CGR) 2025 PDF.
 * The CGR provides comprehensive global analysis of material flows and circular economy
 * implementation rates. Extracts sentences with quantified statistics and metadata.
 *
 * Features:
 *   • PDF text extraction using pdfjs-dist with UTF-8 character handling
 *   • Statistical pattern matching (percentages, tonnage, consumption rates)
 *   • Sentence-level segmentation with length filtering (120-600 chars)
 *   • Automatic ID generation with dataset key prefix
 *   • Centralized CSV writing with file management
 *   • Structured metadata capture with extracted statistics
 *
 * Usage:
 *   node extract_cgr_2025.js
 *
 * Input: PDF file in datasets/raw/circularity_gap_report/
 * Output: CSV with standardized columns in datasets/processed/
 */

/* global process */

import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  formatId,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
} from '#utils/datasetsUtils.js';

// =============================================================================
// DATASET INITIALIZATION
// =============================================================================

const DATASET_KEY = DATASET_KEYS.cgr;
const dataset = DATASET_LOOKUP[DATASET_KEY];

// Validate raw folder contains required input file
const rawFiles = dataset.raw_folder_contents || {};
const input_file = rawFiles.input_file;
if (!input_file) {
  throw new Error(`No input file defined in raw_folder_contents for dataset ${DATASET_KEY}`);
}

const inputFile = path.join(getDatasetRawDir(DATASET_KEY), input_file);
if (!fs.existsSync(path.dirname(inputFile))) {
  console.error(
    `❌ Raw directory missing for dataset key "${DATASET_KEY}": ${path.dirname(inputFile)}`,
  );
  process.exit(1);
}
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Input file not found: ${inputFile}`);
  process.exit(1);
}

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Normalize text by removing extra whitespace and trimming.
 * NOTE: This local variant is used instead of datasetsUtils.cleanText() as it
 * has different requirements for this PDF extraction (removes hyphens).
 *
 * @param {string} text - Raw text to clean
 * @returns {string} Cleaned text with normalized whitespace
 */
function cleanText(text) {
  return text.replace(/\s+/g, ' ').replace(/-\s+/g, '').trim();
}

/**
 * Extract quantified statistics from text using regex pattern matching.
 * Matches common environmental metrics: percentages, tonnage, consumption units.
 * @param {string} text - Text containing potential statistics
 * @returns {Array<string>} Array of extracted statistics (empty if none found)
 */
function extractStats(text) {
  const statsRegex = /([0-9]+(\.[0-9]+)?\s?(%|billion|million|Gt|tonnes|tons|t\/capita))/gi;
  return text.match(statsRegex) || [];
}

/**
 * Extract full text content from PDF file using pdfjs-dist.
 * Processes all pages and concatenates text with newline separators.
 * @async
 * @returns {Promise<string>} Concatenated and cleaned text from all PDF pages
 * @throws {Error} If PDF loading or text extraction fails
 */
async function extractPDFText() {
  const data = new Uint8Array(await fs.readFile(inputFile));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  console.log(`PDF loaded. Pages: ${pdf.numPages}`);

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(' ') + '\n';
  }

  return cleanText(fullText);
}

/**
 * Generate structured insights from extracted PDF text.
 * Splits text into sentences, filters by length, and extracts sentences
 * containing quantified statistics. Each insight includes the sentence as
 * the problem statement and extracted statistics in the impact field.
 * @param {string} text - Full cleaned text from PDF
 * @returns {Array<Object>} Array of insight objects with problem, solution, impact, etc.
 */
function generateInsights(text) {
  const insights = [];

  const sentences = text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 120);

  for (const sentence of sentences) {
    const stats = extractStats(sentence);

    if (stats.length > 0 && sentence.length < 600) {
      insights.push({
        problem: sentence,
        solution:
          'Accelerate systemic circular economy transformation through material reduction, regeneration, reuse, and policy-driven structural change.',
        materials: 'Global material flows',
        circular_strategy: 'Systemic Circular Transition',
        category: 'Circularity Gap Report 2025',
        impact: stats.join(', '),
        source_url: dataset.source_url,
        metadata_json: JSON.stringify({
          extracted_stats: stats,
        }),
      });
    }
  }

  // return insights.slice(0, 100); // cap to 100 high-quality rows
  return insights;
}

async function main() {
  const text = await extractPDFText();

  const insights = generateInsights(text);

  console.log(`Extracted ${insights.length} structured insights`);

  // Assign IDs with proper formatting
  const finalRows = insights.map((row, index) => ({
    ID: formatId(DATASET_KEY, index + 1),
    ...row,
  }));

  // use centralized helper which handles directory creation, clearing on the
  // first write and read-only locking after the file is written
  await writeCsv(OUTPUT_PATH, finalRows);
  console.log(`Wrote ${finalRows.length} rows to ${OUTPUT_PATH}`);
}

// only run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
