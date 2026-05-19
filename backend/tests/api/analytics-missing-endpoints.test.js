/**
 * @module tests/api/analytics-missing-endpoints.test
 * @description Regression tests for `/api/analytics/global-stats` error handling and empty data paths.
 */

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import { closeAllPools, setDatabaseClientOverride } from '#database/index.js';
import createAnalyticsRouter from '#routes/analytics.routes.js';

function makeServiceSupabaseMock({ logRows, marketData, assessmentStats }) {
  return {
    from: () => ({
      select: () => ({
        or: () => ({
          not: () => Promise.resolve({ data: logRows, error: null }),
        }),
      }),
    }),
    rpc: async (name) => {
      if (name === 'get_market_data') return { data: marketData, error: null };
      if (name === 'get_assessment_statistics') return { data: assessmentStats, error: null };
      return { data: [], error: null };
    },
  };
}

function makeMockPgClient() {
  return {
    query: async (sql) => {
      if (String(sql).includes('get_document_statistics')) {
        return { rows: [{ total_documents: 42, by: 'test-mock' }] };
      }
      return {
        rows: [
          { value: 'energy', count: 2 },
          { value: 'water', count: 1 },
        ],
      };
    },
  };
}

before(() => {
  setDatabaseClientOverride(makeMockPgClient(), 'postgres');
});

after(async () => {
  setDatabaseClientOverride(null);
  await closeAllPools();
  // #database/index.js opens Supabase clients at import time with no public
  // close() API. process.exit(0) releases those handles once tests are done.
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});

test('GET /api/analytics/global-stats returns log_stats + market_data + assessment_stats', async () => {
  const nowIso = new Date().toISOString();
  const logRows = [
    {
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
      created_at: nowIso,
    },
  ];
  const marketData = [
    {
      industry: 'energy',
      avg_score: 72,
      min_score: 60,
      max_score: 90,
      count: 10,
      scale: 'commercial',
    },
  ];
  const assessmentStats = [
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
  ];

  const serviceSupabaseMock = makeServiceSupabaseMock({ logRows, marketData, assessmentStats });
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(null, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  assert.ok(res.body.log_stats);
  assert.equal(res.body.log_stats.total_scoring_calls, 1);
  assert.ok(Array.isArray(res.body.market_data));
  assert.ok('assessment_stats' in res.body);
});

test('GET /api/analytics/global-stats handles empty data gracefully', async () => {
  const serviceSupabaseMock = makeServiceSupabaseMock({
    logRows: [],
    marketData: [],
    assessmentStats: [{}],
  });
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(null, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  assert.ok(res.body.log_stats);
  assert.equal(res.body.log_stats.total_scoring_calls, 0);
  assert.ok(Array.isArray(res.body.market_data));
  assert.equal(res.body.market_data.length, 0);
  assert.ok('assessment_stats' in res.body);
});

test('GET /api/analytics/global-stats includes weekly trend data', async () => {
  const nowIso = new Date().toISOString();
  const logRows = [
    { overall_score: 80, created_at: nowIso, audit_is_junk_input: false },
    {
      overall_score: 75,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      audit_is_junk_input: false,
    },
  ];
  const serviceSupabaseMock = makeServiceSupabaseMock({
    logRows,
    marketData: [],
    assessmentStats: [{}],
  });
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(null, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  assert.ok(res.body.log_stats.weekly_trend);
  assert.ok(Array.isArray(res.body.log_stats.weekly_trend));
  assert.equal(res.body.log_stats.weekly_trend.length, 12);
});
