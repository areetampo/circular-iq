import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import request from 'supertest';

import { closeAllPools } from '#database/client.js';
import { stopServer } from '#server/index.js';

process.env.NODE_ENV = 'test';
// Disable global API key guard so these routes can reach handlers.
process.env.API_AUTH_ENABLED = 'false';

let app;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

after(async () => {
  // Stop the server instance if it was started
  await stopServer();
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
