/**
 * Embedding Storage Script
 *
 * Stores pre-generated embeddings from embedded_chunks.jsonl into the configured database (Aiven PostgreSQL or Supabase).
 * Reads from backend/datasets/processed/embedded_chunks.jsonl by default,
 * or from backend/datasets/archives/embedded_chunks.jsonl when run with `--archives`.
 *
 * Usage:
 * node store_embeddings.js                                # Normal mode: read OUT_EMBEDDED_CHUNKS_JSONL, store in Aiven PostgreSQL documents table
 *
 * node store_embeddings.js --dry-run                      # Dry-run: read OUT_EMBEDDED_CHUNKS_JSONL, write to OUT_STORED_DOCUMENTS_JSONL
 *
 * node store_embeddings.js --archives                     # Archive mode: read ARCHIVES_EMBEDDED_CHUNKS_JSONL, store in Supabase documents table
 *
 * node store_embeddings.js --archives --dry-run           # Dry-run with archives: read ARCHIVES_EMBEDDED_CHUNKS_JSONL, write to ARCHIVES_STORED_DOCUMENTS_JSONL
 *
 * node store_embeddings.js --resume                       # Resume interrupted Aiven storage
 *
 * node store_embeddings.js --archives --resume            # Resume interrupted Supabase storage
 *
 * node store_embeddings.js --dry-run --resume             # Resume dry-run (append to JSONL)
 *
 * node store_embeddings.js --archives --dry-run --resume  # Resume dry-run with archives (append to JSONL)
 *
 * In dry-run mode, documents are written to a local JSONL file instead of the database.
 * The output file is maintained as read-only for durability, but is temporarily unlocked
 * during batch writes to allow appending new documents.
 *
 * Uses centralized embedding configuration from backend/src/config/embedding.js
 */

import '#server/bootstrap.js';

import fs from 'fs';
import readline from 'readline';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

import { from as copyFrom } from 'pg-copy-streams';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import {
  EMBEDDING_DIMENSION,
  isValidEmbedding,
  isValidTextForEmbedding,
} from '#config/embedding.js';
import { getAivenPgPool, getSupabasePgPool } from '#database/client.js';
import {
  ARCHIVES_EMBEDDED_CHUNKS_JSONL,
  ARCHIVES_STORED_DOCUMENTS_JSONL,
  ARCHIVES_TEST_EMBEDDED_CHUNKS_JSONL,
  ARCHIVES_TEST_STORED_DOCUMENTS_JSONL,
  assertFileExists,
  OUT_EMBEDDED_CHUNKS_JSONL,
  OUT_STORED_DOCUMENTS_JSONL,
  OUT_TEST_EMBEDDED_CHUNKS_JSONL,
  OUT_TEST_STORED_DOCUMENTS_JSONL,
  prepareWrite,
  writeJsonl,
} from '#pipeline/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const useArchive = process.argv.includes('--archives');
const test = process.argv.includes('--test');
const DRY_RUN = process.argv.includes('--dry-run') || !BACKEND_CONFIG.supabase.serviceKey;
const WORKERS = DRY_RUN ? 1 : 4; // 4
const RESUME = process.argv.includes('--resume');

const embeddedChunksPath = useArchive
  ? test
    ? ARCHIVES_TEST_EMBEDDED_CHUNKS_JSONL
    : ARCHIVES_EMBEDDED_CHUNKS_JSONL
  : test
    ? OUT_TEST_EMBEDDED_CHUNKS_JSONL
    : OUT_EMBEDDED_CHUNKS_JSONL;
assertFileExists(embeddedChunksPath, 'embedded_chunks.jsonl');
const dryRunOutputPath = useArchive
  ? test
    ? ARCHIVES_TEST_STORED_DOCUMENTS_JSONL
    : ARCHIVES_STORED_DOCUMENTS_JSONL
  : test
    ? OUT_TEST_STORED_DOCUMENTS_JSONL
    : OUT_STORED_DOCUMENTS_JSONL;

// connection clients
let pgPool = null;
if (!DRY_RUN) pgPool = useArchive ? getSupabasePgPool() : getAivenPgPool();

