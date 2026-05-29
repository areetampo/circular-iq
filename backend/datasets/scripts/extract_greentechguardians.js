
/**
 * Merges Green Tech Guardians JSONL/CSV, dedupes, and keeps top-scoring rows (MAX_ROWS).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';

import {
    cleanText,
    DATASET_KEYS,
    DATASET_LOOKUP,
    getDatasetProcessedCsvPath,
    getDatasetRawDir,
    verifyPathsExist,
    writeCsv,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

// -------------------- Configuration --------------------
const DATASET_KEY = DATASET_KEYS.gtg;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

// Expected files (all must exist)
const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(RAW_DIR, file),
);
verifyPathsExist(inputFiles);

const ai_earthhack_dataset = path.join(RAW_DIR, dataset.raw_folder_contents.ai_earthhack_dataset);

// Priority for JSONL files (higher = more fields, used for deduplication)
const PRIORITY = {
  [dataset.raw_folder_contents.training]: 3,
  [dataset.raw_folder_contents.validation]: 3,
  [dataset.raw_folder_contents.combined_sample]: 2,
  [dataset.raw_folder_contents.extracted_sample]: 1,
};

// Maximum number of rows to keep in the final CSV
const MAX_ROWS = 1400;
// -------------------------------------------------------

/**
 * Compute a quality score for a parsed record.
 * Higher score = higher quality.
 * JSONL rows with metadata score highest; CSV rows get a base score.
 *
 * @param {Record<string, unknown>} record - Parsed JSONL or CSV record with optional embedded/access/processing scores.
 * @returns {number} Ranking score used for deduped top-row selection.
 */
function computeQualityScore(record) {
  let score = 0;

  // embedded_value (0‑1) – most valuable signal
  if (record.embedded_value !== null && !isNaN(parseFloat(record.embedded_value))) {
    score += parseFloat(record.embedded_value) * 2;
  }

  // access_level (0‑1)
  if (record.access_level !== null && !isNaN(parseFloat(record.access_level))) {
    score += parseFloat(record.access_level) * 1;
  }

  // processing_level (0‑1)
  if (record.processing_level !== null && !isNaN(parseFloat(record.processing_level))) {
    score += parseFloat(record.processing_level) * 1;
  }

  // categories – non‑empty array adds a bonus
  if (record.categories && Array.isArray(record.categories) && record.categories.length > 0) {
    score += 0.5;
  }

  // Length of problem/solution (slight reward for longer descriptions)
  if (record.problem && typeof record.problem === 'string') {
    score += Math.min(record.problem.length / 500, 0.3);
  }
  if (record.solution && typeof record.solution === 'string') {
    score += Math.min(record.solution.length / 500, 0.3);
  }

  return score;
}

async function main() {
  // Read all JSONL files
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.jsonl'));
  logger.info({ count: files.length, files }, 'Found JSONL files');

  // Map to store unique records by (problem + solution) – deduplicates across files
  const records = new Map();

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const cleaned = content.replace(/:\s*NaN\b/g, ': null'); // clean NaN
    const lines = cleaned.split('\n').filter((line) => line.trim());

    logger.info({ file, lines: lines.length }, 'Processing file');

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (!data.problem || !data.solution) continue;

        const key = (data.problem + data.solution).replace(/\s+/g, ' ').trim();

        // Keep the record with highest priority (more fields)
        if (!records.has(key) || PRIORITY[file] > (records.get(key).priority || 0)) {
          records.set(key, { record: data, priority: PRIORITY[file] || 0 });
        }
      } catch (error) {
        logger.warn({ file, error }, 'Skipping invalid JSON');
      }
    }
  }

  logger.info({ unique: records.size }, 'Unique JSONL records after deduplication');

  // --- Read and merge AI_EarthHack_Dataset.csv ---
  const csvContent = fs.readFileSync(ai_earthhack_dataset, 'utf-8');
  const rows = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
  logger.info({ rows: rows.length }, 'EarthHack CSV rows');

  for (const row of rows) {
    const problem = row.problem?.trim();
    const solution = row.solution?.trim();
    if (!problem || !solution) continue;

    const key = (problem + solution).replace(/\s+/g, ' ').trim();
    if (!records.has(key)) {
      // Create a minimal record (priority 0)
      records.set(key, {
        record: {
          id: row.id,
          problem: cleanText(problem),
          solution: cleanText(solution),
          product: row.product || '',
          categories: [],
        },
        priority: 0,
      });
    }
  }

  logger.info({ total: records.size }, 'Total unique records after merging CSV');

  // Build final rows array with quality scores
  const finalRowsWithScore = [];
  for (const { record: data } of records.values()) {
    const problem = (data.problem || '').replace(/\n/g, ' ').trim();
    const solution = (data.solution || '').replace(/\n/g, ' ').trim();
    const materials = (data.product || '').replace(/\n/g, ' ').trim();

    let circular_strategy = '';
    if (data.categories && Array.isArray(data.categories)) {
      circular_strategy = data.categories.join(', ');
    } else if (data.categories) {
      circular_strategy = String(data.categories);
    }

    const metadataJson = JSON.stringify(data);

    const row = {
      id: data.id,
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials,
      circular_strategy,
      category: '',
      impact: '',
      source_url: dataset.url,
      metadata_json: metadataJson,
    };

    const score = computeQualityScore(data);
    finalRowsWithScore.push({ row, score });
  }

  // Sort descending by score and take top MAX_ROWS
  const sortedRows = finalRowsWithScore.sort((a, b) => b.score - a.score);
  const topRows = sortedRows.slice(0, MAX_ROWS).map((item) => item.row);

  logger.info({ selected: topRows.length, total: finalRowsWithScore.length }, 'Selected highest-quality rows');

  // Map to final CSV format
  const finalMapped = topRows.map((r) => ({
    problem: r.problem || '',
    solution: r.solution || '',
    materials: r.materials || '',
    circular_strategy: r.circular_strategy || '',
    category: r.category || '',
    impact: r.impact || '',
    source_url: r.source_url || '',
    metadata_json: typeof r.metadata_json === 'string' ? r.metadata_json : JSON.stringify(r),
  }));

  const writeResult = await writeCsv(DATASET_KEY, OUTPUT_PATH, finalMapped);
  logger.info(
    {
      writtenCount: writeResult.writtenCount,
      outputPath: OUTPUT_PATH,
      duplicateCount: writeResult.duplicateCount
    },
    'Written rows to output path (duplicate rows removed)'
  );

}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    logger.error({ error }, 'Fatal error');
    process.exit(1);
  });
}
