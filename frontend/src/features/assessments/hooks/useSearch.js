import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/lib/apiClient';

/**
 * Hook for searching documents/solutions with TanStack Query caching
 * @param {Object} options
 * @param {string} options.query - Search query string
 * @param {Object} options.filters - Search filters (industry, category, source)
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Search results and states
 */
export function useSearch({ query, filters = {}, enabled = true } = {}) {
  const queryClient = useQueryClient();

  const searchQuery = useQuery({
    queryKey: ['search', { query: query?.trim(), filters }],
    queryFn: async () => {
      if (!query?.trim()) {
        return { results: [], count: 0 };
      }

      const res = await apiClient.post('/search', {
        query: query.trim(),
        filters,
      });

      return res.data || { results: [], count: 0 };
    },
    enabled: enabled && !!query?.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes - search results can be cached for a bit
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  // Legacy mutation-based search for backward compatibility
  const searchMutation = useMutation({
    mutationFn: async ({ query: searchQuery, filters: searchFilters = {} }) => {
      if (!searchQuery?.trim()) {
        return { results: [], count: 0 };
      }

      const res = await apiClient.post('/search', {
        query: searchQuery.trim(),
        filters: searchFilters,
      });

      return res.data || { results: [], count: 0 };
    },
    onSuccess: (data, variables) => {
      // Update the query cache with the mutation result
      queryClient.setQueryData(
        ['search', { query: variables.query?.trim(), filters: variables.filters }],
        data,
      );
    },
  });

  return {
    // Query-based results (preferred)
    results: searchQuery.data?.results || [],
    count: searchQuery.data?.count || 0,
    isLoading: searchQuery.isLoading,
    isError: searchQuery.isError,
    error: searchQuery.error?.message || null,
    refetch: searchQuery.refetch,

    // Mutation-based search (for manual triggering)
    search: searchMutation.mutate,
    searchAsync: searchMutation.mutateAsync,
    isSearching: searchMutation.isPending,
    searchError: searchMutation.error?.message || null,

    // Clear search results
    clearResults: () => {
      queryClient.removeQueries({ queryKey: ['search'] });
    },
  };
}
