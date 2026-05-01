import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import express from 'express';
import request from 'supertest';

// Load environment first
import '#config/loadEnv.js';
import { closeAllPools } from '#database/client.js';
import { logger } from '#utils/logger.js';

// Setup global logger for the test
globalThis.logger = logger;

// Import AFTER configuring env to pick up values
const { apiKeyGuard } = await import('#server/app.js');
const { BACKEND_CONFIG } = await import('#config/backend.config.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(apiKeyGuard);

  // Add a protected route that requires API key
  app.get('/protected', (req, res) => {
    res.json({ message: 'Protected content accessed', authenticated: true });
  });

  return app;
}

test('requests without api key are allowed when auth is disabled', async () => {
  const app = makeApp();
  const res = await request(app).get('/protected');

  // When auth is disabled, should allow access without API key
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { message: 'Protected content accessed', authenticated: true });
});

test('requests with any x-api-key are allowed when auth is disabled', async () => {
  const app = makeApp();
  const res = await request(app).get('/protected').set('x-api-key', 'any-key');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { message: 'Protected content accessed', authenticated: true });
});

test('requests with any Bearer token are allowed when auth is disabled', async () => {
  const app = makeApp();
  const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { message: 'Protected content accessed', authenticated: true });
});

after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});
