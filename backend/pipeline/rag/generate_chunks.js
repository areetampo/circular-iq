/**
 * Pipeline step: `combined_input*.csv` → `chunks.json` (semantic splits for RAG).
 * Flags: `--archives`, `--final` (mutually exclusive), `--enrich-scores` (OpenAI factor estimates).
 * Next: `generate_embeddings.js`, then `store_embeddings.js`.
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
} from '#utils/chunk.js';
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
} from '#utils/datasetsUtils.js';
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

// Fail early if the selected output directory is not writable.
const outDir = path.dirname(outputPath);
await ensureDir(outDir);

const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

// ===== Helper functions =====

/**
 * Parses a combined-input CSV into row objects keyed by header names.
 *
 * @param {string} csvFilePath - Path to the selected combined input CSV.
 * @returns {Array<Record<string, string>>} Parsed records from the CSV header columns.
 * @throws {Error} If the file cannot be read or parsed.
 */
export function loadDataset(csvFilePath) {
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
 * Calls OpenAI to estimate the eight factor scores for one record.
 *
 * @param {string} problemText - Business problem text sent to the scoring prompt.
 * @param {string} solutionText - Circular solution text sent to the scoring prompt.
 * @param {{ materials?: string, category?: string, circular_strategy?: string, impact?: string, metadataHighlights?: string }} additionalFields - Optional record fields included as context for score estimation.
 * @returns {Promise<Record<string, number>|null>} Eight-factor score object, or null when enrichment fails.
 */
async function enrichScores(problemText, solutionText, additionalFields = {}) {
  // Only include populated fields so sparse rows do not add empty prompt noise.
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
    // Reject malformed model output so callers can fall back to null scores.
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
    logger.warn({ error }, 'Failed to enrich scores');
    return null;
  }
}

/**
 * Converts dataset records into primary problem/solution chunks plus optional secondary context.
 * Duplicate primary content reuses the first primary chunk ID, and duplicate secondary content is skipped.
 *
 * @param {Array<Record<string, string|number|null|undefined>>} records - Parsed CSV records keyed by source column name.
 * @returns {Promise<Array<{ id: string, source_row: number, chunk_index: number, content: string, word_count: number, metadata: Record<string, unknown> }>>} Generated chunk objects with source row metadata and optional enriched scores.
 */
export async function createChunks(records) {
  const chunks = [];
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

    const id = record['ID'] || '';
    const datasetKey = id.split('_')[0] || 'unknown';

    // Source CSVs use several casing conventions for the same canonical fields.
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

    // Problem and solution are the minimum viable semantic pair for retrieval.
    if (!problemText || !solutionText) {
      logger.warn({ recordIndex: i }, 'Skipping record: missing problem or solution');
      continue;
    }

    // These thresholds filter truncated rows that pass presence checks but are unusable.
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

    // Mostly-uppercase problem text is usually scraped navigation or malformed source data.
    const allCaps = (problemText.match(/[A-Z]/g) || []).length;
    if (allCaps / problemText.length > 0.8) {
      logger.warn({ recordIndex: i }, 'Skipping record: problem appears to be mostly uppercase');
      continue;
    }

    // Enrichment mode logs progress during precomputation instead.
    if (!ENRICH_SCORES && records.length > 500 && (i + 1) % 500 === 0) {
      logger.info({ current: i + 1, total: records.length }, 'Chunking progress');
    }

    const scores = precomputedScores[i];

    const metadata = extractMetadata(
      problemText,
      solutionText,
      materials,
      category,
      circularStrategy,
    );

    const metadataJson = record['metadata_json'] || '';
    const metadataSummary = formatMetadataFromJson(metadataJson, datasetKey);

    // Store full source fields on every chunk so field-level embeddings can be generated later.
    const fieldsObj = {
      problem: problemText,
      solution: solutionText,
      materials: materials,
      circular_strategy: circularStrategy,
      impact: impact,
      source_url: record['source_url'] || record['Source URL'] || null,
      metadata_json: metadataJson,
    };

    // Preserve extra source columns without overwriting canonical fields.
    const EXCLUDED_FIELDS = new Set([
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
    ]);

    for (const k of Object.keys(record)) {
      const key = String(k).trim();
      if (!key || EXCLUDED_FIELDS.has(key)) continue;
      try {
        const normalized = sanitizeText(record[k]);
        if (normalized && !(key in fieldsObj)) {
          fieldsObj[key] = normalized;
        }
      } catch {
        // Skip values that cannot be normalized; the canonical fields remain available.
      }
    }

    // Keep problem and solution together so retrieval returns a complete case.
    const primaryContent = `Problem: ${problemText}\n\nSolution: ${solutionText}`;
    const primaryContentHash = createHash('sha1').update(primaryContent).digest('hex');
    let primaryChunkId;

    if (seenPrimaryHashes.has(primaryContentHash)) {
      primaryChunkId = seenPrimaryHashes.get(primaryContentHash);
    } else {
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

    // Secondary chunks add searchable context only when the row contains it.
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
 * Writes chunk objects to JSON and logs aggregate chunk statistics.
 *
 * @param {Array<{ id: string, content: string, word_count: number, metadata: Record<string, unknown> }>} chunks - Chunk objects ready for JSON serialization.
 * @param {string} outputPath - Destination path for the chunks JSON file.
 * @throws {Error} If the chunks file cannot be written.
 */
export async function saveChunksToFile(chunks, outputPath) {
  try {
    await writeJson(outputPath, chunks);
  } catch (error) {
    throw new Error(`Failed to write chunks file: ${error.message}`);
  }

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
 * CLI entry that loads the selected dataset, creates chunks, and saves them to disk.
 * Only runs when this file is executed directly.
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
      logger.error({ error }, 'Fatal error during chunking');
      process.exit(1);
    }
  })().catch((error) => {
    logger.error({ error }, 'Unhandled rejection');
    process.exit(1);
  });
}
