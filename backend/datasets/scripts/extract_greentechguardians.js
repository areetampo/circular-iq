/**
 * extract_greentechguardians.js
 *
 * Extracts green technology and sustainability innovation data from the Green Tech
 * Guardians JSONL dataset. Processes training, validation, and sample JSONL files
 * with intelligent merging and deduplication. Prioritizes files with more comprehensive
 * metadata and field coverage. Generates structured entries about green tech innovations.
 *
 * Features:
 *   - JSONL (JSON Lines) parsing and merging from multiple sources
 *   - File priority-based weighting (training > validation > samples)
 *   - Intelligent deduplication by primary identifier
 *   - Metadata preservation and aggregation across sources
 *   - Problem/solution extraction from innovation descriptions
 *   - Automatic ID generation with dataset key prefix
 *   - Centralized CSV writing with directory creation and file locking
 *   - Flexible field mapping for heterogeneous data sources
 *
 * Usage:
 *   node extract_greentechguardians.js
 *
 * Input: Multiple JSONL files with green tech innovation data
 * Output: CSV file with ID, problem, solution, materials, circular_strategy, category, impact, source_url, metadata_json
 * Configuration: PRIORITY object defines merge order and field preference
 */

/* global process */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import {
  formatId,
  cleanText,
  DATASET_LOOKUP,
  DATASET_KEYS,
  getDatasetRawDir,
  getDatasetProcessedCsvPath,
  ensureDir,
  writeCsv,
  verifyPathsExist,
} from '#utils/datasetsUtils.js';
import { fileURLToPath } from 'url';

// Configuration
const DATASET_KEY = DATASET_KEYS.gtg;
const dataset = DATASET_LOOKUP[DATASET_KEY];
const RAW_DIR = getDatasetRawDir(DATASET_KEY);
verifyPathsExist(RAW_DIR);

const OUTPUT_PATH = getDatasetProcessedCsvPath(DATASET_KEY);

const inputFiles = Object.values(dataset.raw_folder_contents).map((file) =>
  path.join(RAW_DIR, file),
);
verifyPathsExist(inputFiles);

// Priority for JSONL files (higher number = more fields)
const PRIORITY = {
  [dataset.raw_folder_contents.training]: 3,
  [dataset.raw_folder_contents.validation]: 3,
  [dataset.raw_folder_contents.combined_sample]: 2,
  [dataset.raw_folder_contents.extracted_sample]: 1,
};

async function main() {
  // Ensure output directory exists
  await ensureDir(path.dirname(OUTPUT_PATH));

  // Read all JSONL files
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.jsonl'));

  if (files.length === 0) {
    console.error('No JSONL files found in', RAW_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} JSONL files:`, files);

  // Map to store unique records by (problem + solution) to deduplicate
  const records = new Map();

  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    // Replace NaN to avoid JSON parse errors
    const cleaned = content.replace(/:\s*NaN\b/g, ': null');
    const lines = cleaned.split('\n').filter((line) => line.trim());

    console.log(`Processing ${file} (${lines.length} lines)`);

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        // Skip rows without problem or solution
        if (!data.problem || !data.solution) continue;

        const key = (data.problem + data.solution).replace(/\s+/g, ' ').trim();

        if (!records.has(key) || PRIORITY[file] > (records.get(key).priority || 0)) {
          // Store the record with its priority
          records.set(key, { record: data, priority: PRIORITY[file] || 0 });
        }
      } catch (e) {
        console.warn(`Skipping invalid JSON in ${file}: ${e.message}`);
      }
    }
  }

  console.log(`Unique JSONL records after deduplication: ${records.size}`);

  // Now process the EarthHack CSV to add additional raw examples
  const csvPath = path.join(RAW_DIR, 'AI_EarthHack_Dataset.csv');
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`EarthHack CSV has ${rows.length} rows`);

    for (const row of rows) {
      const problem = row.problem?.trim();
      const solution = row.solution?.trim();
      if (!problem || !solution) continue;

      const key = (problem + solution).replace(/\s+/g, ' ').trim();
      if (!records.has(key)) {
        // Create a minimal record
        records.set(key, {
          record: {
            id: row.id,
            problem: cleanText(problem),
            solution: cleanText(solution),
            product: '',
            categories: [],
            // No other fields
          },
          priority: 0, // lowest priority
        });
      }
    }
  } else {
    console.warn('EarthHack CSV not found, skipping');
  }

  console.log(`Total unique records after merging CSV: ${records.size}`);

  // Build final rows
  const finalRows = [];
  for (const { record: data } of records.values()) {
    // Map fields
    const problem = (data.problem || '').replace(/\n/g, ' ').trim();
    const solution = (data.solution || '').replace(/\n/g, ' ').trim();
    const materials = (data.product || '').replace(/\n/g, ' ').trim();

    let circular_strategy = '';
    if (data.categories && Array.isArray(data.categories)) {
      circular_strategy = data.categories.join(', ');
    } else if (data.categories) {
      circular_strategy = String(data.categories);
    }

    // Preserve original data in metadata_json
    const metadataJson = JSON.stringify(data);

    finalRows.push({
      id: data.id,
      problem: cleanText(problem),
      solution: cleanText(solution),
      materials,
      circular_strategy,
      category: '',
      impact: '',
      source_url: dataset.url || 'https://www.greentechguardians.com',
      metadata_json: metadataJson,
    });
  }

  // Write CSV using writeCsv (handles quoting, directory, locking)
  const finalMapped = finalRows.map((r) => ({
    problem: r.problem || '',
    solution: r.solution || '',
    materials: r.materials || '',
    circular_strategy: r.circular_strategy || '',
    category: r.category || '',
    impact: r.impact || '',
    source_url: r.source_url || '',
    metadata_json: typeof r.metadata_json === 'string' ? r.metadata_json : JSON.stringify(r),
  }));

  await writeCsv(DATASET_KEY, OUTPUT_PATH, finalMapped);
  console.log(`✅ Written ${finalMapped.length} rows to ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}
