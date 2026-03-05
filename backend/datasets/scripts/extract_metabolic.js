/**
 * extract_metabolic.js
 *
 * Extracts problem‑solution‑impact rows from Metabolic Open Reports PDFs.
 * Uses pdfjs-dist for text extraction with proper worker configuration.
 * Features:
 *   - Processes all PDFs in datasets/raw/metabolic/
 *   - Splits text into meaningful chunks (paragraphs/sentences)
 *   - Attempts to identify problem, solution, impact via heuristics
 *   - Quality scoring to keep best rows
 *   - Writes standardised CSV with ID, problem, solution, materials, strategy, category, impact, source_url, metadata_json
 *
 * Usage:
 *   node extract_metabolic.js
 *
 * Input: PDF files in datasets/raw/metabolic/
 * Output: datasets/processed/metabolic_processed.csv
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  formatId,
  cleanText,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  DATASET_KEYS,
} from '#utils/datasetsUtils.js';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.metabolic;
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const MAX_ROWS_PER_PDF = 30; // maximum rows to extract from one PDF
const MIN_CHUNK_LENGTH = 200; // minimum characters for a chunk
const MAX_CHUNK_LENGTH = 1200; // maximum characters for a chunk

/**
 * Extract text from a PDF file using pdfjs-dist.
 */
async function extractTextFromPdf(filePath) {
  const dataBuffer = await fs.promises.readFile(filePath);
  const uint8Array = new Uint8Array(dataBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
  let pdfDocument = null;
  try {
    pdfDocument = await loadingTask.promise;
  } catch (err) {
    console.error(`  PDF parse error: ${err.message}`);
    return null;
  }

  let fullText = '';
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  return fullText.replace(/\s+/g, ' '); // Normalise spaces
}

/**
 * Score a chunk for quality.
 */
function scoreChunk(text) {
  let score = 0;
  const lower = text.toLowerCase();

  // Presence of numbers (quantified impact)
  if (/\d+%|\d+\s?(tonnes|tons|kg|t|co2|ghg|€|\$)/i.test(lower)) score += 30;

  // Keywords indicating problem or solution
  if (
    lower.includes('challenge') ||
    lower.includes('problem') ||
    lower.includes('issue') ||
    lower.includes('barrier')
  )
    score += 10;
  if (
    lower.includes('solution') ||
    lower.includes('approach') ||
    lower.includes('initiative') ||
    lower.includes('implement')
  )
    score += 10;
  if (
    lower.includes('reduce') ||
    lower.includes('reuse') ||
    lower.includes('recycle') ||
    lower.includes('circular')
  )
    score += 10;

  // Length score (longer chunks often contain more detail)
  if (text.length > 400) score += 10;
  if (text.length > 800) score += 5;

  return score;
}

/**
 * Split text into candidate chunks.
 */
function chunkText(text) {
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => {
    const trimmed = p.trim();
    return trimmed.length >= MIN_CHUNK_LENGTH && trimmed.length <= MAX_CHUNK_LENGTH;
  });

  // If too few paragraphs, split by sentences into larger chunks
  if (paragraphs.length < 3) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = [];
    let currentLength = 0;
    for (const s of sentences) {
      if (currentLength + s.length > MAX_CHUNK_LENGTH && current.length > 0) {
        chunks.push(current.join(' '));
        current = [];
        currentLength = 0;
      }
      current.push(s);
      currentLength += s.length;
      if (currentLength >= MIN_CHUNK_LENGTH && currentLength <= MAX_CHUNK_LENGTH) {
        chunks.push(current.join(' '));
        current = [];
        currentLength = 0;
      }
    }
    if (current.length > 0) chunks.push(current.join(' '));
    return chunks;
  }
  return paragraphs;
}

/**
 * Extract materials from text.
 */
function extractMaterials(text) {
  const materialKeywords = [
    'plastic',
    'pet',
    'paper',
    'cardboard',
    'glass',
    'metal',
    'aluminum',
    'steel',
    'textile',
    'fabric',
    'cotton',
    'polyester',
    'wood',
    'biomass',
    'food',
    'organic',
    'waste',
    'water',
    'energy',
    'heat',
    'steam',
    'chemical',
    'solvent',
    'oil',
    'battery',
    'electronic',
    'e-waste',
    'construction',
    'concrete',
    'cement',
    'timber',
  ];
  const found = new Set();
  const lower = text.toLowerCase();
  for (const kw of materialKeywords) {
    if (lower.includes(kw)) found.add(kw);
  }
  return Array.from(found).join(', ');
}

/**
 * Infer circular strategy.
 */
