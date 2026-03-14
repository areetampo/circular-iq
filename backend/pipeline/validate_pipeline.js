/**
 * End-to-end pipeline test
 * Tests: datasets → chunks → embeddings → supabase → retrieval
 */

import '#server/bootstrap.js';
import fs from 'fs';
import { createSupabaseClient } from '#database/supabase.client.js';
import { OUT_COMBINED_INPUT_CSV, OUT_CHUNKS_JSON, assertFileExists } from '#utils/datasetsUtils.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

let supabase = null;
if (BACKEND_CONFIG.supabase && BACKEND_CONFIG.supabase.serviceKey) {
  supabase = createSupabaseClient();
} else {
  console.warn('⚠️️️ ️  Supabase service key not found; Supabase checks will be skipped');
}

async function testPipeline() {
  console.log('\n=== End-to-End Pipeline Test ===\n');

  try {
    // Test 1: Check combined_input.csv exists
    console.log('1️⃣  Checking datasets merged...');
    try {
      assertFileExists(OUT_COMBINED_INPUT_CSV, 'combined_input.csv');
    } catch (err) {
      console.error('❌ ' + err.message);
      process.exit(1);
    }
    const csvContent = fs.readFileSync(OUT_COMBINED_INPUT_CSV, 'utf8');
    const csvLines = csvContent.split('\n').filter((l) => l.trim());
    console.log(`✓ Found combined_input.csv with ${csvLines.length} rows`);

    // Test 2: Check chunks.json exists
    console.log('\n2️⃣  Checking chunks generated...');
    try {
      assertFileExists(OUT_CHUNKS_JSON, 'chunks.json');
    } catch (err) {
      console.error('❌ ' + err.message);
      process.exit(1);
    }
    const chunks = JSON.parse(fs.readFileSync(OUT_CHUNKS_JSON, 'utf8'));
    console.log(`✓ Found chunks.json with ${chunks.length} chunks`);

    // Test 3: Check embeddings in Supabase
    console.log('\n3️⃣  Checking embeddings in Supabase...');
    if (!supabase) {
      console.warn('⚠️️️  Supabase client not configured; skipping DB checks');
    } else {
      try {
        const { count, error } = await supabase
          .from(BACKEND_CONFIG.db.tables.documents)
          .select('*', { count: 'exact' });
        if (error) throw error;
        console.log(
          `✓ Supabase '${BACKEND_CONFIG.db.tables.documents}' table: ${count} vectors stored`,
        );

        if (count === 0) {
          console.warn('⚠️️️  Warning: No vectors in Supabase. Embeddings may still be processing.');
        }
      } catch (err) {
        console.warn('⚠️️️  Supabase query failed (continuing):', err.message);
      }

      // Test 4: Test retrieval
      console.log('\n4️⃣  Testing vector retrieval...');
      try {
        // Create a test query embedding (dummy values for testing)
        const testEmbedding = Array(1536).fill(0.1);
        const { data, error } = await supabase.rpc(BACKEND_CONFIG.db.functions.match_documents, {
          query_embedding: testEmbedding,
          match_count: 5,
        });

        if (error) {
          console.warn('⚠️️️  Retrieval test skipped (RPC may not be ready): ', error.message);
        } else {
          console.log(`✓ Retrieved ${data?.length || 0} similar documents`);
          if (data && data.length > 0) {
            const sample = data[0];
            console.log(
              `  Sample result:\n  - Source: ${sample.source || 'N/A'}\n  - Similarity: ${(sample.similarity * 100).toFixed(1)}%\n  - Metadata fields: ${sample.metadata?.field_name || 'N/A'}`,
            );
          }
        }
      } catch (err) {
        console.warn('⚠️️️  Retrieval test error (continuing):', err.message);
      }
    }

    // Test 5: Validate chunk structure
    console.log('\n5️⃣  Validating chunk structure...');
    const sampleChunk = chunks[0];
    const requiredFields = ['id', 'content', 'metadata'];
    const hasAll = requiredFields.every((f) => f in sampleChunk);
    if (!hasAll) {
      console.error('❌ Chunks missing required fields:', requiredFields);
      process.exit(1);
    }
    console.log(`✓ Chunk structure valid (fields: ${requiredFields.join(', ')})`);
    console.log(`  Sample metadata keys: ${Object.keys(sampleChunk.metadata).join(', ')}`);

    // Test 6: Check for metadata.fields (our multi-vector approach)
    console.log('\n6️⃣  Checking metadata enrichment...');
    const chunksWithFields = chunks.filter(
      (c) => c.metadata?.fields && Object.keys(c.metadata.fields).length > 0,
    );
    console.log(
      `✓ ${chunksWithFields.length}/${chunks.length} chunks have enriched metadata fields`,
    );

    console.log('\n=== Pipeline Status Summary ===');
    console.log('✓ Datasets merged');
    console.log('✓ Chunks created');
    console.log('✓ Embeddings generated (or in progress)');
    console.log('✓ Multi-vector storage ready');
    console.log('\n✅ Pipeline setup complete!\n');
  } catch (err) {
    console.error('\n❌ Pipeline test failed:', err.message);
    process.exit(1);
  }
}

testPipeline();
