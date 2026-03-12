/**
 * Embedding Storage Script
 *
 * Stores pre-generated embeddings from embedded_chunks.jsonl into the configured database (Aiven PostgreSQL or Supabase).
 * Reads from backend/datasets/processed/embedded_chunks.jsonl by default,
 * or from backend/datasets/archives/embedded_chunks.jsonl when run with `--archives`.
 *
 * Usage:
 * node store_embeddings.js                                # Normal mode: read EMBEDDED_CHUNKS_JSONL, store in Aiven PostgreSQL documents table
 *
 * node store_embeddings.js --dry-run                      # Dry-run: read EMBEDDED_CHUNKS_JSONL, write to STORED_DOCUMENTS_JSONL
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
import path from 'path';
import readline from 'readline';
import process from 'process';
import { createSupabaseClient } from '#database/supabase.client.js';
import { getPgPool } from '#database/client.js';
import {
  ARCHIVES_EMBEDDED_CHUNKS_JSONL,
  EMBEDDED_CHUNKS_JSONL,
  ARCHIVES_STORED_DOCUMENTS_JSONL,
  STORED_DOCUMENTS_JSONL,
  prepareWrite,
  ensureDir,
  writeJsonl,
  assertFileExists,
} from '#utils/datasetsUtils.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { isValidTextForEmbedding, isValidEmbedding } from '#config/embedding.js';
import { fileURLToPath } from 'url';

// The `--archives` flag is now interpreted as "use Supabase for storage".
// When absent we default to using Aiven PostgreSQL for the documents table.
// CLI flags take precedence; environment variables are no longer consulted.
const useArchive = process.argv.includes('--archives') || process.argv.includes('--archive');
const DRY_RUN = process.argv.includes('--dry-run') || !BACKEND_CONFIG.supabase.serviceKey;
const RESUME = process.argv.includes('--resume');

// connection clients
let supabase = null;
let pgPool = null;
if (!DRY_RUN) {
  if (useArchive) {
    supabase = createSupabaseClient();
  } else {
    pgPool = getPgPool();
  }
}

/**
 * Load previously generated embedded chunks from a JSONL file
 * @param {string} embeddedChunksPath - Path to embedded_chunks.jsonl
 * @returns {Promise<Array>} Array of embedded chunk objects
 * @throws {Error} If file not found or invalid JSONL
 */
export async function loadEmbeddedChunks(embeddedChunksPath) {
  const chunks = [];
  const fileStream = fs.createReadStream(embeddedChunksPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (trimmed === '') continue;
      try {
        const chunk = JSON.parse(trimmed);
        chunks.push(chunk);
        lineCount++;
        if (lineCount % 1000 === 0) {
          console.log(`  Loaded ${lineCount} embedded chunks...`);
        }
      } catch (parseError) {
        throw new Error(`Invalid JSON at line ${lineCount + 1}: ${parseError.message}`);
      }
    }
  } catch (error) {
    console.error('Error reading embedded chunks:', error.message);
    throw error;
  }

  console.log(`✓ Loaded ${chunks.length} embedded chunks from ${embeddedChunksPath}`);
  return chunks;
}

/**
 * Store embedded chunks in Supabase documents table
 * @param {Array} embeddedChunks - Chunks with embedding vectors
 * @returns {Promise<number>} Number of documents successfully stored
 * @throws {Error} If storage fails after retries
 */
