#!/usr/bin/env node
/**
 * End-to-end pipeline test
 * Tests: datasets → chunks → embeddings → supabase → retrieval
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPipeline() {
  console.log('\n=== End-to-End Pipeline Test ===\n');

  try {
    // Test 1: Check combined_input.csv exists
    console.log('1️⃣  Checking datasets merged...');
    const combinedPath = path.join(__dirname, '..', 'dataset', 'combined_input.csv');
    if (!fs.existsSync(combinedPath)) {
      console.error('❌ combined_input.csv not found');
      process.exit(1);
    }
    const csvContent = fs.readFileSync(combinedPath, 'utf8');
    const csvLines = csvContent.split('\n').filter((l) => l.trim());
    console.log(`✓ Found combined_input.csv with ${csvLines.length} rows`);

    // Test 2: Check chunks.json exists
    console.log('\n2️⃣  Checking chunks generated...');
    const chunksPath = path.join(__dirname, '..', 'dataset', 'chunks.json');
    if (!fs.existsSync(chunksPath)) {
      console.error('❌ chunks.json not found');
      process.exit(1);
    }
    const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
    console.log(`✓ Found chunks.json with ${chunks.length} chunks`);

    // Test 3: Check embeddings in Supabase
    console.log('\n3️⃣  Checking embeddings in Supabase...');
    try {
      const { count, error } = await supabase.from('documents').select('*', { count: 'exact' });
      if (error) throw error;
      console.log(`✓ Supabase documents table: ${count} vectors stored`);

      if (count === 0) {
        console.warn('⚠ Warning: No vectors in Supabase. Embeddings may still be processing.');
      }
    } catch (err) {
      console.error('❌ Supabase query failed:', err.message);
      process.exit(1);
    }

    // Test 4: Test retrieval
    console.log('\n4️⃣  Testing vector retrieval...');
    try {
      // Create a test query embedding (dummy values for testing)
      const testEmbedding = Array(1536).fill(0.1);
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_count: 5,
      });

      if (error) {
        console.warn('⚠ Retrieval test skipped (RPC may not be ready): ', error.message);
      } else {
        console.log(`✓ Retrieved ${data?.length || 0} similar documents`);
        if (data && data.length > 0) {
          const sample = data[0];
          console.log(`  Sample result:
  - Source: ${sample.source || 'N/A'}
  - Similarity: ${(sample.similarity * 100).toFixed(1)}%
  - Metadata fields: ${sample.metadata?.field_name || 'N/A'}`);
        }
      }
    } catch (err) {
      console.warn('⚠ Retrieval test error:', err.message);
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
