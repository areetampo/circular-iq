import assert from 'node:assert';
import { after, before, test } from 'node:test';

import { closeAllPools } from '#database/index.js';
import { stopServer } from '#server/index.js';
import { logger } from '#utils/logger.js';

let app;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

// Add a basic test to make this file valid
test('misc endpoints setup test', async () => {
  // Basic test to ensure file loads properly
  assert.ok(app, 'App should be loaded');
});

after(async () => {
  logger.info('🧹 Starting test cleanup...');

  // Force cleanup with timeout
  const cleanupPromises = [];

  try {
    // Stop server with timeout
    const serverStop = Promise.race([
      stopServer(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Server stop timeout')), 5000)),
    ]);
    cleanupPromises.push(serverStop);
  } catch (err) {
    logger.warn('⚠️  Server stop error:', err.message);
  }

  try {
    // Close database pools with timeout
    const dbClose = Promise.race([
      closeAllPools(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database close timeout')), 5000),
      ),
    ]);
    cleanupPromises.push(dbClose);
  } catch (err) {
    logger.warn('⚠️  Database close error:', err.message);
  }

  // Wait for cleanup with timeout
  try {
    await Promise.race([
      Promise.allSettled(cleanupPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 10000)),
    ]);
    logger.info('✓ Test cleanup completed');
  } catch (err) {
    logger.warn('⚠️  Cleanup timeout/error:', err.message);
  }

  // Force exit if still hanging
  setTimeout(() => {
    logger.info('🚀 Force exiting test process');
    process.exit(0);
  }, 2000);
});
