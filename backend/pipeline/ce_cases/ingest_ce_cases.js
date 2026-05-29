/**
 * Batch-ingests combined CE case CSV rows into the ce_cases Supabase table.
 * Reads DATASETS_FOR_SEARCH combined input and upserts in configurable batch sizes.
 */

import fs from 'fs';

import { parse } from 'csv-parse';

import { getSupabaseClient } from '#database/index.js';
import { DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV, assertFileExists } from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const CSV_FILE = DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV;
const BATCH_SIZE = 100;

/**
 * Streams the combined CE cases CSV and upserts normalized rows into `ce_cases` in batches.
 * Invalid `metadata_json` values are logged and stored as empty metadata.
 *
 * @throws {Error} When the CSV is missing, parsing fails, or a batch upsert fails.
 */
async function ingestCSV() {
  assertFileExists(CSV_FILE, 'Combined input CSV file');

  // csv-parse's async iterator is cleaner than wrapping stream events in a
  // Promise — no race condition possible, errors propagate naturally via
  // try/catch rather than requiring explicit reject handlers.
  const rows = [];

  const parser = fs.createReadStream(CSV_FILE).pipe(
    parse({
      columns: true, // Use first row as column names.
      skip_empty_lines: true,
      trim: true, // Match downstream field checks that assume trimmed CSV values.
      bom: true, // Some exported CSVs include a UTF-8 BOM before the first header.
    }),
  );

  for await (const row of parser) {
    let metadata = {};
    if (row.metadata_json) {
      try {
        metadata = JSON.parse(row.metadata_json);
      } catch (error) {
        logger.warn({ id: row.ID, error }, 'Failed to parse metadata_json');
      }
    }

    rows.push({
      id: row.ID,
      problem: row.problem || null,
      solution: row.solution || null,
      materials: row.materials || null,
      circular_strategy: row.circular_strategy || null,
      category: row.category || null,
      impact: row.impact || null,
      source_url: row.source_url || null,
      metadata_json: metadata,
    });
  }

  logger.info({ count: rows.length }, 'Read rows from CSV. Starting upsert...');

  const supabase = getSupabaseClient();
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('ce_cases').upsert(batch, { onConflict: 'id' });

    if (error) {
      logger.error({ batchIndex: i, error }, 'Upsert failed');
      throw error;
    }

    inserted += batch.length;
    logger.info(
      { batchLength: batch.length, totalInserted: inserted, totalToInsert: rows.length },
      'Rows inserted',
    );
  }

  logger.info({ inserted }, 'Ingestion complete');
}

ingestCSV().catch((error) => logger.error({ error }, 'Ingestion failed'));
