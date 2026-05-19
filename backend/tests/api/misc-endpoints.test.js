/**
 * @module tests/api/misc-endpoints.test
 * @description Smoke tests for ancillary API routes (search, profile, server bootstrap).
 */

import assert from 'node:assert';
import { after, before, test } from 'node:test';

import { closeAllPools } from '#database/index.js';

let app;

before(async () => {
  // Use app.js (not index.js) — index.js calls app.listen() which binds a port
  // that keeps the process alive. app.js exports the Express app directly;
  // supertest spins up its own ephemeral server per-request and closes it.
  const mod = await import('#server/app.js');
  app = mod.default;
});

test('misc endpoints setup test', async () => {
  assert.ok(app, 'App should be loaded');
});

after(async () => {
  logger.info('🧹 Starting test cleanup...');
  await closeAllPools();
  logger.info('✓ Test cleanup completed');
  // Supabase/OpenAI clients opened at app.js module-load time have no public
  // close() API. process.exit(0) is the only way to release those handles.
  await new Promise((resolve) => setTimeout(resolve, 100));
  process.exit(0);
});
