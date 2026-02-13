#!/usr/bin/env node
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function embedText(text) {
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
  const sampleProblem = 'We need a low-cost modular housing solution to reduce construction waste and enable reuse of building components.';
  const sampleSolution = 'Use prefabricated modular units designed for disassembly and reuse, with standardized connectors and recyclable materials.';
  const queryText = `Problem: ${sampleProblem}\n\nSolution: ${sampleSolution}`;

  console.log('Creating embedding for sample query...');
  const qvec = await embedText(queryText);

  console.log('Querying Supabase match_documents RPC...');
  const { data, error } = await supabase.rpc('match_documents', { query_embedding: qvec, match_count: 10 });
  if (error) {
    console.error('RPC error:', error);
    process.exit(1);
  }

  console.log(`Received ${data.length} vector rows from RPC`);
  const deduped = dedupeResults(data || []);
  console.log('Top deduplicated cases:', JSON.stringify(deduped, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
