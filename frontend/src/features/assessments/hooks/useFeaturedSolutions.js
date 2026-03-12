import { useQuery } from '@tanstack/react-query';
import { getFeaturedSolutions } from '../api/assessmentApi';

export function useFeaturedSolutions({ limit = 3, industry, q = undefined, enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['featured-solutions', { limit, industry, q }],
    queryFn: () => getFeaturedSolutions({ limit, industry, q }),
    enabled,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  return {
    data: query.data,
    solutions: query.data?.solutions || [],
    count: query.data?.count || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}

export default useFeaturedSolutions;
