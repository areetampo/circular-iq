/* global process */

/**
 * Embedding Generation Script
 *
 * Processes chunks and generates embeddings using OpenAI.
 * Reads pre-generated chunks from generate_chunks.js output.
 * Stores embeddedChunks in backend/datasets/out/ for later storage in Supabase.
 *
 * Usage: node generate_embeddings.js [options]
 * Options:
 *   --archives           Use archives paths
 *   --dry-run            Generate fake embeddings locally
 *   --skip-fields        Only embed chunk content, not individual fields
 *   --resume             Resume from existing progress file
 *
 * Important: If using --archives or --skip-fields, use the same flags when resuming.
 * Do not delete or modify the output file between runs – it’s your checkpoint.
 *
 * Defaults: datasets/out~archives/chunks.json → datasets/out~archives/embedded_chunks.json
 *
 * Uses centralized embedding configuration from backend/src/config/embedding.js
 */

import '#server/bootstrap.js';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import {
  CHUNKS_JSON,
  ARCHIVES_CHUNKS_JSON,
  ARCHIVES_EMBEDDED_CHUNKS_JSON,
  EMBEDDED_CHUNKS_JSON,
  writeJson,
  prepareWrite,
  assertFileExists,
} from '#utils/datasetsUtils.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_REQUEST_TIMEOUT_MS,
  EMBEDDING_MAX_RETRIES,
  EMBEDDING_RETRY_DELAY_MS,
  isValidTextForEmbedding,
  isValidEmbedding,
  ratePerMillion,
  estimatedCost,
} from '#config/embedding.js';
import { fileURLToPath } from 'url';

// ================= CONFIGURATION =================
// determine whether to operate on archives paths
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');

// ensure the source chunks file exists early to fail fast
assertFileExists(CHUNKS_JSON, 'chunks.json');

// dry‑run mode if no API key or explicitly requested
const DRY_RUN = process.argv.includes('--dry-run') || !BACKEND_CONFIG.openai.apiKey;

// optionally skip field‑level embeddings (default is to include them)
const SKIP_FIELDS = process.argv.includes('--skip-fields');

// resume mode
const RESUME = process.argv.includes('--resume');

// prepare OpenAI client (skipped in dry run)
let openai = null;
if (!DRY_RUN) {
  openai = new OpenAI({
    apiKey: BACKEND_CONFIG.openai.apiKey,
    timeout: EMBEDDING_REQUEST_TIMEOUT_MS,
  });
}

// rough token estimation (same as in chunking)
const TOKENS_PER_WORD = 1.3;

// safe limit – OpenAI's text-embedding-ada-002 has max 8191 tokens; we'll warn at 8000
const MAX_SAFE_TOKENS = 8000;

// ================= HELPERS =================

/**
 * Estimate token count for a string.
 * @private
 */
function estimateTokens(text) {
  return Math.ceil(text.trim().split(/\s+/).length * TOKENS_PER_WORD);
}

/**
 * Generate deterministic pseudo-embedding for testing
 * @private
 */
function fakeEmbedding(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const vec = new Array(EMBEDDING_DIMENSION);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    vec[i] = ((h + i * 2654435761) % 1000) / 1000;
  }
  return vec;
}

/**
 * Retry logic with exponential backoff
 * @private
 */
