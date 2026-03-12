import { useQuery } from '@tanstack/react-query';
import { getGlobalAnalytics } from '@/features/assessments';

/**
 * Hook for fetching global analytics data for dashboard
 * @param {Object} options
 * @param {Object} options.filters - Filter options for analytics
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Analytics data and states
 */
export function useGlobalAnalytics({ filters = {}, enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['global-analytics', filters],
    queryFn: () => getGlobalAnalytics(filters),
    enabled,
  });

  return {
    data: query.data,
    aggregate: query.data?.aggregate || { totalCount: 0, averageScore: 0 },
    industryMetrics: query.data?.industryMetrics || [],
    timeSeries: query.data?.timeSeries || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
