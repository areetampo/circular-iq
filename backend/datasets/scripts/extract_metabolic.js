/* global process */

/**
 * extract_metabolic.js - Quality improved version with enhanced problem/solution filtering
 *
 * IMPORTANT: Scraping must be done first using scrape_metabolic.js to download the PDFs.
 *
 * Features:
 *   • Reads metadata.json from raw folder to populate source_url for each PDF
 *   • Higher MIN_SCORE (35), longer MIN_CHUNK_LENGTH (250)
 *   • Sentence-aware chunking to reduce truncation
 *   • Filters out rows where problem == solution or one is substring of the other
 *   • Ensures problem and solution come from different sentences when possible
 *   • Final row limit remains 400
 *
 * Usage:
 *   node extract_metabolic.js
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { Buffer } from 'buffer';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  cleanText,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  DATASET_KEYS,
  DATASET_LOOKUP,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';

const require = createRequire(import.meta.url);
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.metabolic;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);
const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.keys(dataset.raw_folder_contents).map((file) => path.join(RAW_DIR, file));
verifyPathsExist(inputFiles);

// Improved extraction parameters
const MAX_ROWS_PER_PDF = 30;
const MIN_CHUNK_LENGTH = 250; // increased from 200
const MAX_CHUNK_LENGTH = 1200;
const MIN_SCORE = 35; // increased from 20/35
const FINAL_ROW_LIMIT = 400; // keep top 400 rows

/**
 * Check if a file starts with the PDF header.
 */
function isValidPdf(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString() === '%PDF-';
  } catch (err) {
    return false;
  }
}

/**
 * Extract text from a PDF file using pdfjs-dist.
 */
async function extractTextFromPdf(filePath) {
  const dataBuffer = await fs.promises.readFile(filePath);
  const uint8Array = new Uint8Array(dataBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
  let pdfDocument;
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
  return fullText.replace(/\s+/g, ' ').trim();
}

/**
 * Score a chunk for overall quality.
 */
function scoreChunk(text) {
  let score = 0;
  const lower = text.toLowerCase();

  // Numbers with units (impact)
  if (/\d+%|\d+\s?(tonnes|tons|kg|t|co2|ghg|€|\$|million|billion)/i.test(lower)) score += 30;
  // Problem keywords
  if (
    lower.includes('challenge') ||
    lower.includes('problem') ||
    lower.includes('issue') ||
    lower.includes('barrier') ||
    lower.includes('difficulty')
  )
    score += 10;
  // Solution keywords
  if (
    lower.includes('solution') ||
    lower.includes('approach') ||
    lower.includes('initiative') ||
    lower.includes('implement') ||
    lower.includes('develop') ||
    lower.includes('create')
  )
    score += 10;
  // Circular economy keywords
  if (
    lower.includes('remanufactur') ||
    lower.includes('refurbish') ||
    lower.includes('repair') ||
    lower.includes('reuse') ||
    lower.includes('recycl') ||
    lower.includes('circular')
  )
    score += 10;
  // Length bonus
  if (text.length > 400) score += 10;
  if (text.length > 800) score += 5;
  return score;
}

/**
 * Split text into candidate chunks, respecting sentence boundaries.
 */
function chunkText(text) {
  // First split into sentences (roughly)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10);
  if (sentences.length === 0) return [];

  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;
    // If adding this sentence exceeds max length, finalize current chunk
    if (currentLength + sentenceLength > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      if (chunkText.length >= MIN_CHUNK_LENGTH) {
        chunks.push(chunkText);
      }
      currentChunk = [];
      currentLength = 0;
    }
    // Start new chunk with this sentence
    currentChunk.push(sentence);
    currentLength += sentenceLength;

    // If current chunk already meets minimum length, we can consider finalizing later
  }

  // Handle the last chunk
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ');
    if (chunkText.length >= MIN_CHUNK_LENGTH) {
      chunks.push(chunkText);
    }
  }

  // If we ended up with no chunks, fallback to paragraph splitting
  if (chunks.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => {
      const trimmed = p.trim();
      return trimmed.length >= MIN_CHUNK_LENGTH && trimmed.length <= MAX_CHUNK_LENGTH;
    });
    return paragraphs;
  }

  return chunks;
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
    'composite',
    'carbon fibre',
    'aluminium',
    'rubber',
    'tyre',
    'engine',
    'gearbox',
    'transmission',
    'clutch',
    'brake',
    'hydraulic',
    'pump',
    'motor',
    'generator',
  ];
  const found = new Set();
  const lower = text.toLowerCase();
  for (const kw of materialKeywords) {
    if (lower.includes(kw)) found.add(kw);
  }
  return Array.from(found).join(', ');
}

