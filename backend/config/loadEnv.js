/**
 * @module loadEnv
 * @description Environment variable loader for the backend application.
 * Loads environment variables from .env files based on the current NODE_ENV.
 *
 * Behavior by environment:
 * - production: Relies solely on actual environment variables from deployment dashboard
 *   for security and performance (no .env file loading).
 * - development: Loads variables from env/.env.backend.
 * - test: Loads variables from env/.env.test.
 *
 * The module locates the monorepo root by searching for the .git directory,
 * ensuring it can find the env/ directory regardless of where the script is run from.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Finds the monorepo root directory by searching upward for the .git directory.
 * This allows reliable location of the 'env' directory regardless of where the script is run from.
 * If .git is not found (e.g., in some CI/CD environments), falls back to the provided startPath.
 *
 * @param {string} startPath - The initial path to start searching from (usually __dirname).
 * @returns {string} The path to the monorepo root or the startPath if .git is not found.
 */
function getMonorepoRoot(startPath) {
  let currentPath = startPath;

  while (currentPath !== path.parse(currentPath).root) {
    // Note: If running in Docker/CI without .git,
    // you might want to check for 'package.json' or 'pnpm-workspace.yaml' instead.
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  // Fallback: If .git isn't found (common in some CI/Docker),
  // you might want to return process.cwd() or a default.
  return startPath;
}

const root = getMonorepoRoot(__dirname);
const rootEnvPath = path.resolve(root, 'env');

if (!IS_PROD) {
  const envFile = NODE_ENV === 'test' ? '.env.test' : '.env.backend';
  const backendPath = path.join(rootEnvPath, envFile);

  if (fs.existsSync(backendPath)) {
    dotenv.config({ path: backendPath, override: false });
    // logger.info({ path: backendPath }, 'Loaded env from');
    console.log(`Loaded environment variables from ${backendPath}`);
  } else {
    // logger.warn({ envFile, path: backendPath }, 'env file not found');
    console.warn(`Warning: ${backendPath} not found.`);
  }
}
