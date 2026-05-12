import { buildApiUrl } from '@/lib/apiClient';

/**
 * Search circular economy cases
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {string} params.mode - Search mode: 'keyword' | 'hybrid'
 * @param {number} params.limit - Maximum number of results (default: 50)
 * @returns {Promise<Object>} Search results
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
