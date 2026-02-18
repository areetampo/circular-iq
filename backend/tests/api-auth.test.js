import { before, test } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.API_AUTH_ENABLED = 'true';
process.env.API_KEY = 'test-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'anon-key';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai';

let app;

before(async () => {
  const mod = await import('../api/server.js');
  app = mod.default || mod.app || mod;
});

test('health endpoint remains open when auth is enabled', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('public market-analysis remains reachable without API key when auth is enabled', async () => {
  const res = await request(app).get('/api/assessments/market-analysis');
  // Accept 200 (happy) or 500 (DB unavailable in test env)
  assert(res.status === 200 || res.status === 500, 'Public market-analysis must be reachable');
});

test('protected routes reject missing API key', async () => {
  const res = await request(app).post('/api/score').send({});
  assert.strictEqual(res.status, 401);
});

test('protected routes reject wrong API key', async () => {
  const res = await request(app)
    .post('/api/score')
    .set('Authorization', 'Bearer wrong-key')
    .send({});
  assert.strictEqual(res.status, 401);
});

test('protected routes allow correct API key then enforce validation', async () => {
  const res = await request(app)
    .post('/api/score')
    .set('Authorization', 'Bearer test-key')
    .send({});
  assert.strictEqual(res.status, 400);
});

test('protected routes allow X-API-Key header then enforce validation', async () => {
  const res = await request(app).post('/api/score').set('X-API-Key', 'test-key').send({});
  assert.strictEqual(res.status, 400);
});

test('public endpoints remain reachable when Authorization bearer (user token) is present', async () => {
  // Simulate a client that includes a Supabase user token (not the API key).
  // The global apiKeyGuard should NOT reject bearer tokens that are not the API key
  // — route-level auth should handle user-token validation where applicable.
  const res = await request(app)
    .get('/api/assessments/market-analysis')
    .set('Authorization', 'Bearer some-user-token');

  // Accept 200 (happy path) or 500 (DB not available in test env)
  assert(res.status === 200 || res.status === 500, 'Public market-analysis must be reachable');
});
