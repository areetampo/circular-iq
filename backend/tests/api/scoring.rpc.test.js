process.env.IS_TEST = 'true';
import assert from 'node:assert/strict';
import test from 'node:test';

import express from 'express';
import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import * as scoringController from '#controllers/scoring.controller.js';
import { setDatabaseClientOverride } from '#database/client.js';
import createScoringRouter, { setOpenAIClient } from '#routes/scoring.routes.js';

// Mock the anonymous usage check to always allow
const originalEnforceAnonymousUsage = scoringController.enforceAnonymousUsage;
// scoringController.enforceAnonymousUsage = async () => null;

// Minimal mock supabase for scoring that returns controlled RPC data
const mockSupabase = {
  rpc: async (name, params) => {
    if (name === BACKEND_CONFIG.db.functions.search_documents_hybrid) {
      return { data: [], error: null };
    }
    if (name === BACKEND_CONFIG.db.functions.search_documents_hybrid_filtered) {
      return { data: [], error: null };
    }
    if (name === BACKEND_CONFIG.db.functions.search_documents_by_industry) {
      return { data: [], error: null };
    }
    if (name === 'check_and_increment_anonymous_usage') {
      // Mock anonymous usage check - always allow for testing
      return { data: [{ current_count: 1, is_allowed: true }], error: null };
    }
    return { data: [], error: null };
  },
};

function makeMockSupabase(searchResults = [], industryResults = []) {
  mockSupabase.rpc = async (name, params) => {
    if (name === BACKEND_CONFIG.db.functions.search_documents_hybrid) {
      return { data: searchResults, error: null };
    }
    if (name === BACKEND_CONFIG.db.functions.search_documents_hybrid_filtered) {
      return { data: searchResults, error: null };
    }
    if (name === BACKEND_CONFIG.db.functions.search_documents_by_industry) {
      return { data: industryResults, error: null };
    }
    if (name === 'check_and_increment_anonymous_usage') {
      // Mock anonymous usage check - always allow for testing
      return { data: [{ current_count: 1, is_allowed: true }], error: null };
    }
    return { data: [], error: null };
  };
  return mockSupabase;
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

  // Ensure field names match controller expectations
  const payload = {
    businessProblem: 'P'.repeat(200), // Minimum 200 characters
    businessSolution: 'S'.repeat(200), // Minimum 200 characters
    parameters: {
      public_participation: 50,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  };

  const res = await request(app)
    .post('/api/score')
    .set('X-API-Key', process.env.API_KEY || process.env.MASTER_API_KEY || 'test-key')
    .send(payload);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.similar_cases));
  const sc = res.body.similar_cases[0];
  assert.equal(sc.id, '200'); // Database returns ids as strings
  assert.equal(sc.industry, 'energy');
  assert.equal(sc.category, 'manufacturing');
  assert.equal(sc.source, 'datasetB');
  assert.equal(sc.similarity, 0.8);
  assert.equal(sc.rrf_score, 0.5);
});
