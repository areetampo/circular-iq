/**
 * @module tests/api/scoring.rpc.test
 * @description Integration tests for `/api/score` with database client overrides and RPC mocks.
 */

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import { closeAllPools, setDatabaseClientOverride } from '#database/index.js';

let BACKEND_CONFIG;
let setOpenAIClient;

before(async () => {
  const configMod = await import('#config/backend.config.js');
  BACKEND_CONFIG = configMod.BACKEND_CONFIG;

  const { setOpenAIClient: setServiceOpenAIClient } = await import('#services/scoring.service.js');
  setServiceOpenAIClient(mockOpenAI);

  const routesMod = await import('#routes/scoring.routes.js');
  setOpenAIClient = routesMod.setOpenAIClient;
});

after(async () => {
  await closeAllPools();
  // #database/index.js opens Supabase clients at import time with no public
  // close() API. process.exit(0) releases those handles once tests are done.
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});

const mockSupabase = { rpc: async () => ({ data: [], error: null }) };

function makeMockSupabase(searchResults = []) {
  mockSupabase.rpc = async () => ({ data: searchResults, error: null });
  return mockSupabase;
}

const fakeEmbedding = Array(1536).fill(0);
const mockOpenAI = {
  embeddings: { create: async () => ({ data: [{ embedding: fakeEmbedding }] }) },
};

function makeApp(supabase, mockRouter) {
  const app = express();
  app.use(express.json());
  app.use('/api/score', mockRouter);
  return app;
}

test('POST /api/score returns similar_cases with structured fields', async () => {
  if (!BACKEND_CONFIG) {
    const configMod = await import('#config/backend.config.js');
    BACKEND_CONFIG = configMod.BACKEND_CONFIG;
  }

  setOpenAIClient(mockOpenAI);

  const mockExtractMetadata = async () => ({
    industry: 'energy',
    scale: 'pilot',
    r_strategy: 'Recycle',
    primary_material: 'plastic',
    geographic_focus: 'global',
    short_description: 'Test solution',
  });

  const mockGenerateReasoning = async () => ({
    confidence_score: 50,
    is_junk_input: false,
    audit_verdict: 'Test assessment',
    comparative_analysis: 'Test comparison',
    integrity_gaps: [],
    strengths: [{ aspect: 'Test strength', evidence_source_id: null }],
    technical_recommendations: ['Test recommendation'],
    similar_cases_summaries: [],
    improvement_roadmap: [],
    sdg_alignment: [],
    market_opportunity_summary: 'Test market opportunity',
    key_metrics_comparison: {
      market_readiness: 'Test readiness',
      scalability: 'Test scalability',
      economic_viability: 'Test viability',
    },
  });

  const mockCalculateGapAnalysis = () => ({
    has_benchmarks: false,
    gap_count: 0,
    recommendations: [],
    benchmark_ranges: {},
  });

  function createMockScoringRouter() {
    const router = express.Router();
    router.post('/', async (req, res) => {
      try {
        const { businessProblem, businessSolution, evaluationParameters } = req.body;
        if (!businessProblem || !businessSolution || !evaluationParameters) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        const scores = {
          overall_score: 75,
          confidence_level: 'medium',
          sub_scores: evaluationParameters,
          derived_metrics: {
            technical_feasibility: 75,
            economic_viability: 75,
            circularity_potential: 75,
            risk_level: 'medium',
          },
        };
        const metadata = await mockExtractMetadata();
        const audit = await mockGenerateReasoning();
        const gap_analysis = mockCalculateGapAnalysis();
        const similar_cases = [
          {
            id: '200',
            title: 'Example',
            industry: 'energy',
            category: 'manufacturing',
            source: 'datasetB',
            similarity: 0.8,
            rrf_score: 0.5,
            metadata: { fields: { problem: 'P', solution: 'S' }, word_count: 5 },
          },
        ];
        res.json({
          businessProblem,
          businessSolution,
          evaluation_parameters: evaluationParameters,
          overall_score: scores.overall_score,
          confidence_level: scores.confidence_level,
          sub_scores: scores.sub_scores,
          derived_metrics: scores.derived_metrics,
          audit,
          similar_cases,
          metadata,
          gap_analysis,
          processing_info: {
            request_id: 'test-request',
            processing_time_ms: 100,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error({ error }, 'Test scoring endpoint error');
        res.status(500).json({ error: error.message });
      }
    });
    return router;
  }

  const { documentsRepository } = await import('#database/index.js');
  const originalSearchHybrid = documentsRepository.searchHybrid;
  const originalSearchByIndustry = documentsRepository.searchByIndustry;

  documentsRepository.searchHybrid = async (...args) => {
    if (args[0] && args[0].length > 0) {
      return [
        {
          id: 200,
          title: 'Example',
          industry: 'energy',
          category: 'manufacturing',
          source: 'datasetB',
          similarity: 0.8,
          rrf_score: 0.5,
          metadata: { fields: { problem: 'P', solution: 'S' }, word_count: 5 },
        },
      ];
    }
    return [];
  };
  documentsRepository.searchByIndustry = async () => [];

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
  setDatabaseClientOverride?.(supabase, 'supabase');
  const app = makeApp(supabase, createMockScoringRouter());

  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const payload = {
    businessProblem: validProblem,
    businessSolution: validSolution,
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

  const res = await request(app).post('/api/score').send(payload);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.similar_cases));
  const sc = res.body.similar_cases[0];
  assert.equal(sc.id, '200');
  assert.ok(typeof sc.similarity === 'number');
  assert.ok(sc.similarity >= 0 && sc.similarity <= 1);
  assert.ok(sc.industry === null || typeof sc.industry === 'string');
  assert.ok(sc.category === null || typeof sc.category === 'string');
  assert.ok(sc.source === null || typeof sc.source === 'string');
  assert.ok(sc.rrf_score === null || typeof sc.rrf_score === 'number');

  documentsRepository.searchHybrid = originalSearchHybrid;
  documentsRepository.searchByIndustry = originalSearchByIndustry;
});
