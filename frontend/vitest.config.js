import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getMonorepoRoot(startPath) {
  let currentPath = startPath;

  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, '.git'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  return startPath;
}

const root = getMonorepoRoot(__dirname);
const rootEnvPath = path.resolve(root, 'env');
console.log(`[vitest.config] envDir resolved to: ${rootEnvPath}`);

// Manually load .env.test (and .env) from the env directory.
// This bypasses the envDir bug where vars are loaded into process.env
// but never injected into import.meta.env in test workers.
const testEnv = loadEnv('test', rootEnvPath, '');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
    css: true,
    testTimeout: 10000,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    // Inject vars directly into import.meta.env in every test worker.
    // Remove envDir — it only populates process.env, not import.meta.env.
    env: testEnv,
    logHeapUsage: true,
    reporters: ['default', 'verbose'],
  },
});
