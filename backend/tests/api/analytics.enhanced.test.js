/**
 * @module tests/api/analytics.enhanced.test
 * @description Integration tests for `/api/analytics/global-stats` with multi-industry mock data.
 */

import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import { closeAllPools } from '#database/index.js';
import createAnalyticsRouter from '#routes/analytics.routes.js';

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
                  technical_feasibility: 75,
                  economic_viability: 70,
                  circularity_potential: 85,
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
                {
                  id: 2,
                  created_at: new Date().toISOString(),
                  overall_score: 65,
                  confidence_level: 75,
                  technical_feasibility: 60,
                  economic_viability: 55,
                  circularity_potential: 70,
                  parameter_consistency_score: 68,
                  r_strategy_alignment_score: 62,
                  risk_level: 'medium',
                  industry: 'water',
                  r_strategy: 'Recycle',
                  scale: 'pilot',
                  primary_material: 'plastic',
                  geographic_focus: 'regional',
                  circular_economy_tier: { tier: 'Implementer' },
                  audit_is_junk_input: false,
                },
                {
                  id: 3,
                  created_at: new Date().toISOString(),
                  overall_score: 45,
                  confidence_level: 60,
                  technical_feasibility: 50,
                  economic_viability: 40,
                  circularity_potential: 48,
                  parameter_consistency_score: 52,
                  r_strategy_alignment_score: 44,
                  risk_level: 'high',
                  industry: 'construction',
                  r_strategy: 'Reduce',
                  scale: 'lab',
                  primary_material: 'concrete',
                  geographic_focus: 'local',
                  circular_economy_tier: { tier: 'Beginner' },
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
              avg_score: 75,
              min_score: 60,
              max_score: 90,
              count: 15,
              scale: 'commercial',
            },
            {
              industry: 'water',
              avg_score: 68,
              min_score: 50,
              max_score: 80,
              count: 8,
              scale: 'pilot',
            },
            {
              industry: 'construction',
              avg_score: 52,
              min_score: 40,
              max_score: 65,
              count: 5,
              scale: 'lab',
            },
          ],
          error: null,
        };
      }
      if (name === 'get_assessment_statistics') {
        return {
          data: [
            {
              total_assessments: 28,
              completed_assessments: 28,
              avg_score: 67,
              median_score: 65,
              min_score: 40,
              max_score: 90,
              avg_confidence: 75,
              avg_technical_feasibility: 68,
              avg_economic_viability: 62,
              avg_circularity_potential: 71,
              assessments_by_industry: { energy: 15, water: 8, construction: 5 },
              assessments_by_risk: { low: 12, medium: 10, high: 6 },
              assessments_by_scale: { commercial: 15, pilot: 8, lab: 5 },
              assessments_by_tier: { Leader: 8, Implementer: 12, Beginner: 8 },
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    },
  };
}

after(async () => {
  await closeAllPools();
  // #database/index.js opens Supabase clients at import time with no public
  // close() API. process.exit(0) releases those handles once tests are done.
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});

test('GET /api/analytics/global-stats returns comprehensive analytics with multiple industries', async () => {
  const serviceSupabase = makeMockSupabaseForGlobalStats();
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(serviceSupabase));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  assert.ok(res.body.log_stats);
  assert.ok(res.body.market_data);
  assert.ok('assessment_stats' in res.body);
  assert.equal(res.body.log_stats.total_scoring_calls, 3);
  assert.equal(typeof res.body.log_stats.avg_score, 'number');
  assert.ok(res.body.log_stats.avg_metrics);
  assert.ok(res.body.log_stats.score_distribution);
  assert.ok(res.body.log_stats.tier_distribution);
  assert.ok(res.body.log_stats.risk_distribution);
  assert.ok(res.body.log_stats.industry_distribution);
  assert.ok(res.body.log_stats.strategy_distribution);
  assert.ok(res.body.log_stats.material_distribution);
  assert.ok(res.body.log_stats.geo_distribution);
  assert.ok(res.body.log_stats.scale_distribution);
  assert.ok(res.body.log_stats.weekly_trend);
  assert.ok(Array.isArray(res.body.market_data));
  assert.equal(res.body.market_data.length, 3);
  assert.ok(res.body.assessment_stats);
  assert.equal(res.body.assessment_stats.total_assessments, 28);
  assert.equal(res.body.assessment_stats.avg_score, 67);
});

test('GET /api/analytics/global-stats includes proper score distribution', async () => {
  const serviceSupabase = makeMockSupabaseForGlobalStats();
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(serviceSupabase));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  const scoreDist = res.body.log_stats.score_distribution;
  assert.equal(scoreDist['0-25'], 0);
  assert.equal(scoreDist['26-50'], 1);
  assert.equal(scoreDist['51-75'], 1);
  assert.equal(scoreDist['76-100'], 1);
});

test('GET /api/analytics/global-stats includes industry and risk distributions', async () => {
  const serviceSupabase = makeMockSupabaseForGlobalStats();
  const app = express();
  app.use('/api/analytics', createAnalyticsRouter(serviceSupabase));

  const res = await request(app).get('/api/analytics/global-stats');
  assert.equal(res.status, 200);
  const industryDist = res.body.log_stats.industry_distribution;
  assert.ok(Array.isArray(industryDist));
  assert.ok(industryDist.length >= 3);
  const energyIndustry = industryDist.find((i) => i.industry === 'energy');
  assert.ok(energyIndustry);
  assert.equal(energyIndustry.count, 1);
  assert.equal(energyIndustry.avg_score, 80);
  const riskDist = res.body.log_stats.risk_distribution;
  assert.equal(riskDist.low, 1);
  assert.equal(riskDist.medium, 1);
  assert.equal(riskDist.high, 1);
});
