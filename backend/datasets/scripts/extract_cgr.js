/* global process */

/**
 * extract_cgr_2025.js – Final improved version
 *
 * Extracts business‑oriented problem‑solution pairs from the Circularity Gap Report 2025.
 * Features:
 *   • Multi‑keyword scoring for theme classification
 *   • Unit validation (percentages vs. tonnes)
 *   • Confidence threshold to drop uncertain rows
 *   • Uses `writeCsv` from utils for correct quoting (unquoted header, quoted data)
 *
 * Usage:
 *   node extract_cgr_2025.js
 *
 * Input:  datasets/raw/circularity_gap_report/CGR_2025.pdf
 * Output: datasets/processed/cgr_processed.csv
 */

import fs from 'fs/promises';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { fileURLToPath } from 'url';
import {
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  writeCsv,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';

// =============================================================================
// CONFIGURATION
// =============================================================================
const DATASET_KEY = DATASET_KEYS.cgr;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const inputFile = path.join(RAW_DIR, dataset.raw_folder_contents.input_file);
verifyPathsExist([inputFile]);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const MIN_SENTENCE_LENGTH = 60;
const MAX_SENTENCE_LENGTH = 600;
const CONFIDENCE_THRESHOLD = 2; // minimum keyword matches to accept a theme

// Theme definitions with positive keywords and negative keywords (to exclude)
const THEMES = [
  {
    name: 'circularity_metric',
    posKeywords: [
      'circularity metric',
      'secondary material',
      'circularity gap',
      'technical cycling',
      'input technical cycling',
    ],
    negKeywords: ['extraction', 'biomass', 'fossil', 'waste', 'landfill', 'stock', 'building'],
    allowedUnits: ['%'],
    problemTemplate: (stat) =>
      `The global circularity rate is only ${stat}, meaning most materials are still virgin – a missed opportunity for resource efficiency and cost savings.`,
    solution:
      'Boost secondary material use through design for recyclability, extended producer responsibility, and better collection systems.',
    materials: 'Mixed materials',
    circular_strategy: 'Recycle, Circular design',
  },
  {
    name: 'material_extraction',
    posKeywords: [
      'extraction',
      'virgin material',
      'resource use',
      'throughput',
      'consumption',
      'material use',
    ],
    negKeywords: ['circularity', 'recycl', 'biomass', 'fossil', 'waste', 'stock'],
    allowedUnits: ['%', 'tonnes', 'billion', 'million', 'Gt', 't/capita'], // allow percentages for growth rates
    problemTemplate: (stat) =>
      `Global material extraction reached ${stat}, driving up supply chain costs and resource competition.`,
    solution:
      'Reduce virgin material demand through circular design, product longevity, and sufficiency strategies.',
    materials: 'Global material flows',
    circular_strategy: 'Reduce, Circular design',
  },
  {
    name: 'biomass',
    posKeywords: ['biomass', 'food', 'feed', 'agricultur', 'forest', 'land use', 'crop', 'pasture'],
    negKeywords: ['fossil', 'energy', 'emissions', 'waste', 'landfill'],
    allowedUnits: ['%', 'tonnes', 'billion', 'million', 'Gt'],
    problemTemplate: (stat) =>
      `Biomass extraction has reached ${stat}, causing deforestation, biodiversity loss, and soil degradation that threaten agricultural supply chains.`,
    solution:
      'Transition to regenerative agriculture, reduce food waste, shift towards plant‑based materials, and cascade biomass use.',
    materials: 'Biomass',
    circular_strategy: 'Regenerate, Cascading',
  },
  {
    name: 'fossil_fuels',
    posKeywords: ['fossil', 'coal', 'oil', 'gas', 'energy', 'emissions', 'ghg', 'fuel'],
    negKeywords: ['biomass', 'renewable', 'circularity'],
    allowedUnits: ['%', 'tonnes', 'billion', 'million', 'Gt', 'exajoules'],
    problemTemplate: (stat) =>
      `Fossil fuel consumption stands at ${stat}, exposing businesses to carbon pricing, regulatory risks, and price volatility.`,
    solution:
      'Accelerate electrification, scale renewable energy, improve systemic efficiency, and phase out fossil subsidies.',
    materials: 'Fossil fuels',
    circular_strategy: 'Energy transition, Systemic efficiency',
  },
  {
    name: 'virgin_non_renewable',
    posKeywords: ['virgin', 'non-renewable', 'landfill', 'waste', 'disposal', 'dump'],
    negKeywords: ['biomass', 'fossil', 'energy', 'circularity', 'recycl'],
    allowedUnits: ['%', 'tonnes', 'billion', 'million', 'Gt'],
    problemTemplate: (stat) =>
      `${stat} of materials are landfilled without recovery, representing lost value and increasing disposal costs.`,
    solution:
      'Design for recyclability, improve collection and recycling infrastructure, and implement extended producer responsibility.',
    materials: 'Mixed non-renewable',
    circular_strategy: 'Recycle, Recover',
  },
  {
    name: 'stock_buildup',
    posKeywords: [
      'stock',
      'building',
      'infrastructure',
      'construction',
      'floor space',
      'urban',
      'built-up',
    ],
    negKeywords: ['extraction', 'waste', 'landfill'],
    allowedUnits: ['%', 'tonnes', 'billion', 'million', 'Gt', 'square metres'],
    problemTemplate: (stat) =>
      `Rapid stock accumulation (${stat}) locks materials into long‑lived assets, delaying circular recovery and increasing future demolition waste.`,
    solution:
      'Prioritise renovation over new build, design for disassembly and reuse, and use low‑carbon, circular materials in construction.',
    materials: 'Construction minerals, metals',
    circular_strategy: 'Reuse, Design for longevity',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Remove spaced‑letter artifacts by merging runs of single‑letter tokens.
 */
function fixSpacedLetters(text) {
  const tokens = text.split(' ');
  const result = [];
  let i = 0;
  while (i < tokens.length) {
    const run = [];
    while (i < tokens.length) {
      const token = tokens[i].replace(/[^a-zA-Z]/g, '');
      if (token.length === 1) {
        run.push(tokens[i]);
        i++;
      } else {
        break;
      }
    }
    if (run.length >= 3) {
      const merged = run.map((t) => t.replace(/[^a-zA-Z]/g, '')).join('');
      const last = run[run.length - 1];
      const trailingPunct = last.replace(/[a-zA-Z]/g, '');
      result.push(merged + trailingPunct);
    } else {
      result.push(...run);
    }
    if (i < tokens.length) {
      result.push(tokens[i]);
      i++;
    }
  }
  return result.join(' ');
}

/**
 * Extract all statistics from a sentence.
 */
function extractStats(sentence) {
  const statsRegex =
    /([0-9]+(\.[0-9]+)?\s?(%|billion|million|Gt|tonnes|tons|t\/capita|exajoules|square metres))/gi;
  return sentence.match(statsRegex) || [];
}

/**
 * Determine the most relevant theme with confidence score.
 * Returns null if below threshold or no match.
 */
function classifyTheme(sentence, stats) {
  const lower = sentence.toLowerCase();
  let bestTheme = null;
  let bestScore = 0;

  for (const theme of THEMES) {
    let score = 0;
    // Positive keyword matches
    for (const kw of theme.posKeywords) {
      if (lower.includes(kw)) score += 1;
    }
    // Negative keyword matches reduce score
    for (const kw of theme.negKeywords) {
      if (lower.includes(kw)) score -= 1;
    }

    // Unit validation: at least one extracted statistic must have a unit allowed by theme
    if (stats.length > 0) {
      const unitOk = stats.some((stat) => {
        const unit = stat.replace(/[0-9\s.,]/g, '').toLowerCase();
        return theme.allowedUnits.some(
          (allowed) => unit.includes(allowed) || (allowed === '%' && stat.includes('%')),
        );
      });
      if (!unitOk) {
        // Penalize heavily if units don't match (but still possible if no stats? shouldn't happen)
        score -= 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  if (bestScore >= CONFIDENCE_THRESHOLD) {
    return bestTheme;
  }
  return null;
}

/**
 * Build a problem statement.
 */
function buildProblem(sentence, stats, theme) {
  const stat = stats[0] || 'unprecedented levels';
  let problem = theme.problemTemplate(stat);
  // If the template didn't use the sentence, append a brief context
  if (!problem.includes(sentence.substring(0, 30))) {
    const brief = sentence.length > 100 ? sentence.substring(0, 100) + '…' : sentence;
    problem = `${brief} ${problem}`;
  }
  return cleanText(problem);
}

/**
 * Extract full text from PDF and fix artifacts.
 */
async function extractPDFText() {
  const fileBuffer = await fs.readFile(inputFile);
  const data = new Uint8Array(fileBuffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  console.log(`PDF loaded. Pages: ${pdf.numPages}`);

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(' ') + '\n';
  }

  let cleaned = cleanText(fullText);
  cleaned = fixSpacedLetters(cleaned);
  return cleaned;
}

// =============================================================================
// MAIN
// =============================================================================
async function main() {
  console.log(`Reading PDF: ${inputFile}`);
  const text = await extractPDFText();

  const sentenceCandidates = text.split(/(?<=[.!?])\s+/);
  const rows = [];

  for (let rawSentence of sentenceCandidates) {
    const sentence = rawSentence.trim();
    if (sentence.length < MIN_SENTENCE_LENGTH || sentence.length > MAX_SENTENCE_LENGTH) continue;

    const stats = extractStats(sentence);
    if (stats.length === 0) continue;

    // Skip obvious non‑content markers
    if (
      /image|figure|table|source|note:|www\.|http|in support of|in collaboration with|about circle economy|acknowledgement|contributor|endnote|references/i.test(
        sentence,
      )
    )
      continue;

    const theme = classifyTheme(sentence, stats);
    if (!theme) continue; // drop if no confident theme

    const problem = buildProblem(sentence, stats, theme);

    rows.push({
      problem,
      solution: theme.solution,
      materials: theme.materials,
      circular_strategy: theme.circular_strategy,
      category: 'Circularity Gap Report 2025',
      impact: stats.join(', '),
      source_url: dataset.source_url,
      metadata_json: JSON.stringify({
        extracted_stats: stats,
        original_snippet: sentence.substring(0, 200),
      }),
    });
  }

  console.log(`Extracted ${rows.length} candidate rows.`);

  // Deduplicate based on problem text
  const unique = [];
  const seen = new Set();
  for (const row of rows) {
    const key = row.problem.slice(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }

  console.log(`After deduplication: ${unique.length} rows.`);

  // Write CSV using the helper (handles unquoted header, quoted data)
  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, unique);
  console.log(
    `✅ Wrote ${writeResult.writtenCount} rows to ${OUTPUT_PATH} (duplicate rows removed: ${writeResult.duplicateCount})`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
}