const supabaseDest = `Supabase (${BACKEND_CONFIG.supabase.url})`;
const aivenDest = `Aiven PostgreSQL (${BACKEND_CONFIG.aiven.host})`;
const dbDest = useArchive ? supabaseDest : aivenDest;
const storageDest = DRY_RUN
  ? `local JSONL file at ${dryRunOutputPath}`
  : useArchive
    ? supabaseDest
    : aivenDest;

/**
 * Create an adapter function for inserting documents, which either writes to a JSONL file in dry-run mode or inserts into the database in normal mode.
 * In dry-run mode, the output file is prepared (cleared if not resuming) and documents are appended in batches.
 * In normal mode, documents are inserted in batches using a single multi-row INSERT query with ON CONFLICT to avoid duplicates in resume mode.
 * @returns {Promise<function(Array): Promise<number>>} A function that takes an array of document objects and returns the count of stored documents
 * @throws {Error} If file writing fails in dry-run mode or if database insertion fails in normal mode
 */
export async function createInsertAdapter() {
  const escapeCsv = (v) =>
    `"${String(v ?? '')
      .replace(/"/g, '""')
      .replace(/\r?\n/g, ' ')}"`;

  if (DRY_RUN) {
    await prepareWrite(dryRunOutputPath, { clear: !RESUME });

    /**
     * @param {Array} docs
     * @returns {Promise<number>} count of stored documents
     */
    return async (docs) => {
      await writeJsonl(dryRunOutputPath, docs, { append: true });
      return docs.length;
    };
  }

  /**
   * @param {Array} docs
   * @returns {Promise<number>} count of stored documents
   *
   * Strategy:
   * 1. Query the DB for any (chunk_id, field_name) pairs from this batch that already exist
   *    — uses idx_unique_chunk_field directly, O(batch_size) index lookups.
   * 2. Filter those out so COPY never sees a conflicting row.
   * 3. COPY the clean set directly into documents with live progress logging.
   */
  return async (docs) => {
    const client = await pgPool.connect();

    try {
      // ── Step 1: check which identifiers already exist in the DB ──────────────
      // Build array of [chunk_id, field_name] pairs for this batch
      const pairs = docs.map((d) => [d.metadata.chunk_id, d.metadata.field_name]);

      // Query uses the unique index idx_unique_chunk_field for fast lookups
      const { rows: existingRows } = await client.query(
        `SELECT chunk_id, field_name
          FROM documents
          WHERE (chunk_id, field_name) = ANY(
            SELECT unnest($1::text[]), unnest($2::text[])
          )`,
        [pairs.map((p) => p[0]), pairs.map((p) => p[1])],
      );

      const alreadyInDb = new Set(existingRows.map((r) => `${r.chunk_id}:${r.field_name}`));
      const docsToInsert = docs.filter(
        (d) => !alreadyInDb.has(`${d.metadata.chunk_id}:${d.metadata.field_name}`),
      );

      const skipped = docs.length - docsToInsert.length;
      if (skipped > 0) {
        logger.info({ skipped }, 'Skipping docs already in DB');
      }

      if (docsToInsert.length === 0) {
        logger.info({ total: docs.length }, 'Nothing new to insert: all docs already exist');
        client.release();
        return 0;
      }

      // ── Step 2: COPY the clean set directly into documents ───────────────────
      logger.info({ count: docsToInsert.length }, 'COPY new docs into documents');

      const stream = client.query(
        copyFrom(
          `COPY documents (content, embedding, industry, category, source, metadata) FROM STDIN WITH (FORMAT csv)`,
        ),
      );

      // Push all rows as one payload — avoids backpressure stall with pg-copy-streams
      let rowsWritten = 0;
      const PROGRESS_INTERVAL = Math.max(1, Math.floor(docsToInsert.length / 10));

      const payload =
        docsToInsert
          .map((doc, i) => {
            rowsWritten = i + 1;
            if (rowsWritten % PROGRESS_INTERVAL === 0 || rowsWritten === docsToInsert.length) {
              logger.info({ prepared: rowsWritten, total: docsToInsert.length }, 'Rows prepared');
            }
            const embeddingStr = `[${doc.embedding.join(',')}]`;
            return [
              doc.content.replace(/\n/g, ' '),
              embeddingStr,
              doc.industry ?? '',
              doc.category ?? '',
              doc.source ?? '',
              JSON.stringify(doc.metadata),
            ]
              .map(escapeCsv)
              .join(',');
          })
          .join('\n') + '\n';

      const readable = new Readable({ read() {} });
      readable.push(payload, 'utf8');
      readable.push(null);

      await new Promise((resolve, reject) => {
        stream.on('finish', () => {
          logger.info({ rows: docsToInsert.length }, 'COPY stream finished');
          resolve();
        });
        stream.on('error', reject);
        readable.on('error', reject);
        readable.pipe(stream);
      });

      logger.info({ inserted: docsToInsert.length, total: docs.length, skipped }, 'Docs inserted');
      return docsToInsert.length;
    } catch (error) {
      logger.error({ err: error }, 'insertAdapter error');
      throw error;
    } finally {
      client.release();
    }
  };
}

