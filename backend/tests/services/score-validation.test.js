import assert from 'node:assert';
import { before, test } from 'node:test';

import request from 'supertest';

import { closeAllPools } from '#database/client.js';

process.env.NODE_ENV = 'test';
process.env.API_AUTH_ENABLED = 'false';

let app;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

afterAll(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});

// POST /score input validation tests
test('POST /score rejects missing businessProblem', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessSolution: 'A'.repeat(200),
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
    });

  assert.strictEqual(res.status, 400, 'Should reject missing businessProblem');
  assert(res.body.error, 'Should include error message');
});

test('POST /score rejects businessProblem shorter than 200 chars', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'Short problem',
      businessSolution: 'A'.repeat(200),
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
    });

  assert.strictEqual(res.status, 400, 'Should reject problem < 200 chars');
});

test('POST /score rejects businessSolution shorter than 200 chars', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'Short solution',
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
    });

  assert.strictEqual(res.status, 400, 'Should reject solution < 200 chars');
});

test('POST /score rejects missing parameters object', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
    });

  assert.strictEqual(res.status, 400, 'Should reject missing parameters');
});

test('POST /score rejects parameter value outside 0-100 range', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      evaluationParameters: {
        public_participation: 150,
        infrastructure: 50,
        market_price: 50,
        maintenance: 50,
        uniqueness: 50,
        size_efficiency: 50,
        chemical_safety: 50,
        tech_readiness: 50,
      },
    });

  assert.strictEqual(res.status, 400, 'Should reject parameter > 100');
});

test('POST /score rejects negative parameter value', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      evaluationParameters: {
        public_participation: -10,
        infrastructure: 50,
        market_price: 50,
        maintenance: 50,
        uniqueness: 50,
        size_efficiency: 50,
        chemical_safety: 50,
        tech_readiness: 50,
      },
    });

  assert.strictEqual(res.status, 400, 'Should reject negative parameter');
});

test('POST /score rejects non-numeric parameter', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      evaluationParameters: {
        public_participation: 'fifty',
        infrastructure: 50,
        market_price: 50,
        maintenance: 50,
        uniqueness: 50,
        size_efficiency: 50,
        chemical_safety: 50,
        tech_readiness: 50,
      },
    });

  assert.strictEqual(res.status, 400, 'Should reject non-numeric parameter');
});

test('POST /score requires all 8 parameters', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      evaluationParameters: {
        public_participation: 50,
        infrastructure: 50,
        market_price: 50,
        maintenance: 50,
        uniqueness: 50,
        size_efficiency: 50,
        chemical_safety: 50,
        // missing tech_readiness
      },
    });

  assert.strictEqual(res.status, 400, 'Should require all 8 parameters');
});

test('POST /score accepts valid input with all 8 parameters', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      evaluationParameters: {
        public_participation: 50,
        infrastructure: 60,
        market_price: 70,
        maintenance: 55,
        uniqueness: 65,
        size_efficiency: 60,
        chemical_safety: 80,
        tech_readiness: 70,
      },
    });

  // May return 200 if processing succeeds, or 500 if OpenAI/DB fails
  assert(res.status === 200 || res.status === 500, 'Valid input should be accepted');

  // When successful, the response MUST include the original inputs so callers
  // can persist a complete snapshot. If the endpoint returned 500 we skip
  // the assertions to avoid flaky failures when external services are down.
  if (res.status === 200) {
    assert.strictEqual(res.body.businessProblem, 'A'.repeat(200));
    assert.strictEqual(res.body.businessSolution, 'A'.repeat(200));
    assert(res.body.evaluation_parameters && typeof res.body.evaluation_parameters === 'object');
  }
});

test('POST /score accepts boundary values (0 and 100)', async () => {
  const res = await request(app)
    .post('/api/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      evaluationParameters: {
        public_participation: 0,
        infrastructure: 100,
        market_price: 0,
        maintenance: 100,
        uniqueness: 50,
        size_efficiency: 50,
        chemical_safety: 50,
        tech_readiness: 50,
      },
    });

  assert(res.status === 200 || res.status === 500, 'Should accept 0 and 100');
});
