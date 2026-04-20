// backend/pipeline/embed_ce_cases.js
import fs from 'fs/promises';

import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_MODEL,
  retryWithBackoff,
} from '#config/embedding.js';
import { supabase } from '#database/index.js';
import { DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON } from '#pipeline/datasetsUtils.js';

const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

/** === FLAGS ===
 *
 * No flags (default):
 *   - Generate embeddings for ALL rows (call OpenAI)
 *   - Overwrite ALL embeddings in local cache
 *   - Overwrite ALL embeddings in Supabase
 *
 * --gen-cache-all
 *   - Generate embeddings for ALL rows (call OpenAI)
 *   - Overwrite ALL embeddings in local cache
 *   - Do NOT touch Supabase
 *
 * --gen-cache-missing
 *   - Generate embeddings ONLY for rows missing in local cache
 *   - Append missing embeddings to local cache (preserve existing)
 *   - Do NOT touch Supabase
 *
 * --restore-supabase-all
 *   - Overwrite ALL embeddings in Supabase using local cache (no OpenAI)
 *   - For every id present in the cache file, update Supabase
 *   - Rows in Supabase but not in cache remain unchanged
 *
 * --restore-supabase-missing
 *   - Write ONLY missing embeddings to Supabase (where embedding IS NULL)
 *   - Uses local cache as source (no OpenAI)
 */

const args = process.argv.slice(2);
const GEN_CACHE_ALL = args.includes('--gen-cache-all');
const GEN_CACHE_MISSING = args.includes('--gen-cache-missing');
const RESTORE_SUPABASE_ALL = args.includes('--restore-supabase-all');
const RESTORE_SUPABASE_MISSING = args.includes('--restore-supabase-missing');

// Validate that at most one flag is provided
const flagsProvided = [
  GEN_CACHE_ALL,
  GEN_CACHE_MISSING,
  RESTORE_SUPABASE_ALL,
  RESTORE_SUPABASE_MISSING,
].filter(Boolean).length;
if (flagsProvided > 1) {
  console.error('❌ Error: Multiple flags provided. Please use only one flag at a time.');
  process.exit(1);
}

// Determine mode
const DEFAULT_MODE = !(
  GEN_CACHE_ALL ||
  GEN_CACHE_MISSING ||
  RESTORE_SUPABASE_ALL ||
  RESTORE_SUPABASE_MISSING
);

if (DEFAULT_MODE) {
  console.log('◉ DEFAULT MODE: Generate ALL embeddings → cache + Supabase (overwrite both)');
} else if (GEN_CACHE_ALL) {
  console.log(
    '◉ --gen-cache-all: Generate ALL embeddings → cache only (overwrite cache, no Supabase)',
  );
} else if (GEN_CACHE_MISSING) {
  console.log(
    '◉ --gen-cache-missing: Generate ONLY missing embeddings → cache only (preserve existing, no Supabase)',
  );
} else if (RESTORE_SUPABASE_ALL) {
  console.log(
    '◉ --restore-supabase-all: Restore ALL embeddings from cache → Supabase (overwrite, no OpenAI)',
  );
} else if (RESTORE_SUPABASE_MISSING) {
  console.log(
    '◉ --restore-supabase-missing: Restore ONLY missing embeddings from cache → Supabase (no OpenAI)',
  );
}

function getTextToEmbed(row) {
  const parts = [];
  if (row.problem) parts.push(row.problem);
  if (row.solution) parts.push(row.solution);
  return parts.join('\n\n').trim() || '[No text]';
}

async function loadCache() {
  try {
    const data = await fs.readFile(
      DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON,
      'utf8',
    );
    return new Map(JSON.parse(data));
  } catch {
    return new Map();
  }
}

async function saveCache(cache) {
  const obj = Object.fromEntries(cache);
  await fs.writeFile(
    DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON,
    JSON.stringify(obj, null, 2),
  );
}

async function getEmbedding(text) {
  return retryWithBackoff(async () => {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  });
}

async function updateEmbedding(id, embeddingVector) {
  const { error } = await supabase
    .from('ce_cases')
    .update({ embedding: embeddingVector })
    .eq('id', id);
  if (error) throw new Error(`Failed to update ${id}: ${error.message}`);
}

// Helper: fetch all rows (for default, gen-cache-all, gen-cache-missing)
async function fetchAllRows() {
  const { data, error } = await supabase.from('ce_cases').select('id, problem, solution');
  if (error) throw error;
  return data;
}

// Helper: fetch rows with NULL embedding (for restore-supabase-missing)
async function fetchRowsWithNullEmbedding() {
  const { data, error } = await supabase.from('ce_cases').select('id').is('embedding', null);
  if (error) throw error;
  return data;
}

