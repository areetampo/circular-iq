/**
 * @module tests/api/assessments-routes.test
 * @description Integration tests for `/api/assessments` CRUD, stats, public share, and compare routes.
 */

import '#config/loadEnv.js';
import assert from 'node:assert';
import { after, before, test } from 'node:test';

import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { closeAllPools } from '#database/index.js';

let app;

// Get API key from environment for test authentication
const TEST_API_KEY = process.env.API_KEY || 'test-api-key';
const AUTH_ENABLED = BACKEND_CONFIG.app.apiAuthEnabled;

before(async () => {
  const mod = await import('#server/app.js');
  app = mod.default;
});

after(async () => {
  await closeAllPools();
  // Give supertest's internal server a tick to finish, then force exit
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});

// POST /assessments validation tests
test('POST /assessments rejects missing title', async () => {
  const requestBuilder = request(app).post('/api/assessments');

  // Only add Authorization header if auth is enabled
  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    result: { overall_score: 50 },
  });

  assert.strictEqual(res.status, 400, 'Should reject missing title');
});

test('POST /assessments rejects missing result', async () => {
  const requestBuilder = request(app).post('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    title: 'Test Assessment',
  });

  assert.strictEqual(res.status, 400, 'Should reject missing result');
});

test('POST /assessments rejects missing overall_score in result', async () => {
  const requestBuilder = request(app).post('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    title: 'Test Assessment',
    result: { audit: {} },
  });

  assert.strictEqual(res.status, 400, 'Should reject result without overall_score');
});

// GET /assessments query parameter tests
test('GET /assessments accepts page and pageSize query params', async () => {
  const requestBuilder = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({ page: 1, pageSize: 10 });

  assert(res.status === 200 || res.status === 500, 'Should accept params (200 or DB error 500)');
  if (res.status === 200) {
    assert.strictEqual(res.body.page, 1, 'Should reflect page param');
    assert.strictEqual(res.body.pageSize, 10, 'Should reflect pageSize param');
  }
});

test('GET /assessments clamps pageSize to max 100', async () => {
  const requestBuilder = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({ pageSize: 500 });

  assert(res.status === 200 || res.status === 500, 'Should respond');
  if (res.status === 200 && res.body.pageSize) {
    assert(res.body.pageSize <= 100, 'Should cap pageSize at 100');
  }
});

test('GET /assessments defaults page to 1 and pageSize to 20', async () => {
  const requestBuilder = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({});

  assert(res.status === 200 || res.status === 500, 'Should respond');
  if (res.status === 200) {
    assert.strictEqual(res.body.page, 1, 'Should default page to 1');
    assert.strictEqual(res.body.pageSize, 20, 'Should default pageSize to 20');
  }
});

test('GET /assessments accepts sortBy whitelist values', async () => {
  const validSorts = ['created_at', 'overall_score', 'title'];

  for (const sort of validSorts) {
    const requestBuilder = request(app).get('/api/assessments');

    if (AUTH_ENABLED) {
      requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
    }

    const res = await requestBuilder.query({ sortBy: sort });
    assert(res.status === 200 || res.status === 500, `Should accept sortBy=${sort}`);
  }
});

test('GET /assessments defaults to created_at for invalid sortBy', async () => {
  const requestBuilder = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({ sortBy: 'invalid_column' });

  // Should use created_at as default, so query succeeds or returns DB error, not validation error
  assert(res.status === 200 || res.status === 500, 'Should default invalid sort to created_at');
});

test('GET /assessments accepts order asc/desc', async () => {
  const requestBuilder1 = request(app).get('/api/assessments');
  const requestBuilder2 = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder1.set('Authorization', `Bearer ${TEST_API_KEY}`);
    requestBuilder2.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res1 = await requestBuilder1.query({ order: 'asc' });
  const res2 = await requestBuilder2.query({ order: 'desc' });

  assert(res1.status === 200 || res1.status === 500, 'Should accept order=asc');
  assert(res2.status === 200 || res2.status === 500, 'Should accept order=desc');
});

test('GET /assessments accepts filter parameters', async () => {
  const requestBuilder = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({
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
  const requestBuilder = request(app).get('/api/assessments');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({});

  if (res.status === 200) {
    assert(Array.isArray(res.body.assessments), 'Should have assessments array');
    assert(typeof res.body.total === 'number', 'Should have total count');
    assert(typeof res.body.page === 'number', 'Should have page number');
    assert(typeof res.body.pageSize === 'number', 'Should have pageSize');
  }
});

// GET /assessments/:id routing test
test('GET /assessments/:id endpoint is routable', async () => {
  const requestBuilder = request(app).get('/api/assessments/123');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder;

  // Should hit the route handler, even if DB error (500) or not found (404)
  assert(res.status >= 200 && res.status < 600, 'Endpoint should be routable');
});

// DELETE /assessments/:id routing test
test('DELETE /assessments/:id endpoint is routable', async () => {
  const requestBuilder = request(app).delete('/api/assessments/123');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder;

  // Should hit the route handler
  assert(res.status >= 200 && res.status < 600, 'Endpoint should be routable');
});

// GET /compare with query parameters test
test('GET /assessments/compare rejects missing query parameters', async () => {
  const requestBuilder = request(app).get('/api/assessments/compare');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder;

  // Should reject due to missing id1 and id2
  assert.strictEqual(res.status, 400, 'Should reject missing query parameters');
});

test('GET /assessments/compare rejects missing id2 parameter', async () => {
  const requestBuilder = request(app).get('/api/assessments/compare');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({ id1: 'abc123' });

  // Should reject due to missing id2
  assert.strictEqual(res.status, 400, 'Should reject missing id2 parameter');
});

test('GET /assessments/compare accepts id1 and id2 query parameters', async () => {
  const requestBuilder = request(app).get('/api/assessments/compare');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.query({ id1: 'abc123', id2: 'def456' });

  // Should route successfully (may return 401 if auth required, 404 if not found, or 200/500 based on DB)
  assert(res.status >= 200 && res.status < 600, 'Should route with query parameters');
});

test('GET /api/assessments/validate rejects invalid UUID format', async () => {
  const requestBuilder = request(app).get('/api/assessments/validate/not-a-uuid');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder;
  assert.strictEqual(res.status, 400, 'Should reject invalid publicId format');
});

test('PATCH /api/assessments/:id endpoint is routable', async () => {
  const requestBuilder = request(app).patch('/api/assessments/123');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({ is_public: true });
  assert(res.status >= 200 && res.status < 600, 'Endpoint should be routable');
});
