/**
 * Embedding Generation and Vector Storage Script
 *
 * Processes chunks from chunk.js and:
 * 1. Generates embeddings using OpenAI text-embedding-3-small
 * 2. Stores in Supabase with pgvector support
 * 3. Preserves all metadata for RAG retrieval
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load the backend .env to ensure keys are available when running from workspace root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DRY_RUN =
  process.argv.includes('--dry-run') ||
  !process.env.OPENAI_API_KEY ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY;

let openai = null;
if (!DRY_RUN) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

let supabase = null;
if (!DRY_RUN) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  );
}

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20; // OpenAI rate limiting
const BATCH_DELAY_MS = 500; // Delay between batches

function fakeEmbedding(text) {
  // Deterministic pseudo-embedding for local testing (not a semantic vector)
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const vec = new Array(EMBEDDING_DIMENSIONS);
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    // create pseudo-random but deterministic values in [0,1)
    vec[i] = ((h + i * 2654435761) % 1000) / 1000;
  }
  return vec;
}

/**
 * Load pre-generated chunks from chunk.js output
 * @param {string} chunksFilePath - Path to chunks.json
 * @returns {Array} Array of chunk objects
 */
export function loadChunks(chunksFilePath) {
  if (!fs.existsSync(chunksFilePath)) {
    throw new Error(`Chunks file not found at ${chunksFilePath}`);
  }

  const fileContent = fs.readFileSync(chunksFilePath, 'utf-8');
  const chunks = JSON.parse(fileContent);

  console.log(`✓ Loaded ${chunks.length} chunks from ${chunksFilePath}`);
  return chunks;
}

/**
 * Generate embeddings for chunks using OpenAI
 * @param {Array} chunks - Array of chunk objects
 * @returns {Promise<Array>} Chunks with embedded vectors
 */
export async function generateEmbeddings(chunks) {
  console.log(`\nGenerating embeddings for ${chunks.length} chunks...`);
  const embeddedChunks = [];

  // We will request embeddings for document-level content + each non-empty field in metadata.fields
  // Flatten into items to batch-call OpenAI and then stitch back into each chunk
  const items = []; // { chunkIdx, fieldName, text }
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    // doc-level
    items.push({ chunkIdx: c, fieldName: 'doc', text: chunk.content });

    // field-level embeddings (problem, solution, params, etc.)
    const fields = (chunk.metadata && chunk.metadata.fields) || {};
    for (const [fname, ftext] of Object.entries(fields)) {
      if (ftext && String(ftext).trim().length > 0) {
        items.push({ chunkIdx: c, fieldName: fname, text: String(ftext).trim() });
      }
    }
  }

  console.log(`  Prepared ${items.length} embedding requests across ${chunks.length} chunks`);

  // Batch through the flattened items
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batchItems = items.slice(i, Math.min(i + BATCH_SIZE, items.length));

    console.log(
      `  Processing embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}...`,
    );

    if (DRY_RUN) {
      // Generate fake embeddings locally
      batchItems.forEach((it, localIdx) => {
        const globalIdx = i + localIdx;
        const item = items[globalIdx];
        const chunkIndex = item.chunkIdx;
        const fieldName = item.fieldName;

        if (!chunks[chunkIndex]._embeddings)
          chunks[chunkIndex]._embeddings = { fields: {}, doc: null };
        const vec = fakeEmbedding(item.text);
        if (fieldName === 'doc') chunks[chunkIndex]._embeddings.doc = vec;
        else chunks[chunkIndex]._embeddings.fields[fieldName] = vec;
      });
    } else {
      const texts = batchItems.map((it) => it.text);
      try {
        const response = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: texts,
          encoding_format: 'float',
        });

        // Stitch embeddings back to chunk-level structure
        response.data.forEach((embObj, localIdx) => {
          const globalIdx = i + localIdx;
          const item = items[globalIdx];
          const chunkIndex = item.chunkIdx;
          const fieldName = item.fieldName;

          if (!chunks[chunkIndex]._embeddings)
            chunks[chunkIndex]._embeddings = { fields: {}, doc: null };

          if (fieldName === 'doc') {
            chunks[chunkIndex]._embeddings.doc = embObj.embedding;
          } else {
            chunks[chunkIndex]._embeddings.fields[fieldName] = embObj.embedding;
          }
        });

        // Rate limiting delay
        if (i + BATCH_SIZE < items.length) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      } catch (error) {
        console.error(`Error generating embeddings for item batch starting at index ${i}:`, error);
        throw error;
      }
    }
  }

  // Build embeddedChunks output preserving original chunk + embeddings
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    embeddedChunks.push({
      ...chunk,
      embeddings: chunk._embeddings || { doc: null, fields: {} },
      embedding_model: EMBEDDING_MODEL,
      embedding_dimensions: EMBEDDING_DIMENSIONS,
      created_at: new Date().toISOString(),
    });
  }

  console.log(`✓ Generated embeddings for ${embeddedChunks.length} chunks (doc + fields)`);
  return embeddedChunks;
}

