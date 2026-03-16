import path from 'path';
import { fileURLToPath } from 'url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../env',
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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Only split react-aria, react, router, pdf, charts, mui, lodash, dayjs, and main app pages
          if (
            id.includes('@react-aria') ||
            id.includes('@react-stately') ||
            id.includes('react-aria-components')
          ) {
            return 'vendor-react-aria';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))
            return 'vendor-react';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
          if (id.includes('recharts') || id.includes('@mui/x-charts')) return 'vendor-charts';
          if (id.includes('node_modules/@mui/')) return 'vendor-mui';
          if (id.includes('node_modules/lodash')) return 'vendor-lodash';
          if (id.includes('node_modules/dayjs')) return 'vendor-dayjs';
          if (
            id.match(
              /pages\\[\\/](DashboardPage|ResultsPage|MarketAnalysisPage|LandingPage|MyAssessmentsPage|AssessmentComparisonPage|GuidePage)/,
            )
          ) {
            const match = id.match(/pages\\[\\/](\\w+)\\./);
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
