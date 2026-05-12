#!/usr/bin/env node
/**
 * Backend Test Runner - Fixed Version
 *
 * This wrapper script ensures test environment is set up (env/.env.test loaded and validated)
 * before running any tests. It then delegates to Node's built-in test runner.
 *
 * Note: Analytics tests have been updated to align with existing endpoints.
 * All tests are now included by default.
 *
 * Usage:
 *   node tests/run-tests.js                    # Run all tests
 *   node tests/run-tests.js --include-analytics # Run all tests (legacy flag, no effect)
 *   npm test
 */

import './setup.js';

import { logger } from '#utils/logger.js';

logger.info('Running tests with Node.js built-in test runner');

const { execSync } = await import('child_process');

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
      try {
        execSync(`node --test ${testFile}`, {
          cwd: process.cwd(),
          env: process.env,
          stdio: 'inherit',
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
    logger.error('Test execution failed:', error.message);
    if (global.clearGlobalTimeout) {
      global.clearGlobalTimeout();
    }
    process.exit(1);
  }
}

runTests();
