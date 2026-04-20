// backend/pipeline/ingest_ce_cases.js
import fs from 'fs';

import csv from 'csv-parser';

import { supabase } from '#database/index.js';
import { DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV } from '#pipeline/datasetsUtils.js';

const CSV_FILE = DATASETS_FOR_SEARCH_COMBINED_INPUT_CSV;
const BATCH_SIZE = 100;

async function ingestCSV() {
  const rows = [];
  let total = 0;
  let inserted = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to table columns
        const mapped = {
          id: row.ID,
          problem: row.problem,
          solution: row.solution,
          materials: row.materials,
          circular_strategy: row.circular_strategy,
          category: row.category,
          impact: row.impact,
          source_url: row.source_url,
          metadata_json: row.metadata_json ? JSON.parse(row.metadata_json) : {},
        };
        rows.push(mapped);
        total++;

        // Batch insert
        if (rows.length >= BATCH_SIZE) {
          const batch = rows.splice(0, BATCH_SIZE);
          // Use upsert to avoid duplicates
          supabase
            .from('ce_cases')
            .upsert(batch, { onConflict: 'id' })
            .then(({ error }) => {
              if (error) throw error;
              inserted += batch.length;
              console.log(`Inserted ${inserted}/${total}`);
            })
            .catch(reject);
        }
      })
      .on('end', async () => {
        // Insert remaining rows
        if (rows.length > 0) {
          const { error } = await supabase.from('ce_cases').upsert(rows, { onConflict: 'id' });
          if (error) throw error;
          inserted += rows.length;
        }
        console.log(`✅ Ingestion complete: ${inserted} rows inserted/updated.`);
        resolve();
      })
      .on('error', reject);
  });
}

ingestCSV().catch(console.error);