export async function storeDocuments(embeddedChunks) {
  console.log(
    `\nStoring ${embeddedChunks.length} documents${DRY_RUN ? ' (dry-run -> local JSONL)' : useArchive ? ' in Supabase' : ' in Aiven PostgreSQL'}...`,
  );

  // Determine output path for dry-run mode
  const dryRunOutputPath = useArchive ? ARCHIVES_STORED_DOCUMENTS_JSONL : STORED_DOCUMENTS_JSONL;

  // Clear target storage only when not in resume mode
  if (!DRY_RUN && !RESUME) {
    if (useArchive) {
      console.log('  Using SUPABASE_SERVICE_ROLE_KEY (required for RLS bypass)\n');
      console.log(`Truncating existing documents table in Supabase...`);
      try {
        const { error: truncateError } = await supabase.rpc('truncate_documents');
        if (truncateError) {
          throw new Error(`Truncate failed: ${truncateError.message}`);
        }
        console.log('✓ documents table cleared.\n');
      } catch (error) {
        console.error('✗ documents table clear failed:', error.message);
        throw error;
      }
    } else {
      console.log('  Clearing documents table in Aiven PostgreSQL...');
      // Ensure we are in write mode before truncating
      const client = await pgPool.connect();
      try {
        await client.query('SET transaction_read_only = off');
        await client.query('TRUNCATE TABLE documents');
        console.log('✓ documents table truncated.\n');
      } catch (err) {
        console.error('✗ Failed to clear Aiven documents table:', err.message);
        throw err;
      } finally {
        client.release();
      }
    }
  } else if (DRY_RUN && !RESUME) {
    // dry-run, not resume: start with clean file
    await prepareWrite(dryRunOutputPath, { clear: true });
  } else {
    console.log(`Resume mode: skipping table truncation and file clear.\n`);
  }

  // ========== RESUME: gather already stored document identifiers ==========
  let existingIdentifiers = new Set();
  if (RESUME) {
    console.log('Resume mode: checking already stored documents...');
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
    } else if (useArchive) {
      // Supabase: fetch all metadata
      const { data, error } = await supabase.from('documents').select('metadata');
      if (error) throw error;
      for (const row of data) {
        const chunkId = row.metadata?.chunk_id;
        const fieldName = row.metadata?.field_name;
        if (chunkId && fieldName) {
          existingIdentifiers.add(`${chunkId}:${fieldName}`);
        }
      }
    } else {
      // Aiven: fetch all metadata (use JSON extraction)
      const { rows } = await pgPool.query(
        "SELECT metadata->>'chunk_id' AS chunk_id, metadata->>'field_name' AS field_name FROM documents",
      );
      for (const row of rows) {
        if (row.chunk_id && row.field_name) {
          existingIdentifiers.add(`${row.chunk_id}:${row.field_name}`);
        }
      }
    }
    console.log(`  Found ${existingIdentifiers.size} already stored documents.`);
  }

  const BATCH_SIZE = 10;
  let totalStored = 0;
  let batchNum = 0;

  const totalBatches = Math.ceil(embeddedChunks.length / BATCH_SIZE);

  console.log(`Total batches to process: ${totalBatches} (batch size: ${BATCH_SIZE})\n`);

  for (let i = 0; i < embeddedChunks.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = embeddedChunks.slice(i, Math.min(i + BATCH_SIZE, embeddedChunks.length));
    const documentsToInsert = [];

    // Prepare documents for insertion
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
      };

      // Doc-level document
      if (chunk.embeddings && chunk.embeddings.doc && isValidEmbedding(chunk.embeddings.doc)) {
        const identifier = `${chunk.id}:doc`;
        if (!RESUME || !existingIdentifiers.has(identifier)) {
          documentsToInsert.push({
            content: chunk.content,
            embedding: chunk.embeddings.doc,
            industry: industryVal,
            category: categoryVal,
            source: sourceVal,
            metadata: { ...baseMeta, field_name: 'doc' },
          });
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
        if (!RESUME || !existingIdentifiers.has(identifier)) {
          documentsToInsert.push({
            content: fieldText,
            embedding: vec,
            industry: industryVal,
            category: categoryVal,
            source: sourceVal,
            metadata: { ...baseMeta, field_name: fname },
          });
        }
      }
    }

    if (documentsToInsert.length === 0) {
      console.log(
        `  Batch ${batchNum}: ${RESUME ? 'All documents already exist (skipping)' : 'No valid documents (all embeddings invalid)'}`,
      );
      continue;
    }

    // Insert batch with error handling
    if (DRY_RUN) {
      // Ensure output directory exists; file itself has already been prepared
      await ensureDir(path.dirname(dryRunOutputPath));
      try {
        await writeJsonl(dryRunOutputPath, documentsToInsert, {
          append: true,
          // no need to clear here because we cleared before the loop
        });
        totalStored += documentsToInsert.length;
        console.log(
          `  ✔ Batch ${batchNum}/${totalBatches}: Wrote ${documentsToInsert.length} documents (total: ${totalStored}) to ${dryRunOutputPath}`,
        );
      } catch (error) {
        console.error(
          `  ✗ Batch ${batchNum}/${totalBatches}: Failed to write JSONL:`,
          error.message,
        );
        throw error;
      }
    } else if (useArchive) {
      try {
        const { data, error } = await supabase.from('documents').insert(documentsToInsert).select();

        if (error) {
          throw new Error(`Insert failed: ${error.message}`);
        }

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response: data is not an array');
        }

        totalStored += data.length;
        console.log(
          `  ✔ Batch ${batchNum}/${totalBatches}: Inserted ${data.length} documents (total: ${totalStored}) into Supabase documents (sample ID: ${data[0]?.id || 'N/A'})`,
        );
      } catch (error) {
        console.error(`  ✗ Batch ${batchNum}/${totalBatches} failed:`, error.message);
        throw error;
      }
    } else {
      // Optimized Bulk Insert for Aiven/PostgreSQL via pgPool and parameterized queries
      const client = await pgPool.connect();
      try {
        // This explicitly starts a writable transaction, overriding the session default
        await client.query('BEGIN READ WRITE');

        // Build a single multi-row insert query
        // Query structure: INSERT INTO table (cols) VALUES ($1,$2...), ($6,$7...)
        const columns = ['content', 'embedding', 'industry', 'category', 'source', 'metadata'];
        const values = [];
        const placeholders = [];

        documentsToInsert.forEach((doc, docIdx) => {
          const offset = docIdx * columns.length;
          const rowPlaceholders = columns.map((_, colIdx) => {
            const position = offset + colIdx + 1;
            // Special casting for the vector column
            if (columns[colIdx] === 'embedding') {
              return `$${position}::extensions.vector`;
            }
            return `$${position}`;
          });
          placeholders.push(`(${rowPlaceholders.join(',')})`);

          values.push(
            doc.content,
            `[${doc.embedding.join(',')}]`, // Format array as Postgres vector string
            doc.industry,
            doc.category,
            doc.source,
            JSON.stringify(doc.metadata),
          );
        });

        const sql = `INSERT INTO documents (${columns.join(',')}) VALUES ${placeholders.join(',')}`;

        await client.query(sql, values);
        await client.query('COMMIT');

        totalStored += documentsToInsert.length;
        console.log(
          `  ✔ Batch ${batchNum}/${totalBatches}: Inserted ${documentsToInsert.length} documents (total: ${totalStored}) into Aiven`,
        );
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ✗ Batch ${batchNum}/${totalBatches} failed (Aiven Bulk):`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }
  }

  console.log(
    `\n✓ Successfully stored ${totalStored} documents ${DRY_RUN ? '' : useArchive ? 'in Supabase' : 'in Aiven'}\n`,
  );
  return totalStored;
}

/**
 * Validate stored embeddings with test query
 * @private
 */
async function validateStorage() {
  console.log('\n========= Validating and optimizing storage =========');

  try {
    // 1. Count Check (and VACUUM for Aiven)
    if (useArchive) {
      const { count, error: countError } = await supabase
        .from('documents')
        .select('id', { head: true, count: 'exact' });
      if (countError) throw countError;
      console.log(`  ✓ Total documents in Supabase: ${count}`);
    } else {
      // Aiven: optional VACUUM ANALYZE (non‑critical if it fails)
      try {
        console.log('  Running VACUUM ANALYZE...');
        await pgPool.query('VACUUM ANALYZE documents');
      } catch (vacErr) {
        console.warn('  ⚠️ VACUUM ANALYZE failed (non‑critical):', vacErr.message);
      }

      const { rows } = await pgPool.query('SELECT COUNT(*) AS cnt FROM documents');
      console.log(`  ✓ Total documents in Aiven: ${rows[0]?.cnt}`);
    }

    // 2. Test vector search function with a dummy embedding
    const testEmbedding = Array(1536).fill(0.1);

    if (useArchive) {
      // Supabase: use RPC
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_count: 1,
      });
      if (error) throw error;
      console.log('  ✓ Vector search function operational (Supabase)');
      if (data?.length) {
        console.log(`  ✓ Search returned ${data.length} result(s)`);
      }
    } else {
      // Aiven: use properly formatted vector string
      const embeddingStr = '[' + testEmbedding.join(',') + ']';
      const { rows } = await pgPool.query(
        'SELECT * FROM match_documents($1::extensions.vector, $2)',
        [embeddingStr, 1],
      );
      console.log('  ✓ Vector search function operational (Aiven)');
      if (rows.length) {
        console.log(`  ✓ Search returned ${rows.length} result(s)`);
      }
    }
  } catch (error) {
    console.warn('  ⚠️ Validation warning:', error.message);
  }
}

/**
 * Main execution pipeline
 * @async
 */
export async function main() {
  const embeddedChunksPath = useArchive ? ARCHIVES_EMBEDDED_CHUNKS_JSONL : EMBEDDED_CHUNKS_JSONL;
  assertFileExists(embeddedChunksPath, 'embedded_chunks.jsonl');
  const dryRunOutputPath = useArchive ? ARCHIVES_STORED_DOCUMENTS_JSONL : STORED_DOCUMENTS_JSONL;

  try {
    console.log('=============== Embedding Storage Pipeline ===============');
    if (DRY_RUN) {
      console.log(`=== Dry-run mode: output will be written to ${dryRunOutputPath} ===`);
    }

    // Step 1: Load embedded chunks
    const embeddedChunks = await loadEmbeddedChunks(embeddedChunksPath);

    // Step 2: Store in the chosen destination
    const storedCount = await storeDocuments(embeddedChunks);

    // Step 3: Validate storage (production only)
    if (!DRY_RUN) {
      await validateStorage();
    } else {
      console.log(`Dry-run mode: skipped ${useArchive ? 'Supabase' : 'Aiven'} validation.\n`);
    }

    // Success summary
    console.log('=============== Storage Complete ===============');
    console.log(`${embeddedChunks.length} embedded chunks → ${storedCount} stored documents`);
    console.log(
      `Storage destination: ${
        DRY_RUN
          ? `Local JSONL file (${dryRunOutputPath})`
          : (useArchive
              ? `Supabase (${BACKEND_CONFIG.supabase.projectId})`
              : `Aiven PostgreSQL (${BACKEND_CONFIG.aiven.host})`) + ' documents table'
      }\n`,
    );
  } catch (error) {
    console.error('\n✗ STORAGE FAILED');
    console.error(`✗ ${error.message}\n`);
    process.exit(1);
  }
}

// Self-executing module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('\n✗ Fatal error:', err.message);
    process.exit(1);
  });
}
