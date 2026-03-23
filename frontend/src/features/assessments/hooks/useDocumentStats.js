import { useQuery } from '@tanstack/react-query';

import apiClient from '@/lib/apiClient';

/**
 * useDocumentStats
 * Fetches document knowledge-base summary metrics from the analytics API.
 * @param {Object} [options]
 * @param {boolean} [options.enabled]
 * @returns {Object}
 */
export function useDocumentStats({ enabled = true } = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['document-stats'],
    queryFn: () => apiClient.get('/api/analytics/documents/summary').then((res) => res.data),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - document stats don't change often
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    stats: data,
    loading: isLoading,
    isLoading,
    error: error?.message || null,
    isError,
    refetch,
  };
}
