/** Builds proxied API URLs for backend requests. */

import { FRONTEND_CONFIG } from '@/config';
import { supabase } from '@/lib/supabase';

/**
 * Get authentication headers for API requests
 * Retrieves the current Supabase session and returns Authorization header if user is authenticated
 *
 * @returns {Promise<Object>} Object containing Authorization header or empty object if not authenticated
 */
async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

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

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const apiClient = {
  async request(path, { method = 'GET', headers = {}, body, ...rest } = {}) {
    const authHeaders = await getAuthHeaders();
    const mergedHeaders = { ...defaultHeaders, ...authHeaders, ...headers };
    const res = await apiFetch(path, {
      method,
      headers: mergedHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
      ...rest,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        (typeof data === 'object' && data?.error) ||
        (typeof data === 'string' && data) ||
        `Request failed with status ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return { status: res.status, ok: res.ok, data };
  },

  get(path, options) {
    return this.request(path, { method: 'GET', ...options });
  },

  post(path, body, options) {
    return this.request(path, { method: 'POST', body, ...options });
  },

  put(path, body, options) {
    return this.request(path, { method: 'PUT', body, ...options });
  },

  delete(path, options) {
    return this.request(path, { method: 'DELETE', ...options });
  },
};

export default apiClient;