async function main() {
  // Load current cache
  let cache = await loadCache();
  console.log(`Loaded cache with ${cache.size} entries.`);

  // --------------------------------------------------------------------------
  // MODE: RESTORE-SUPABASE-ALL (overwrite all Supabase embeddings from cache)
  // --------------------------------------------------------------------------
  if (RESTORE_SUPABASE_ALL) {
    if (cache.size === 0) {
      console.error('❌ Cache is empty. Nothing to restore.');
      process.exit(1);
    }
    console.log(`Restoring ${cache.size} embeddings from cache to Supabase (overwrite)...`);
    const entries = Array.from(cache.entries());
    let updated = 0;
    for (let i = 0; i < entries.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = entries.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async ([id, embedding]) => {
          await updateEmbedding(id, embedding);
          updated++;
          console.log(`✓ ${id} updated in Supabase`);
        }),
      );
      console.log(`Progress: ${updated}/${cache.size}`);
      if (i + EMBEDDING_BATCH_SIZE < entries.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }
    console.log(`✅ Restored ${updated} embeddings to Supabase (all from cache).`);
    // Final validation query
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    console.log(`📊 Supabase still has ${count} rows with NULL embedding.`);
    return;
  }

  // --------------------------------------------------------------------------
  // MODE: RESTORE-SUPABASE-MISSING (only where embedding IS NULL)
  // --------------------------------------------------------------------------
  if (RESTORE_SUPABASE_MISSING) {
    const missingRows = await fetchRowsWithNullEmbedding();
    console.log(`Found ${missingRows.length} rows with NULL embedding in Supabase.`);
    if (missingRows.length === 0) {
      console.log('No missing embeddings to restore.');
      return;
    }
    let restored = 0;
    let missingInCache = 0;
    for (let i = 0; i < missingRows.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = missingRows.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          if (cache.has(row.id)) {
            const embedding = cache.get(row.id);
            await updateEmbedding(row.id, embedding);
            restored++;
            console.log(`✓ ${row.id} restored from cache to Supabase`);
          } else {
            missingInCache++;
            console.warn(`⚠️  ${row.id} missing in cache — cannot restore.`);
          }
        }),
      );
      console.log(
        `Progress: ${restored}/${missingRows.length} restored, ${missingInCache} missing from cache`,
      );
      if (i + EMBEDDING_BATCH_SIZE < missingRows.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }
    console.log(`✅ Restored ${restored} rows. ${missingInCache} rows missing from cache.`);
    // Final validation
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    console.log(`📊 Supabase still has ${count} rows with NULL embedding.`);
    return;
  }

  // --------------------------------------------------------------------------
  // For all remaining modes, we need all rows from the database
  // --------------------------------------------------------------------------
  const allRows = await fetchAllRows();
  console.log(`Total rows in ce_cases: ${allRows.length}`);

  // --------------------------------------------------------------------------
  // MODE: GEN-CACHE-ALL (generate all embeddings, update cache only)
  // --------------------------------------------------------------------------
  if (GEN_CACHE_ALL) {
    console.log('Generating embeddings for ALL rows (cache only)...');
    let generated = 0;
    for (let i = 0; i < allRows.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = allRows.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          const text = getTextToEmbed(row);
          console.log(`Generating embedding for ${row.id} (${text.length} chars)...`);
          const embedding = await getEmbedding(text);
          cache.set(row.id, embedding);
          generated++;
          console.log(`✓ ${row.id} generated and cached`);
        }),
      );
      console.log(`Progress: ${generated}/${allRows.length}`);
      await saveCache(cache);
      if (i + EMBEDDING_BATCH_SIZE < allRows.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }
    console.log(`✅ Generated and cached ${generated} embeddings.`);
    // Optional: show Supabase NULL count (cache-only doesn't change Supabase)
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    console.log(`📊 Supabase currently has ${count} rows with NULL embedding.`);
    return;
  }

  // --------------------------------------------------------------------------
  // MODE: GEN-CACHE-MISSING (generate only missing in cache, append to cache)
  // --------------------------------------------------------------------------
  if (GEN_CACHE_MISSING) {
    const missingInCache = allRows.filter((row) => !cache.has(row.id));
    console.log(`Found ${missingInCache.length} rows missing from cache.`);
    if (missingInCache.length === 0) {
      console.log('Cache already contains all rows. Nothing to generate.');
      return;
    }
    let generated = 0;
    for (let i = 0; i < missingInCache.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = missingInCache.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          const text = getTextToEmbed(row);
          console.log(`Generating embedding for ${row.id} (${text.length} chars)...`);
          const embedding = await getEmbedding(text);
          cache.set(row.id, embedding);
          generated++;
          console.log(`✓ ${row.id} generated and added to cache`);
        }),
      );
      console.log(`Progress: ${generated}/${missingInCache.length}`);
      await saveCache(cache);
      if (i + EMBEDDING_BATCH_SIZE < missingInCache.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }
    console.log(`✅ Generated and cached ${generated} new embeddings.`);
    // Optional: show Supabase NULL count
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    console.log(`📊 Supabase currently has ${count} rows with NULL embedding.`);
    return;
  }

  // --------------------------------------------------------------------------
  // DEFAULT MODE: generate all embeddings, overwrite cache + Supabase
  // --------------------------------------------------------------------------
  console.log('DEFAULT MODE: Generating embeddings for ALL rows (overwrite cache + Supabase)...');
  let generated = 0;
  for (let i = 0; i < allRows.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = allRows.slice(i, i + EMBEDDING_BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        const text = getTextToEmbed(row);
        console.log(`Generating embedding for ${row.id} (${text.length} chars)...`);
        const embedding = await getEmbedding(text);
        // Update cache
        cache.set(row.id, embedding);
        // Update Supabase
        await updateEmbedding(row.id, embedding);
        generated++;
        console.log(`✓ ${row.id} generated and stored in cache + Supabase`);
      }),
    );
    console.log(`Progress: ${generated}/${allRows.length}`);
    await saveCache(cache);
    if (i + EMBEDDING_BATCH_SIZE < allRows.length) {
      await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
    }
  }
  console.log(`✅ Generated and stored ${generated} embeddings (cache + Supabase).`);

  // Final validation: count rows still with NULL embedding
  const { count, error } = await supabase
    .from('ce_cases')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);
  if (error) throw error;
  console.log(`📊 Supabase has ${count} rows with NULL embedding (should be 0).`);
}

main().catch(console.error);
