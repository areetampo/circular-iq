/**
 * Embedding Generation Script
 *
 * Processes chunks and generates embeddings using OpenAI.
 * Reads pre-generated chunks from generate_chunks.js output.
 * Stores embeddedChunks in backend/datasets/out/ for later storage in Supabase.
 *
 * Usage: node generate_embeddings.js [chunks_path] [output_path]
 * Defaults: datasets/out/chunks.json → datasets/out/embedded_chunks.json
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
} from '#config/embedding.js';
import { fileURLToPath } from 'url';
import { EMBEDDED_CHUNKS_JSON } from '#utils/datasetsUtils.js';

// switch to archives mode if --archives or --archive flag is provided
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');
const DRY_RUN = process.argv.includes('--dry-run') || !BACKEND_CONFIG.openai.apiKey;

let openai = null;
if (!DRY_RUN) {
  openai = new OpenAI({
    apiKey: BACKEND_CONFIG.openai.apiKey,
    timeout: EMBEDDING_REQUEST_TIMEOUT_MS,
  });
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
        console.warn(`  ⚠ Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

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

/**
 * Generate embeddings for chunks using OpenAI with retry logic
 * @param {Array} chunks - Array of chunk objects
 * @returns {Promise<Array>} Chunks with embedded vectors
 * @throws {Error} If embedding generation fails after retries
 */
export async function generateEmbeddings(chunks) {
  console.log(`\nGenerating embeddings for ${chunks.length} chunks...`);
  console.log(`  Model: ${EMBEDDING_MODEL}`);
  console.log(`  Dimension: ${EMBEDDING_DIMENSION}`);

  const embeddedChunks = [];

  // Flatten chunks into items to batch-embed
  const items = [];
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];

    // Validate and add doc-level text
    if (isValidTextForEmbedding(chunk.content)) {
      items.push({ chunkIdx: c, fieldName: 'doc', text: chunk.content });
    }

    // Add field-level texts
    const fields = (chunk.metadata && chunk.metadata.fields) || {};
    for (const [fname, ftext] of Object.entries(fields)) {
      if (isValidTextForEmbedding(ftext)) {
        items.push({ chunkIdx: c, fieldName: fname, text: String(ftext).trim() });
      }
    }
  }

  if (items.length === 0) {
    console.warn('⚠ No valid text items to embed (all below minimum length)');
    return chunks;
  }

  console.log(`  Prepared ${items.length} embedding requests across ${chunks.length} chunks\n`);

  // Process in batches
  for (let i = 0; i < items.length; i += EMBEDDING_BATCH_SIZE) {
    const batchItems = items.slice(i, Math.min(i + EMBEDDING_BATCH_SIZE, items.length));
    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / EMBEDDING_BATCH_SIZE);

    console.log(`  Processing batch ${batchNum}/${totalBatches}...`);

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

  console.log(`\n✓ Successfully generated embeddings for ${embeddedChunks.length} chunks\n`);
  return embeddedChunks;
}

/**
 * Save embedded chunks to JSON file
 * @param {Array} embeddedChunks - Chunks with embeddings
 * @param {string} outputPath - Output file path
 */
export function saveEmbeddedChunks(embeddedChunks, outputPath) {
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(embeddedChunks, null, 2));
  // Make read-only to prevent accidental edits
  try {
    fs.chmodSync(outputPath, 0o444);
  } catch {
    // ignore chmod errors (Windows etc.)
  }
  console.log(`✓ Saved ${embeddedChunks.length} embedded chunks to ${outputPath}`);
}

/**
 * Main execution pipeline
 * @async
 */
export async function main() {
  const chunksPath = process.argv[2] || (useArchive ? ARCHIVES_CHUNKS_JSON : CHUNKS_JSON);
  const outputPath =
    process.argv[3] || (useArchive ? ARCHIVES_EMBEDDED_CHUNKS_JSON : EMBEDDED_CHUNKS_JSON);
  if (useArchive) console.log('⚠️  running in archives mode; using archives folder paths');

  try {
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  Embedding Generation Pipeline                                     ║');
    console.log('║  Circular Economy Business Auditor                                 ║');
    console.log(`║  Model: ${EMBEDDING_MODEL}                                    ║`);
    console.log(
      `║  Dimension: ${EMBEDDING_DIMENSION}                                              ║`,
    );
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Step 1: Load chunks
    const chunks = loadChunks(chunksPath);

    // Step 2: Generate embeddings with full error handling
    const embeddedChunks = await generateEmbeddings(chunks);

    // Step 3: Save embedded chunks
    saveEmbeddedChunks(embeddedChunks, outputPath);

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
