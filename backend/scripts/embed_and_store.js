import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function embedAndStore() {
  console.log('=== Starting Embedding & Storage Pipeline ===\n');

  const chunksPath = path.join('dataset', 'chunks.json');
  
  if (!fs.existsSync(chunksPath)) {
    console.error(`Error: Chunks file not found at ${chunksPath}`);
    console.error('Please run chunk.js first to generate chunks.json');
    process.exit(1);
  }

  console.log(`Reading chunks from: ${chunksPath}`);
  const chunksData = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
  
  if (!Array.isArray(chunksData) || chunksData.length === 0) {
    console.error('Error: Chunks file is empty or invalid format');
    process.exit(1);
  }

  console.log(`Loaded ${chunksData.length} chunks\n`);

  const BATCH_SIZE = 50;
  const totalChunks = chunksData.length;
  const totalBatches = Math.ceil(totalChunks / BATCH_SIZE);
  
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;

  console.log(`Processing in batches of ${BATCH_SIZE}`);
  console.log(`Total batches: ${totalBatches}\n`);

  for (let i = 0; i < chunksData.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = chunksData.slice(i, i + BATCH_SIZE);
    
    console.log(`\n--- Batch ${batchNumber}/${totalBatches} ---`);
    console.log(`Processing chunks ${i + 1} to ${Math.min(i + BATCH_SIZE, totalChunks)}`);

    try {
      const textsToEmbed = batch.map(chunk => chunk.full_text);

      console.log('Generating embeddings with OpenAI...');
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: textsToEmbed,
      });

      const rows = embeddingResponse.data.map((e, idx) => ({
        content: batch[idx].full_text,
        embedding: e.embedding,
        metadata: batch[idx].metadata
      }));

      console.log('Storing embeddings in Supabase...');
      const { data, error } = await supabase
        .from("documents")
        .insert(rows)
        .select();

      if (error) {
        console.error(`Error storing batch ${batchNumber}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✓ Successfully stored ${batch.length} chunks`);
        console.log(`  Database IDs: ${data[0].id} to ${data[data.length - 1].id}`);
      }

      processedCount += batch.length;
      const progress = ((processedCount / totalChunks) * 100).toFixed(1);
      console.log(`Progress: ${processedCount}/${totalChunks} (${progress}%)`);

    } catch (error) {
      console.error(`\n✗ Error processing batch ${batchNumber}:`, error.message);
      errorCount += batch.length;
      
      if (error.message.includes('rate_limit')) {
        console.log('Rate limit hit, waiting 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  }

  console.log('\n=== EMBEDDING PIPELINE COMPLETE ===');
  console.log(`Total chunks processed: ${processedCount}`);
  console.log(`Successfully stored: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (successCount > 0) {
    console.log('\n✓ Database is ready for similarity searches');
    console.log('You can now use the match_documents function to query similar content');
  }

  if (errorCount > 0) {
    console.log('\n⚠ Some chunks failed to process. Review errors above.');
    process.exit(1);
  }
}

console.log('Circular Economy Auditor - Embedding Pipeline\n');
embedAndStore()
  .then(() => {
    console.log('\nEmbedding process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nFatal error in embedding pipeline:', error);
    process.exit(1);
  });
