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

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
);

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const BATCH_SIZE = 20; // OpenAI rate limiting
const BATCH_DELAY_MS = 500; // Delay between batches

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

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
    const texts = batch.map((chunk) => chunk.content);

    console.log(
      `  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}...`,
    );

    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
      });

      // Combine chunks with their embeddings
      batch.forEach((chunk, idx) => {
        const embeddingObj = response.data.find((e) => e.index === idx);
        embeddedChunks.push({
          ...chunk,
          embedding: embeddingObj.embedding,
          embedding_model: EMBEDDING_MODEL,
          embedding_dimensions: EMBEDDING_DIMENSIONS,
          created_at: new Date().toISOString(),
        });
      });

      // Rate limiting delay
      if (i + BATCH_SIZE < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch starting at index ${i}:`, error);
      throw error;
    }
  }

  console.log(`✓ Generated embeddings for ${embeddedChunks.length} chunks`);
  return embeddedChunks;
}

/**
 * Store embedded chunks in Supabase
 * @param {Array} embeddedChunks - Chunks with embedding vectors
 */
export async function storeInSupabase(embeddedChunks) {
  console.log(`\nStoring ${embeddedChunks.length} documents in Supabase...`);

  const SUPABASE_BATCH_SIZE = 100; // Supabase insert batch limit

  for (let i = 0; i < embeddedChunks.length; i += SUPABASE_BATCH_SIZE) {
    const batch = embeddedChunks.slice(i, Math.min(i + SUPABASE_BATCH_SIZE, embeddedChunks.length));

    // Format documents for Supabase insertion
    const documents = batch.map((chunk) => ({
      content: chunk.content,
      embedding: chunk.embedding,
      metadata: {
        chunk_id: chunk.id,
        source_row: chunk.source_row,
        chunk_index: chunk.chunk_index,
        chunk_type: chunk.metadata.chunk_type,
        category: chunk.metadata.category,
        source_id: chunk.metadata.source_id,
        fields: chunk.metadata.fields,
        word_count: chunk.word_count,
        // Extracted metadata for filtering and benchmarking
        industry: chunk.metadata.industry || 'general',
        scale: chunk.metadata.scale || 'medium',
        r_strategy: chunk.metadata.r_strategy || 'reduction',
        primary_material: chunk.metadata.primary_material || 'mixed',
        geographic_focus: chunk.metadata.geographic_focus || 'global',
      },
    }));

    try {
      const { data, error } = await supabase.from('documents').insert(documents).select();

      if (error) {
        console.error(`Error inserting batch at index ${i}:`, error);
        throw error;
      }

      console.log(
        `  ✓ Inserted batch ${Math.floor(i / SUPABASE_BATCH_SIZE) + 1}/${Math.ceil(embeddedChunks.length / SUPABASE_BATCH_SIZE)} (${data.length} documents)`,
      );
    } catch (error) {
      console.error(`Failed to store batch:`, error);
      throw error;
    }
  }

  console.log(`✓ Successfully stored ${embeddedChunks.length} documents in Supabase`);
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

    // Step 2: Generate embeddings
    const embeddedChunks = await generateEmbeddings(chunks);

    // Step 3: Store in Supabase
    await storeInSupabase(embeddedChunks);

    // Step 4: Validate
    await validateStorage();

    console.log('\n✓ Pipeline complete! Ready for RAG retrieval.');
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
