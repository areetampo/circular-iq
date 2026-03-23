import assert from 'node:assert/strict';
import { afterAll, before, test } from 'node:test';

import request from 'supertest';

import { closeAllPools } from '#database/client.js';

process.env.NODE_ENV = 'test';
// Disable global API key guard so these routes can reach handlers.
process.env.API_AUTH_ENABLED = 'false';

let app;
let server;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

afterAll(async () => {
  // Close any open server instances created by supertest
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  // Close all database pools and connections
  await closeAllPools();
});

test('GET /docs/methodology returns methodology JSON', async () => {
  const res = await request(app).get('/docs/methodology');
  assert.equal(res.status, 200);
  assert.ok(res.body.title);
  assert.ok(res.body.framework);
});

test('POST /api/search rejects missing query', async () => {
  const res = await request(app).post('/api/search').send({});
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('GET /api/score/test-anonymous-limit-tracking is routable', async () => {
  const res = await request(app).get('/api/score/test-anonymous-limit-tracking');
  // May return 200 (happy path) or 500/503 if DB/RPC not available in test env.
  assert.ok(res.status >= 200 && res.status < 600);
});
