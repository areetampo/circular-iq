/** Builds proxied API URLs for backend requests. */

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

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const apiClient = {
  async request(path, { method = 'GET', headers = {}, body, ...rest } = {}) {
    const mergedHeaders = { ...defaultHeaders, ...headers };
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
