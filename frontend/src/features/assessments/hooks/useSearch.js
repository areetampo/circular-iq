import { useCallback, useState } from 'react';

import apiClient from '@/lib/apiClient';

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, filters = {}) => {
    if (!query?.trim()) {
      setResults([]); // clear stale results
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/search', { query: query.trim(), filters });
      setResults(res.data?.results || []);
    } catch (err) {
      setError(err?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => setResults([]), []);

  return { results, loading, error, search, clearResults };
}
