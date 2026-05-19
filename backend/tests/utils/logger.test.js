/**
 * @module tests/utils/logger.test
 * @description Unit tests for the shared Pino logger wrapper (`logOperation`, level methods).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('logger exports', () => {
  assert.strictEqual(typeof logger.info, 'function');
  assert.strictEqual(typeof logger.error, 'function');
  assert.strictEqual(typeof logger.warn, 'function');
  assert.strictEqual(typeof logger.debug, 'function');
  assert.strictEqual(typeof logger.logOperation, 'function');
});

test('logOperation method', () => {
  // Test that logOperation doesn't throw and is a function
  assert.strictEqual(typeof logger.logOperation, 'function');

  // Call it to ensure it works without errors
  logger.logOperation('test', '/test-path', 'success', 100);
});
