/**
 * Embeds `ce_cases` rows via OpenAI with optional local cache and Supabase restore modes.
 * Flags: default (cache+DB), `--gen-cache-all`, `--gen-cache-missing`, `--restore-supabase-all`, `--restore-supabase-missing`.
 */

import fs from 'fs/promises';

import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getSupabaseClient } from '#database/index.js';
import {
  DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON,
  assertFileExists,
  writeJson,
} from '#utils/datasetsUtils.js';
import {
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_MODEL,
  retryWithBackoff,
} from '#utils/embedding.js';
import { logger } from '#utils/logger.js';

const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });
const supabase = getSupabaseClient();

const args = process.argv.slice(2);
const GEN_CACHE_ALL = args.includes('--gen-cache-all');
const GEN_CACHE_MISSING = args.includes('--gen-cache-missing');
const RESTORE_SUPABASE_ALL = args.includes('--restore-supabase-all');
const RESTORE_SUPABASE_MISSING = args.includes('--restore-supabase-missing');

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
 * Includes title and company from metadata_json (when present) as context
 * before problem and solution. This enriches semantic search so that queries
 * like "CEWOOD panels" or "acoustic wood wool" surface the right rows even
 * when the product name appears only in metadata_json, not in the core fields.
 *
 * NOTE: metadata_json may arrive as a parsed object (from Supabase select)
 * or as a raw JSON string (if row came from CSV). Both cases are handled.
 *
 * @param {{ problem?: string, solution?: string, metadata_json?: Record<string, unknown>|string|null }} row - Database row with problem, solution, and metadata fields used as embedding context.
 * @returns {string} Text to embed, or `[No text]` if no content is available.
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

/**
 * Loads embeddings cache from local JSON file.
 * Returns an empty Map if the file doesn't exist or can't be parsed.
 *
 * @returns {Promise<Map<string, Array<number>>>} CE case ID to embedding vector map.
 */
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

/**
 * Saves embeddings cache to local JSON file.
 *
 * @param {Map<string, Array<number>>} cache - CE case ID to embedding vector map.
 * @throws {Error} If the cache file cannot be written.
 */
async function saveCache(cache) {
  const obj = Object.fromEntries(cache);
  await writeJson(DATASETS_FOR_SEARCH_COMBINED_INPUT_EMBEDDINGS_CACHE_JSON, obj);
}

/**
 * Generates an OpenAI embedding for CE case text with retry logic.
 *
 * @param {string} text - CE case text sent to OpenAI embeddings API.
 * @returns {Promise<Array<number>>} Embedding vector from the configured embedding model.
 * @throws {Error} If embedding generation fails after retries.
 */
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

/**
 * Updates a single row's embedding in Supabase.
 *
 * @param {string} id - CE case row ID to update.
 * @param {Array<number>} embeddingVector - Embedding vector to store in the `embedding` column.
 * @throws {Error} If Supabase rejects the update.
 */
async function updateEmbedding(id, embeddingVector) {
  const { error } = await supabase
    .from('ce_cases')
    .update({ embedding: embeddingVector })
    .eq('id', id);
  if (error) throw new Error(`Failed to update ${id}: ${error.message}`);
}

/**
 * Fetches all rows from `ce_cases` needed for embedding text construction.
 * Paginates in chunks of 1000 to avoid Supabase's default limit.
 * Without pagination, large tables return a silent partial result.
 *
 * @returns {Promise<Array<{ id: string, problem?: string|null, solution?: string|null, metadata_json?: Record<string, unknown>|string|null }>>} CE case rows selected for embedding.
 * @throws {Error} If a Supabase page query fails.
 */
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

/**
 * Fetches only rows with NULL embeddings from `ce_cases`.
 * Paginated in chunks of 1000 for the same reason as fetchAllRows.
 *
 * @returns {Promise<Array<{ id: string }>>} CE case IDs missing embeddings, used for cache restoration.
 * @throws {Error} If a Supabase page query fails.
 */
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

/**
 * Logs progress statistics including done/total, percentage, elapsed time, and ETA.
 *
 * @param {number} done - Completed item count used to compute percent and ETA.
 * @param {number} total - Total item count for the active mode.
 * @param {number} startTime - Start timestamp in Unix milliseconds.
 */
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

/**
 * Routes CE case embedding work to the selected cache or Supabase operation mode.
 * Handles all five operation modes: default, gen-cache-all, gen-cache-missing,
 * restore-supabase-all, and restore-supabase-missing.
 *
 * @throws {Error} If Supabase reads/writes or embedding generation fail after logging context.
 */
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

main().catch((error) => logger.error({ error }, 'Main failed'));
