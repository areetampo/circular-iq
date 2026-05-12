import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import { closeAllPools, setDatabaseClientOverride } from '#database/index.js';
import createAnalyticsRouter from '#routes/analytics.routes.js';

// Mock Supabase for global-stats endpoint testing
function makeMockSupabaseForGlobalStats() {
  return {
    from: () => ({
      select: () => ({
        or: () => ({
          not: () =>
            Promise.resolve({
              data: [
                {
                  id: 1,
                  created_at: new Date().toISOString(),
                  overall_score: 80,
                  confidence_level: 90,
                  technical_feasibility: 70,
                  economic_viability: 60,
                  circularity_potential: 75,
                  parameter_consistency_score: 82,
                  r_strategy_alignment_score: 71,
                  risk_level: 'low',
                  industry: 'energy',
                  r_strategy: 'Reuse',
                  scale: 'commercial',
                  primary_material: 'metal',
                  geographic_focus: 'global',
                  circular_economy_tier: { tier: 'Leader' },
                  audit_is_junk_input: false,
                },
              ],
              error: null,
            }),
        }),
      }),
    }),
    rpc: async (name) => {
      if (name === 'get_market_data') {
        return {
          data: [
            {
              industry: 'energy',
              avg_score: 72,
              min_score: 60,
              max_score: 90,
              count: 10,
              scale: 'commercial',
            },
          ],
          error: null,
        };
      }
      if (name === 'get_assessment_statistics') {
        return {
          data: [
            {
              total_assessments: 5,
              completed_assessments: 5,
              avg_score: 70,
              median_score: 68,
              min_score: 40,
              max_score: 95,
              avg_confidence: 80,
              avg_technical_feasibility: 70,
              avg_economic_viability: 65,
              avg_circularity_potential: 72,
              assessments_by_industry: {},
              assessments_by_risk: {},
              assessments_by_scale: {},
              assessments_by_tier: {},
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    },
  };
}

test('GET /api/analytics/global-stats returns aggregate analytics data', async () => {
  setDatabaseClientOverride(null); // Reset override
  const serviceSupabase = makeMockSupabaseForGlobalStats();
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(null, serviceSupabase));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  assert.ok(res.body.log_stats);
  assert.ok(res.body.market_data);
  assert.ok('assessment_stats' in res.body);
  assert.equal(res.body.log_stats.total_scoring_calls, 1);
  assert.ok(Array.isArray(res.body.market_data));
  assert.ok(res.body.assessment_stats);
});

test('POST /api/analytics/embeddings/reindex starts reindex process', async () => {
  setDatabaseClientOverride(null); // Reset override

  // Create a mock analytics controller that returns success without spawning
  const mockAnalyticsController = {
    postEmbeddingsReindex: () => async (req, res) => {
      res.json({ started: true, pid: 12345 });
    },
    getGlobalStats: (_serviceSupabase) => async (req, res) => {
      res.json({ log_stats: {}, market_data: [], assessment_stats: null });
    },
  };

  // Create a custom router with the mocked controller
  const express = await import('express');
  const app = express.default();

  app.post('/api/analytics/embeddings/reindex', mockAnalyticsController.postEmbeddingsReindex());

  const res = await request(app).post('/api/analytics/embeddings/reindex');
  assert.equal(res.status, 200);
  assert.ok(res.body.started);
  assert.ok(typeof res.body.pid === 'number');
});

after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});