/**
 * Infer circular strategy from text.
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
 * Extract problem, solution, impact from a chunk using sentence scoring.
 * Returns null if problem and solution are too similar.
 */
function extractProblemSolutionImpact(chunk) {
  const sentences = chunk.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 15);
  if (sentences.length === 0) {
    return null;
  }

  const problemKeywords = [
    'challenge',
    'problem',
    'issue',
    'barrier',
    'difficulty',
    'obstacle',
    'need',
    'lack',
    'shortage',
    'concern',
    'threat',
    'risk',
    'gap',
    'inefficiency',
  ];
  const solutionKeywords = [
    'solution',
    'approach',
    'method',
    'measure',
    'initiative',
    'action',
    'implement',
    'develop',
    'create',
    'introduce',
    'launch',
    'establish',
    'strategy',
    'framework',
    'policy',
    'project',
    'program',
    'tool',
    'technique',
  ];
  const actionVerbs = [
    'developed',
    'created',
    'designed',
    'implemented',
    'used',
    'applied',
    'launched',
    'established',
    'introduced',
    'adopted',
    'built',
    'constructed',
  ];

  let problemSentences = [];
  let solutionSentences = [];
  let impactSentences = [];

  sentences.forEach((s, idx) => {
    const lower = s.toLowerCase();
    let pScore = 0,
      sScore = 0,
      iScore = 0;

    if (/\d+%|\d+\s?(tonnes|tons|kg|t|co2|ghg|€|\$|million|billion)/i.test(lower)) iScore += 3;

    problemKeywords.forEach((kw) => {
      if (lower.includes(kw)) pScore += 1;
    });
    if (/^\s*(challenge|problem|issue|barrier)\s*[:;]/.test(lower)) pScore += 5;

    solutionKeywords.forEach((kw) => {
      if (lower.includes(kw)) sScore += 1;
    });
    actionVerbs.forEach((v) => {
      if (lower.includes(v)) sScore += 1;
    });
    if (/^\s*(solution|approach|method|initiative)\s*[:;]/.test(lower)) sScore += 5;

    if (pScore > 0) problemSentences.push({ text: s, score: pScore, index: idx });
    if (sScore > 0) solutionSentences.push({ text: s, score: sScore, index: idx });
    if (iScore > 0) impactSentences.push({ text: s, score: iScore, index: idx });
  });

  problemSentences.sort((a, b) => b.score - a.score);
  solutionSentences.sort((a, b) => b.score - a.score);
  impactSentences.sort((a, b) => b.score - a.score);

  let bestProblem = problemSentences[0] || null;
  let bestSolution = solutionSentences[0] || null;

  // If same sentence, try alternatives
  if (bestProblem && bestSolution && bestProblem.index === bestSolution.index) {
    if (solutionSentences.length > 1) {
      bestSolution = solutionSentences[1];
    } else if (problemSentences.length > 1) {
      bestProblem = problemSentences[1];
    } else {
      return null; // discard
    }
  }

  // Fallback: find nearby sentences if missing
  if (bestProblem && !bestSolution) {
    const idx = bestProblem.index;
    for (let offset = 1; offset <= 2; offset++) {
      if (idx + offset < sentences.length) {
        bestSolution = { text: sentences[idx + offset], score: 0, index: idx + offset };
        break;
      }
      if (idx - offset >= 0) {
        bestSolution = { text: sentences[idx - offset], score: 0, index: idx - offset };
        break;
      }
    }
  }
  if (!bestProblem && bestSolution) {
    const idx = bestSolution.index;
    for (let offset = 1; offset <= 2; offset++) {
      if (idx + offset < sentences.length) {
        bestProblem = { text: sentences[idx + offset], score: 0, index: idx + offset };
        break;
      }
      if (idx - offset >= 0) {
        bestProblem = { text: sentences[idx - offset], score: 0, index: idx - offset };
        break;
      }
    }
  }

  if (!bestProblem) bestProblem = { text: sentences[0], score: 0, index: 0 };
  if (!bestSolution) {
    if (sentences.length > 1) {
      const rest = sentences.slice(bestProblem.index + 1).join(' ');
      bestSolution = { text: rest || sentences[0], score: 0, index: -1 };
    } else {
      bestSolution = bestProblem; // will be filtered later
    }
  }

  const problemText = bestProblem.text.substring(0, 500);
  const solutionText = bestSolution.text.substring(0, 800);

  // Similarity filter
  const cleanProblem = problemText.replace(/\s+/g, ' ').trim().toLowerCase();
  const cleanSolution = solutionText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (
    cleanProblem === cleanSolution ||
    cleanSolution.includes(cleanProblem) ||
    cleanProblem.includes(cleanSolution)
  ) {
    return null;
  }

  const bestImpact =
    impactSentences[0]?.text ||
    (impactSentences.length > 0 ? impactSentences[0].text : 'Qualitative impact described.');

  return {
    problem: problemText,
    solution: solutionText,
    impact: bestImpact.substring(0, 200),
  };
}