/**
 * Asynchronously stream embedded chunks from a JSONL file, yielding one chunk object at a time.
 * @async
 * @param {string} filePath - Path to the embedded_chunks.jsonl file
 * @returns {AsyncGenerator<Object>} Yields parsed chunk objects one by one
 * @throws {Error} If the file cannot be read or if any line contains invalid JSON
 */
export async function* streamEmbeddedChunks(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let line = 0;

  for await (const raw of rl) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    try {
      yield JSON.parse(trimmed);
      line++;

      if (line % 1000 === 0) {
        logger.info({ loaded: line }, 'Embedded chunks loaded');
      }
    } catch (err) {
      throw new Error(`Invalid JSON at line ${line + 1}: ${err.message}`);
    }
  }

  logger.info('Finished streaming embeddings');
}

/**
 * Verify that the embedding dimension of the database column matches the expected dimension
 * @async
 * @param {Object} pgPool - PostgreSQL connection pool
 * @param {number} expectedDim - Expected embedding dimension from the model configuration
 * @returns {Promise<void>}
 * @throws {Error} If dimension mismatch or query fails
 */
async function verifyEmbeddingDimension(pgPool, expectedDim) {
  logger.info('Verifying embedding dimension in database');

  const { rows } = await pgPool.query(`
    SELECT
      a.atttypmod
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    WHERE c.relname = 'documents'
      AND a.attname = 'embedding'
  `);

  if (!rows.length) {
    throw new Error('Could not find embedding column in documents table');
  }

  const typmod = rows[0].atttypmod;

  // pgvector stores dimension directly in atttypmod
  const dbDim = typmod;

  if (dbDim !== expectedDim) {
    throw new Error(
      `Embedding dimension mismatch.\nDB expects: ${dbDim}\nModel produces: ${expectedDim}`,
    );
  }

  logger.info({ dimension: dbDim }, 'Embedding dimension verified');
}

/**
 * Process a batch of embedded chunks, prepare documents for insertion, and insert them using the provided insertDocuments function.
 * @async
 * @param {Array} batch - Array of chunk objects to process
 * @param {number} batchNum - Current batch number for logging
 * @param {Set} existingIdentifiers - Set of identifiers already in DB (from resume)
 * @param {Set} seenInRun - Set of identifiers already processed in this run
 * @param {function} insertDocuments - The insert adapter
 * @returns {Promise<{inserted: number, batchNum: number}>} Object with inserted count and batch number
 * @throws {Error} If insertion fails
 */
