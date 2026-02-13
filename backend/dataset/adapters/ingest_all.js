import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
// small inline CSV stringifier to avoid an external dependency
function stringifyCsv(rows, headers) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const lines = [headers.map(escape).join(',')];
  for (const r of rows) {
    const line = headers.map((h) => escape(r[h] ?? '')).join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.join(__dirname, '..', 'samples');
const RAW_DIR = path.join(__dirname, '..', 'raw');
const GREENTECH_DIR = path.join(__dirname, '..', 'GreenTechGuardians', 'outputs');
const OUT_PATH = path.join(__dirname, '..', 'combined_input.csv');

function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true });
}

function normalizeRow(row, sourceName) {
  // Minimal normalization: keep original keys, ensure problem/solution exist
  const normalized = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.trim();
    normalized[key] = typeof v === 'string' ? v.trim() : v;
  }

  // If problem/solution missing, try to synthesize from available columns
  if (!normalized.problem && !normalized.Problem) {
    normalized['problem'] = normalized['description'] || normalized['summary'] || '';
  }
  if (!normalized.solution && !normalized.Solution) {
    normalized['solution'] = normalized['intervention'] || normalized['approach'] || '';
  }

  // Add provenance
  normalized['_source_dataset'] = sourceName;
  return normalized;
}

function mergeSamples() {
  if (!fs.existsSync(SAMPLES_DIR)) {
    console.error('Samples directory not found:', SAMPLES_DIR);
    process.exit(1);
  }

  const merged = [];

  // Helper to add CSV rows from a directory
  function addFromDir(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.csv'));
    for (const f of files) {
      const full = path.join(dirPath, f);
      const rows = loadCsv(full);
      for (const r of rows) {
        merged.push(normalizeRow(r, f));
      }
    }
  }

  // Include all available sources: samples, raw downloads, and internal GreenTechGuardians outputs
  // Order is not prioritized; all rows will be merged into combined_input.csv
  addFromDir(SAMPLES_DIR);
  addFromDir(RAW_DIR);
  addFromDir(GREENTECH_DIR);

  if (merged.length === 0) {
    console.log('No rows to write');
    return;
  }

  // Determine header union
  const headerSet = new Set();
  merged.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);

  const csv = stringifyCsv(merged, headers);
  fs.writeFileSync(OUT_PATH, csv, 'utf8');
  console.log(`Wrote ${merged.length} rows to ${OUT_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('ingest_all.js')) {
  mergeSamples();
}
