import assert from 'node:assert/strict';
import test from 'node:test';

import express from 'express';
import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { setDatabaseClientOverride } from '#database/client.js';
import createScoringRouter, { setOpenAIClient } from '#routes/scoring.routes.js';

// Minimal mock supabase for scoring that returns controlled RPC data
function makeMockSupabase(searchResults = [], industryResults = []) {
  return {
    rpc: async (name, params) => {
      if (name === BACKEND_CONFIG.db.functions.search_documents_hybrid) {
        return { data: searchResults, error: null };
      }
      if (name === BACKEND_CONFIG.db.functions.search_documents_by_industry) {
        return { data: industryResults, error: null };
      }
      return { data: [], error: null };
    },
  };
}

// simple mock OpenAI that returns zero embeddings
const fakeEmbedding = Array(1536).fill(0);
const mockOpenAI = {
  embeddings: { create: async () => ({ data: [{ embedding: fakeEmbedding }] }) },
};
setOpenAIClient(mockOpenAI);

// helper for running an express app with scoring router
function makeApp(supabase) {
  const app = express();
  app.use(express.json());
  app.use('/api/score', createScoringRouter(supabase));
  return app;
}

// Sanity test: ensure similar cases are formatted
test('POST /api/score returns similar_cases with structured fields', async () => {
  const exampleDoc = {
    id: 200,
    title: 'Example',
    industry: 'energy',
    category: 'manufacturing',
    source: 'datasetB',
    similarity: 0.8,
    rrf_score: 0.5,
    metadata: { fields: { problem: 'P', solution: 'S' }, word_count: 5 },
  };

  const supabase = makeMockSupabase([exampleDoc], []);
  // ensure repository uses our mock instead of real supabase client
  setDatabaseClientOverride(supabase, 'supabase');
  const app = makeApp(supabase);

  const payload = {
    businessProblem: 'P',
    businessSolution: 'S',
    parameters: {},
  };

  const res = await request(app).post('/api/score').send(payload);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.similar_cases));
  const sc = res.body.similar_cases[0];
  assert.equal(sc.id, 200);
  assert.equal(sc.industry, 'energy');
  assert.equal(sc.category, 'manufacturing');
  assert.equal(sc.source, 'datasetB');
  assert.equal(sc.similarity, 0.8);
  assert.equal(sc.rrf_score, 0.5);
});
