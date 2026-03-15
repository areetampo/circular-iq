
/**
 * extract_eulac_case_studies.js - EU-LAC circular economy case studies extraction
 *
 * EU-LAC (Europe-Latin America-Caribbean) circular economy best practice case studies extraction
 * from a structured PDF document. Each case study covers a company implementing circular economy
 * strategies with detailed information on background, context, motivation, objectives,
 * implementation steps, and social/environmental contributions.
 *
 * Features:
 *   • PDF text extraction with UTF-8 support
 *   • Structured field-based parsing using pre-defined case boundaries and field headers
 *   • Case-insensitive field detection with regex pattern matching
 *   • Automatic text normalization (whitespace, special character handling)
 *   • Per-case metadata preservation (case ID, name, website)
 *   • Automatic ID generation with dataset key prefix
 *   • Centralized CSV writing with directory creation and file locking
 *
 * Usage:
 *   node extract_eulac_case_studies.js
 *
 * Input: EU-LAC case study PDF with structured company/field layout
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Note: Case page ranges and metadata defined in CASE_RANGES array
 * Configuration: Field headers defined in FIELD_HEADERS array for parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  cleanText,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';

const DATASET_KEY = DATASET_KEYS.eulac;
const RAW_PDF = path.join(getDatasetRawDir(DATASET_KEY), 'eulac_case_studies.pdf');
verifyPathsExist(RAW_PDF);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// Known field headers (used as stop markers)
const FIELD_HEADERS = [
  'YEAR',
  'COMPANY NAME',
  'ECONOMIC ACTIVITY',
  'COUNTRIES OF OPERATION',
  'NUMBER OF EMPLOYEES',
  'COMPANY WEBSITE',
  'BEST PRACTICE WEBSITE',
  'CONTACT PERSON DATA',
  'BACKGROUND',
  'CONTEXT',
  'MOTIVATION',
  'OBJECTIVES',
  'STEP BY STEP',
  'CONTRIBUTION',
  'SOCIAL',
];

// Build a regex pattern that matches any of the headers as whole words at line start (case‑insensitive)
const HEADER_PATTERN = FIELD_HEADERS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

const CASE_RANGES = [
  { id: 1, start: 36, end: 43, name: 'Ananas Anam', url: 'https://www.ananas-anam.com/' },
  {
    id: 2,
    start: 44,
    end: 55,
    name: 'Better Future Factory',
    url: 'https://www.betterfuturefactory.com/',
  },
  { id: 3, start: 56, end: 63, name: 'Closing the Loop', url: 'http://closingtheloop.eu' },
  { id: 4, start: 64, end: 71, name: 'Donar', url: 'http://www.donar.si/' },
  { id: 5, start: 72, end: 81, name: 'LATU', url: 'https://www.latu.org.uy/' },
  { id: 6, start: 82, end: 91, name: 'Neptuno Pumps', url: 'http://www.neptunopumps.com/' },
  { id: 7, start: 92, end: 103, name: 'Pulpo SA', url: 'http://www.pulpak.com.ar/' },
];

// ========== HELPER FUNCTIONS ==========

/**
 * Extract text from a range of pages.
 */
async function extractPagesText(filePath, startPage, endPage) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
  let fullText = '';
  for (let i = startPage; i <= Math.min(endPage, pdfDoc.numPages); i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return cleanText(fullText);
}

/**
 * Extract a field value that may span multiple lines, stopping at the next known header.
 */
function extractField(text, fieldName) {
  // Escape fieldName for regex
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Create a regex that captures everything from the field name until either:
  //   - a newline followed by any of the known headers (at start of line)
  //   - or end of string
  const regex = new RegExp(
    `${escaped}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${HEADER_PATTERN})|$)`,
    'i',
  );
  const match = text.match(regex);
  if (!match) return '';
  let value = match[1].trim();
  // Remove trailing ":" or "‑" if they are the last characters (sometimes artifacts)
  value = value.replace(/[:\-–—]\s*$/, '').trim();
  return value;
}

/**
 * Extract a section (e.g., BACKGROUND, OBJECTIVES) that may contain multiple paragraphs.
 */
function extractSection(text, sectionNames) {
  const namesPattern = sectionNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(
    `(?:${namesPattern})\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${HEADER_PATTERN})|$)`,
    'i',
  );
  const match = text.match(regex);
  return match ? cleanText(match[1]) : '';
}

/**
 * Extract a problem sentence from BACKGROUND / CONTEXT.
 */
function extractProblem(text) {
  const background = extractSection(text, ['BACKGROUND', 'CONTEXT']);
  if (!background) return '';
  const sentences = background.match(/[^.!?]+[.!?]+/g) || [];
  const problemSentence = sentences.find((s) =>
    /\b(waste|environmental|problem|issue|challenge|pollution|saturation|landfill|tons?|million|billion)\b/i.test(
      s,
    ),
  );
  if (problemSentence) return problemSentence.trim();
  return sentences.slice(0, 2).join(' ').trim();
}

