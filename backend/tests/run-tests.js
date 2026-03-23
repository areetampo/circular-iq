#!/usr/bin/env node
/**
 * Backend Test Runner
 *
 * This wrapper script ensures the test environment is set up (env/.env.test loaded and validated)
 * before running any tests. It then delegates to Node's built-in test runner.
 *
 * Usage:
 *   node tests/run-tests.js
 *   npm test
 */

import './setup.js';

// After setup.js completes loading and validating env/.env.test,
// spawn the test runner in a child process with the loaded environment
import { spawn } from 'node:child_process';

const testProcess = spawn('node', ['--test', ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
});

testProcess.on('exit', (code) => {
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('Failed to run tests:', error);
  process.exit(1);
});
