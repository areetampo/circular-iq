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
import {
  DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON,
  assertFileExists,
  writeJson,
} from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

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
  logger.error('Error: Multiple flags provided. Please use only one flag at a time.');
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
  logger.info('DEFAULT MODE: Generate ALL embeddings --> cache + Supabase (overwrite both)');
} else if (GEN_CACHE_ALL) {
  logger.info(
    '--gen-cache-all: Generate ALL embeddings --> cache only (overwrite cache, no Supabase)',
  );
} else if (GEN_CACHE_MISSING) {
  logger.info(
    '--gen-cache-missing: Generate ONLY missing embeddings --> cache only (preserve existing, no Supabase)',
  );
} else if (RESTORE_SUPABASE_ALL) {
  logger.info(
    '--restore-supabase-all: Restore ALL embeddings from cache --> Supabase (overwrite, no OpenAI)',
  );
} else if (RESTORE_SUPABASE_MISSING) {
  logger.info(
    '--restore-supabase-missing: Restore ONLY missing embeddings from cache --> Supabase (no OpenAI)',
  );
}

/**
 * Build the text that gets embedded for a row.
 *
 * We include title + company from metadata_json (when present) as context
 * before problem + solution. This enriches semantic search so that queries
 * like "CEWOOD panels" or "acoustic wood wool" surface the right rows even
 * when the product name appears only in metadata_json, not in the core fields.
 *
 * NOTE: metadata_json may arrive as a parsed object (from Supabase select)
 * or as a raw JSON string (if row came from CSV). Both cases are handled.
 */
function getTextToEmbed(row) {
  const parts = [];

  try {
    const meta =
      row.metadata_json && typeof row.metadata_json === 'object'
        ? row.metadata_json
        : JSON.parse(row.metadata_json || '{}');

    const title = meta.title || meta.product_name || '';
    if (title) parts.push(title);

    const company = meta.company || meta.Company || '';
    if (company) parts.push(company);
  } catch {
    // metadata_json unparseable — skip silently, core fields still embedded
  }

  if (row.problem) parts.push(row.problem);
  if (row.solution) parts.push(row.solution);

  return parts.join('\n\n').trim() || '[No text]';
}

async function loadCache() {
  try {
    assertFileExists(
      DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON,
      'Embeddings cache file',
    );
    const data = await fs.readFile(
      DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON,
      'utf8',
    );
    return new Map(Object.entries(JSON.parse(data)));
  } catch (error) {
    if (error.message.includes('not found')) {
      logger.info('Cache file does not exist, starting with empty cache');
    } else {
      logger.warn({ error }, 'Could not load cache file, starting with empty cache');
    }
    return new Map();
  }
}

async function saveCache(cache) {
  const obj = Object.fromEntries(cache);
  await writeJson(DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON, obj);
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

// Fetch all rows including metadata_json (needed for richer embedding text).
// Paginates in chunks of 1000 — Supabase's default limit is 1000 rows per
// request; without pagination, large tables return a silent partial result.
async function fetchAllRows() {
  const PAGE_SIZE = 1000;
  const allRows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('ce_cases')
      .select('id, problem, solution, metadata_json')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data.length) break;

    allRows.push(...data);
    logger.info({ fetched: allRows.length }, 'Fetching rows from Supabase...');

    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return allRows;
}

