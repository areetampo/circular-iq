import '#server/bootstrap.js';
import OpenAI from 'openai';
import { createSupabaseClient } from '#database/supabase.client.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

const DRY_RUN = !BACKEND_CONFIG.openai.apiKey || !BACKEND_CONFIG.supabase.serviceKey;

let openai = null;
let supabase = null;
if (!DRY_RUN) {
  openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });
  supabase = createSupabaseClient();
} else {
  console.warn(
    '⚠️️️  Running in dry-run mode: OpenAI/Supabase keys not fully configured, skipping external calls',
  );
}

async function embedText(text) {
  if (DRY_RUN) {
    // deterministic fake embedding
    const v = new Array(1536).fill(0).map((_, i) => ((text.length + i * 31) % 1000) / 1000);
    return v;
  }
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding;
}

function dedupeResults(results) {
  const dedupMap = new Map();
  for (const r of results) {
    const meta = r.metadata || {};
    const fields = meta.fields || {};
    const sourceId = meta.source_id || fields.id || fields.ID || meta.source_row || String(r.id);
    const existing = dedupMap.get(sourceId);
    if (!existing || (r.similarity || 0) > (existing.similarity || 0)) {
      dedupMap.set(sourceId, {
        id: sourceId,
        title: fields.title || fields.name || fields.project || null,
        problem: fields.problem || r.content || null,
        solution: fields.solution || null,
        similarity: r.similarity || 0,
        metadata: meta,
      });
    }
  }
  return Array.from(dedupMap.values()).slice(0, 5);
}

async function main() {
  const sampleProblem =
    'We need a low-cost modular housing solution to reduce construction waste and enable reuse of building components.';
  const sampleSolution =
    'Use prefabricated modular units designed for disassembly and reuse, with standardized connectors and recyclable materials.';
  const queryText = `Problem: ${sampleProblem}\n\nSolution: ${sampleSolution}`;

  console.log('Creating embedding for sample query...');
  const qvec = await embedText(queryText);

  if (DRY_RUN) {
    console.log('DRY RUN: Skipping Supabase RPC, returning fake results');
    const fakeResults = [
      {
        id: 'fake_1',
        content: sampleProblem,
        metadata: { fields: { problem: sampleProblem } },
        similarity: 0.9,
      },
    ];
    console.log('Top deduplicated cases:', JSON.stringify(dedupeResults(fakeResults), null, 2));
    return;
  }

  console.log(`Querying Supabase ${BACKEND_CONFIG.db.functions.match_documents} RPC...`);
  const { data, error } = await supabase.rpc(BACKEND_CONFIG.db.functions.match_documents, {
    query_embedding: qvec,
    match_count: 10,
  });
  if (error) {
    console.error('RPC error:', error);
    process.exit(1);
  }

  console.log(`Received ${data.length} vector rows from RPC`);
  const deduped = dedupeResults(data || []);
  console.log('Top deduplicated cases:', JSON.stringify(deduped, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
