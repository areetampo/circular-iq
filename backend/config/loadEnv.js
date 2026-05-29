/**
 * Loads `env/.env.backend` or `env/.env.test` before config validation.
 * Production skips dotenv files so deployed secrets come only from the process environment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PROD = NODE_ENV === 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolves the repository root used for local env files.
 *
 * @param {string} startPath - Directory nearest this config module.
 * @returns {string} Directory containing `.git`, or `startPath` when Docker/CI omits Git metadata.
 */
function getMonorepoRoot(startPath) {
  let currentPath = startPath;

  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  // Docker/CI images may copy source without Git metadata; keep lookup anchored to this module.
  return startPath;
}

const root = getMonorepoRoot(__dirname);
const rootEnvPath = path.resolve(root, 'env');

if (!IS_PROD) {
  const envFile = NODE_ENV === 'test' ? '.env.test' : '.env.backend';
  const backendPath = path.join(rootEnvPath, envFile);

  if (fs.existsSync(backendPath)) {
    dotenv.config({ path: backendPath, override: false });
    console.log(`Loaded environment variables from ${backendPath}`);
  } else {
    console.warn(`Warning: ${backendPath} not found.`);
  }
}