/**
 * Store embedded chunks in Supabase
 * @param {Array} embeddedChunks - Chunks with embedding vectors
 * @returns {Promise<number>} Number of documents successfully stored
 */
export async function storeInSupabase(embeddedChunks) {
  console.log(
    `\nStoring ${embeddedChunks.length} documents${DRY_RUN ? ' (dry-run -> local JSONL)' : ' in Supabase'}...`,
  );
  if (!DRY_RUN)
    console.log(
      '  Note: Using SUPABASE_SERVICE_ROLE_KEY (required due to RLS on documents table)\n',
    );

  //truncate existing documents to avoid duplicates (skip in dry-run)
  if (!DRY_RUN) {
    console.log('Clearing existing documents from Supabase...');
    const { error: deleteError } = await supabase.from('documents').delete().neq('id', 0);
    if (deleteError) {
      console.error('✗ Error clearing documents:', deleteError.message);
      throw deleteError;
    }
    console.log('✓ Table cleared successfully.\n');
  } else {
    console.log('Dry-run mode: skipping Supabase table clear.');
  }

  const SUPABASE_BATCH_SIZE = 10; // Supabase insert batch limit
  let totalStored = 0;

  for (let i = 0; i < embeddedChunks.length; i += SUPABASE_BATCH_SIZE) {
    const batch = embeddedChunks.slice(i, Math.min(i + SUPABASE_BATCH_SIZE, embeddedChunks.length));

    // For each chunk we may store multiple vector rows: doc-level + per-field vectors
    const documentsToInsert = [];

    for (const chunk of batch) {
      const baseMeta = {
        chunk_id: chunk.id,
        source_row: chunk.source_row,
        chunk_index: chunk.chunk_index,
        chunk_type: (chunk.metadata && chunk.metadata.chunk_type) || 'primary',
        category: (chunk.metadata && chunk.metadata.category) || null,
        source_id: (chunk.metadata && chunk.metadata.source_id) || null,
        fields: (chunk.metadata && chunk.metadata.fields) || {},
        word_count: chunk.word_count,
        industry: (chunk.metadata && chunk.metadata.industry) || 'general',
        scale: (chunk.metadata && chunk.metadata.scale) || 'medium',
        r_strategy: (chunk.metadata && chunk.metadata.r_strategy) || 'reduction',
        primary_material: (chunk.metadata && chunk.metadata.primary_material) || 'mixed',
        geographic_focus: (chunk.metadata && chunk.metadata.geographic_focus) || 'global',
      };

      // Doc-level row
      if (chunk.embeddings && chunk.embeddings.doc) {
        documentsToInsert.push({
          content: chunk.content,
          embedding: chunk.embeddings.doc,
          metadata: { ...baseMeta, field_name: 'doc' },
        });
      }

      // Field-level rows
      const fieldEmb = (chunk.embeddings && chunk.embeddings.fields) || {};
      for (const [fname, vec] of Object.entries(fieldEmb)) {
        if (!vec) continue;
        const fieldText =
          (chunk.metadata && chunk.metadata.fields && chunk.metadata.fields[fname]) || '';
        documentsToInsert.push({
          content: fieldText,
          embedding: vec,
          metadata: { ...baseMeta, field_name: fname },
        });
      }
    }

    try {
      if (DRY_RUN) {
        // write to local JSONL for inspection
        const outPath = path.join(__dirname, '..', 'dataset', 'stored_documents.jsonl');
        for (const doc of documentsToInsert) {
          fs.appendFileSync(outPath, JSON.stringify(doc) + '\n', 'utf8');
        }
        totalStored += documentsToInsert.length;
        console.log(
          `  ✓ Wrote batch ${Math.floor(i / SUPABASE_BATCH_SIZE) + 1}/${Math.ceil(embeddedChunks.length / SUPABASE_BATCH_SIZE)} (${documentsToInsert.length} documents) to ${outPath}`,
        );
      } else {
        try {
          const res = await supabase.from('documents').insert(documentsToInsert).select();
          const { data, error } = res;
          if (error) {
            console.error(`Error inserting batch at index ${i}:`, error);
            // log full response for debugging
            console.error('Insert response:', res);
            throw error;
          }

          if (Array.isArray(data)) {
            totalStored += data.length;
            console.log(
              `  ✓ Inserted batch ${Math.floor(i / SUPABASE_BATCH_SIZE) + 1}/${Math.ceil(embeddedChunks.length / SUPABASE_BATCH_SIZE)} (${data.length} documents)`,
            );
            // log a sample id from inserted rows for traceability
            console.log('    Sample inserted id:', data[0]?.id || '(no id)');
          } else {
            console.warn('  ⚠ Insert returned unexpected response shape:', res);
          }
        } catch (err) {
          console.error(`Failed to insert batch at index ${i}:`, err?.message || err);
          throw err;
        }
      }

      if (i + SUPABASE_BATCH_SIZE < embeddedChunks.length) {
        console.log(`  ...Cooling down for 1s to prevent connection reset...`);
        await new Promise((resolve) => setTimeout(resolve, 0)); // Refresh event loop
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Network breather
      }
    } catch (error) {
      console.error(`Failed to store batch:`, error);
      throw error;
    }
  }

  console.log(`\n✓ Successfully stored ${totalStored} documents in Supabase\n`);
  return totalStored;
}

