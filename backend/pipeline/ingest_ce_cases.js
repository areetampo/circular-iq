// backend/pipeline/ingest_ce_cases.js
import fs from 'fs';

import csv from 'csv-parser';

import { supabase } from '#database/index.js';
import {
  DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV,
  assertFileExists,
} from '#pipeline/datasetsUtils.js';
import { logger } from '#utils/logger.js';

const CSV_FILE = DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV;
const BATCH_SIZE = 100;

async function ingestCSV() {
  // Check if CSV file exists before attempting to read
  assertFileExists(CSV_FILE, 'Combined input CSV file');

  // ── Step 1: Collect all rows from the CSV stream ──────────────────────────
  // We must fully consume the stream before doing any async DB work.
  // The original pattern of firing upsert() calls inside the 'data' event
  // created a race: the 'end' event could fire (and resolve) before those
  // in-flight promises settled, causing missed error handling and an incorrect
  // `inserted` count. Collecting first, then upserting sequentially, is safe.
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        let metadata = {};
        if (row.metadata_json) {
          try {
            metadata = JSON.parse(row.metadata_json);
          } catch (e) {
            logger.warn({ id: row.ID, error: e.message }, 'Failed to parse metadata_json');
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
      })
      .on('end', resolve)
      .on('error', reject);
  });

  logger.info({ count: rows.length }, 'Read rows from CSV. Starting upsert...');

  // ── Step 2: Batch upsert sequentially ─────────────────────────────────────
  // Sequential (not parallel) so errors are caught immediately and progress
  // logging reflects actual DB state.
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('ce_cases').upsert(batch, { onConflict: 'id' });

    if (error) {
      logger.error({ batchIndex: i, error: error.message }, 'Upsert failed');
      throw error;
    }

    inserted += batch.length;
    logger.info({ inserted, total: rows.length }, 'Rows inserted');
  }

  logger.info({ inserted }, 'Ingestion complete');
}

ingestCSV().catch((error) => logger.error({ error }, 'Ingestion failed'));
