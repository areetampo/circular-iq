import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { apiKeyGuard } from '#server/app.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

// Ensure deterministic test environment
BACKEND_CONFIG.app.apiAuthEnabled = true;
BACKEND_CONFIG.app.apiKey = 'MASTER_TEST_KEY';

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
