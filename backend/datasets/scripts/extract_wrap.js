/* global process */

/**
 * extract_wrap.js - Problem/solution pair extraction from WRAP PDF reports and case studies
 *
 * IMPORTANT: Run `scrape_wrap.js` before executing this script; PDFs must be downloaded first.
 *
 * Processes all PDFs in datasets/raw/wrap_resources/ and its subfolders (reports/, guides/).
 * Uses pdfjs-dist with worker configuration.
 *
 * Features:
 *   • Recursive PDF scanning (root + subfolders)
 *   • Sentence-level problem/solution extraction with improved pairing logic
 *   • Minimum keyword scores to ensure relevance
 *   • Category guessed from filename or folder
 *   • Outputs standardized CSV, limited to top MAX_ROWS by paragraph score
 *
 * Usage:
 *   node datasets/scripts/extract_wrap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  cleanText,
  getDatasetRawDir,
  DATASET_LOOKUP,
  DATASETS_PROCESSED_DIR,
  writeCsv,
  DATASET_KEYS,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';

const require = createRequire(import.meta.url);
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.wrap;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);
const outputPath = path.join(DATASETS_PROCESSED_DIR, dataset.processed_csv_extracted);

const MAX_ROWS = 500; // Keep only the top highest‑scoring rows

// Minimum keyword scores required for a sentence to be considered a problem or solution
const MIN_PROBLEM_SCORE = 1; // must contain at least one problem keyword
const MIN_SOLUTION_SCORE = 1; // must contain at least one solution keyword

// Problem/solution keywords (unchanged)
const PROBLEM_KEYWORDS = [
  'challenge',
  'problem',
  'issue',
  'barrier',
  'difficult',
  'obstacle',
  'waste',
  'loss',
  'emission',
  'carbon',
  'energy',
  'water',
  'resource',
  'cost',
  'expensive',
  'inefficient',
  'unsustainable',
  'linear',
];
const SOLUTION_KEYWORDS = [
  'solution',
  'action',
  'measure',
  'initiative',
  'project',
  'trial',
  'redesign',
  'innovation',
  'recycl',
  'reuse',
  'repair',
  'remanufactur',
  'reduce',
  'prevent',
  'save',
  'improve',
  'achieve',
  'implement',
  'launch',
  'develop',
  'create',
  'design',
  'pilot',
];
const IMPACT_KEYWORDS = [
  'ton',
  'tonne',
  'kg',
  'co2',
  'ghg',
  'percent',
  '%',
  '£',
  'pound',
  'million',
  'billion',
  'saving',
  'reduction',
  'increase',
  'avoid',
];

// Helper: split sentences (unchanged)
function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
}

function scoreSentence(sentence, keywords) {
  const lower = sentence.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
}

// ========== IMPROVED EXTRACTION ==========
// Enforces problem‑then‑solution order and falls back only when necessary.
function extractProblemSolution(paragraph) {
  const sentences = splitSentences(paragraph);
  if (sentences.length < 2) return { problem: paragraph, solution: paragraph };

  // Score each sentence for problem and solution keywords
  const scored = sentences.map((sent, idx) => ({
    sent,
    probScore: scoreSentence(sent, PROBLEM_KEYWORDS),
    solScore: scoreSentence(sent, SOLUTION_KEYWORDS),
    idx,
  }));

  // 1. Best problem sentence (highest problem score)
  const bestProb = scored.reduce(
    (best, curr) => (curr.probScore > best.probScore ? curr : best),
    scored[0],
  );

  // 2. Among sentences AFTER bestProb, pick the one with highest solution score
  const afterCandidates = scored.filter((s) => s.idx > bestProb.idx);
  let bestSol =
    afterCandidates.length > 0
      ? afterCandidates.reduce(
          (best, curr) => (curr.solScore > best.solScore ? curr : best),
          afterCandidates[0],
        )
      : null;

  // 3. Fallback if no sentence after, or bestSol has zero score
  if (!bestSol || bestSol.solScore === 0) {
    // best overall solution (but avoid picking the same sentence as problem)
    const sortedBySol = [...scored].sort((a, b) => b.solScore - a.solScore);
    bestSol =
      sortedBySol[0].idx === bestProb.idx
        ? sortedBySol[1] || sortedBySol[0] // pick next best if available
        : sortedBySol[0];
  }

  return {
    problem: bestProb.sent,
    solution: bestSol.sent,
  };
}

// ========== ENHANCED PARAGRAPH SCORING ==========
// Adds a bonus if the paragraph contains both problem and solution keywords.
function scoreParagraph(text) {
  let score = 0;
  const lower = text.toLowerCase();

  let hasProblem = false;
  let hasSolution = false;

  PROBLEM_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) {
      score += 2;
      hasProblem = true;
    }
  });
  SOLUTION_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) {
      score += 3;
      hasSolution = true;
    }
  });
  IMPACT_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) score += 5;
  });

  // Bonus if paragraph contains both problem and solution keywords
  if (hasProblem && hasSolution) score += 10;

  const words = text.split(/\s+/).length;
  if (words > 30 && words < 500) score += Math.min(words / 10, 20);
  else if (words >= 500) score += 15;
  else if (words < 15) score -= 10;

  return score;
}

// ========== REMAINING FUNCTIONS (UNCHANGED) ==========
function extractMaterials(text) {
  const lower = text.toLowerCase();
  const materials = [];
  const materialKeywords = [
    'plastic',
    'polymer',
    'steel',
    'aluminium',
    'aluminum',
    'copper',
    'glass',
    'paper',
    'cardboard',
    'textile',
    'fabric',
    'cotton',
    'polyester',
    'wool',
    'wood',
    'timber',
    'concrete',
    'cement',
    'aggregate',
    'food',
    'organic',
  ];
  materialKeywords.forEach((mat) => {
    if (lower.includes(mat)) materials.push(mat);
  });
  return materials.join(', ');
}

function determineStrategy(text) {
  const lower = text.toLowerCase();
  if (lower.includes('remanufactur')) return 'Remanufacturing';
  if (lower.includes('redesign') || lower.includes('design for')) return 'Design for circularity';
  if (lower.includes('reuse') || lower.includes('refill')) return 'Reuse';
  if (lower.includes('repair')) return 'Repair';
  if (lower.includes('recycl')) return 'Recycling';
  if (lower.includes('prevent') || lower.includes('reduce')) return 'Prevention';
  if (lower.includes('recover')) return 'Recovery';
  return 'Circular economy initiative';
}

function extractImpact(text) {
  const lower = text.toLowerCase();
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:tonnes|ton|kg|t)(?!\w)/gi,
    /(\d+(?:\.\d+)?)\s*%/gi,
    /(?:£|€|\$)\s?(\d+(?:\.\d+)?(?:\s*million|\s*billion)?)/gi,
    /(\d+(?:\.\d+)?)\s*(?:CO2e|CO2|GHG)/gi,
  ];
  const matches = [];
  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(lower)) !== null) matches.push(match[0]);
  });
  return matches.length ? matches.join('; ') : '';
}

async function extractPdfText(filePath) {
  const dataBuffer = await fs.promises.readFile(filePath);
  const uint8Array = new Uint8Array(dataBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array, useSystemFonts: true });
  const pdfDocument = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    let pageText = strings.join(' ');

    // Clean boilerplate
    pageText = pageText.replace(/\bPage \d+ of \d+\b/gi, '');
    pageText = pageText.replace(/\b\d+\s*\|/g, '');
    pageText = pageText.replace(/\|\s*\d+/g, '');
    pageText = pageText.replace(/www\.\S+/gi, '');
    pageText = pageText.replace(/\n{3,}/g, '\n\n');
    pageText = pageText.replace(/\s+/g, ' ');

    fullText += pageText + '\n\n';
  }
  return fullText;
}

function guessCategoryFromPath(relativePath) {
  if (relativePath.includes('reports')) return 'Report';
  if (relativePath.includes('guides')) return 'Guide';
  if (relativePath.includes('case-studies')) return 'Case Study';
  return 'Cross-sector';
}

async function main() {
  // Collect all PDFs recursively from RAW_DIR
  const pdfFiles = [];
  function walkDir(dir, baseDir = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(baseDir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else if (entry.name.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push({ fullPath, relPath });
      }
    }
  }
  walkDir(RAW_DIR);

  if (pdfFiles.length === 0) {
    console.warn('No PDF files found in', RAW_DIR);
    return;
  }
  console.log(`Found ${pdfFiles.length} PDFs.`);

  const allCandidates = [];

  for (const { fullPath, relPath } of pdfFiles) {
    console.log(`Processing ${relPath}...`);
    try {
      const text = await extractPdfText(fullPath);
      const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.length > 30);

      paragraphs.forEach((para) => {
        const score = scoreParagraph(para);
        if (score > 10) {
          const { problem, solution } = extractProblemSolution(para);
          // ===== NEW: Minimum keyword score filter =====
          const probScore = scoreSentence(problem, PROBLEM_KEYWORDS);
          const solScore = scoreSentence(solution, SOLUTION_KEYWORDS);
          if (probScore >= MIN_PROBLEM_SCORE && solScore >= MIN_SOLUTION_SCORE) {
            allCandidates.push({
              text: para,
              problem,
              solution,
              score,
              source_file: relPath,
            });
          }
        }
      });
    } catch (err) {
      console.error(`❌ Failed to extract text from ${relPath}: ${err.message}`);
    }
  }

  console.log(`Collected ${allCandidates.length} candidate paragraphs.`);
  if (allCandidates.length === 0) return;

  const rows = allCandidates.map((cand) => {
    const impact = extractImpact(cand.text);
    const materials = extractMaterials(cand.text);
    const strategy = determineStrategy(cand.text);
    const category = guessCategoryFromPath(cand.source_file);

    const metadata = {
      source_file: cand.source_file,
      score: cand.score,
      full_paragraph: cand.text.substring(0, 500) + '...',
    };

    return {
      problem: cleanText(cand.problem),
      solution: cleanText(cand.solution),
      materials,
      circular_strategy: strategy,
      category,
      impact,
      source_url: '',
      metadata_json: JSON.stringify(metadata),
      score: cand.score,
    };
  });

  rows.sort((a, b) => b.score - a.score);

  const limitedRows = rows.slice(0, MAX_ROWS);

  console.log(`Generated ${limitedRows.length} rows. (limited to top ${MAX_ROWS} rows by score)`);
  const writeResult = await writeCsv(DATASET_KEY, outputPath, limitedRows);
  console.log(
    `✅ Written ${writeResult.writtenCount} rows to ${outputPath} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