/**
 * Extract a solution sentence from OBJECTIVES / MOTIVATION / STEP BY STEP.
 */
function extractSolution(text) {
  const objectives = extractSection(text, ['OBJECTIVES', 'MOTIVATION', 'STEP BY STEP']);
  if (!objectives) return '';
  const sentences = objectives.match(/[^.!?]+[.!?]+/g) || [];
  const productNames = [
    'Piñatex',
    'NicoLess',
    'Perpetual Plastic',
    'Refil',
    'New Marble',
    'Pulpo',
    'Ecopulpo',
    'Pulpak',
  ];
  const productSentence = sentences.find((s) => productNames.some((name) => s.includes(name)));
  if (productSentence) return productSentence.trim();
  const devSentence = sentences.find((s) =>
    /\b(developed|created|implemented|designed|produces|transforms)\b/i.test(s),
  );
  if (devSentence) return devSentence.trim();
  return sentences[0] || '';
}

/**
 * Detect circular strategy from text keywords.
 */
function detectCircularStrategy(text) {
  const t = text.toLowerCase();
  if (t.includes('remanufactur')) return 'Remanufacturing';
  if (t.includes('bio') && (t.includes('waste') || t.includes('valorisation')))
    return 'Bio-based Valorisation';
  if (t.includes('recycl')) return 'Recycling';
  if (t.includes('reuse')) return 'Reuse';
  if (t.includes('upcycl')) return 'Upcycling';
  return 'Circular Innovation';
}

/**
 * Extract materials mentioned in text.
 */
function extractMaterials(text) {
  const materials = [
    'pineapple',
    'plastic',
    'metal',
    'waste',
    'water',
    'textile',
    'packaging',
    'biomass',
    'paper',
    'felt',
    'PET',
    'ABS',
    'polystyrene',
    'cardboard',
    'fibre',
    'leaves',
    'bottles',
    'foam',
    'pulp',
    'PES',
    'PU',
  ];
  const found = new Set();
  const lower = text.toLowerCase();
  for (const mat of materials) {
    if (lower.includes(mat)) found.add(mat);
  }
  return Array.from(found).join('; ');
}

/**
 * Extract quantitative metrics (numbers with units).
 */
function extractMetrics(text) {
  const matches = text.match(
    /\d+(?:\.\d+)?\s*(?:%|tons?|tonnes?|kg|m3|million|billion|years?|months?)/gi,
  );
  return matches ? [...new Set(matches)].join('; ') : '';
}

/**
 * Build a human‑readable impact description.
 */
function extractImpact(text) {
  const metrics = extractMetrics(text);
  const narrative = extractSection(text, ['CONTRIBUTION', 'SOCIAL']);
  const firstSentence = narrative ? narrative.split(/[.!?]/)[0].trim() : '';
  if (metrics && firstSentence) {
    return `Quantified results include: ${metrics}. ${firstSentence}`;
  } else if (metrics) {
    return `Quantified results include: ${metrics}.`;
  } else if (firstSentence) {
    return firstSentence;
  }
  return '';
}

// ========== MAIN ==========
async function main() {
  if (!fs.existsSync(RAW_PDF)) {
    throw new Error(`PDF not found at ${RAW_PDF}`);
  }

  const rows = [];

  for (const range of CASE_RANGES) {
    console.log(`Extracting case study ${range.id} (pages ${range.start}–${range.end})...`);
    let text;
    try {
      text = await extractPagesText(RAW_PDF, range.start, range.end);
    } catch (err) {
      console.error(`❌ Failed to extract pages for case ${range.id}: ${err.message}`);
      continue; // skip this case study and move to next
    }

    // Extract raw fields
    let company = extractField(text, 'COMPANY NAME');
    let economicActivity = extractField(text, 'ECONOMIC ACTIVITY');

    // If extraction yielded nothing, fallback to the hardcoded name
    if (!company) company = range.name;

    const problem = extractProblem(text);
    const solution = extractSolution(text);
    const impact = extractImpact(text);
    const circularStrategy = detectCircularStrategy(text);
    const materials = extractMaterials(text);
    const metrics = extractMetrics(text);

    const metadata = {
      company,
      economic_activity: economicActivity || '',
      circular_strategy: circularStrategy,
      materials_detected: materials,
      metrics_detected: metrics,
      source_type: 'EULAC Case Study',
    };

    rows.push({
      problem,
      solution,
      materials,
      circular_strategy: circularStrategy,
      category: economicActivity || 'Circular Economy',
      impact,
      source_url: range.url,
      metadata_json: JSON.stringify(metadata),
    });
  }

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, rows);
  console.log(
    `✅ Saved ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (${writeResult.duplicateCount} duplicate rows removed)`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}