/**
 * Validate stored embeddings by running a test query
 */
export async function validateStorage() {
  console.log('\nValidating storage with test query...');

  try {
    const { data, error } = await supabase.from('documents').select('count').limit(1);

    if (error) throw error;

    const countResult = await supabase.rpc('count_documents');

    if (countResult.error) {
      console.log('  Note: count_documents function not yet available');
    } else {
      console.log(`  ✓ Total documents in database: ${countResult.data}`);
    }

    // Test vector search
    const testEmbedding = Array(EMBEDDING_DIMENSIONS).fill(0.1);
    const searchResult = await supabase.rpc('match_documents', {
      query_embedding: testEmbedding,
      match_count: 1,
    });

    if (searchResult.error) {
      console.log('  Note: Vector search function may not be available yet');
    } else {
      console.log('  ✓ Vector search function operational');
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
}

/**
 * Main execution pipeline
 */
export async function main() {
  const chunksPath = process.argv[2] || path.join(__dirname, '../dataset/chunks.json');

  try {
    console.log('=== Circular Economy Business Auditor ===');
    console.log('Embedding Generation and Storage Pipeline\n');

    // Step 1: Load chunks
    const chunks = loadChunks(chunksPath);

    // Step 1.5: Clear existing documents to avoid duplicates (skip in dry-run)
    if (!DRY_RUN) {
      console.log('Clearing existing documents from Supabase...');
      const { error: deleteError } = await supabase.from('documents').delete().neq('id', 0);

      if (deleteError) {
        console.error('✗ Error clearing documents:', deleteError.message);
        throw deleteError;
      }
      console.log('✓ Table cleared successfully.\n');
    } else {
      console.log('Dry-run mode: skipping Supabase table clear.');
    }

    // Step 2: Generate embeddings
    const embeddedChunks = await generateEmbeddings(chunks);

    // Step 3: Store in Supabase
    const storedCount = await storeInSupabase(embeddedChunks);

    // Step 4: Validate (skip in dry-run)
    if (!DRY_RUN) {
      await validateStorage();
    } else {
      console.log('Dry-run mode: skipping validation that requires Supabase.');
    }

    console.log(
      '╔════════════════════════════════════════════════════════════════════════════════╗',
    );
    console.log(
      `║ ✓ Pipeline Complete!                                                           ║`,
    );
    console.log(
      `║ Successfully stored ${storedCount} documents prepared from ${chunks.length} chunks in documents table. ║`,
    );
    console.log(
      '║ Ready for RAG retrieval and vector search.                                     ║',
    );
    console.log(
      '╚════════════════════════════════════════════════════════════════════════════════╝\n',
    );
  } catch (error) {
    console.error('\n✗ Pipeline failed:', error.message);
    process.exit(1);
  }
}

// Execute if running directly
const isMainModule = process.argv[1].endsWith('embed_and_store.js');
if (isMainModule) {
  main();
}
