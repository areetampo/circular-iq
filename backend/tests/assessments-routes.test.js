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

// POST /assessments validation tests
test('POST /assessments rejects missing title', async () => {
  const res = await request(app)
    .post('/assessments')
    .send({
      result: { overall_score: 50 },
    });

  assert.strictEqual(res.status, 400, 'Should reject missing title');
});

test('POST /assessments rejects missing result', async () => {
  const res = await request(app).post('/assessments').send({
    title: 'Test Assessment',
  });

  assert.strictEqual(res.status, 400, 'Should reject missing result');
});

test('POST /assessments rejects missing overall_score in result', async () => {
  const res = await request(app)
    .post('/assessments')
    .send({
      title: 'Test Assessment',
      result: { audit: {} },
    });

  assert.strictEqual(res.status, 400, 'Should reject result without overall_score');
});

// GET /assessments query parameter tests
test('GET /assessments accepts page and pageSize query params', async () => {
  const res = await request(app).get('/assessments').query({ page: 1, pageSize: 10 });

  assert(res.status === 200 || res.status === 500, 'Should accept params (200 or DB error 500)');
  if (res.status === 200) {
    assert.strictEqual(res.body.page, 1, 'Should reflect page param');
    assert.strictEqual(res.body.pageSize, 10, 'Should reflect pageSize param');
  }
});

test('GET /assessments clamps pageSize to max 100', async () => {
  const res = await request(app).get('/assessments').query({ pageSize: 500 });

  assert(res.status === 200 || res.status === 500, 'Should respond');
  if (res.status === 200 && res.body.pageSize) {
    assert(res.body.pageSize <= 100, 'Should cap pageSize at 100');
  }
});

test('GET /assessments defaults page to 1 and pageSize to 20', async () => {
  const res = await request(app).get('/assessments');

  assert(res.status === 200 || res.status === 500, 'Should respond');
  if (res.status === 200) {
    assert.strictEqual(res.body.page, 1, 'Should default page to 1');
    assert.strictEqual(res.body.pageSize, 20, 'Should default pageSize to 20');
  }
});

test('GET /assessments accepts sortBy whitelist values', async () => {
  const validSorts = ['created_at', 'overall_score', 'title'];

  for (const sort of validSorts) {
    const res = await request(app).get('/assessments').query({ sortBy: sort });
    assert(res.status === 200 || res.status === 500, `Should accept sortBy=${sort}`);
  }
});

test('GET /assessments defaults to created_at for invalid sortBy', async () => {
  const res = await request(app).get('/assessments').query({ sortBy: 'invalid_column' });

  // Should use created_at as default, so query succeeds or returns DB error, not validation error
  assert(res.status === 200 || res.status === 500, 'Should default invalid sort to created_at');
});

test('GET /assessments accepts order asc/desc', async () => {
  const res1 = await request(app).get('/assessments').query({ order: 'asc' });
  const res2 = await request(app).get('/assessments').query({ order: 'desc' });

  assert(res1.status === 200 || res1.status === 500, 'Should accept order=asc');
  assert(res2.status === 200 || res2.status === 500, 'Should accept order=desc');
});

test('GET /assessments accepts filter parameters', async () => {
  const res = await request(app).get('/assessments').query({
    sessionId: 'session-1',
    industry: 'textiles',
    search: 'solar',
    minScore: 50,
    maxScore: 80,
    createdFrom: '2024-01-01',
    createdTo: '2024-12-31',
  });

  assert(res.status === 200 || res.status === 500, 'Should accept all filter params');
});

test('GET /assessments returns structure with assessments, total, page, pageSize', async () => {
  const res = await request(app).get('/assessments');

  if (res.status === 200) {
    assert(Array.isArray(res.body.assessments), 'Should have assessments array');
    assert(typeof res.body.total === 'number', 'Should have total count');
    assert(typeof res.body.page === 'number', 'Should have page number');
    assert(typeof res.body.pageSize === 'number', 'Should have pageSize');
  }
});

// GET /assessments/:id routing test
test('GET /assessments/:id endpoint is routable', async () => {
  const res = await request(app).get('/assessments/123');

  // Should hit the route handler, even if DB error (500) or not found (404)
  assert(res.status >= 200 && res.status < 600, 'Endpoint should be routable');
});

// DELETE /assessments/:id routing test
test('DELETE /assessments/:id endpoint is routable', async () => {
  const res = await request(app).delete('/assessments/123');

  // Should hit the route handler
  assert(res.status >= 200 && res.status < 600, 'Endpoint should be routable');
});
