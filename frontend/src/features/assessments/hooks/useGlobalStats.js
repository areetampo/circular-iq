import { useQuery } from '@tanstack/react-query';

import { getGlobalStats } from '@/features/assessments/api/assessmentApi';

/**
 * Fetches combined global activity stats (log aggregates, market data RPC, assessment stats RPC).
 *
 * @param {{ enabled?: boolean }} [options={}] - Query options.
 * @param {boolean} [options.enabled=true] - Whether to enable the query.
 * @returns {{
 *   logStats: Record<string, unknown>|null,
 *   marketData: Array<Record<string, unknown>>,
 *   assessmentStats: Record<string, unknown>|null,
 *   totalScoringCalls: number|null,
 *   avgScore: number|null,
 *   avgConfidence: number|null,
 *   avgTechFeas: number|null,
 *   avgEconViab: number|null,
 *   avgCircPot: number|null,
 *   avgParamConsistency: number|null,
 *   avgRAlignment: number|null,
 *   scoreDistribution: Record<string, number>,
 *   tierDistribution: Record<string, number>,
 *   riskDistribution: Record<string, number>,
 *   industryDistribution: Array<Record<string, unknown>>,
 *   strategyDistribution: Array<Record<string, unknown>>,
 *   materialDistribution: Array<Record<string, unknown>>,
 *   geoDistribution: Array<Record<string, unknown>>,
 *   scaleDistribution: Array<Record<string, unknown>>,
 *   junkRate: number|null,
 *   weeklyTrend: Array<Record<string, unknown>>,
 *   marketDataByIndustry: Array<Record<string, unknown>>,
 *   totalSavedAssessments: number|null,
 *   assessmentsByTier: Record<string, number>,
 *   assessmentsByRisk: Record<string, number>,
 *   assessmentsByScale: Record<string, number>,
 *   assessmentsByIndustry: Record<string, number>,
 *   isLoading: boolean,
 *   isFetching: boolean,
 *   isError: boolean,
 *   error: string|null,
 *   refetch: import('@tanstack/react-query').UseQueryResult['refetch'],
 *   dataUpdatedAt: number
 * }} Global activity aggregates, loading/error state, and manual refetch handle.
 */
export default function useGlobalStats(options = {}) {
  const { enabled = true } = options;

  const { data, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['global-stats'],
    queryFn: getGlobalStats,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 min - reduced to allow manual refresh
    gcTime: 30 * 60 * 1000, // 30 min
    refetchOnMount: 'stale', // Refetch stale data on mount (after 2 minutes)
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const logStats = data?.log_stats ?? null;
  const marketData = data?.market_data ?? [];
  const assessStats = data?.assessment_stats ?? null;

  return {
    // raw slices
    logStats,
    marketData,
    assessmentStats: assessStats,

    // top-line numbers from scoring_results_log
    totalScoringCalls: logStats?.total_scoring_calls ?? null,
    avgScore: logStats?.avg_score ?? null,
    avgConfidence: logStats?.avg_metrics?.confidence_level ?? null,
    avgTechFeas: logStats?.avg_metrics?.technical_feasibility ?? null,
    avgEconViab: logStats?.avg_metrics?.economic_viability ?? null,
    avgCircPot: logStats?.avg_metrics?.circularity_potential ?? null,
    avgParamConsistency: logStats?.avg_metrics?.parameter_consistency_score ?? null,
    avgRAlignment: logStats?.avg_metrics?.r_strategy_alignment_score ?? null,

    // distributions
    scoreDistribution: logStats?.score_distribution ?? {},
    tierDistribution: logStats?.tier_distribution ?? {},
    riskDistribution: logStats?.risk_distribution ?? {},
    industryDistribution: logStats?.industry_distribution ?? [],
    strategyDistribution: logStats?.strategy_distribution ?? [],
    materialDistribution: logStats?.material_distribution ?? [],
    geoDistribution: logStats?.geo_distribution ?? [],
    scaleDistribution: logStats?.scale_distribution ?? [],
    junkRate: logStats?.junk_rate ?? null,
    weeklyTrend: logStats?.weekly_trend ?? [],

    // market data (contributed assessments)
    marketDataByIndustry: marketData.map((m) => ({
      industry: m.industry,
      count: Number(m.count ?? m.assessment_count ?? 0),
      avgScore: m.avg_score ?? m.avgScore ?? m.average_score ?? null,
      marketShare: m.market_share ?? m.marketShare ?? m.share ?? m.percentage ?? null,
    })),

    // saved assessment stats (global)
    totalSavedAssessments: assessStats?.total_assessments ?? null,
    assessmentsByTier: assessStats?.assessments_by_tier ?? {},
    assessmentsByRisk: assessStats?.assessments_by_risk ?? {},
    assessmentsByScale: assessStats?.assessments_by_scale ?? {},
    assessmentsByIndustry: assessStats?.assessments_by_industry ?? {},

    isLoading,
    isFetching,
    isError,
    error: error?.message ?? null,
    refetch,
    dataUpdatedAt,
  };
}
