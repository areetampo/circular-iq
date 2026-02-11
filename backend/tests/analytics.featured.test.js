import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import createAnalyticsRouter, { setOpenAIClient } from '../api/routes/analytics.js';

// Mock Supabase chains used in the featured-solutions endpoint
function makeMockSupabaseForDocs(docs = []) {
  return {
    from: (table) => ({
      select: (cols) => ({
        limit: (n) => ({
          order: async (col, opts) => ({ data: docs, error: null }),
        }),
      }),
    }),
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

  const mockSupabase = makeMockSupabaseForDocs([doc]);
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(mockSupabase));

  const res = await request(app).get('/api/analytics/featured-solutions?limit=2');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.solutions));
  assert.equal(res.body.count >= 1, true);
  assert.equal(res.body.solutions[0].id, 42);
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
      if (name === 'search_documents_hybrid') {
        return {
          data: [
            {
              id: 101,
              content: 'content',
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
});
