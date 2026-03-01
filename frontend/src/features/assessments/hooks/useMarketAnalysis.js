import { useQuery } from '@tanstack/react-query';
import {
  getMarketAnalysis,
  getAssessmentById,
  getMarketAnalysisPublic,
  getPublicAssessment,
} from '@/features/assessments';
import { getIndustry } from '@/lib/metadata';

/**
 * Hook for fetching market analysis data
 * @param {Object} options
 * @param {string} options.assessmentId - Optional assessment ID to fetch user data
 * @param {boolean} options.enabled - Whether to enable the query (e.g., when modal is open)
 * @returns {Object} Market analysis data and states
 */
export function useMarketAnalysis({ assessmentId, publicId, enabled = true } = {}) {
  // Query for market analysis data
  const marketQuery = useQuery({
    queryKey: ['market-analysis', assessmentId || publicId],
    queryFn: async () => {
      const data = publicId
        ? await getMarketAnalysisPublic(publicId)
        : await getMarketAnalysis(assessmentId);
      return {
        marketData: data.market_data || [],
        stats: data.stats || null,
      };
    },
    enabled,
  });

  // Query for assessment data if assessmentId is provided
  const assessmentQuery = useQuery({
    queryKey: ['assessment', assessmentId || publicId],
    queryFn: () => (publicId ? getPublicAssessment(publicId) : getAssessmentById(assessmentId)),
    enabled: enabled && !!(assessmentId || publicId),
  });

  // Extract user score and industry from assessment
  const assessment =
    assessmentQuery.data?.assessment?.result_json || assessmentQuery.data?.assessment;
  const userScore = assessment?.overall_score || null;
  let userIndustry = null;
  try {
    userIndustry = getIndustry(assessment) || null;
  } catch (e) {
    userIndustry = assessment?.industry || assessment?.metadata?.industry || null;
  }

  return {
    marketData: marketQuery.data?.marketData || [],
    stats: marketQuery.data?.stats || null,
    userScore,
    userIndustry: marketQuery.data?.userIndustry || userIndustry,
    userPercentile: marketQuery.data?.user_percentile ?? null,
    industryBenchmark: marketQuery.data?.industry_benchmark || null,
    strategyBreakdown: marketQuery.data?.strategy_breakdown || [],
    isLoading: marketQuery.isLoading || (assessmentId ? assessmentQuery.isLoading : false),
    isError: marketQuery.isError || assessmentQuery.isError,
    error: marketQuery.error?.message || assessmentQuery.error?.message || null,
    refetch: marketQuery.refetch,
  };
}
