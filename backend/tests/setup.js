/**
 * Backend Test Setup
 *
 * This file is automatically loaded before running tests via the --loader flag or NODE_OPTIONS.
 * It enforces that env/.env.test exists and contains required environment variables for all backend tests.
 *
 * Key responsibilities:
 * 1. Locate the monorepo root and load env/.env.test
 * 2. Throw critical errors if .env.test is missing or required vars are not set
 * 3. Ensure consistent test environment across all test runs
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
 * Find the monorepo root by looking for .git directory
 */
function getMonorepoRoot(startPath) {
  let currentPath = startPath;

  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
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
        'Tests require a .env.test file in the env/ directory at the monorepo root.\n' +
        'See env/.env.example for reference configuration.\n' +
        'Create env/.env.test with required environment variables before running tests.',
    );
  }

  // Load environment variables from .env.test
  const result = dotenv.config({ path: envTestPath });
  if (result.error && result.error.code !== 'ENOENT') {
    throw new Error(`Failed to load env/.env.test: ${result.error.message}`);
  }

  // Validate required backend test environment variables
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FRONTEND_URL',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `[CRITICAL] Missing required environment variables in env/.env.test:\n` +
        missingVars.map((v) => `  - ${v}`).join('\n') +
        '\n\nEnsure all required variables are set in env/.env.test before running tests.',
    );
  }

  // Verify we're in test mode
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[WARNING] NODE_ENV is not set to "test" in env/.env.test. Tests should run in test environment.',
    );
  }

  console.log(`✓ Test environment loaded from ${envTestPath}`);
}

// Run setup immediately when this module is imported
setupTestEnvironment();
