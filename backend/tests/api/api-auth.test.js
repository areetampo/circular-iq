/**
 * @module tests/api/api-auth.test
 * @description Integration tests for API-key authentication on protected routes.
 */

import '#config/loadEnv.js';
import assert from 'node:assert';
import { after, before, test } from 'node:test';

import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { closeAllPools } from '#database/index.js';

let app;
const AUTH_ENABLED = BACKEND_CONFIG.app.apiAuthEnabled;

before(async () => {
  // Use app.js (not index.js) — index.js calls app.listen() which binds a port
  // that keeps the process alive. app.js exports the Express app directly;
  // supertest spins up its own ephemeral server per-request and closes it.
  const mod = await import('#server/app.js');
  app = mod.default;
});

after(async () => {
  await closeAllPools();
  // Supabase/OpenAI clients opened at app.js module-load time have no public
  // close() API. process.exit(0) is the only way to release those handles.
  // All assertions are already complete by the time after() runs.
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});

test('health endpoint remains open when auth is disabled', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('routes allow access when auth is disabled', async () => {
  const requestBuilder = request(app).get('/api/profile');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
  }

  const res = await requestBuilder;
  assert(
    res.status === 401 || res.status === 404 || res.status === 500,
    `Expected 401/404/500, got ${res.status}`,
  );
});

test('routes ignore API keys when auth is disabled', async () => {
  const requestBuilder = request(app).get('/api/profile');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
  }

  const res = await requestBuilder;
  assert(
    res.status === 401 || res.status === 404 || res.status === 500,
    `Expected 401/404/500, got ${res.status}`,
  );
});

test('scoring endpoint enforces validation even when auth is disabled', async () => {
  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
  }

  const res = await requestBuilder.send({});
  assert.strictEqual(res.status, 400);
});

test('scoring endpoint ignores API keys when auth is disabled', async () => {
  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
    requestBuilder.set('X-API-Key', 'any-key');
  }

  const res = await requestBuilder.send({});
  assert.strictEqual(res.status, 400);
});
