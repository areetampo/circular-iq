/**
 * Backend Test Setup Script
 *
 * This script ensures test environment is properly configured before running tests.
 * It's automatically loaded by the test runner via NODE_OPTIONS or package.json.
 *
 * Key responsibilities:
 * 1. Locate the monorepo root and load env/.env.test
 * 2. Throw critical errors if .env.test is missing or required vars are not set
 * 3. Ensure consistent test environment across all test runs
 * 4. Prevent infinite test hanging with global timeout
 *
 * Usage: Run tests with this setup:
 *   NODE_OPTIONS='--require ./backend/tests/setup.js' npm test
 * OR configure in package.json test script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find monorepo root by looking for .git directory
 */
function getMonorepoRoot(startDir) {
  let currentPath = path.resolve(startDir);

  while (currentPath !== path.dirname(currentPath)) {
    const gitPath = path.join(currentPath, '.git');
    if (fs.existsSync(gitPath) || fs.existsSync(gitPath + '/')) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  // Fallback to current working directory if .git not found
  return process.cwd();
}

/**
 * Load and validate test environment
 */
function setupTestEnvironment() {
  const monorepoRoot = getMonorepoRoot(__dirname);
  const envTestPath = path.resolve(monorepoRoot, 'env', '.env.test');

  // Check if env/.env.test exists
  if (!fs.existsSync(envTestPath)) {
    throw new Error(
      `[CRITICAL] env/.env.test not found at ${envTestPath}\n` +
        'Create this file with test environment variables.\n' +
        'Copy env/.env.example to env/.env.test and update values.',
    );
  }

  // Load test environment variables
  const result = dotenv.config({ path: envTestPath });

  if (result.error) {
    throw new Error(`[CRITICAL] Failed to load env/.env.test: ${result.error.message}`);
  }

  console.log(`✓ Test environment loaded from ${envTestPath}`);

  // Validate required test variables
  const requiredVars = [
    'NODE_ENV',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'API_AUTH_ENABLED',
    'API_KEY',
    'OPENAI_API_KEY',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `[CRITICAL] Missing required environment variables: ${missingVars.join(', ')}\n` +
        `Add these to env/.env.test`,
    );
  }

  // Load second time to ensure dotenv variables are available
  dotenv.config({ path: envTestPath });

  console.log('Loaded environment variables from', envTestPath);
}

// Global timeout to prevent infinite hanging
const GLOBAL_TIMEOUT = 120000; // 120 seconds

let timeoutHandle;

function setupGlobalTimeout() {
  timeoutHandle = setTimeout(() => {
    console.error('🚨 TEST TIMEOUT: Tests are hanging, forcing exit...');
    console.error('This usually indicates unclosed connections or hanging promises');
    process.exit(1);
  }, GLOBAL_TIMEOUT);
}

function clearGlobalTimeout() {
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
}

// Setup timeout at start
setupGlobalTimeout();

// Clear timeout on successful completion
process.on('exit', () => {
  clearGlobalTimeout();
});

// Handle various exit scenarios
process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, exiting...');
  clearGlobalTimeout();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, exiting...');
  clearGlobalTimeout();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  clearGlobalTimeout();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  clearGlobalTimeout();
  process.exit(1);
});

// Run setup
setupTestEnvironment();

export { clearGlobalTimeout };
