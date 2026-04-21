/**
 * Semantic Chunking Script for Circular Economy datasets
 *
 * Splits CSV rows into semantic chunks while preserving:
 * - Business problem + solution pairs
 * - Metadata for traceability
 * - Context for RAG retrieval
 *
 * INPUT: combined_input.csv (merged from all datasets/processed/*.csv files)
 * - Creates semantic chunks from problem/solution pairs
 * - Handles various CSV formats and column naming variations
 *
 * OUTPUT: Writes chunks.json to backend/datasets/out/
 * NEXT STEP: Run generate_embeddings.js to generate embeddings, then store_embeddings.js to store in Supabase
 *
 * NOTE: This script only processes CSV files locally.
 *       Embedding generation happens in generate_embeddings.js
 *       Supabase storage happens in store_embeddings.js using SUPABASE_SERVICE_ROLE_KEY
 *       (Service role is required because RLS policies protect the documents table)
 *
 * --archives flag -> takes input from archives/combined_input.csv and writes output to archives/chunks.json folder instead of normal out/ folder
 *
 * --final flag -> takes combined_input_final.csv as input instead of combined_input.csv
 *
 * NOTE: combined_input_final.csv only present in out/ and if --archives flag is there it simply takes combined_input.csv from archives/ hence, no both flags cannot be used together
 *
 * --enrich-scores flag -> calls OpenAI to enrich each record with estimated scores for the 8 factors (this will be slow and consume tokens, use with caution)
 */

import '#server/bootstrap.js';

import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parse } from 'csv-parse/sync';
import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  countWords,
  ENRICH_CONCURRENCY,
  extractMetadata,
  formatMetadataFromJson,
  getMetadataHighlights,
  sanitizeText,
  splitLongText,
  WORDS_PER_CHUNK,
} from '#config/chunk.js';
import {
  ARCHIVES_CHUNKS_JSON,
  ARCHIVES_COMBINED_INPUT_CSV,
  ARCHIVES_COMBINED_INPUT_FINAL_CSV,
  ARCHIVES_TEST_CHUNKS_JSON,
  ARCHIVES_TEST_COMBINED_INPUT_CSV,
  ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV,
  assertFileExists,
  ensureDir,
  OUT_CHUNKS_JSON,
  OUT_COMBINED_INPUT_CSV,
  OUT_COMBINED_INPUT_FINAL_CSV,
  OUT_TEST_CHUNKS_JSON,
  OUT_TEST_COMBINED_INPUT_CSV,
  OUT_TEST_COMBINED_INPUT_FINAL_CSV,
  writeJson,
} from '#pipeline/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const ENRICH_SCORES = process.argv.includes('--enrich-scores');
const useArchive = process.argv.includes('--archives');
const final = process.argv.includes('--final');
const test = process.argv.includes('--test');

const datasetPath = useArchive
  ? test
    ? final
      ? ARCHIVES_TEST_COMBINED_INPUT_FINAL_CSV
      : ARCHIVES_TEST_COMBINED_INPUT_CSV
    : final
      ? ARCHIVES_COMBINED_INPUT_FINAL_CSV
      : ARCHIVES_COMBINED_INPUT_CSV
  : test
    ? final
      ? OUT_TEST_COMBINED_INPUT_FINAL_CSV
      : OUT_TEST_COMBINED_INPUT_CSV
    : final
      ? OUT_COMBINED_INPUT_FINAL_CSV
      : OUT_COMBINED_INPUT_CSV;
assertFileExists(
  datasetPath,
  `${
    test
      ? final
        ? 'combined_input_final_test.csv'
        : 'combined_input_test.csv'
      : final
        ? 'combined_input_final.csv'
        : 'combined_input.csv'
  }`,
);
const outputPath = useArchive
  ? test
    ? ARCHIVES_TEST_CHUNKS_JSON
    : ARCHIVES_CHUNKS_JSON
  : test
    ? OUT_TEST_CHUNKS_JSON
    : OUT_CHUNKS_JSON;

