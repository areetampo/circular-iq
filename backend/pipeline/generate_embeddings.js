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
  OUT_CHUNKS_JSON,
  ARCHIVES_CHUNKS_JSON,
  OUT_EMBEDDED_CHUNKS_JSONL,
  ARCHIVES_EMBEDDED_CHUNKS_JSONL,
  assertFileExists,
  ARCHIVES_TEST_CHUNKS_JSON,
  OUT_TEST_CHUNKS_JSON,
  ARCHIVES_TEST_EMBEDDED_CHUNKS_JSONL,
  OUT_TEST_EMBEDDED_CHUNKS_JSONL,
} from '#utils/datasetsUtils.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_REQUEST_TIMEOUT_MS,
  isValidTextForEmbedding,
  isValidEmbedding,
  MAX_SAFE_TOKENS,
  ratePerMillion,
  estimatedCost,
  estimateTokens,
  fakeEmbedding,
  retryWithBackoff,
} from '#config/embedding.js';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { encoding_for_model } from 'tiktoken';

// ================= CONFIGURATION =================
const DRY_RUN = process.argv.includes('--dry-run') || !BACKEND_CONFIG.openai.apiKey;
const SKIP_FIELDS = process.argv.includes('--skip-fields');
const useArchive = process.argv.includes('--archives');
const test = process.argv.includes('--test');
const RESUME = process.argv.includes('--resume');
let tokenEncoder = null;
try {
  tokenEncoder = encoding_for_model(EMBEDDING_MODEL);
} catch {
  console.warn(`⚠️  No exact tokeniser for model ${EMBEDDING_MODEL}, falling back to cl100k_base`);
  // fallback: use the base encoder for OpenAI models
  tokenEncoder = encoding_for_model('gpt-4');
}

const chunksPath = useArchive
  ? test
    ? ARCHIVES_TEST_CHUNKS_JSON
    : ARCHIVES_CHUNKS_JSON
  : test
    ? OUT_TEST_CHUNKS_JSON
    : OUT_CHUNKS_JSON;
assertFileExists(chunksPath, 'chunks.json');
const outputPath = useArchive
  ? test
    ? ARCHIVES_TEST_EMBEDDED_CHUNKS_JSONL
    : ARCHIVES_EMBEDDED_CHUNKS_JSONL
  : test
    ? OUT_TEST_EMBEDDED_CHUNKS_JSONL
    : OUT_EMBEDDED_CHUNKS_JSONL;

// prepare OpenAI client (skipped in dry run)
let openai = null;
if (!DRY_RUN) {
  openai = new OpenAI({
    apiKey: BACKEND_CONFIG.openai.apiKey,
    timeout: EMBEDDING_REQUEST_TIMEOUT_MS,
  });
}

