import { useQuery } from '@tanstack/react-query';
import { getAssessmentStats } from '@/features/assessments';

/**
 * Hook for fetching aggregate statistics for all user assessments
 * @param {Object} options
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Stats and query state
 */
export function useAssessmentStats({ enabled = true } = {}) {
  const {
    data = {
      totalAssessments: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      topIndustries: null,
    },
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assessment-stats'],
    queryFn: () => getAssessmentStats(),
    enabled,
    staleTime: 0, // Always fetch fresh - no caching
    gcTime: 0, // Don't cache in garbage collection
  });

  // Debug log
  // console.log('[useAssessmentStats]', { data, topIndustries: data.topIndustries });

  return {
    totalAssessments: data.totalAssessments || 0,
    averageScore: data.averageScore || 0,
    highestScore: data.highestScore || 0,
    lowestScore: data.lowestScore || 0,
    topIndustries: data.topIndustries || null,
    isLoading,
    isError,
    error: error?.message || null,
    refetch,
  };
}
