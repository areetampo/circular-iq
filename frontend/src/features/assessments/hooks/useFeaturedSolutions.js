import { useQuery } from '@tanstack/react-query';
import { getFeaturedSolutions } from '@/features/assessments/api/assessmentApi';

export function useFeaturedSolutions({ limit = 3, enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['featured-solutions', { limit }],
    queryFn: () => getFeaturedSolutions({ limit }),
    enabled,
    staleTime: 10 * 60 * 1000,
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