async function processBatch(batch, batchNum, existingIdentifiers, seenInRun, insertDocuments) {
  const documentsToInsert = [];

  for (const chunk of batch) {
    // Extract structured columns (no defaults - assume upstream normalization)
    const industryVal = chunk.metadata?.industry ?? null;
    const categoryVal = chunk.metadata?.category ?? null;
    const sourceVal = chunk.metadata?.source ?? null;

    // Build metadata object for JSONB
    const baseMeta = {
      chunk_id: chunk.id,
      source_row: chunk.source_row,
      chunk_index: chunk.chunk_index,
      chunk_type: (chunk.metadata && chunk.metadata.chunk_type) || 'primary',
      source_id: (chunk.metadata && chunk.metadata.source_id) || null,
      fields: (chunk.metadata && chunk.metadata.fields) || {},
      word_count: chunk.word_count,
      scale: (chunk.metadata && chunk.metadata.scale) || null,
      r_strategy: (chunk.metadata && chunk.metadata.r_strategy) || null,
      primary_material: (chunk.metadata && chunk.metadata.primary_material) || null,
      geographic_focus: (chunk.metadata && chunk.metadata.geographic_focus) || null,
      scores: (chunk.metadata && chunk.metadata.scores) || null,
    };

    // Doc-level document
    if (chunk.embeddings && chunk.embeddings.doc && isValidEmbedding(chunk.embeddings.doc)) {
      const identifier = `${chunk.id}:doc`;
      // Check both cross-run (existingIdentifiers) and intra-run (seenInRun)
      if ((!RESUME || !existingIdentifiers.has(identifier)) && !seenInRun.has(identifier)) {
        seenInRun.add(identifier);
        documentsToInsert.push({
          content: chunk.content,
          embedding: chunk.embeddings.doc,
          industry: industryVal,
          category: categoryVal,
          source: sourceVal,
          metadata: { ...baseMeta, field_name: 'doc' },
        });
      } else {
        logger.info({ identifier }, 'Skipping duplicate identifier');
      }
    }

    // Field-level documents
    const fieldEmb = (chunk.embeddings && chunk.embeddings.fields) || {};
    for (const [fname, vec] of Object.entries(fieldEmb)) {
      if (!vec || !isValidEmbedding(vec)) continue;

      const fieldText =
        (chunk.metadata && chunk.metadata.fields && chunk.metadata.fields[fname]) || '';
      if (!isValidTextForEmbedding(fieldText)) continue;
      const identifier = `${chunk.id}:${fname}`;
      if ((!RESUME || !existingIdentifiers.has(identifier)) && !seenInRun.has(identifier)) {
        seenInRun.add(identifier);
        documentsToInsert.push({
          content: fieldText,
          embedding: vec,
          industry: industryVal,
          category: categoryVal,
          source: sourceVal,
          metadata: { ...baseMeta, field_name: fname },
        });
      } else {
        logger.info({ identifier }, 'Skipping duplicate identifier');
      }
    }
  }

  if (documentsToInsert.length === 0) {
    logger.info({ batchNum }, 'Batch: nothing to insert');
    return { inserted: 0, batchNum };
  }

  // --- Log initial identifiers (including potential duplicates) before any intra‑batch deduplication ---
  const initialIdentifiers = documentsToInsert.map(
    (d) => `${d.metadata.chunk_id}:${d.metadata.field_name}`,
  );
  // logger.info(
  //   `Batch ${batchNum} initial identifiers (including possible duplicates):`,
  //   JSON.stringify(initialIdentifiers),
  // );

  // --- Intra‑batch (for this batch only) duplicate removal ---
  const duplicateIds = initialIdentifiers.filter(
    (id, index) => initialIdentifiers.indexOf(id) !== index,
  );
  if (duplicateIds.length > 0) {
    logger.warn(
      { batchNum, duplicateCount: duplicateIds.length, duplicateIds },
      'Deduplicating duplicates in batch',
    );
    const seen = new Set();
    const before = documentsToInsert.length;
    documentsToInsert.splice(
      0,
      documentsToInsert.length,
      ...documentsToInsert.filter((d) => {
        const key = `${d.metadata.chunk_id}:${d.metadata.field_name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    );
    const removedCount = before - documentsToInsert.length;
    logger.warn({ batchNum, removed: removedCount }, 'Removed duplicate documents from batch');
  }

  // --- Final identifiers after deduplication ---
  const finalIdentifiers = documentsToInsert.map(
    (d) => `${d.metadata.chunk_id}:${d.metadata.field_name}`,
  );
  // logger.info(
  //   `Batch ${batchNum} final identifiers (after dedup):`,
  //   JSON.stringify(finalIdentifiers),
  // );

  // --- Explicitly show which identifiers were removed (if any) ---
  if (duplicateIds.length > 0) {
    logger.info({ batchNum, removed: duplicateIds }, 'Batch removed identifiers');
  }

  if (documentsToInsert.length === 0) {
    logger.info({ batchNum }, 'Batch: all documents were duplicates, nothing to insert');
    return { inserted: 0, batchNum };
  }

  // --- Proceed to insert ---
  try {
    const inserted = await insertDocuments(documentsToInsert);
    // logger.info(`✓ Batch ${batchNum}: inserted ${inserted}/${documentsToInsert.length} documents`); <- logged in insert adapter for more accurate count after intra-batch deduplication
    return { inserted, batchNum };
  } catch (error) {
    logger.error(
      {
        err: error,
        batchNum,
        documents: documentsToInsert.map((d) => ({
          id: `${d.metadata.chunk_id}:${d.metadata.field_name}`,
          content_preview: d.content.substring(0, 50),
        })),
      },
      'Batch failed',
    );
    throw error; // rethrow to be caught by main error handler
  }
}

/**
 * Store embedded chunks in Supabase documents table
 * @async
 * @param {AsyncGenerator<Object>} chunkStream - Async generator yielding chunk objects with embedding vectors
 * @returns {Promise<number>} Number of documents successfully stored
 * @throws {Error} If storage fails after retries
 */
export async function storeDocuments(chunkStream) {
  logger.info({ resume: RESUME, destination: storageDest }, 'Storing documents');

  // Clear target storage only when not in resume mode
  if (!DRY_RUN && !RESUME) {
    logger.info({ destination: dbDest }, 'Truncating existing documents table');

    const client = await pgPool.connect();
    try {
      await client.query('SET transaction_read_only = off');
      await client.query('TRUNCATE TABLE documents');

      logger.info('Documents table cleared');
    } catch (error) {
      logger.error({ err: error }, 'Documents table clear failed');
      throw error;
    } finally {
      client.release();
    }
  }

  if (RESUME) {
    logger.info(
      { destination: storageDest },
      'Resume mode enabled: existing documents will be preserved',
    );
  }

  // ========== RESUME: gather already stored document identifiers ==========
  let existingIdentifiers = new Set();
  if (RESUME) {
    logger.info('Resume mode: checking already stored documents');
    if (DRY_RUN) {
      // Read existing JSONL file
      if (fs.existsSync(dryRunOutputPath)) {
        const fileStream = fs.createReadStream(dryRunOutputPath, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        for await (const line of rl) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const doc = JSON.parse(trimmed);
            const chunkId = doc.metadata?.chunk_id;
            const fieldName = doc.metadata?.field_name;
            if (chunkId && fieldName) {
              existingIdentifiers.add(`${chunkId}:${fieldName}`);
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
    } else {
      const { rows } = await pgPool.query(
        "SELECT metadata->>'chunk_id' AS chunk_id, metadata->>'field_name' AS field_name FROM documents",
      );

      if (!Array.isArray(rows)) {
        throw new Error('Unexpected response: data rows not an array');
      }

      for (const row of rows) {
        if (row.chunk_id && row.field_name) {
          existingIdentifiers.add(`${row.chunk_id}:${row.field_name}`);
        }
      }
    }
    logger.info({ count: existingIdentifiers.size }, 'Found already stored documents');
  }

  // Track identifiers we've already processed in this run to avoid duplicates within the same run
  const seenInRun = new Set();
  // Stream-level dedup: guard against duplicate chunk entries in the JSONL file itself.
  // This can happen on --resume runs when zero-item chunks were written multiple times.
  const seenChunkIds = new Set();

  const insertDocuments = await createInsertAdapter();
  const BATCH_SIZE = 200;

  let totalStored = 0;
  let batch = [];
  let batchNum = 0;

  const queue = [];

  for await (const chunk of chunkStream) {
    // Skip duplicate chunk entries (same chunk_id appearing more than once in the JSONL)
    if (seenChunkIds.has(chunk.id)) {
      logger.warn({ chunkId: chunk.id }, 'Skipping duplicate chunk in JSONL stream');
      continue;
    }
    seenChunkIds.add(chunk.id);

    batch.push(chunk);

    if (batch.length < BATCH_SIZE) continue;

    batchNum++;
    const batchCopy = batch;
    batch = [];

    // Pass both sets to processBatch
    const job = processBatch(batchCopy, batchNum, existingIdentifiers, seenInRun, insertDocuments);
    queue.push(job);

    if (queue.length >= WORKERS) {
      const results = await Promise.all(queue.splice(0));
      for (const res of results) {
        totalStored += res.inserted;
        logger.info(
          { batchNum: res.batchNum, inserted: res.inserted, totalStored },
          'Batch complete',
        );
      }
    }
  }

  if (batch.length > 0) {
    batchNum++;
    queue.push(processBatch(batch, batchNum, existingIdentifiers, seenInRun, insertDocuments));
  }

  if (queue.length) {
    const results = await Promise.all(queue);
    for (const res of results) {
      totalStored += res.inserted;
      logger.info(
        { batchNum: res.batchNum, inserted: res.inserted, totalStored },
        'Batch complete',
      );
    }
  }

  logger.info({ totalStored }, 'Successfully stored documents');
  return totalStored;
}

/**
 * Validate stored embeddings with test query
 * @async
 * @returns {Promise<void>}
 */
async function validateStorage() {
  logger.info('Validating and optimizing storage');

  // 1. VACUUM and Count Check
  const client = await pgPool.connect();
  try {
    logger.info('Running VACUUM ANALYZE');
    await client.query('VACUUM ANALYZE documents');
  } catch (vacErr) {
    logger.warn({ err: vacErr }, 'VACUUM ANALYZE failed (non-critical)');
  } finally {
    client.release();
  }

  // 2. Count Check
  try {
    const { rows } = await pgPool.query('SELECT COUNT(*) AS count FROM documents');
    const count = parseInt(rows[0].count, 10);
    logger.info({ destination: dbDest, count }, 'Document count');
  } catch (countErr) {
    logger.error({ err: countErr }, 'Failed to count documents');
  }

  // 3. Test vector search function with a dummy embedding
  try {
    // Ensure the search path includes the extensions schema
    await pgPool.query('SET search_path TO public, extensions');

    const testEmbedding = Array(EMBEDDING_DIMENSION).fill(0.1); // Dummy embedding
    const searchSql = `
      SELECT id, content, embedding <=> $1::extensions.halfvec AS distance
      FROM documents
      ORDER BY embedding <=> $1::extensions.halfvec
      LIMIT 3
    `;

    const { rows } = await pgPool.query(searchSql, [`[${testEmbedding.join(',')}]`]);
    if (!Array.isArray(rows)) {
      throw new Error('Unexpected response: search result rows not an array');
    }

    const topResults = rows.map((row, i) => ({
      rank: i + 1,
      id: row.id.substring(0, 8) + '…',
      contentPreview: row.content.length > 80 ? row.content.substring(0, 80) + '…' : row.content,
      distance: row.distance.toFixed(4),
    }));

    logger.info({ rowCount: rows.length, topResults }, 'Test vector search executed successfully');
  } catch (searchErr) {
    logger.error({ err: searchErr }, 'Failed to test vector search');
  }
}

/**
 * Main execution pipeline
 * @async
 */
export async function main() {
  try {
    logger.info(
      {
        pipeline: 'Embedding Storage',
        resume: RESUME,
        dryRun: DRY_RUN,
        archive: useArchive,
        testMode: test,
        workers: WORKERS,
        inputPath: embeddedChunksPath,
        destination: storageDest,
      },
      'Embedding storage pipeline started',
    );

    // Verify embedding dimension in database matches expected dimension from model configuration (skip in dry-run)
    if (!DRY_RUN) {
      await verifyEmbeddingDimension(pgPool, EMBEDDING_DIMENSION);
    }

    // Store documents
    const storedCount = await storeDocuments(streamEmbeddedChunks(embeddedChunksPath));

    // Validate storage (skip in dry-run)
    if (!DRY_RUN) {
      await validateStorage();
    } else {
      logger.info({ archive: useArchive }, 'Dry-run mode: skipped validation');
    }

    // Success summary
    logger.info({ storedCount, destination: storageDest }, 'Embedding storage complete');
  } catch (error) {
    logger.error({ err: error }, 'STORAGE FAILED');
    process.exit(1);
  }
}

// Self-executing module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((err) => {
      logger.error({ err }, 'Fatal error in embedding storage pipeline');
      process.exit(1);
    })
    .finally(async () => {
      if (pgPool) {
        logger.info('Closing database connection pool');
        await pgPool.end();
        logger.info('Database connection pool closed');
      }
    });
}
