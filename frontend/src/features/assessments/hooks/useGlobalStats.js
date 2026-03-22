import { useQuery } from '@tanstack/react-query';

import { getGlobalStats } from '@/features/assessments/api/assessmentApi';

/**
 * Hook for the global dashboard stats endpoint.
 * Single cached call combining:
 *   - scoring_results_log aggregates (all calls, widest coverage)
 *   - get_market_data RPC (contributed assessments benchmark data)
 *   - get_assessment_statistics RPC (saved assessments global stats)
 */
export function useGlobalStats({ enabled = true } = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['global-stats'],
    queryFn: getGlobalStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000, // 30 min
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
    totalScoringCalls: logStats?.total_scoring_calls ?? 0,
    avgScore: logStats?.avg_score ?? 0,
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
    junkRate: logStats?.junk_rate ?? 0,
    weeklyTrend: logStats?.weekly_trend ?? [],

    // market data (contributed assessments)
    marketDataByIndustry: marketData,

    // saved assessment stats (global)
    totalSavedAssessments: assessStats?.total_assessments ?? 0,
    assessmentsByTier: assessStats?.assessments_by_tier ?? {},
    assessmentsByRisk: assessStats?.assessments_by_risk ?? {},
    assessmentsByScale: assessStats?.assessments_by_scale ?? {},
    assessmentsByIndustry: assessStats?.assessments_by_industry ?? {},

    isLoading,
    isError,
    error: error?.message ?? null,
    refetch,
  };
}
