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
      completedAssessments: 0,
      averageScore: 0,
      medianScore: 0,
      minScore: null,
      maxScore: null,
      avgConfidence: null,
      avgTechnicalFeasibility: null,
      avgEconomicViability: null,
      avgCircularityPotential: null,
      assessmentsByIndustry: {},
      assessmentsByRisk: {},
      assessmentsByScale: {},
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
    completedAssessments: data.completedAssessments || 0,
    averageScore: data.averageScore || 0,
    medianScore: data.medianScore || 0,
    minScore: data.minScore,
    maxScore: data.maxScore,
    avgConfidence: data.avgConfidence,
    avgTechnicalFeasibility: data.avgTechnicalFeasibility,
    avgEconomicViability: data.avgEconomicViability,
    avgCircularityPotential: data.avgCircularityPotential,
    assessmentsByIndustry: data.assessmentsByIndustry || {},
    assessmentsByRisk: data.assessmentsByRisk || {},
    assessmentsByScale: data.assessmentsByScale || {},
    isLoading,
    isError,
    error: error?.message || null,
    refetch,
  };
}
