// backend/pipeline/ingest_ce_cases.js

import fs from 'fs';

import { parse } from 'csv-parse';

import { supabase } from '#database/index.js';
import { DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV, assertFileExists } from '#utils/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const CSV_FILE = DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV;
const BATCH_SIZE = 100;

async function ingestCSV() {
  assertFileExists(CSV_FILE, 'Combined input CSV file');

  // ── Step 1: Collect all rows via async iterator ───────────────────────────
  // csv-parse's async iterator is cleaner than wrapping stream events in a
  // Promise — no race condition possible, errors propagate naturally via
  // try/catch rather than requiring explicit reject handlers.
  const rows = [];

  const parser = fs.createReadStream(CSV_FILE).pipe(
    parse({
      columns: true, // use first row as column names
      skip_empty_lines: true,
      trim: true, // strip whitespace from values
      bom: true, // strips the UTF-8 BOM if present, harmless if absent
    }),
  );

  for await (const row of parser) {
    let metadata = {};
    if (row.metadata_json) {
      try {
        metadata = JSON.parse(row.metadata_json);
      } catch (err) {
        logger.warn({ id: row.ID, err }, 'Failed to parse metadata_json');
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

  // ── Step 2: Batch upsert sequentially ─────────────────────────────────────
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

ingestCSV().catch((err) => logger.error({ err }, 'Ingestion failed'));
