import assert from 'node:assert';
import { afterAll, before, test } from 'node:test';

import request from 'supertest';

import { closeAllPools } from '#database/client.js';

process.env.NODE_ENV = 'test';
process.env.API_AUTH_ENABLED = 'true';
process.env.API_KEY = 'test-key';

let app;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

afterAll(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});

test('health endpoint remains open when auth is enabled', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('protected routes reject missing API key', async () => {
  // Use a truly protected endpoint (/api/profile) to verify API guard
  const res = await request(app).get('/api/profile');
  assert.strictEqual(res.status, 401);
});

test('protected routes reject wrong API key', async () => {
  // Wrong API key supplied should be rejected for protected endpoints
  const res = await request(app).get('/api/profile').set('Authorization', 'Bearer wrong-key');
  assert.strictEqual(res.status, 401);
});

test('protected routes allow correct API key then enforce validation', async () => {
  // Supplying the master API key in Authorization should be accepted by the global guard
  // and the scoring endpoint will then perform input validation (400)
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
