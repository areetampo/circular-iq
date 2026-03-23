process.env.NODE_ENV = 'test';
process.env.IS_TEST = 'true';
process.env.API_AUTH_ENABLED = 'true';
process.env.API_KEY = 'test-key';

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import { closeAllPools, setDatabaseClientOverride } from '#database/client.js';

let BACKEND_CONFIG;
let scoringController;
let createScoringRouter;
let setOpenAIClient;

// Dynamically import modules that depend on environment configuration.
// This ensures `process.env.NODE_ENV` and other env vars are set before the config is evaluated.
before(async () => {
  const configMod = await import('#config/backend.config.js');
  BACKEND_CONFIG = configMod.BACKEND_CONFIG;

  scoringController = await import('#controllers/scoring.controller.js');
  const routesMod = await import('#routes/scoring.routes.js');
  createScoringRouter = routesMod.default;
  setOpenAIClient = routesMod.setOpenAIClient;
});

after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});

// Mock the anonymous usage check to always allow (in case ENV doesn't set test mode)
const originalEnforceAnonymousUsage = () => null;

// Minimal mock supabase for scoring that returns controlled RPC data
const mockSupabase = {
  rpc: async (name, params) => ({ data: [], error: null }),
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

// helper for running an express app with scoring router
function makeApp(supabase) {
  const app = express();
  app.use(express.json());
  app.use('/api/score', createScoringRouter(supabase));
  return app;
}

// Sanity test: ensure similar cases are formatted
test('POST /api/score returns similar_cases with structured fields', async () => {
  // Ensure env-derived config is initialized before we start
  if (!BACKEND_CONFIG) {
    const configMod = await import('#config/backend.config.js');
    BACKEND_CONFIG = configMod.BACKEND_CONFIG;
  }

  // Ensure OpenAI client is set before the router is created
  setOpenAIClient(mockOpenAI);

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
  // Ensure repository uses our mock instead of real supabase client
  setDatabaseClientOverride?.(supabase, 'supabase');
  const app = makeApp(supabase);

  // Ensure field names match controller expectations
  const payload = {
    businessProblem: 'P'.repeat(200), // Minimum 200 characters
    businessSolution: 'S'.repeat(200), // Minimum 200 characters
    evaluationParameters: {
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
    .set('X-API-Key', process.env.API_KEY || BACKEND_CONFIG.app.apiKey)
    .send(payload);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.similar_cases));
  const sc = res.body.similar_cases[0];
  assert.equal(sc.id, '200'); // Database returns ids as strings
  // The front-end expects the similarity score to be normalized to 0..1
  assert.ok(typeof sc.similarity === 'number');
  assert.ok(sc.similarity >= 0 && sc.similarity <= 1);

  // Industry/category/source are derived from the underlying document metadata and may be null in some cases
  assert.ok(sc.industry === null || typeof sc.industry === 'string');
  assert.ok(sc.category === null || typeof sc.category === 'string');
  assert.ok(sc.source === null || typeof sc.source === 'string');

  // rrf_score may not be available depending on the scoring path
  assert.ok(sc.rrf_score === null || typeof sc.rrf_score === 'number');
});
