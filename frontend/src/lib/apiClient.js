/**
 * API Client Helper
 * Handles routing requests through the Vercel proxy in production
 * and directly to the backend in development
 *
 * Location: src/lib/apiClient.js
 */

import { FRONTEND_CONFIG } from '@/config';

/**
 * Build the full API endpoint URL
 * In production on Vercel, routes through /api/proxy
 * In development, goes directly to the backend
 *
 * @param {string} path - API path (e.g., '/api/score', '/api/assessments')
 * @returns {string} Full URL for the API endpoint
 */
export function buildApiUrl(path) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // In production on Vercel, use the serverless proxy function
  if (FRONTEND_CONFIG.isProd) {
    // Encode the path to handle query parameters safely
    const encodedPath = encodeURIComponent(normalizedPath);
    return `/api/proxy?path=${encodedPath}`;
  }

  // In development, call the backend directly
  return `${FRONTEND_CONFIG.apiBaseUrl}${normalizedPath}`;
}

/**
 * Build the full API endpoint URL with query parameters
 *
 * @param {string} path - API path (e.g., '/api/assessments')
 * @param {Object} params - Query parameters to append
 * @returns {string} Full URL with query parameters
 */
export function buildApiUrlWithParams(path, params = {}) {
  const baseUrl = buildApiUrl(path);

  if (Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(
    baseUrl,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  return url.pathname + url.search;
}

/**
 * Fetch helper that uses the appropriate URL based on environment
 * Preserves all original fetch options
 *
 * @param {string} path - API path
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  return fetch(url, options);
}
