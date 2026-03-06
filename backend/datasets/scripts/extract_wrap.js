/* global process */

/**
 * extract_wrap.js - Problem/solution pair extraction from WRAP PDF reports and case studies
 *
 * Processes all PDFs in datasets/raw/wrap_resources/ and its subfolders (reports/, guides/).
 * Uses pdfjs-dist with worker configuration.
 *
 * Features:
 *   • Recursive PDF scanning (root + subfolders)
 *   • Sentence-level problem/solution extraction
 *   • Category guessed from filename or folder
 *   • Outputs standardized CSV
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
  formatId,
  cleanText,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  DATASET_KEYS,
} from '#utils/datasetsUtils.js';

const require = createRequire(import.meta.url);
const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

const DATASET_KEY = DATASET_KEYS.wrap;

// Problem/solution keywords
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

const RAW_DIR = getDatasetRawDir(DATASET_KEY);
if (!RAW_DIR) throw new Error(`Raw folder not defined for dataset key: ${DATASET_KEY}`);

// Helper: split sentences
function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
}

function scoreSentence(sentence, keywords) {
  const lower = sentence.toLowerCase();
  return keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
}

function extractProblemSolution(paragraph) {
  const sentences = splitSentences(paragraph);
  if (sentences.length === 0) return { problem: paragraph, solution: paragraph };

  let bestProblem = { sentence: sentences[0], score: 0 };
  let bestSolution = { sentence: sentences[sentences.length - 1], score: 0 };

  for (const sent of sentences) {
    const probScore = scoreSentence(sent, PROBLEM_KEYWORDS);
    const solScore = scoreSentence(sent, SOLUTION_KEYWORDS);

    if (probScore > bestProblem.score) {
      bestProblem = { sentence: sent, score: probScore };
    }
    if (solScore > bestSolution.score) {
      bestSolution = { sentence: sent, score: solScore };
    }
  }

  if (bestProblem.score === 0) bestProblem.sentence = sentences[0];
  if (bestSolution.score === 0) bestSolution.sentence = sentences[sentences.length - 1];

  return {
    problem: bestProblem.sentence,
    solution: bestSolution.sentence,
  };
}

function scoreParagraph(text) {
  let score = 0;
  const lower = text.toLowerCase();

  PROBLEM_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) score += 2;
  });
  SOLUTION_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) score += 3;
  });
  IMPACT_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) score += 5;
  });

  const words = text.split(/\s+/).length;
  if (words > 30 && words < 500) score += Math.min(words / 10, 20);
  else if (words >= 500) score += 15;
  else if (words < 15) score -= 10;

  return score;
}

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

// Guess category from relative path (subfolder)
function guessCategoryFromPath(relativePath) {
  if (relativePath.includes('reports')) return 'Report';
  if (relativePath.includes('guides')) return 'Guide';
  if (relativePath.includes('case-studies')) return 'Case Study'; // unlikely, but just in case
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
          allCandidates.push({
            text: para,
            problem,
            solution,
            score,
            source_file: relPath,
          });
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
      ID: formatId(DATASET_KEY, 0), // placeholder
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
  rows.forEach((row, idx) => {
    row.ID = formatId(DATASET_KEY, idx + 1);
  });

  console.log(`Generated ${rows.length} rows.`);
  const outputPath = getDatasetProcessedCsvPath(DATASET_KEY);
  await writeCsv(outputPath, rows);
  console.log(`✅ Written to ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
