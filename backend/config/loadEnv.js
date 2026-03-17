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

// 1. Define __dirname once at the top level
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Finds the monorepo root by looking for a marker (like .git or package.json).
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

// 2. Calculate the path properly using the helper
const root = getMonorepoRoot(__dirname);
const rootEnvPath = path.resolve(root, 'env');

if (!IS_PROD) {
  // 3. Use the rootEnvPath we already calculated above
  const backendPath = path.join(rootEnvPath, '.env.backend');

  if (fs.existsSync(backendPath)) {
    dotenv.config({ path: backendPath, override: false });
    console.log(`✓ Loaded env from: ${backendPath}`);
  } else {
    console.warn(`‼ Warning: .env.backend not found at ${backendPath}`);
  }
}
