/**
 * loadEnv.js
 *
 * Responsible for loading environment variables from .env files based on the current NODE_ENV.
 * In production, it relies solely on actual environment variables from dashboard for security and performance.
 * In development and test environments, it loads variables from .env.backend.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Helper function to find the monorepo root by looking for a .git directory.
 * This allows us to reliably locate the 'env' directory regardless of where this script is run from.
 * If .git is not found (e.g., in some CI/CD environments), it falls back to the provided startPath.
 * You can modify this to check for other files like 'package.json' if .git is not suitable for your environment.
 * @param {string} startPath - The initial path to start searching from (usually __dirname).
 * @returns {string} - The path to the monorepo root or the startPath if .git is not found.
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
