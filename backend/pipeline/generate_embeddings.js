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
  EMBEDDED_CHUNKS_JSONL,
  ARCHIVES_EMBEDDED_CHUNKS_JSONL,
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
  TOKENS_PER_WORD,
  MAX_SAFE_TOKENS,
  ratePerMillion,
  estimatedCost,
} from '#config/embedding.js';
import { fileURLToPath } from 'url';
import readline from 'readline';

// ================= CONFIGURATION =================
// determine whether to operate on archives paths
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');

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

  console.log(`\n========= Generating embeddings for ${chunks.length} chunks... =========`);
  console.log(`  Model: ${EMBEDDING_MODEL}`);
  console.log(`  Dimension: ${EMBEDDING_DIMENSION}`);
  if (SKIP_FIELDS) console.log('  Field‑level embeddings: disabled');
  console.log('');

  // Prepare output stream
  const writeStream = fs.createWriteStream(progressPath, {
    flags: resume ? 'a' : 'w',
    encoding: 'utf-8',
  });

  // Build id → index map for resume
  const idToIdx = new Map();
  chunks.forEach((chunk, idx) => idToIdx.set(chunk.id, idx));

  // If resuming, read existing file line by line to build processed set and mark written chunks
  const processedItems = new Set();
  const written = new Array(chunks.length).fill(false);

  if (resume && progressPath && fs.existsSync(progressPath)) {
    console.log('  Reading existing progress file to determine already embedded chunks...');
    const rl = readline.createInterface({
      input: fs.createReadStream(progressPath),
      crlfDelay: Infinity,
    });
    let lineCount = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      lineCount++;
      try {
        const chunkObj = JSON.parse(line);
        const chunkId = chunkObj.id;
        const idx = idToIdx.get(chunkId);
        if (idx !== undefined) {
          // 1. Track exactly which parts are already done
          if (chunkObj.embeddings?.doc) processedItems.add(`${chunkId}:doc`);

          if (chunkObj.embeddings?.fields) {
            Object.keys(chunkObj.embeddings.fields).forEach((field) => {
              processedItems.add(`${chunkId}:${field}`);
            });
          }

          // 2. CRITICAL: Only mark the chunk as 'written' if it is 100% complete.
          // If it's incomplete, we don't mark it written so the script
          // can try to finish the remaining fields.
          const fieldsInFile = Object.keys(chunkObj.embeddings?.fields || {}).length;
          const expectedFields = Object.keys(chunks[idx].metadata?.fields || {}).filter(
            (f) => f !== 'metadata_json',
          ).length;

          if (chunkObj.embeddings?.doc && (SKIP_FIELDS || fieldsInFile >= expectedFields)) {
            written[idx] = true;
          }
        }
      } catch (e) {
        console.warn(`  ⚠️ Skipping malformed line ${lineCount}: ${e.message}`);
      }
    }
    console.log(
      `  Resuming: found ${processedItems.size} already embedded items across ${written.filter(Boolean).length} chunks.`,
    );
  }

  // Build list of items to embed (only those not already processed)
  const items = [];
  const tokenEstimates = [];
  const chunkTotalItems = new Array(chunks.length).fill(0);

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const chunkId = chunk.id;

    // Validate and add doc-level text
    if (isValidTextForEmbedding(chunk.content) && !processedItems.has(`${chunkId}:doc`)) {
      const tokens = estimateTokens(chunk.content);
      if (tokens > MAX_SAFE_TOKENS) {
        console.warn(
          `  ⚠️ Chunk ${c} (${chunk.id}) has ~${tokens} tokens, which may exceed the model limit. Consider shortening.`,
        );
      }
      items.push({ chunkIdx: c, fieldName: 'doc', text: chunk.content });
      tokenEstimates.push(estimateTokens(chunk.content));
      chunkTotalItems[c]++;
    }

    // Add field-level texts (skipped if --skip-fields)
    if (!SKIP_FIELDS) {
      const fields = (chunk.metadata && chunk.metadata.fields) || {};
      for (const [fname, ftext] of Object.entries(fields)) {
        if (fname === 'metadata_json') continue;
        if (isValidTextForEmbedding(ftext) && !processedItems.has(`${chunkId}:${fname}`)) {
          const text = String(ftext).trim();
          items.push({ chunkIdx: c, fieldName: fname, text });
          tokenEstimates.push(estimateTokens(text));
          chunkTotalItems[c]++;
        }
      }
    }
  }

  if (items.length === 0) {
    console.warn('⚠️️ No new text items to embed (all were already done or below minimum length)');
    writeStream.end();
    return;
  }

  const totalTokens = tokenEstimates.reduce((a, b) => a + b, 0);
  console.log(`  Prepared ${items.length} embedding requests across ${chunks.length} chunks`);
  console.log(`  Estimated total tokens: ~${totalTokens.toLocaleString()}`);
  console.log(
    `  Approximate cost (${EMBEDDING_MODEL} @ $${ratePerMillion}/1M tokens): $${estimatedCost(totalTokens).toFixed(4)}`,
  );

  // Track processed counts per chunk
  const processedCounts = new Array(chunks.length).fill(0);
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
      console.log(
        `    Estimated time remaining: ~${etaMinutes} minutes ${etaSeconds.toFixed(0)} seconds`,
      );
    }

    if (DRY_RUN) {
      // Generate fake embeddings locally
      batchItems.forEach((it) => {
        const { chunkIdx, fieldName, text } = it;
        if (!chunks[chunkIdx]._embeddings) {
          chunks[chunkIdx]._embeddings = { fields: {}, doc: null };
        }
        chunks[chunkIdx]._embeddings[fieldName === 'doc' ? 'doc' : `fields.${fieldName}`] =
          fakeEmbedding(text);
        processedCounts[chunkIdx]++;
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
        if (
          !response.data ||
          !Array.isArray(response.data) ||
          response.data.length !== batchItems.length
        ) {
          throw new Error('Invalid OpenAI response structure or count mismatch');
        }

        if (response.data.length !== batchItems.length) {
          throw new Error(
            `Embedding count mismatch: requested ${batchItems.length}, got ${response.data.length}`,
          );
        }

        // Validate each embedding dimension
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
          processedCounts[chunkIdx]++;
        }

        totalProcessedTokens += batchTokens;
        console.log(`    ✓ Generated and validated ${batchItems.length} embeddings`);

        // Rate limiting delay between batches
        if (i + EMBEDDING_BATCH_SIZE < items.length) {
          await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
        }
      } catch (error) {
        const errorMsg = error.message || String(error);
        console.error(`  ✗ Batch ${batchNum} failed: ${errorMsg}`);
        writeStream.end();
        throw new Error(`Embedding generation failed at batch ${batchNum}: ${errorMsg}`);
      }
    }

    // After batch, write any chunks that are now complete
    for (let c = 0; c < chunks.length; c++) {
      if (!written[c] && processedCounts[c] === chunkTotalItems[c]) {
        // Chunk is complete
        const chunk = chunks[c];
        const outputObj = {
          ...chunk,
          embeddings: chunk._embeddings,
          embedding_model: EMBEDDING_MODEL,
          embedding_dimension: EMBEDDING_DIMENSION,
          created_at: new Date().toISOString(),
        };
        // Remove temporary _embeddings to keep output clean
        delete outputObj._embeddings;
        writeStream.write(JSON.stringify(outputObj) + '\n');
        written[c] = true;
      }
    }
  }

  // Close the stream
  writeStream.end();

  console.log(`\n✓ Successfully generated embeddings for ${written.filter(Boolean).length} chunks`);
  console.log(`  Estimated total tokens processed: ~${totalProcessedTokens.toLocaleString()}\n`);
}

