import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import createAnalyticsRouter from '#routes/analytics.routes.js';
import { setDatabaseClientOverride } from '#database/client.js';

function makeMockSupabaseForSummary(assessments) {
  const chain = {
    eq() {
      return chain;
    },
    gte() {
      return chain;
    },
    then(resolve) {
      resolve({ data: assessments, error: null });
    },
  };

  return {
    from: () => ({
      select: () => chain,
    }),
  };
}

function makeServiceSupabaseMock({ logRows, marketData, assessmentStats }) {
  return {
    from: () => ({
      select: () => ({
        or: () => ({
          not: () =>
            Promise.resolve({
              data: logRows,
              error: null,
            }),
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
  // Make documentsRepository use a mock Postgres client.
  setDatabaseClientOverride(makeMockPgClient(), 'postgres');
});

after(() => {
  setDatabaseClientOverride(null);
});

test('GET /api/analytics returns aggregate, industryMetrics, timeSeries', async () => {
  const nowIso = new Date().toISOString();
  const assessments = [
    { industry: 'energy', created_at: nowIso, result_json: { overall_score: 80 } },
    { industry: 'energy', created_at: nowIso, result_json: { overall_score: 60 } },
  ];

  const supabaseMock = makeMockSupabaseForSummary(assessments);
  const serviceSupabaseMock = makeServiceSupabaseMock({
    logRows: [],
    marketData: [],
    assessmentStats: [{}],
  });

  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(supabaseMock, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics');
  assert.equal(res.status, 200);
  assert.ok(res.body.aggregate);
  assert.ok(Array.isArray(res.body.industryMetrics));
  assert.ok(Array.isArray(res.body.timeSeries));
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

  const supabaseMock = makeMockSupabaseForSummary([]);
  const serviceSupabaseMock = makeServiceSupabaseMock({
    logRows,
    marketData,
    assessmentStats,
  });

  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(supabaseMock, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  assert.ok(res.body.log_stats);
  assert.equal(res.body.log_stats.total_scoring_calls, 1);
  assert.ok(Array.isArray(res.body.market_data));
  assert.ok('assessment_stats' in res.body);
});

test('GET /api/analytics/documents/summary returns byIndustry/byCategory/... arrays', async () => {
  const supabaseMock = makeMockSupabaseForSummary([]);
  const serviceSupabaseMock = makeServiceSupabaseMock({
    logRows: [],
    marketData: [],
    assessmentStats: [{}],
  });

  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(supabaseMock, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics/documents/summary');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.byIndustry));
  assert.ok(Array.isArray(res.body.byCategory));
  assert.ok(Array.isArray(res.body.byRStrategy));
  assert.ok(Array.isArray(res.body.byScale));
  assert.ok(Array.isArray(res.body.bySource));
});

test('GET /api/analytics/documents/stats returns stats', async () => {
  const supabaseMock = makeMockSupabaseForSummary([]);
  const serviceSupabaseMock = makeServiceSupabaseMock({
    logRows: [],
    marketData: [],
    assessmentStats: [{}],
  });

  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(supabaseMock, serviceSupabaseMock));

  const res = await request(app).get('/api/analytics/documents/stats');
  assert.equal(res.status, 200);
  assert.ok('stats' in res.body);
  assert.ok(Array.isArray(res.body.stats));
});
