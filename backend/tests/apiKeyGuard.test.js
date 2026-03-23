import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import express from 'express';
import request from 'supertest';

import { closeAllPools } from '#database/client.js';

// Ensure deterministic test environment by setting environment variables
process.env.API_AUTH_ENABLED = 'true';
process.env.API_KEY = 'MASTER_TEST_KEY';

// Import after configuring env to pick up values
const { apiKeyGuard } = await import('#server/app.js');
const { BACKEND_CONFIG } = await import('#config/backend.config.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(apiKeyGuard);
  app.get('/protected', (req, res) => res.json({ ok: true }));
  return app;
}

test('requests without api key are rejected', async () => {
  const app = makeApp();
  const res = await request(app).get('/protected');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.code, 'UNAUTHORIZED');
});

test('requests with valid x-api-key are accepted', async () => {
  const app = makeApp();
  const res = await request(app).get('/protected').set('x-api-key', 'MASTER_TEST_KEY');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { ok: true });
});

test('requests with Bearer token equal to API key are accepted', async () => {
  const app = makeApp();
  const res = await request(app).get('/protected').set('Authorization', 'Bearer MASTER_TEST_KEY');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { ok: true });
});

after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});
