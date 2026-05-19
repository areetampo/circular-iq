/**
 * @module searchApi
 * @description Client for the CE cases search API (`GET /api/search/ce-cases`).
 * Supports keyword and hybrid (embedding + keyword) search modes.
 */

import { buildApiUrl } from '@/lib/apiClient';

/**
 * Searches circular economy cases by query string.
 *
 * @param {Object} params
 * @param {string} params.q     - Search query (required, non-empty string).
 * @param {'keyword'|'hybrid'} params.mode - Search strategy.
 * @param {number} [params.limit=50] - Maximum results to return.
 * @returns {Promise<Object>} Parsed JSON response body from the API.
 * @throws {Error} If `q` or `mode` is invalid, or the API returns a non-2xx status.
 */
export async function searchCeCases({ q, mode, limit = 50 }) {
  if (!q || typeof q !== 'string') {
    throw new Error('Search query is required');
  }

  if (!mode || !['keyword', 'hybrid'].includes(mode)) {
    throw new Error('Search mode must be either "keyword" or "hybrid"');
  }

  const params = new URLSearchParams({ q, mode, limit: limit.toString() });
  const url = buildApiUrl(`/api/search/ce-cases?${params}`);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}