function inferStrategy(text) {
  const lower = text.toLowerCase();
  if (lower.includes('remanufactur')) return 'Remanufacturing';
  if (lower.includes('refurbish')) return 'Refurbishment';
  if (lower.includes('repair')) return 'Repair';
  if (lower.includes('reuse')) return 'Reuse';
  if (lower.includes('recycl')) return 'Recycling';
  if (lower.includes('reduce')) return 'Reduce';
  if (lower.includes('recover') || lower.includes('energy')) return 'Energy Recovery';
  if (lower.includes('design') || lower.includes('ecodesign')) return 'Eco-design';
  if (lower.includes('industrial symbiosis') || lower.includes('by-product'))
    return 'Industrial Symbiosis';
  return 'Circular Economy';
}

/**
 * Infer category from text and filename.
 */
function inferCategory(text, filename) {
  const lower = text.toLowerCase() + ' ' + filename.toLowerCase();
  if (
    lower.includes('construction') ||
    lower.includes('built environment') ||
    lower.includes('building')
  )
    return 'Built Environment';
  if (lower.includes('textile') || lower.includes('fashion')) return 'Textiles';
  if (lower.includes('food') || lower.includes('agriculture') || lower.includes('agrifood'))
    return 'Food & Agriculture';
  if (lower.includes('plastic') || lower.includes('packaging')) return 'Plastics & Packaging';
  if (lower.includes('electronics') || lower.includes('e-waste')) return 'Electronics';
  if (lower.includes('city') || lower.includes('urban') || lower.includes('regional'))
    return 'Cities & Regions';
  if (lower.includes('policy')) return 'Policy';
  if (lower.includes('business') || lower.includes('company')) return 'Business';
  return 'General';
}

/**
 * Process a single PDF file.
 */
async function processPdf(filePath, filename) {
  console.log(`Processing ${filename}...`);

  if (!isValidPdf(filePath)) {
    console.log(`  Invalid PDF header – skipping.`);
    return [];
  }

  const text = await extractTextFromPdf(filePath);
  if (!text || text.length < 200) {
    console.log(`  Skipping (text too short or empty)`);
    return [];
  }

  const chunks = chunkText(text);
  const rows = [];

  for (const chunk of chunks) {
    const score = scoreChunk(chunk);
    if (score < 20) continue; // low quality

    const materials = extractMaterials(chunk);
    const strategy = inferStrategy(chunk);
    const category = inferCategory(chunk, filename);

    // Attempt to split chunk into problem and solution
    const sentences = chunk.split(/(?<=[.!?])\s+/);
    let problem, solution;
    if (sentences.length >= 2) {
      problem = sentences[0];
      solution = sentences.slice(1).join(' ');
    } else {
      problem = chunk;
      solution = chunk;
    }

    // Impact: try to extract a sentence containing numbers
    let impact = '';
    const numSentence = sentences.find((s) => /\d+%|\d+\s?(tonnes|tons|kg|t|co2|€|\$)/i.test(s));
    if (numSentence) {
      impact = numSentence;
    } else {
      impact = 'Qualitative impact described.';
    }

    rows.push({
      problem: cleanText(problem.substring(0, 500)),
      solution: cleanText(solution.substring(0, 800)),
      materials,
      circular_strategy: strategy,
      category,
      impact: cleanText(impact.substring(0, 200)),
      source_url: '',
      metadata_json: JSON.stringify({
        original_filename: filename,
        chunk_preview: chunk.substring(0, 500),
        score,
      }),
      _score: score,
    });

    if (rows.length >= MAX_ROWS_PER_PDF) break;
  }

  console.log(`  Extracted ${rows.length} rows from ${filename}`);
  return rows;
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Raw directory not found: ${RAW_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(RAW_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
  console.log(`Found ${files.length} PDF files in ${RAW_DIR}`);

  let allRows = [];
  let failedFiles = [];

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    try {
      const rows = await processPdf(filePath, file);
      allRows.push(...rows);
    } catch (err) {
      console.error(`❌ Unexpected error processing ${file}: ${err.message}`);
      failedFiles.push(file);
    }
  }

  if (failedFiles.length > 0) {
    console.warn(`\n⚠️ The following files could not be processed and were skipped:`);
    failedFiles.forEach((f) => console.warn(`   - ${f}`));
  }

  console.log(`\nTotal raw rows extracted: ${allRows.length}`);

  // Sort by quality score and keep top 500
  const sorted = allRows.sort((a, b) => b._score - a._score);
  const topRows = sorted.slice(0, 500);

  // Remove temporary _score field and assign IDs
  const finalRows = topRows.map((row, idx) => {
    const { _score, ...rest } = row;
    return {
      ID: formatId(DATASET_KEY, idx + 1),
      ...rest,
    };
  });

  await writeCsv(OUTPUT_PATH, finalRows);
  console.log(`✅ Wrote ${finalRows.length} rows to ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}
