import { FRONTEND_CONFIG } from '@/config/frontend.config';

/**
 * Builds API path: production uses Vercel rewrites (`/api/...`); development prefixes `VITE_API_URL`.
 *
 * @param {string} path - API path (e.g. `/api/score`, `/api/assessments`).
 * @returns {string} Absolute development URL or production rewrite path.
 */
export function buildApiUrl(path) {
  const API_URL = FRONTEND_CONFIG.app.apiUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (FRONTEND_CONFIG.isProduction) {
    // All routes (including stream) go directly to backend via Vercel rewrite.
    // The rewrite in vercel.json forwards /api/:path* → Render backend.
    // frontend/api/proxy.js is kept but unused.
    return normalizedPath; // e.g. /api/profile → caught by vercel.json rewrite
  }

  return `${API_URL}${normalizedPath}`;
}
