/**
 * Pipeline step: `embedded_chunks.jsonl` → `documents` table (Aiven) or Supabase when `--archives`.
 * Flags: `--dry-run` (JSONL only), `--resume`, `--archives`. Target chosen via `USE_SUPABASE_DOCUMENTS_TABLE`.
 */

import '#server/bootstrap.js';

import fs from 'fs';
import readline from 'readline';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

import { from as copyFrom } from 'pg-copy-streams';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getAivenPgPool, getSupabasePgPool } from '#database/index.js';
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
} from '#utils/datasetsUtils.js';
import {
  EMBEDDING_DIMENSION,
  isValidEmbedding,
  isValidTextForEmbedding,
} from '#utils/embedding.js';
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
 * Creates a storage adapter for dry-run JSONL writes or database COPY insertion.
 * Dry-run mode prepares the output file immediately; normal mode defers duplicate checks and COPY work to the returned adapter.
 *
 * @returns {Promise<(docs: Array<{ content: string, embedding: number[], industry?: string|null, category?: string|null, source?: string|null, metadata: { chunk_id: string, field_name: string, [key: string]: unknown } }>) => Promise<number>>} Insert adapter that stores document rows and returns the number persisted.
 * @throws {Error} If dry-run output preparation fails before the adapter is returned.
 */