// Fetch only rows with NULL embedding — also paginated for the same reason.
async function fetchRowsWithNullEmbedding() {
  const PAGE_SIZE = 1000;
  const allRows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('ce_cases')
      .select('id')
      .is('embedding', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data.length) break;

    allRows.push(...data);

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

// Logs done/total, percentage, elapsed time, and ETA after each batch.
function logProgress(done, total, startTime) {
  const pct = ((done / total) * 100).toFixed(1);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
  const rowsPerSec = done / Math.max(elapsedSec, 1);
  const etaSec = rowsPerSec > 0 ? Math.round((total - done) / rowsPerSec) : '?';
  logger.info(
    { done, total, pct: `${pct}%`, elapsed: `${elapsedSec}s`, eta: `${etaSec}s` },
    'Progress',
  );
}

async function main() {
  let cache = await loadCache();
  logger.info({ entries: cache.size }, 'Loaded cache');

  // --------------------------------------------------------------------------
  // MODE: RESTORE-SUPABASE-ALL (overwrite all Supabase embeddings from cache)
  // --------------------------------------------------------------------------
  if (RESTORE_SUPABASE_ALL) {
    if (cache.size === 0) {
      logger.error('Cache is empty. Nothing to restore.');
      process.exit(1);
    }

    const startTime = Date.now();

    logger.info({ count: cache.size }, 'Restoring embeddings from cache to Supabase (overwrite)');

    const entries = Array.from(cache.entries());
    let updated = 0;

    for (let i = 0; i < entries.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = entries.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async ([id, embedding]) => {
          await updateEmbedding(id, embedding);
          updated++;
        }),
      );
      logProgress(updated, entries.length, startTime);
      if (i + EMBEDDING_BATCH_SIZE < entries.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }

    logger.info({ updated }, '✓ Restored embeddings to Supabase (all from cache)');
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    logger.info({ count }, 'Supabase rows with NULL embedding (should be 0)');
    return;
  }

  // --------------------------------------------------------------------------
  // MODE: RESTORE-SUPABASE-MISSING (only where embedding IS NULL)
  // --------------------------------------------------------------------------
  if (RESTORE_SUPABASE_MISSING) {
    const missingRows = await fetchRowsWithNullEmbedding();
    logger.info({ count: missingRows.length }, 'Found rows with NULL embedding in Supabase');
    if (missingRows.length === 0) {
      logger.info('No missing embeddings to restore. Supabase is fully up to date.');
      return;
    }

    const startTime = Date.now();

    logger.info(
      'Starting restore process: checking cache and updating Supabase with missing embeddings',
    );

    let restored = 0;
    let missingInCache = 0;

    for (let i = 0; i < missingRows.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = missingRows.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          if (cache.has(row.id)) {
            await updateEmbedding(row.id, cache.get(row.id));
            restored++;
          } else {
            missingInCache++;
            logger.warn({ id: row.id }, 'Missing in cache — cannot restore');
          }
        }),
      );
      logProgress(restored + missingInCache, missingRows.length, startTime);
      if (i + EMBEDDING_BATCH_SIZE < missingRows.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }

    logger.info({ restored, missingInCache }, '✓ Restore complete');
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    logger.info({ count }, 'Supabase rows with NULL embedding');
    return;
  }

  // --------------------------------------------------------------------------
  // For all remaining modes, we need all rows from the database
  // --------------------------------------------------------------------------
  const allRows = await fetchAllRows();
  logger.info({ count: allRows.length }, 'Total rows in ce_cases');

  // --------------------------------------------------------------------------
  // MODE: GEN-CACHE-ALL (generate all embeddings, update cache only)
  // --------------------------------------------------------------------------
  if (GEN_CACHE_ALL) {
    const startTime = Date.now();

    logger.info('Generating embeddings for ALL rows (cache only, no Supabase writes)');

    let generated = 0;

    for (let i = 0; i < allRows.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = allRows.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          const text = getTextToEmbed(row);
          const embedding = await getEmbedding(text);
          cache.set(row.id, embedding);
          generated++;
        }),
      );
      logProgress(generated, allRows.length, startTime);
      await saveCache(cache);
      if (i + EMBEDDING_BATCH_SIZE < allRows.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }

    logger.info({ generated }, '✓ Generated and cached embeddings (Supabase untouched)');
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    logger.info({ count }, 'Supabase rows with NULL embedding');
    return;
  }

  // --------------------------------------------------------------------------
  // MODE: GEN-CACHE-MISSING (generate only missing in cache, append to cache)
  // --------------------------------------------------------------------------
  if (GEN_CACHE_MISSING) {
    const missingInCache = allRows.filter((row) => !cache.has(row.id));

    logger.info(
      { missing: missingInCache.length, cached: cache.size, total: allRows.length },
      'Cache status',
    );

    if (missingInCache.length === 0) {
      logger.info('Cache already contains all rows. Nothing to generate.');
      return;
    }

    const startTime = Date.now();

    logger.info('Starting generation process: creating embeddings for missing cache entries');

    let generated = 0;

    for (let i = 0; i < missingInCache.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = missingInCache.slice(i, i + EMBEDDING_BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          const text = getTextToEmbed(row);
          const embedding = await getEmbedding(text);
          cache.set(row.id, embedding);
          generated++;
        }),
      );
      logProgress(generated, missingInCache.length, startTime);
      await saveCache(cache);
      if (i + EMBEDDING_BATCH_SIZE < missingInCache.length) {
        await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
      }
    }

    logger.info({ generated }, 'Generated and cached missing embeddings (Supabase untouched)');
    const { count, error } = await supabase
      .from('ce_cases')
      .select('id', { count: 'exact', head: true })
      .is('embedding', null);
    if (error) throw error;
    logger.info({ count }, 'Supabase rows with NULL embedding');
    return;
  }

  // --------------------------------------------------------------------------
  // DEFAULT MODE: generate all embeddings, overwrite cache + Supabase
  // --------------------------------------------------------------------------
  const startTime = Date.now();

  logger.info('DEFAULT MODE: Generating embeddings for ALL rows (overwrite cache + Supabase)');

  let generated = 0;

  for (let i = 0; i < allRows.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = allRows.slice(i, i + EMBEDDING_BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        const text = getTextToEmbed(row);
        const embedding = await getEmbedding(text);
        cache.set(row.id, embedding);
        await updateEmbedding(row.id, embedding);
        generated++;
      }),
    );
    logProgress(generated, allRows.length, startTime);
    await saveCache(cache);
    if (i + EMBEDDING_BATCH_SIZE < allRows.length) {
      await new Promise((resolve) => setTimeout(resolve, EMBEDDING_BATCH_DELAY_MS));
    }
  }

  logger.info({ generated }, '✓ Generated and stored embeddings (cache + Supabase)');
  const { count, error } = await supabase
    .from('ce_cases')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);
  if (error) throw error;
  logger.info({ count }, 'Supabase rows with NULL embedding (should be 0)');
}

main().catch((err) => logger.error({ err }, 'Main failed'));
