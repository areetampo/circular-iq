import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: rootEnvPath,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/config': path.resolve(__dirname, './src/config'),
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
  build: {
    chunkSizeWarningLimit: 1000, // 10KB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // PDF vendor
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg'))
            return 'vendor-pdf';
          // Charts vendor
          if (id.includes('recharts') || id.includes('@mui/x-charts') || id.includes('d3'))
            return 'vendor-charts';
          // React + MUI + React Aria – all in one chunk
          if (
            id.includes('@mui/') ||
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('@react-aria') ||
            id.includes('@react-stately') ||
            id.includes('react-aria-components')
          )
            return 'vendor-react';
          // supabase
          if (id.includes('@supabase')) return 'vendor-supabase';
          // Split main app pages
          if (
            id.match(
              /pages[\\/](DashboardPage|ResultsPage|MarketAnalysisPage|LandingPage|MyAssessmentsPage|AssessmentComparisonPage|GuidePage)/,
            )
          ) {
            const match = id.match(/pages[\\/](\\w+)\./);
            if (match) return `page-${match[1].toLowerCase()}`;
          }
        },
      },
    },
  },
  // Vitest config for tests run via `pnpm test`
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/api': path.resolve(__dirname, './src/api'),
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
});
