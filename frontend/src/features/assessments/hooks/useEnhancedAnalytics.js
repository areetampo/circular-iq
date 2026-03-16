import { useQuery } from '@tanstack/react-query';

import { getEnhancedAnalytics } from '@/features/assessments';

/**
 * Hook for fetching enhanced analytics data with detailed metrics
 * @param {Object} options
 * @param {Object} options.filters - Filter options for analytics
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Enhanced analytics data and states
 */
export function useEnhancedAnalytics({ filters = {}, enabled = true } = {}) {
  const query = useQuery({
    queryKey: ['enhanced-analytics', filters],
    queryFn: () => getEnhancedAnalytics(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: query.data,
    aggregate: query.data?.aggregate || {
      totalCount: 0,
      averageScore: 0,
      avgViability: 0,
      publicCount: 0,
      contributingCount: 0,
      medianScore: 0,
    },
    industryMetrics: query.data?.industryMetrics || [],
    timeSeries: query.data?.timeSeries || [],
    scoreDistribution: query.data?.scoreDistribution || [],
    strategyDistribution: query.data?.strategyDistribution || [],
    scaleDistribution: query.data?.scaleDistribution || [],
    trends: query.data?.trends || { recentGrowth: 0, scoreImprovement: 0 },
    overallVolatility:
      query.data?.overallVolatility ?? query.data?.aggregate?.overallVolatility ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