async function main() {
  // Read metadata.json from raw folder
  const metadataPath = path.join(RAW_DIR, 'metadata.json');
  let metadataMap = new Map(); // filename -> sourceUrl (detailUrl)
  if (fs.existsSync(metadataPath)) {
    const metadataRaw = await fs.promises.readFile(metadataPath, 'utf8');
    const metadataList = JSON.parse(metadataRaw);
    for (const item of metadataList) {
      // item has { filename, detailUrl, pdfUrl }
      metadataMap.set(item.filename, item.detailUrl || '');
    }
    console.log(`Loaded source URLs for ${metadataMap.size} files from metadata.json.`);
  } else {
    console.warn('⚠️  metadata.json not found – source_url will be empty.');
  }

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Raw directory not found: ${RAW_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(RAW_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'));
  console.log(`Found ${files.length} PDF files in ${RAW_DIR}`);

  let allRows = [];

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const sourceUrl = metadataMap.get(file) || '';

    console.log(`\nProcessing ${file}...`);

    if (!isValidPdf(filePath)) {
      console.log('  Invalid PDF header – skipping.');
      continue;
    }

    const text = await extractTextFromPdf(filePath);
    if (!text || text.length < 200) {
      console.log('  Text too short or empty – skipping.');
      continue;
    }

    const chunks = chunkText(text);
    console.log(`  Extracted ${chunks.length} candidate chunks.`);

    for (const chunk of chunks) {
      const score = scoreChunk(chunk);
      if (score < MIN_SCORE) continue;

      const materials = extractMaterials(chunk);
      const strategy = inferStrategy(chunk);
      const category = inferCategory(chunk, file);

      const extracted = extractProblemSolutionImpact(chunk);
      if (!extracted) continue;

      const { problem, solution, impact } = extracted;

      if (problem.length < 50) continue;

      allRows.push({
        problem: cleanText(problem),
        solution: cleanText(solution),
        materials,
        circular_strategy: strategy,
        category,
        impact: cleanText(impact),
        source_url: sourceUrl,
        metadata_json: JSON.stringify({
          original_filename: file,
          chunk_preview: chunk.substring(0, 500),
          score,
        }),
        _score: score,
      });

      if (allRows.length % 100 === 0) console.log(`  Collected ${allRows.length}+ rows so far...`);
    }
  }

  console.log(`\nTotal raw rows extracted: ${allRows.length}`);

  // Sort by score and take top FINAL_ROW_LIMIT
  const sorted = allRows.sort((a, b) => b._score - a._score);
  const topRows = sorted.slice(0, FINAL_ROW_LIMIT);

  const finalRows = topRows.map((row) => {
    const { _score, ...rest } = row;
    return rest;
  });

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalRows);
  console.log(
    `✅ Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}