async function retryWithBackoff(fn, maxRetries = EMBEDDING_MAX_RETRIES) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = EMBEDDING_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`  ⚠️️ Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ----- I/O helpers -----

/**
 * Load pre-generated chunks from generate_chunks.js output
 * @param {string} chunksFilePath - Path to chunks.json
 * @returns {Array} Array of chunk objects
 * @throws {Error} If file not found or invalid JSON
 */
export function loadChunks(chunksFilePath) {
  if (!fs.existsSync(chunksFilePath)) {
    throw new Error(`Chunks file not found at ${chunksFilePath}`);
  }

  try {
    const fileContent = fs.readFileSync(chunksFilePath, 'utf-8');
    const chunks = JSON.parse(fileContent);

    if (!Array.isArray(chunks)) {
      throw new Error('Chunks file must contain a JSON array');
    }

    console.log(`✓ Loaded ${chunks.length} chunks from ${chunksFilePath}`);
    return chunks;
  } catch (error) {
    throw new Error(`Failed to load chunks: ${error.message}`);
  }
}

// ================= CORE LOGIC =================

/**
 * Generate embeddings for chunks using OpenAI with retry logic
 * @param {Array} chunks - Array of chunk objects
 * @returns {Promise<Array>} Chunks with embedded vectors
 * @throws {Error} If embedding generation fails after retries
 */
export async function generateEmbeddings(chunks, opts = {}) {
  const { progressPath = null, resume = false } = opts;

  console.log(`\nGenerating embeddings for ${chunks.length} chunks...`);
  console.log(`  Model: ${EMBEDDING_MODEL}`);
  console.log(`  Dimension: ${EMBEDDING_DIMENSION}`);
  if (SKIP_FIELDS) console.log('  Field‑level embeddings: disabled');
  console.log('');

  // Prepare progress file: clear if not resuming, otherwise keep
  if (progressPath && !resume) {
    await prepareWrite(progressPath, { clear: true });
  }

  // Set of already processed items (if resuming)
  const processedItems = new Set();
  if (resume && progressPath && fs.existsSync(progressPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
      existing.forEach((chunk) => {
        const chunkId = chunk.id;
        if (chunk.embeddings?.doc) processedItems.add(`${chunkId}:doc`);
        if (chunk.embeddings?.fields) {
          Object.keys(chunk.embeddings.fields).forEach((field) => {
            processedItems.add(`${chunkId}:${field}`);
          });
        }
      });
      console.log(`  Resuming: found ${processedItems.size} already embedded items.`);
    } catch (e) {
      console.warn(`  ⚠️️ Failed to read progress file for resuming: ${e.message}`);
    }
  }

  const embeddedChunks = [];

  // Flatten chunks into items to batch-embed
  const items = [];
  const tokenEstimates = [];

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const chunkId = chunk.id;

    // Validate and add doc-level text
    if (isValidTextForEmbedding(chunk.content)) {
      const tokens = estimateTokens(chunk.content);
      if (tokens > MAX_SAFE_TOKENS) {
        console.warn(
          `  ⚠️ Chunk ${c} (${chunk.id}) has ~${tokens} tokens, which may exceed the model limit. Consider shortening.`,
        );
      }
      if (!processedItems.has(`${chunkId}:doc`)) {
        items.push({ chunkIdx: c, fieldName: 'doc', text: chunk.content });
        tokenEstimates.push(tokens);
      }
    }

    // Add field-level texts (skip if --skip-fields)
    if (!SKIP_FIELDS) {
      const fields = (chunk.metadata && chunk.metadata.fields) || {};
      for (const [fname, ftext] of Object.entries(fields)) {
        // Skip the full metadata_json field – it's already parsed and included in the summary
        if (fname === 'metadata_json') continue;
        if (isValidTextForEmbedding(ftext)) {
          const text = String(ftext).trim();
          const tokens = estimateTokens(text);
          if (!processedItems.has(`${chunkId}:${fname}`)) {
            items.push({ chunkIdx: c, fieldName: fname, text });
            tokenEstimates.push(tokens);
          }
        }
      }
    }
  }

  if (items.length === 0) {
    console.warn('⚠️️ No new text items to embed (all were already done or below minimum length)');
    return chunks;
  }

  const totalTokens = tokenEstimates.reduce((a, b) => a + b, 0);
  console.log(`  Prepared ${items.length} embedding requests across ${chunks.length} chunks`);
  console.log(`  Estimated total tokens: ~${totalTokens.toLocaleString()}`);
  console.log(
    `  Approximate cost (${EMBEDDING_MODEL} @ $${ratePerMillion}/1M tokens): $${estimatedCost(totalTokens).toFixed(4)}`,
  );

  // Process in batches
  let totalProcessedTokens = 0;
  const startTime = Date.now();

  for (let i = 0; i < items.length; i += EMBEDDING_BATCH_SIZE) {
    const batchItems = items.slice(i, Math.min(i + EMBEDDING_BATCH_SIZE, items.length));
    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / EMBEDDING_BATCH_SIZE);
    const batchTokens = tokenEstimates.slice(i, i + batchItems.length).reduce((a, b) => a + b, 0);

    console.log(
      `  Processing batch ${batchNum}/${totalBatches} (${batchItems.length} items, ~${batchTokens} tokens)...`,
    );

    // Estimate time remaining after first batch
    if (batchNum === 1 && totalBatches > 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const etaSeconds = (elapsed / batchItems.length) * (items.length - i - batchItems.length);
      const etaMinutes = Math.ceil(etaSeconds / 60);
      console.log(`    Estimated time remaining: ~${etaMinutes} minutes`);
    }

    if (DRY_RUN) {
      // Generate fake embeddings locally
      batchItems.forEach((it) => {
        const { chunkIdx, fieldName, text } = it;
        if (!chunks[chunkIdx]._embeddings) {
          chunks[chunkIdx]._embeddings = { fields: {}, doc: null };
        }
        const vec = fakeEmbedding(text);
        if (fieldName === 'doc') {
          chunks[chunkIdx]._embeddings.doc = vec;
        } else {
          chunks[chunkIdx]._embeddings.fields[fieldName] = vec;
        }
      });
      totalProcessedTokens += batchTokens;
      console.log(`    ✓ Generated ${batchItems.length} fake embeddings`);
    } else {
      try {
        // Call OpenAI API with retry logic
        const response = await retryWithBackoff(async () => {
          return await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: batchItems.map((it) => it.text),
            encoding_format: 'float',
          });
        });

        // Validate embedding structure
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid OpenAI response structure');
        }

        if (response.data.length !== batchItems.length) {
          throw new Error(
            `Embedding count mismatch: requested ${batchItems.length}, got ${response.data.length}`,
          );
        }

        // Validate each embedding dimension
        let validCount = 0;
        for (let idx = 0; idx < response.data.length; idx++) {
          const embObj = response.data[idx];
          const embedding = embObj.embedding;

          if (!isValidEmbedding(embedding)) {
            console.error(
              `    ✗ Invalid embedding at index ${idx}: dimension mismatch or non-numeric values`,
            );
            throw new Error(`Invalid embedding returned for item ${idx}`);
          }

          // Stitch back to chunk
          const { chunkIdx, fieldName } = batchItems[idx];
          if (!chunks[chunkIdx]._embeddings) {
            chunks[chunkIdx]._embeddings = { fields: {}, doc: null };
          }

          if (fieldName === 'doc') {
            chunks[chunkIdx]._embeddings.doc = embedding;
          } else {
            chunks[chunkIdx]._embeddings.fields[fieldName] = embedding;
          }
          validCount++;
        }

        totalProcessedTokens += batchTokens;
        console.log(`    ✓ Generated and validated ${validCount} embeddings`);

        // Rate limiting delay between batches
        if (i + EMBEDDING_BATCH_SIZE < items.length) {
          await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
        }
      } catch (error) {
        const errorMsg = error.message || String(error);
        console.error(`  ✗ Batch ${batchNum} failed: ${errorMsg}`);
        throw new Error(`Embedding generation failed at batch ${batchNum}: ${errorMsg}`);
      }
    }

    // if progress path provided write current state of embedded chunks
    if (progressPath) {
      try {
        const partial = chunks.map((chunk) => ({
          ...chunk,
          embeddings: chunk._embeddings || { doc: null, fields: {} },
          embedding_model: EMBEDDING_MODEL,
          embedding_dimension: EMBEDDING_DIMENSION,
          created_at: new Date().toISOString(),
        }));
        await writeJson(progressPath, partial);
      } catch (e) {
        console.warn(`⚠️️ failed to flush progress after batch ${batchNum}:`, e.message);
      }
    }
  }

  // Build output preserving original chunks + embeddings
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    embeddedChunks.push({
      ...chunk,
      embeddings: chunk._embeddings || { doc: null, fields: {} },
      embedding_model: EMBEDDING_MODEL,
      embedding_dimension: EMBEDDING_DIMENSION,
      created_at: new Date().toISOString(),
    });
    // Clean up temporary property to avoid leaking memory
    if (chunks[c]._embeddings) delete chunks[c]._embeddings;
  }

  // Do NOT write final embeddedChunks to progressPath here – that will be done by saveEmbeddedChunks in main

  console.log(`\n✓ Successfully generated embeddings for ${embeddedChunks.length} chunks`);
  console.log(`  Estimated total tokens processed: ~${totalProcessedTokens.toLocaleString()}\n`);
  return embeddedChunks;
}

// ================= SAVE THE EMBEDDED CHUNKS =================

/**
 * Save embedded chunks to JSON file
 * @param {Array} embeddedChunks - Chunks with embeddings
 * @param {string} outputPath - Output file path
 */
export async function saveEmbeddedChunks(embeddedChunks, outputPath) {
  try {
    await writeJson(outputPath, embeddedChunks);
  } catch (err) {
    throw new Error(`Failed to write embedded chunks: ${err.message}`);
  }

  console.log(`✓ Saved ${embeddedChunks.length} embedded chunks to ${outputPath}`);
}

// ================= MAIN EXECUTION PIPELINE =================

/**
 * Main execution pipeline
 * @async
 */
export async function main() {
  const chunksPath = useArchive ? ARCHIVES_CHUNKS_JSON : CHUNKS_JSON;
  const outputPath = useArchive ? ARCHIVES_EMBEDDED_CHUNKS_JSON : EMBEDDED_CHUNKS_JSON;
  if (useArchive) console.log('⚠️️️  running in archives mode; using archives folder paths');

  try {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  Embedding Generation Pipeline                                     ║');
    console.log('║  Circular Economy Business Auditor                                 ║');
    console.log(`║  Model: ${EMBEDDING_MODEL}                                    ║`);
    console.log(
      `║  Dimension: ${EMBEDDING_DIMENSION}                                              ║`,
    );
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    console.log(`Input: ${chunksPath}`);

    // Step 1: Load chunks
    const chunks = loadChunks(chunksPath);

    // Step 2: Generate embeddings with full error handling
    // provide the desired output path so the routine will flush progress
    // to disk after each batch (useful for large datasets and dry runs)
    const embeddedChunks = await generateEmbeddings(chunks, {
      progressPath: outputPath,
      resume: RESUME,
    });

    // Step 3: Save embedded chunks
    await saveEmbeddedChunks(embeddedChunks, outputPath);

    // Success summary
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  ✓ EMBEDDING GENERATION COMPLETE                                   ║');
    console.log(`║  Processed: ${chunks.length} chunks → ${embeddedChunks.length} embedded      ║`);
    console.log(
      `║  Output: ${path.relative(process.cwd(), outputPath)}                          ║`,
    );
    console.log('║  Next: npm run store to save embeddings to Supabase                ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n✗ EMBEDDING GENERATION FAILED');
    console.error(`✗ ${error.message}\n`);
    process.exit(1);
  }
}

// Self-executing module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n✗ Fatal error:', err.message);
    process.exit(1);
  });
}
