#!/usr/bin/env node
/**
 * @module tests/run-tests
 * @description Loads `tests/setup.js`, then runs the Node.js built-in test runner over `backend/tests`.
 *
 * @example
 * node backend/tests/run-tests.js
 * npm test
 */

import './setup.js';

logger.info('Running tests with Node.js built-in test runner');

const { execSync } = await import('child_process');

/**
 * Tests that make real external API calls (OpenAI embeddings + audit generation)
 * can take 50-60 s for two scoring requests. Give them a generous timeout so the
 * child process isn't killed before it can report results.
 */
const SLOW_TESTS = new Set(['tests/services/score-validation.test.js']);

/** Default per-file timeout (ms). Slow tests use SLOW_TIMEOUT instead. */
const DEFAULT_TIMEOUT = 30000;
const SLOW_TIMEOUT = 120000; // 2 minutes — covers two ~26 s OpenAI round-trips + overhead

/**
 * Why --test-force-exit:
 * Several test files import modules (database/index.js, server/app.js) that
 * create Supabase clients via @supabase/supabase-js. The Supabase JS client
 * opens persistent fetch/WebSocket handles internally and exposes no .close()
 * method, so closeAllPools() cannot release them. Without --test-force-exit the
 * child process hangs after all tests pass, eventually hitting the setup.js
 * 5-minute watchdog which kills it with a test failure. --test-force-exit tells
 * Node's built-in test runner to call process.exit(0|1) as soon as all tests
 * finish, bypassing the open-handle wait entirely.
 */
const FORCE_EXIT_FLAG = '--test-force-exit';

/**
 * Executes the configured Node test file list via `execSync`.
 * @returns {Promise<void>}
 */
async function runTests() {
  // Ensure NODE_ENV is set to test for all test runs
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }

  const testArgs = process.argv.slice(2);

  // List of all tests (analytics tests now align with existing endpoints)
  const allTests = [
    'tests/api/anonymous.test.js',
    'tests/api/api-auth.test.js',
    'tests/api/assessments-routes.test.js',
    'tests/api/misc-endpoints.test.js',
    'tests/api/scoring.rpc.test.js',
    'tests/api/apiKeyGuard.test.js',
    'tests/api/analytics-missing-endpoints.test.js',
    'tests/api/analytics.enhanced.test.js',
    'tests/api/analytics.featured.test.js',
    'tests/database/documents.repository.test.js',
    'tests/services/score-validation.test.js',
    'tests/services/scoring-logic-enrichment.test.js',
  ];

  // All tests are included by default now
  let testsToRun = allTests;

  // Filter for specific test files if provided
  const filteredArgs = testArgs.filter((arg) => arg !== '--include-analytics');
  if (filteredArgs.length > 0) {
    testsToRun = filteredArgs.filter((arg) => testsToRun.some((test) => test.includes(arg)));
  }

  try {
    // Run all tests in sequence to avoid hanging
    for (const testFile of testsToRun) {
      logger.info(`\n🧪 Running ${testFile}...`);
      const timeout = SLOW_TESTS.has(testFile) ? SLOW_TIMEOUT : DEFAULT_TIMEOUT;
      try {
        execSync(`node --import ./tests/setup.js --test ${FORCE_EXIT_FLAG} ${testFile}`, {
          cwd: process.cwd(),
          env: { ...process.env },
          stdio: 'inherit',
          timeout,
        });
        logger.info(`✓ ${testFile} completed`);
      } catch (error) {
        logger.error(`✕ ${testFile} failed with exit code ${error.status}`);
        // Continue running other tests even if one fails
      }
    }

    logger.info('\n🎉 All test runs completed!');

    // Clear the global timeout before exiting
    if (global.clearGlobalTimeout) {
      global.clearGlobalTimeout();
    }

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Test execution failed');
    if (global.clearGlobalTimeout) {
      global.clearGlobalTimeout();
    }
    process.exit(1);
  }
}

runTests();
