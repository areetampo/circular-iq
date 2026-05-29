import { buildApiUrl } from '@/lib/apiClient';

/**
 * Searches circular economy cases by query string.
 *
 * @param {{ q: string, mode: 'keyword'|'hybrid', limit?: number }} searchParams - Query, mode, and result limit sent to the search endpoint.
 * @param {string} searchParams.q     - Search query (required, non-empty string).
 * @param {'keyword'|'hybrid'} searchParams.mode - Search strategy.
 * @param {number} [searchParams.limit=50] - Maximum results to return.
 * @returns {Promise<Record<string, unknown>>} Parsed JSON response body from the API.
 * @throws {Error} If `q` or `mode` is invalid, or the API returns a non-2xx status.
 */
export async function searchCeCases(searchParams) {
  const { q, mode, limit = 50 } = searchParams;

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
