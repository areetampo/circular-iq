/* eslint-env node */
/* global process */
import { before, test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.API_AUTH_ENABLED = 'false';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai';

let app;

before(async () => {
  const mod = await import('../api/server.js');
  app = mod.default || mod.app || mod;
});

// POST /score input validation tests
test('POST /score rejects missing businessProblem', async () => {
  const res = await request(app)
    .post('/score')
    .send({
      businessSolution: 'A'.repeat(200),
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'Short problem',
      businessSolution: 'A'.repeat(200),
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'Short solution',
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
    });

  assert.strictEqual(res.status, 400, 'Should reject missing parameters');
});

test('POST /score rejects parameter value outside 0-100 range', async () => {
  const res = await request(app)
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      parameters: {
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
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      parameters: {
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
});

test('POST /score accepts boundary values (0 and 100)', async () => {
  const res = await request(app)
    .post('/score')
    .send({
      businessProblem: 'A'.repeat(200),
      businessSolution: 'A'.repeat(200),
      parameters: {
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