// ================= MAIN EXECUTION PIPELINE =================

/**
 * Main execution pipeline
 * @async
 */
export async function main() {
  const chunksPath = useArchive ? ARCHIVES_CHUNKS_JSON : CHUNKS_JSON;
  assertFileExists(chunksPath, 'chunks.json');
  const outputPath = useArchive ? ARCHIVES_EMBEDDED_CHUNKS_JSONL : EMBEDDED_CHUNKS_JSONL;
  if (useArchive) console.log('⚠️️️  running in archives mode; using archives folder paths');

  try {
    console.log('=============== Embedding Generation Pipeline ===============');
    console.log(`  Model: ${EMBEDDING_MODEL}`);
    console.log(`  Dimension: ${EMBEDDING_DIMENSION}`);
    console.log(`  Input: ${chunksPath}`);

    // Step 1: Load chunks
    const chunks = loadChunks(chunksPath);

    // Step 2: Generate embeddings with full error handling
    await generateEmbeddings(chunks, {
      progressPath: outputPath,
      resume: RESUME,
    });

    // Success summary
    console.log('========= ✓ EMBEDDING GENERATION COMPLETE =========');
    console.log(`  Output: ${path.relative(process.cwd(), outputPath)}`);
    console.log(
      '  Next: Check out pipeline/store_embeddings.js for methods to store these embeddings',
    );
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