// ================= HELPERS =================

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

  // Prepare output stream
  const writeStream = fs.createWriteStream(progressPath, {
    flags: resume ? 'a' : 'w',
    encoding: 'utf-8',
  });

  // Build id → index map for resume
  const idToIdx = new Map();
  chunks.forEach((chunk, idx) => idToIdx.set(chunk.id, idx));

  // If resuming, read existing file line by line to build processed set and mark written chunks
  const written = new Array(chunks.length).fill(false);

  // Map to store existing embeddings from the progress file
  const existingEmbeddings = new Map(); // chunkId → { doc?: vector, fields: { [fieldName]: vector } }

  if (resume && progressPath && fs.existsSync(progressPath)) {
    console.log('  Reading existing progress file to load previously generated embeddings...');
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
        const embeddings = chunkObj.embeddings;
        if (!embeddings) continue;

        const existing = { fields: {} };
        if (embeddings.doc) existing.doc = embeddings.doc;
        if (embeddings.fields) {
          for (const [f, vec] of Object.entries(embeddings.fields)) {
            existing.fields[f] = vec;
          }
        }
        existingEmbeddings.set(chunkId, existing);
      } catch (e) {
        console.warn(`  ⚠️ Skipping malformed line ${lineCount}: ${e.message}`);
      }
    }
    console.log(
      `  Resume mode: loaded embeddings for ${existingEmbeddings.size} chunks from previous run.`,
    );
  }

  // Build list of items to embed (only those not already processed)
  const items = [];
  const tokenEstimates = [];
  const chunkTotalItems = new Array(chunks.length).fill(0);

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    const chunkId = chunk.id;
    const existing = existingEmbeddings.get(chunkId);
    chunk._embeddings = existing ? { ...existing, fields: { ...existing.fields } } : { fields: {} };
    const emb = chunk._embeddings;

    // Add doc-level text if missing
    if (isValidTextForEmbedding(chunk.content) && !emb.doc) {
      const tokens = estimateTokens(chunk.content, tokenEncoder);
      if (tokens > MAX_SAFE_TOKENS) {
        console.warn(
          `  ⚠️ Chunk ${c} (${chunk.id}) has ~${tokens} tokens, which may exceed the model limit. Consider shortening.`,
        );
      }
      items.push({ chunkIdx: c, fieldName: 'doc', text: chunk.content });
      tokenEstimates.push(estimateTokens(chunk.content, tokenEncoder));
      chunkTotalItems[c]++;
    }

    // Add field-level texts (skipped if --skip-fields)
    if (!SKIP_FIELDS) {
      const fields = (chunk.metadata && chunk.metadata.fields) || {};
      for (const [fname, ftext] of Object.entries(fields)) {
        if (fname === 'metadata_json') continue;
        if (isValidTextForEmbedding(ftext) && !emb.fields[fname]) {
          const text = String(ftext).trim();
          items.push({ chunkIdx: c, fieldName: fname, text });
          tokenEstimates.push(estimateTokens(text, tokenEncoder));
          chunkTotalItems[c]++;
        }
      }
    }
  }

  // pendingChunks tracks indices of chunks that have items to embed but aren't written yet.
  // Only chunks with chunkTotalItems > 0 are added — zero-item chunks are excluded entirely.
  const pendingChunks = new Set();
  for (let ci = 0; ci < chunks.length; ci++) {
    if (chunkTotalItems[ci] > 0) pendingChunks.add(ci);
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

  for (let i = 0; i < items.length; i += EMBEDDING_BATCH_SIZE) {
    const batchItems = items.slice(i, Math.min(i + EMBEDDING_BATCH_SIZE, items.length));
    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / EMBEDDING_BATCH_SIZE);
    const batchTokens = tokenEstimates.slice(i, i + batchItems.length).reduce((a, b) => a + b, 0);

    console.log(
      `  Processing batch ${batchNum}/${totalBatches} (${batchItems.length} items, ~${batchTokens} tokens)...`,
    );

    const batchStart = Date.now();

    if (DRY_RUN) {
      // Generate fake embeddings locally
      batchItems.forEach((it) => {
        const { chunkIdx, fieldName, text } = it;
        if (!chunks[chunkIdx]._embeddings) {
          chunks[chunkIdx]._embeddings = { fields: {}, doc: null };
        }
        if (fieldName === 'doc') {
          chunks[chunkIdx]._embeddings.doc = fakeEmbedding(text);
        } else {
          chunks[chunkIdx]._embeddings.fields[fieldName] = fakeEmbedding(text);
        }
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

        // Log ETA after first real batch completes (accurate timing)
        if (batchNum === 1 && totalBatches > 1) {
          const batchMs = Date.now() - batchStart;
          const msPerItem = batchMs / batchItems.length;
          const remainingItems = items.length - i - batchItems.length;
          const etaSec = Math.ceil((msPerItem * remainingItems) / 1000);
          const etaMin = Math.floor(etaSec / 60);
          const etaRemSec = etaSec % 60;
          console.log(
            `    Estimated time remaining: ~${etaMin}m ${etaRemSec}s (${batchItems.length} items took ${(batchMs / 1000).toFixed(1)}s)`,
          );
        }

        // Rate limiting delay between batches
        if (i + EMBEDDING_BATCH_SIZE < items.length) {
          await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
        }
      } catch (error) {
        const errorMsg = error.message || String(error);
        console.error(`  ✗ Batch ${batchNum} failed: ${errorMsg}`);
        // Wait for stream to flush before throwing so progress is saved
        await new Promise((resolve) => writeStream.end(resolve));
        throw new Error(`Embedding generation failed at batch ${batchNum}: ${errorMsg}`);
      }
    }

    // Write completed chunks using the pendingChunks Set — O(pending) not O(all chunks).
    // Zero-item chunks are never added to pendingChunks so they can't create duplicates.
    for (const ci of pendingChunks) {
      if (processedCounts[ci] === chunkTotalItems[ci]) {
        const chunk = chunks[ci];
        const outputObj = {
          ...chunk,
          embeddings: chunk._embeddings,
          embedding_model: EMBEDDING_MODEL,
          embedding_dimension: EMBEDDING_DIMENSION,
          created_at: new Date().toISOString(),
        };
        delete outputObj._embeddings;
        writeStream.write(JSON.stringify(outputObj) + '\n');
        written[ci] = true;
        pendingChunks.delete(ci);
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
  try {
    console.log('=============== Embedding Generation Pipeline ===============');
    console.log('  Options:');
    console.log(`    Model: ${EMBEDDING_MODEL}`);
    console.log(`    Dimension: ${EMBEDDING_DIMENSION}`);
    console.log(`    Skip field-level embeddings: ${SKIP_FIELDS}`);
    console.log(`    Dry run (fake embeddings): ${DRY_RUN}`);
    console.log(`    Use archives paths: ${useArchive}`);
    console.log(`    Use test dataset: ${test}`);
    console.log(`  Input: ${chunksPath}`);
    console.log(`  Output: ${outputPath}`);

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