export async function createInsertAdapter() {
  const escapeCsv = (v) =>
    `"${String(v ?? '')
      .replace(/"/g, '""')
      .replace(/\r?\n/g, ' ')}"`;

  if (DRY_RUN) {
    await prepareWrite(dryRunOutputPath, { clear: !RESUME });

    /**
     * @param {Array<{ content: string, embedding: number[], metadata: Record<string, unknown> }>} docs - Embedded document rows that would be inserted during a non-dry run.
     * @returns {Promise<number>} Number of rows appended to the dry-run JSONL output.
     */
    return async (docs) => {
      await writeJsonl(dryRunOutputPath, docs, { append: true });
      return docs.length;
    };
  }

  /**
   * @param {Array<{ content: string, embedding: number[], industry?: string|null, category?: string|null, source?: string|null, metadata: { chunk_id: string, field_name: string, [key: string]: unknown } }>} docs - Embedded document rows to insert after duplicate filtering.
   * @returns {Promise<number>} Number of rows copied into `documents`; duplicate `(chunk_id, field_name)` pairs are excluded.
   * @throws {Error} If duplicate lookup, COPY streaming, or connection handling fails.
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
      // Use the unique index to avoid COPY conflicts during resumed or repeated runs.
      const pairs = docs.map((d) => [d.metadata.chunk_id, d.metadata.field_name]);

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
      logger.error({ error }, 'insertAdapter error');
      throw error;
    } finally {
      client.release();
    }
  };
}

/**
 * Streams embedded chunks from JSONL one parsed object at a time.
 *
 * @param {string} filePath - Path to the selected `embedded_chunks.jsonl` file.
 * @returns {AsyncGenerator<{ id: string, content: string, embeddings?: Record<string, number[]>, metadata?: Record<string, unknown>, [key: string]: unknown }>} Parsed embedded chunk objects yielded one line at a time.
 * @throws {Error} If the file cannot be read or any non-empty line contains invalid JSON.
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
    } catch (error) {
      throw new Error(`Invalid JSON at line ${line + 1}: ${error.message}`);
    }
  }

  logger.info('Finished streaming embeddings');
}

/**
 * Verifies that the database vector column matches the configured embedding dimension.
 *
 * @param {{ query: (sql: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> }} pgPool - PostgreSQL connection pool.
 * @param {number} expectedDim - Embedding dimension produced by the configured model.
 * @throws {Error} If the embedding column is missing, the dimension differs, or the query fails.
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

  // pgvector exposes the configured vector dimension through atttypmod.
  const dbDim = typmod;

  if (dbDim !== expectedDim) {
    throw new Error(
      `Embedding dimension mismatch.\nDB expects: ${dbDim}\nModel produces: ${expectedDim}`,
    );
  }

  logger.info({ dimension: dbDim }, 'Embedding dimension verified');
}

/**
 * Converts embedded chunks into document rows, deduplicates identifiers, and persists the batch.
 *
 * @param {Array<{ id: string, content: string, source_row?: number, chunk_index?: number, word_count?: number, embeddings?: Record<string, number[]>, metadata?: Record<string, unknown> }>} batch - Embedded chunk objects from the current worker batch.
 * @param {number} batchNum - One-based batch number used in progress and error logs.
 * @param {Set<string>} existingIdentifiers - Previously stored `chunk_id:field_name` identifiers loaded during resume mode.
 * @param {Set<string>} seenInRun - Identifiers already prepared by earlier batches in this process.
 * @param {(docs: Array<{ content: string, embedding: number[], industry?: string|null, category?: string|null, source?: string|null, metadata: { chunk_id: string, field_name: string, [key: string]: unknown } }>) => Promise<number>} insertDocuments - Adapter that writes prepared docs and returns the persisted count.
 * @returns {Promise<{ inserted: number, batchNum: number }>} Insert count paired with the original batch number for concurrent result aggregation.
 * @throws {Error} If the insert adapter rejects.
 */
async function processBatch(batch, batchNum, existingIdentifiers, seenInRun, insertDocuments) {
  const documentsToInsert = [];

  for (const chunk of batch) {
    // Upstream chunking normalizes these fields, so missing values stay null rather than invented.
    const industryVal = chunk.metadata?.industry ?? null;
    const categoryVal = chunk.metadata?.category ?? null;
    const sourceVal = chunk.metadata?.source ?? null;

    // Keep source fields together in metadata so vector rows can be traced back to chunks.
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

    // The full chunk text is indexed separately from individual metadata fields.
    if (chunk.embeddings && chunk.embeddings.doc && isValidEmbedding(chunk.embeddings.doc)) {
      const identifier = `${chunk.id}:doc`;
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

    // Field embeddings let targeted queries match source metadata that is not in the main text.
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

  const initialIdentifiers = documentsToInsert.map(
    (d) => `${d.metadata.chunk_id}:${d.metadata.field_name}`,
  );
  // Remove duplicate identifiers within the batch before COPY sees a unique-key conflict.
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

  if (duplicateIds.length > 0) {
    logger.info({ batchNum, removed: duplicateIds }, 'Batch removed identifiers');
  }

  if (documentsToInsert.length === 0) {
    logger.info({ batchNum }, 'Batch: all documents were duplicates, nothing to insert');
    return { inserted: 0, batchNum };
  }

  try {
    const inserted = await insertDocuments(documentsToInsert);
    return { inserted, batchNum };
  } catch (error) {
    logger.error(
      {
        error,
        batchNum,
        documents: documentsToInsert.map((d) => ({
          chunkId: d.metadata.chunk_id,
          fieldName: d.metadata.field_name,
          content_preview: d.content.substring(0, 50),
        })),
      },
      'Batch failed',
    );
    throw error;
  }
}

/**
 * Stores embedded chunks as searchable document rows in the configured destination.
 * Non-resume database runs truncate `documents`; resume runs preserve existing identifiers.
 *
 * @param {AsyncGenerator<{ id: string, content: string, embeddings?: Record<string, number[]>, metadata?: Record<string, unknown> }>} chunkStream - Async generator yielding chunk objects with embedding vectors.
 * @returns {Promise<number>} Number of new document rows persisted after duplicate filtering.
 * @throws {Error} If truncation, resume lookup, streaming, or batch insertion fails.
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
      logger.error({ error }, 'Documents table clear failed');
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
            // Resume should continue past partial dry-run lines left by interrupted writes.
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
 * Runs post-load database maintenance and a smoke-test vector search.
 * VACUUM, metadata backfill, count, and search failures are logged but do not stop the pipeline.
 *
 * @throws {Error} If a database connection cannot be acquired for VACUUM.
 */
async function validateStorage() {
  logger.info('Validating and optimizing storage');

  const client = await pgPool.connect();
  try {
    logger.info('Running VACUUM ANALYZE');
    await client.query('VACUUM ANALYZE documents');
  } catch (vacErr) {
    logger.warn({ vacErr }, 'VACUUM ANALYZE failed (non-critical)');
  } finally {
    client.release();
  }

  try {
    logger.info('Running metadata backfill');
    await pgPool.query('SELECT backfill_document_metadata()');
    logger.info('Metadata backfill complete');
  } catch (backfillErr) {
    logger.warn({ backfillErr }, 'Metadata backfill failed (non-critical)');
  }

  try {
    const { rows } = await pgPool.query('SELECT COUNT(*) AS count FROM documents');
    const count = parseInt(rows[0].count, 10);
    logger.info({ destination: dbDest, count }, 'Document count');
  } catch (countErr) {
    logger.error({ countErr }, 'Failed to count documents');
  }

  try {
    // halfvec operators live in the extensions schema on this database.
    await pgPool.query('SET search_path TO public, extensions');

    const testEmbedding = Array(EMBEDDING_DIMENSION).fill(0.1); // Fixed smoke-test vector.
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
    logger.error({ searchErr }, 'Failed to test vector search');
  }
}

/**
 * CLI entry for storing embedded chunks and validating the target database when enabled.
 * Exits with status 1 when any required storage step fails.
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

    if (!DRY_RUN) {
      await verifyEmbeddingDimension(pgPool, EMBEDDING_DIMENSION);
    }

    const storedCount = await storeDocuments(streamEmbeddedChunks(embeddedChunksPath));

    if (!DRY_RUN) {
      await validateStorage();
    } else {
      logger.info({ archive: useArchive }, 'Dry-run mode: skipped validation');
    }

    logger.info({ storedCount, destination: storageDest }, 'Embedding storage complete');
  } catch (error) {
    logger.error({ error }, 'STORAGE FAILED');
    process.exit(1);
  }
}

// Self-executing module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((error) => {
      logger.error({ error }, 'Fatal error in embedding storage pipeline');
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
