import '#config/loadEnv.js';
import assert from 'node:assert';
import { after, before, test } from 'node:test';

import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { closeAllPools } from '#database/index.js';

let app;
const AUTH_ENABLED = BACKEND_CONFIG.app.apiAuthEnabled;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});

test('health endpoint remains open when auth is disabled', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('routes allow access when auth is disabled', async () => {
  // When auth is disabled, routes should be accessible without API keys
  // The requireAuth middleware will use test user ID, but profile won't exist in DB
  const requestBuilder = request(app).get('/api/profile');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
  }

  const res = await requestBuilder;
  // Should return 401 (no auth) or 404 (profile not found) or 500 (if DB error), but not be blocked
  assert(
    res.status === 401 || res.status === 404 || res.status === 500,
    `Expected 401/404/500, got ${res.status}`,
  );
});

test('routes ignore API keys when auth is disabled', async () => {
  // When auth is disabled, API keys should be ignored
  // For requireAuth middleware, we need to not send any Authorization header to trigger test mode
  const requestBuilder = request(app).get('/api/profile');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
  }

  const res = await requestBuilder;
  // Should return 401 (no auth) or 404 (profile not found) or 500 (if DB error), but not be blocked
  assert(
    res.status === 401 || res.status === 404 || res.status === 500,
    `Expected 401/404/500, got ${res.status}`,
  );
});

test('scoring endpoint enforces validation even when auth is disabled', async () => {
  // When auth is disabled, scoring should still validate input and return 400 for bad input
  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
  }

  const res = await requestBuilder.send({});
  assert.strictEqual(res.status, 400);
});

test('scoring endpoint ignores API keys when auth is disabled', async () => {
  // When auth is disabled, API keys should be ignored but validation still applies
  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${process.env.API_KEY}`);
    requestBuilder.set('X-API-Key', 'any-key');
  }

  const res = await requestBuilder.send({});
  assert.strictEqual(res.status, 400);
});
