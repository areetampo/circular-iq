import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import createAnalyticsRouter from '#routes/analytics.routes.js';

// Minimal mock supabase that returns a few assessments
function makeMockSupabaseForEnhanced() {
  const assessments = [
    {
      industry: 'energy',
      result_json: { overall_score: 80 },
      overall_score: null,
      business_viability_score: 70,
      created_at: new Date().toISOString(),
      is_public: true,
      contribute_to_global_benchmarks: true,
    },
    {
      industry: 'energy',
      result_json: { overall_score: 60 },
      overall_score: null,
      business_viability_score: 55,
      created_at: new Date().toISOString(),
      is_public: true,
      contribute_to_global_benchmarks: false,
    },
    {
      industry: 'water',
      result_json: { overall_score: 70 },
      overall_score: null,
      business_viability_score: 65,
      created_at: new Date().toISOString(),
      is_public: true,
      contribute_to_global_benchmarks: false,
    },
  ];

  // return an object that supports .select(...).eq(...).gte(...) chains and is thenable
  const thenable = {
    eq() {
      return this;
    },
    gte() {
      return this;
    },
    then(resolve) {
      resolve({ data: assessments, error: null });
      return Promise.resolve();
    },
  };

  return {
    from: () => ({ select: () => thenable }),
    rpc: async () => ({ data: [], error: null }),
  };
}

test('GET /api/analytics/enhanced returns volatility, confidence intervals and marketShare fields', async () => {
  const supabase = makeMockSupabaseForEnhanced();
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(supabase));

  // Request without industry - industryMarketShare should be null
  const res = await request(app).get('/api/analytics/enhanced');
  assert.equal(res.status, 200);
  assert.ok(res.body.aggregate);
  assert.ok(typeof res.body.aggregate.overallVolatility === 'number');
  assert.ok(Array.isArray(res.body.timeSeries));
  assert.ok(res.body.timeSeries.length > 0);
  assert.equal(typeof res.body.timeSeries[0].stdDev, 'number');
  assert.equal(typeof res.body.timeSeries[0].confidenceUpper, 'number');
  assert.equal(typeof res.body.timeSeries[0].confidenceLower, 'number');
  assert.equal(res.body.industryMarketShare, null);

  // Weekly granularity should return ISO week keys like YYYY-W## and the last period
  const resWeekly = await request(app).get('/api/analytics/enhanced?granularity=weekly');
  assert.equal(resWeekly.status, 200);
  assert.ok(Array.isArray(resWeekly.body.timeSeries));
  const lastPeriod = resWeekly.body.timeSeries[resWeekly.body.timeSeries.length - 1];
  assert.ok(/^[0-9]{4}-W[0-9]{2}$/.test(lastPeriod.period));

  // Request filtered by industry and granularity - expect numeric industryMarketShare
  const res2 = await request(app).get(
    '/api/analytics/enhanced?industry=energy&granularity=monthly',
  );
  assert.equal(res2.status, 200);
  assert.equal(typeof res2.body.industryMarketShare, 'number');
  // find matching industry metric
  const match = res2.body.industryMetrics.find((m) => m.industry === 'energy');
  assert.ok(match);
  assert.equal(Number(match.marketShare), Number(res2.body.industryMarketShare));
});
