import assert from 'node:assert/strict';
import test from 'node:test';

import express from 'express';
import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { setDatabaseClientOverride } from '#database/client.js';
import createAnalyticsRouter, { setOpenAIClient } from '#routes/analytics.routes.js';

// Mock Supabase chains used in the featured-solutions endpoint
// It optionally asserts that `.eq` filters are applied at the query builder level.
function makeMockSupabaseForDocs(docs = [], expected = {}) {
  return {
    from: (table) => {
      const chain = {
        select: (cols) => chain,
        eq: (col, val) => {
          if (expected[col] !== undefined) {
            assert.equal(val, expected[col], `expected filter ${col} to be ${expected[col]}`);
          }
          return chain;
        },
        limit: (n) => ({
          order: async (col, opts) => ({ data: docs, error: null }),
        }),
        order: (col, opts) => ({ data: docs, error: null }),
      };
      return chain;
    },
    rpc: async (name, params) => {
      // default: return no results
      return [];
    },
  };
}

// Test fallback path (no 'q' param): should return documents or hardcoded samples
test('GET /api/analytics/featured-solutions (fallback) returns documents', async () => {
  const doc = {
    id: 42,
    content: 'Sample content',
    metadata: {
      chunk_type: 'problem_solution',
      fields: { problem: 'P', solution: 'S' },
      category: 'TestCategory',
      word_count: 120,
      source_id: 'src-1',
    },
  };

  // supply expected filters to ensure query builder uses eq for industry/category/source
  const mockSupabase = makeMockSupabaseForDocs([doc], {
    industry: null,
    category: null,
    source: null,
  });
  setDatabaseClientOverride(mockSupabase, 'supabase');
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(mockSupabase));

  const res = await request(app).get('/api/analytics/featured-solutions?limit=2');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.solutions));
  assert.equal(res.body.count >= 1, true);
  const sol = res.body.solutions[0];
  assert.equal(sol.id, 42);
  // structured columns should exist (may be null)
  assert.ok('industry' in sol);
  assert.ok('category' in sol);
  assert.ok('source' in sol);
  assert.ok('similarity' in sol);
  assert.ok('rrf_score' in sol);
});

// Test semantic path: mock OpenAI embedding and supabase RPC
test('GET /api/analytics/featured-solutions?q=... performs hybrid search', async () => {
  // Mock OpenAI client
  const fakeEmbedding = Array(1536).fill(0.01);
  const mockOpenAI = {
    embeddings: {
      create: async (opts) => ({ data: [{ embedding: fakeEmbedding }] }),
    },
  };

  setOpenAIClient(mockOpenAI);

  // Mock Supabase RPC to return expected format
  const mockSupabase = {
    rpc: async (name, params) => {
      if (name === BACKEND_CONFIG.db.functions.search_documents_hybrid) {
        // ensure our new filter parameters are present (may be null)
        assert.ok('industry_filter' in params);
        assert.ok('category_filter' in params);
        assert.ok('source_filter' in params);
        return {
          data: [
            {
              id: 101,
              content: 'content',
              industry: 'energy',
              category: 'Construction',
              source: 'datasetA',
              metadata: {
                fields: { problem: 'P', solution: 'S' },
                category: 'Construction',
                word_count: 100,
              },
              combined_score: 0.92,
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    },
    from: () => ({
      select: () => ({ limit: () => ({ order: async () => ({ data: [], error: null }) }) }),
    }),
  };

  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(mockSupabase));

  const res = await request(app).get('/api/analytics/featured-solutions?q=packaging&limit=3');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.solutions));
  assert.equal(res.body.count >= 1, true);
  assert.equal(res.body.solutions[0].id, 101);
  assert.ok(res.body.solutions[0].score >= 0);
  // new structured fields should be preserved in response
  assert.equal(res.body.solutions[0].industry, 'energy');
  assert.equal(res.body.solutions[0].category, 'Construction');
  assert.equal(res.body.solutions[0].source, 'datasetA');
  assert.ok(typeof res.body.solutions[0].similarity === 'number');
  assert.ok('rrf_score' in res.body.solutions[0]);
});

// Test that DB filtering is applied for fallback path using structured columns

test('GET /api/analytics/featured-solutions (fallback) applies DB-level filters', async () => {
  const doc = {
    id: 55,
    content: 'X',
    metadata: {
      chunk_type: 'problem_solution',
      fields: { problem: 'P', solution: 'S' },
      word_count: 50,
      source_id: 'src-1',
    },
    industry: 'energy',
    category: 'construction',
    source: 'datasetX',
  };
  const mockSupabase = makeMockSupabaseForDocs([doc], {
    industry: 'energy',
    category: null,
    source: null,
  });
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(mockSupabase));

  const res = await request(app).get('/api/analytics/featured-solutions?limit=1&industry=energy');
  assert.equal(res.status, 200);
  assert.equal(res.body.solutions[0].id, 55);
});

// Ensure invalid query values (arrays) are sanitized and not passed to RPC

test('GET /api/analytics/featured-solutions sanitizes array filters', async () => {
  const mockSupabase = {
    rpc: async (name, params) => {
      // filters should be null when provided as arrays
      assert.equal(params.industry_filter, null);
      assert.equal(params.category_filter, null);
      assert.equal(params.source_filter, null);
      return { data: [], error: null };
    },
    from: () => ({
      select: () => ({ limit: () => ({ order: async () => ({ data: [], error: null }) }) }),
    }),
  };

  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(mockSupabase));

  const res = await request(app).get(
    '/api/analytics/featured-solutions?q=test&industry[]=a&category[]=b',
  );
  assert.equal(res.status, 200);
});
