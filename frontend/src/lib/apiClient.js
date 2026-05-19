/**
 * @module apiClient
 * @description API client utility for building proxied API URLs.
 * In production, routes through Vercel rewrites to the backend.
 * In development, goes directly to the backend API URL.
 */

import { FRONTEND_CONFIG } from '@/config';

/**
 * Build the full API endpoint URL
 * In production on Vercel, routes through /api/proxy (injects API key server-side)
 * Exception: /api/score/stream bypasses proxy — SSE cannot stream through serverless functions
 * In development, goes directly to the backend
 *
 * @param {string} path - API path (e.g., '/api/score', '/api/assessments')
 * @returns {string} Full URL for the API endpoint
 */
export function buildApiUrl(path) {
  const API_URL = FRONTEND_CONFIG.apiUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (FRONTEND_CONFIG.isProd) {
    // All routes (including stream) go directly to backend via Vercel rewrite.
    // The rewrite in vercel.json forwards /api/:path* → Render backend.
    // frontend/api/proxy.js is kept but unused.
    return normalizedPath; // e.g. /api/profile → caught by vercel.json rewrite
  }

  return `${API_URL}${normalizedPath}`;
}