// ensure output folder is ready (writeJson will also handle this later)
const outDir = path.dirname(outputPath);
await ensureDir(outDir);

const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

// ===== Helper functions =====

/**
 * Load and parse a generic CSV dataset
 * @param {string} csvFilePath - Path to an input CSV file (e.g. datasets/combined_input.csv)
 * @returns {Array} Array of parsed records
 */
export function loadDataset(csvFilePath) {
  // already checked if csvFilePath exists in main function using assertFileExists

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ',',
    quote: '"',
    relax_column_count: true,
  });

  logger.info({ recordCount: records.length }, 'Loaded records from dataset');
  return records;
}

/**
 * Call OpenAI to estimate the 8 factor scores for a given record.
 * @param {string} problemText
 * @param {string} solutionText
 * @param {Object} additionalFields -  Optional fields from the record (materials, category, circular_strategy, impact, etc.)
 * @returns {Promise<Object|null>} Scores object or null on failure
 */
async function enrichScores(problemText, solutionText, additionalFields = {}) {
  // Build context string from any additional fields that exist
  const contextParts = [];
  if (additionalFields.materials) contextParts.push(`Materials: ${additionalFields.materials}`);
  if (additionalFields.category) contextParts.push(`Category: ${additionalFields.category}`);
  if (additionalFields.circular_strategy)
    contextParts.push(`Circular strategy: ${additionalFields.circular_strategy}`);
  if (additionalFields.impact) contextParts.push(`Impact: ${additionalFields.impact}`);
  if (additionalFields.metadataHighlights) contextParts.push(additionalFields.metadataHighlights);
  const context = contextParts.length ? `\nAdditional context:\n${contextParts.join('\n')}` : '';

  const prompt = `
You are a circular economy expert. Based on the following business problem and solution, estimate realistic scores (0‑100) for the eight factors used in our evaluation framework:

- public_participation: How easily can stakeholders engage with the system? (0 = very difficult, 100 = universal access)
- infrastructure: Existing infrastructure availability and geographic reach (0 = none, 100 = excellent)
- market_price: Economic value of recovered materials and market demand (0 = needs subsidy, 100 = strong market)
- maintenance: Ease and cost of upkeep, system durability (0 = high maintenance, 100 = very easy)
- uniqueness: Innovation level and competitive advantage (0 = conventional, 100 = highly innovative)
- size_efficiency: Physical footprint and transportation efficiency (0 = very inefficient, 100 = highly efficient)
- chemical_safety: Environmental hazards and health risks (inverse scale: 0 = significant hazards, 100 = minimal risks)
- tech_readiness: Technology maturity and implementation complexity (0 = emerging, 100 = proven, ready)

Business Problem:
${problemText}

Business Solution:
${solutionText}
${context}

Return ONLY a JSON object with keys exactly as above and values between 0 and 100.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const scores = JSON.parse(response.choices[0].message.content);
    // Validate that all expected keys exist and are numbers
    const expected = [
      'public_participation',
      'infrastructure',
      'market_price',
      'maintenance',
      'uniqueness',
      'size_efficiency',
      'chemical_safety',
      'tech_readiness',
    ];
    for (const key of expected) {
      if (typeof scores[key] !== 'number' || scores[key] < 0 || scores[key] > 100) {
        throw new Error(`Invalid or missing score for ${key}`);
      }
    }
    return scores;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to enrich scores');
    return null;
  }
}

/**
 * Process dataset into semantic chunks
 * Preserves problem/solution pairs as foundational units
 * @param {Array} records - Parsed CSV records
 * @returns {Promise<Array>} Array of chunk objects with metadata
 */
export async function createChunks(records) {
  const chunks = [];
  // Dedup guard: tracks content hashes for secondary chunks to prevent identical
  // chunks (e.g. from near-duplicate CSV rows) from causing unique constraint violations
  const seenPrimaryHashes = new Map(); // contentHash → primaryChunkId
  const seenSecondaryHashes = new Set(); // content → (for dedup)

  // Pre-enrich scores concurrently in batches of ENRICH_CONCURRENCY.
  // In normal mode this is skipped entirely (ENRICH_SCORES=false).
  const precomputedScores = new Array(records.length).fill(null);
  if (ENRICH_SCORES) {
    logger.info(
      { recordCount: records.length, concurrency: ENRICH_CONCURRENCY },
      'Pre-enriching scores for records',
    );

    let enrichedCount = 0;
    for (let b = 0; b < records.length; b += ENRICH_CONCURRENCY) {
      const batchSlice = records.slice(b, Math.min(b + ENRICH_CONCURRENCY, records.length));
      await Promise.all(
        batchSlice.map((rec, off) => {
          const pText = sanitizeText(
            rec['problem'] || rec['Problem'] || rec['Business Problem'] || '',
          );
          const sText = sanitizeText(
            rec['solution'] || rec['Solution'] || rec['Business Solution'] || '',
          );
          const idx = b + off;
          const dKey = (rec['ID'] || '').split('_')[0] || 'unknown';
          const highlights = getMetadataHighlights(rec['metadata_json'] || '', dKey);
          return enrichScores(pText, sText, {
            materials: sanitizeText(rec['materials'] || rec['Materials'] || rec['Material'] || ''),
            category: sanitizeText(
              rec['category'] || rec['Category'] || rec['type'] || rec['Type'] || 'General',
            ),
            circular_strategy: sanitizeText(
              rec['circular_strategy'] || rec['Circular Strategy'] || '',
            ),
            impact: sanitizeText(rec['impact'] || rec['Impact'] || ''),
            metadataHighlights: highlights,
          }).then((s) => {
            precomputedScores[idx] = s;
          });
        }),
      );
      enrichedCount += batchSlice.length;

      // Log progress every few batches or at the end
      if (enrichedCount % (ENRICH_CONCURRENCY * 10) === 0 || enrichedCount === records.length) {
        logger.info({ enrichedCount, totalRecords: records.length }, 'Enrichment progress');
      }
    }
    logger.info('Score enrichment complete');
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Extract dataset key from ID (first part before underscore)
    const id = record['ID'] || '';
    const datasetKey = id.split('_')[0] || 'unknown';

    // Extract key fields - adjust column names based on actual CSV structure
    const problemText = sanitizeText(
      record['problem'] || record['Problem'] || record['Business Problem'] || '',
    );
    const solutionText = sanitizeText(
      record['solution'] || record['Solution'] || record['Business Solution'] || '',
    );
    const materials = sanitizeText(
      record['materials'] || record['Materials'] || record['Material'] || '',
    );
    const circularStrategy = sanitizeText(
      record['circular_strategy'] ||
        record['Circular Strategy'] ||
        record['circularity'] ||
        record['Circularity'] ||
        '',
    );
    const category = sanitizeText(
      record['category'] || record['Category'] || record['type'] || record['Type'] || 'General',
    );
    const impact = sanitizeText(
      record['impact'] || record['Impact'] || record['outcomes'] || record['Outcomes'] || '',
    );

    // Validate minimum content - be strict about quality
    if (!problemText || !solutionText) {
      logger.warn({ recordIndex: i }, 'Skipping record: missing problem or solution');
      continue;
    }

    // Enforce minimum length to filter out truncated/malformed records
    const MIN_PROBLEM_LENGTH = 20;
    const MIN_SOLUTION_LENGTH = 20;

    if (problemText.length < MIN_PROBLEM_LENGTH) {
      logger.warn(
        { recordIndex: i, problemLength: problemText.length, required: MIN_PROBLEM_LENGTH },
        'Skipping record: problem too short',
      );
      continue;
    }

    if (solutionText.length < MIN_SOLUTION_LENGTH) {
      logger.warn(
        { recordIndex: i, solutionLength: solutionText.length, required: MIN_SOLUTION_LENGTH },
        'Skipping record: solution too short',
      );
      continue;
    }

    // Check for low-quality content (all caps, repetitive, etc)
    const allCaps = (problemText.match(/[A-Z]/g) || []).length;
    if (allCaps / problemText.length > 0.8) {
      logger.warn({ recordIndex: i }, 'Skipping record: problem appears to be mostly uppercase');
      continue;
    }

    // Progress for large non-enrich datasets (enrich has its own counter)
    if (!ENRICH_SCORES && records.length > 500 && (i + 1) % 500 === 0) {
      logger.info({ current: i + 1, total: records.length }, 'Chunking progress');
    }

    // Use pre-enriched scores from the concurrent batch above (null if not enriching)
    const scores = precomputedScores[i];

    // Extract metadata for classification
    const metadata = extractMetadata(
      problemText,
      solutionText,
      materials,
      category,
      circularStrategy,
    );

    // Parse metadata_json and get a formatted summary
    const metadataJson = record['metadata_json'] || '';
    const metadataSummary = formatMetadataFromJson(metadataJson, datasetKey);

    // Build a complete fields object (same for primary and secondary)
    const fieldsObj = {
      problem: problemText,
      solution: solutionText,
      materials: materials,
      circular_strategy: circularStrategy,
      impact: impact,
      source_url: record['source_url'] || record['Source URL'] || null,
      metadata_json: metadataJson,
    };

    // Copy any extra columns from the original record into fieldsObj (avoid overwriting existing keys)
    for (const [k, v] of Object.entries(record)) {
      const key = String(k).trim();
      if (!key) continue;
      const excluded = [
        'problem',
        'Problem',
        'Business Problem',
        'solution',
        'Solution',
        'Business Solution',
        'materials',
        'Materials',
        'Material',
        'circular_strategy',
        'Circular Strategy',
        'circularity',
        'Circularity',
        'category',
        'Category',
        'type',
        'Type',
        'impact',
        'Impact',
        'outcomes',
        'Outcomes',
        'source_url',
        'Source URL',
        'metadata_json',
        'ID',
      ];
      if (excluded.includes(key)) continue;
      try {
        const normalized = sanitizeText(record[k]);
        if (normalized && !(key in fieldsObj)) {
          fieldsObj[key] = normalized;
        }
      } catch {
        // ignore
      }
    }

    // Create primary chunk: Problem + Solution (always together)
    const primaryContent = `Problem: ${problemText}\n\nSolution: ${solutionText}`;
    const primaryContentHash = createHash('sha1').update(primaryContent).digest('hex');
    let primaryChunkId;

    if (seenPrimaryHashes.has(primaryContentHash)) {
      // Duplicate primary chunk – reuse existing ID
      primaryChunkId = seenPrimaryHashes.get(primaryContentHash);
    } else {
      // Create new primary chunk
      const primaryChunk = {
        id: `row_${i}_chunk_0`,
        source_row: i,
        chunk_index: 0,
        content: primaryContent,
        metadata: {
          category,
          source:
            record['source'] ||
            record['Source'] ||
            record['source_url'] ||
            record['Source URL'] ||
            null,
          chunk_type: 'primary',
          source_id: record['ID'] || `row_${i}`,
          industry: metadata.industry,
          scale: metadata.scale,
          r_strategy: metadata.r_strategy,
          primary_material: metadata.primary_material,
          geographic_focus: metadata.geographic_focus,
          fields: fieldsObj,
          scores,
        },
        word_count: countWords(primaryContent),
      };
      chunks.push(primaryChunk);
      primaryChunkId = primaryChunk.id;
      seenPrimaryHashes.set(primaryContentHash, primaryChunkId);
    }

    // Create secondary chunks if additional context exists
    const secondaryParts = [];
    if (materials) secondaryParts.push(`Materials: ${materials}`);
    if (circularStrategy) secondaryParts.push(`Circular Strategy: ${circularStrategy}`);
    if (impact) secondaryParts.push(`Impact: ${impact}`);
    if (metadataSummary) secondaryParts.push(metadataSummary);

    if (secondaryParts.length > 0) {
      const secondaryContent = `Problem: ${problemText}\n\nSolution: ${solutionText}\n\n${secondaryParts.join('\n\n')}`;
      const wordCount = countWords(secondaryContent);

      if (seenSecondaryHashes.has(secondaryContent)) {
        logger.warn(
          { rowIndex: i },
          'Skipping duplicate secondary chunk: identical content already seen',
        );
      } else {
        seenSecondaryHashes.add(secondaryContent);

        if (wordCount > WORDS_PER_CHUNK * 1.5) {
          const subChunks = splitLongText(secondaryContent, WORDS_PER_CHUNK);
          subChunks.forEach((subContent, subIdx) => {
            chunks.push({
              id: `row_${i}_chunk_${subIdx + 1}`,
              source_row: i,
              chunk_index: subIdx + 1,
              content: subContent,
              metadata: {
                category,
                chunk_type: 'secondary',
                source_id: record['ID'] || `row_${i}`,
                parent_chunk: primaryChunkId,
                industry: metadata.industry,
                scale: metadata.scale,
                r_strategy: metadata.r_strategy,
                primary_material: metadata.primary_material,
                geographic_focus: metadata.geographic_focus,
                fields: fieldsObj,
                scores,
              },
              word_count: countWords(subContent),
            });
          });
        } else {
          chunks.push({
            id: `row_${i}_chunk_1`,
            source_row: i,
            chunk_index: 1,
            content: secondaryContent,
            metadata: {
              category,
              chunk_type: 'secondary',
              source_id: record['ID'] || `row_${i}`,
              parent_chunk: primaryChunkId,
              industry: metadata.industry,
              scale: metadata.scale,
              r_strategy: metadata.r_strategy,
              primary_material: metadata.primary_material,
              geographic_focus: metadata.geographic_focus,
              fields: fieldsObj,
              scores,
            },
            word_count: countWords(secondaryContent),
          });
        }
      }
    }
  }

  logger.info(
    { chunkCount: chunks.length, recordCount: records.length },
    'Created semantic chunks',
  );
  return chunks;
}

/**
 * Save chunks to JSON file
 * @param {Array} chunks - Array of chunk objects
 * @param {string} outputPath - Output file path
 */
export async function saveChunksToFile(chunks, outputPath) {
  try {
    await writeJson(outputPath, chunks);
  } catch (err) {
    throw new Error(`Failed to write chunks file: ${err.message}`);
  }

  // Log statistics
  const stats = {
    total_chunks: chunks.length,
    total_words: chunks.reduce((sum, c) => sum + c.word_count, 0),
    avg_words_per_chunk: Math.round(
      chunks.reduce((sum, c) => sum + c.word_count, 0) / chunks.length,
    ),
    primary_chunks: chunks.filter((c) => c.metadata.chunk_type === 'primary').length,
    secondary_chunks: chunks.filter((c) => c.metadata.chunk_type === 'secondary').length,
    categories: [...new Set(chunks.map((c) => c.metadata.category))],
  };

  logger.info({ outputPath, chunkCount: chunks.length }, 'Chunks saved to file');
  logger.info(stats, 'Chunking statistics');
}

/**
 * Main execution
 * Loads dataset, creates chunks, and saves to file
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  logger.info(
    {
      enrichScores: ENRICH_SCORES,
      useArchive,
      final,
      test,
      datasetPath,
      outputPath,
    },
    'Starting chunk generation',
  );

  (async () => {
    try {
      const records = loadDataset(datasetPath);
      const chunks = await createChunks(records);
      await saveChunksToFile(chunks, outputPath);
      logger.info('Chunking complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Fatal error during chunking');
      process.exit(1);
    }
  })().catch((err) => {
    logger.error({ err }, 'Unhandled rejection');
    process.exit(1);
  });
}
