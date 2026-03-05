/**
 * extract_metabolic.js – Improved version with stricter filtering and reduced row limit
 *
 * Features:
 *   - Higher score threshold (35) to keep only higher-quality chunks.
 *   - Additional filters: problem length > 50, problem ≠ solution.
 *   - Final row limit reduced to 400.
 *
 * Usage:
 *   node extract_metabolic.js
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

const MAX_ROWS_PER_PDF = 30;
const MIN_CHUNK_LENGTH = 200;
const MAX_CHUNK_LENGTH = 1200;
const MIN_SCORE = 35; // increased from 20 to 35
const FINAL_ROW_LIMIT = 400; // reduced from 500 to 400

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
  return fullText.replace(/\s+/g, ' ');
}

/**
 * Score a chunk for overall quality (same as before).
 */
function scoreChunk(text) {
  let score = 0;
  const lower = text.toLowerCase();

  if (/\d+%|\d+\s?(tonnes|tons|kg|t|co2|ghg|€|\$)/i.test(lower)) score += 30;
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
  if (text.length > 400) score += 10;
  if (text.length > 800) score += 5;
  return score;
}

/**
 * Split text into candidate chunks (paragraphs or sentences).
 */
function chunkText(text) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => {
    const trimmed = p.trim();
    return trimmed.length >= MIN_CHUNK_LENGTH && trimmed.length <= MAX_CHUNK_LENGTH;
  });

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
 * Enhanced extraction of problem, solution, impact from a chunk.
 * Uses sentence‑level scoring with expanded keywords.
 */
function extractProblemSolutionImpact(chunk) {
  // Split into sentences (roughly)
  const sentences = chunk.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 15);
  if (sentences.length === 0) {
    return {
      problem: chunk,
      solution: chunk,
      impact: 'Qualitative impact described.',
    };
  }

  // Keyword sets
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

  // Score each sentence for problem, solution, and impact
  let problemSentences = [];
  let solutionSentences = [];
  let impactSentences = [];

  sentences.forEach((s, idx) => {
    const lower = s.toLowerCase();
    let pScore = 0,
      sScore = 0,
      iScore = 0;

    // Impact: numbers with units
    if (/\d+%|\d+\s?(tonnes|tons|kg|t|co2|ghg|€|\$|million|billion)/i.test(lower)) {
      iScore += 3;
    }

    // Problem keywords
    problemKeywords.forEach((kw) => {
      if (lower.includes(kw)) pScore += 1;
    });
    // If the sentence starts with "Challenge:" or similar, give high score
    if (/^\s*(challenge|problem|issue|barrier)\s*[:;]/.test(lower)) pScore += 5;

    // Solution keywords
    solutionKeywords.forEach((kw) => {
      if (lower.includes(kw)) sScore += 1;
    });
    // Action verbs
    actionVerbs.forEach((v) => {
      if (lower.includes(v)) sScore += 1;
    });
    // Headings like "Solution:", "Approach:"
    if (/^\s*(solution|approach|method|initiative)\s*[:;]/.test(lower)) sScore += 5;

    if (pScore > 0) {
      problemSentences.push({ text: s, score: pScore, index: idx });
    }
    if (sScore > 0) {
      solutionSentences.push({ text: s, score: sScore, index: idx });
    }
    if (iScore > 0) {
      impactSentences.push({ text: s, score: iScore, index: idx });
    }
  });

  // Sort by score desc
  problemSentences.sort((a, b) => b.score - a.score);
  solutionSentences.sort((a, b) => b.score - a.score);
  impactSentences.sort((a, b) => b.score - a.score);

  // Choose best problem and solution
  let bestProblem = problemSentences.length > 0 ? problemSentences[0] : null;
  let bestSolution = solutionSentences.length > 0 ? solutionSentences[0] : null;

  // If we have both, use them.
  if (bestProblem && bestSolution) {
    // If they are the same sentence, we need to decide: maybe the sentence contains both.
    if (bestProblem.index === bestSolution.index && solutionSentences.length > 1) {
      bestSolution = solutionSentences[1];
    }
  }

  // If only problem, try to find a nearby sentence as solution
  if (bestProblem && !bestSolution) {
    const problemIdx = bestProblem.index;
    for (let offset = 1; offset <= 2; offset++) {
      if (problemIdx + offset < sentences.length) {
        const cand = sentences[problemIdx + offset];
        if (cand.length > 20) {
          bestSolution = { text: cand, score: 0, index: problemIdx + offset };
          break;
        }
      }
      if (problemIdx - offset >= 0) {
        const cand = sentences[problemIdx - offset];
        if (cand.length > 20) {
          bestSolution = { text: cand, score: 0, index: problemIdx - offset };
          break;
        }
      }
    }
  }

  // If only solution, try to find a nearby problem
  if (!bestProblem && bestSolution) {
    const solIdx = bestSolution.index;
    for (let offset = 1; offset <= 2; offset++) {
      if (solIdx + offset < sentences.length) {
        const cand = sentences[solIdx + offset];
        if (cand.length > 20) {
          bestProblem = { text: cand, score: 0, index: solIdx + offset };
          break;
        }
      }
      if (solIdx - offset >= 0) {
        const cand = sentences[solIdx - offset];
        if (cand.length > 20) {
          bestProblem = { text: cand, score: 0, index: solIdx - offset };
          break;
        }
      }
    }
  }

  // Impact: take best impact sentence
  let bestImpact = impactSentences.length > 0 ? impactSentences[0].text : null;

  // Fallback: if still no problem/solution, use first sentence as problem, rest as solution
  if (!bestProblem) {
    bestProblem = { text: sentences[0], score: 0, index: 0 };
  }
  if (!bestSolution) {
    // If only one sentence, use it as both
    if (sentences.length === 1) {
      bestSolution = bestProblem;
    } else {
      // Use remaining sentences as solution
      const rest = sentences.slice(bestProblem.index + 1).join(' ');
      bestSolution = { text: rest || bestProblem.text, score: 0 };
    }
  }

  const problem = bestProblem.text;
  const solution = bestSolution.text;
  const impact =
    bestImpact ||
    (impactSentences.length > 0 ? impactSentences[0].text : 'Qualitative impact described.');

  return { problem, solution, impact };
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
    if (score < MIN_SCORE) continue; // increased threshold

    const materials = extractMaterials(chunk);
    const strategy = inferStrategy(chunk);
    const category = inferCategory(chunk, filename);

    const { problem, solution, impact } = extractProblemSolutionImpact(chunk);

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

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    try {
      const rows = await processPdf(filePath, file);
      allRows.push(...rows);
    } catch (err) {
      console.error(`❌ Unexpected error processing ${file}: ${err.message}`);
    }
  }

  console.log(`\nTotal raw rows extracted: ${allRows.length}`);

  // Apply additional filters before sorting
  const filteredRows = allRows.filter((row) => {
    // Problem must be longer than 50 characters (avoid fragments)
    if (row.problem.length < 50) return false;
    // Problem and solution should not be identical (fallback case)
    if (row.problem === row.solution) return false;
    return true;
  });

  console.log(`After length and duplicate filters: ${filteredRows.length}`);

  // Sort by score and take top FINAL_ROW_LIMIT
  const sorted = filteredRows.sort((a, b) => b._score - a._score);
  const topRows = sorted.slice(0, FINAL_ROW_LIMIT);

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
