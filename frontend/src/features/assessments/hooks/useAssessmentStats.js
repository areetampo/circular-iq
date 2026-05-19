/**
 * @module useAssessmentStats
 * @description React hook for fetching aggregate statistics for the current user's assessments.
 * Provides totals, averages, distributions by industry/risk/scale, and derived metrics.
 */

import { useQuery } from '@tanstack/react-query';

import { getAssessmentStats } from '@/features/assessments/api/assessmentApi';

/**
 * Fetches aggregate statistics for the current user's assessments (scores, industries, risk).
 * @param {Object} options - Query options.
 * @param {boolean} [options.enabled=true] - Whether to enable the query.
 * @returns {{
 *   totalAssessments: number,
 *   completedAssessments: number,
 *   averageScore: number,
 *   medianScore: number,
 *   minScore: number|null,
 *   maxScore: number|null,
 *   avgConfidence: number|null,
 *   avgTechnicalFeasibility: number|null,
 *   avgEconomicViability: number|null,
 *   avgCircularityPotential: number|null,
 *   assessmentsByIndustry: Object,
 *   assessmentsByRisk: Object,
 *   assessmentsByScale: Object,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: Error|null,
 *   refetch: Function
 * }}
 */
export default function useAssessmentStats({ enabled = true } = {}) {
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
    staleTime: 5 * 60 * 1000, // 5 minutes - assessment stats change but not too frequently
    cacheTime: 15 * 60 * 1000, // 15 minutes
  });

  // Debug log
  // logger.log('[useAssessmentStats]', { data, topIndustries: data.topIndustries });

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
