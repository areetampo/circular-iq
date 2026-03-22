import { useQuery } from '@tanstack/react-query';

import { getComparisonAssessments } from '@/features/assessments';

export function useAssessmentComparison(id1, id2) {
  // Fetch both assessments using the comparison endpoint with visibility checking
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['comparison', id1, id2],
    queryFn: () => getComparisonAssessments(id1, id2),
    enabled: !!id1 && !!id2,
  });

  // Extract assessment data
  const assessment1 = data?.assessment1 ?? null;
  const assessment2 = data?.assessment2 ?? null;

  // Derive comparison metrics
  const comparisonData = deriveComparison(assessment1, assessment2);

  return {
    assessment1,
    assessment2,
    comparisonData,
    loading: isLoading,
    isLoading,
    error: error?.message || null,
    isError,
    refetch: () => {
      // Refetch would be handled by React Query automatically
    },
  };
}

function deriveComparison(a1, a2) {
  if (!a1?.result_json || !a2?.result_json) {
    return {
      factorDiffs: {},
      overallDiff: 0,
      biggestGain: null,
      biggestDrop: null,
    };
  }

  const sub1 = a1.result_json.sub_scores || {};
  const sub2 = a2.result_json.sub_scores || {};

  const factorDiffs = {};
  const allFactors = new Set([...Object.keys(sub1), ...Object.keys(sub2)]);

  allFactors.forEach((factor) => {
    const score1 = Number(sub1[factor]) || 0;
    const score2 = Number(sub2[factor]) || 0;
    factorDiffs[factor] = score2 - score1;
  });

  const overall1 = Number(a1.result_json.overall_score) || 0;
  const overall2 = Number(a2.result_json.overall_score) || 0;
  const overallDiff = overall2 - overall1;

  let biggestGain = null;
  let biggestDrop = null;

  Object.entries(factorDiffs).forEach(([factor, diff]) => {
    if (!biggestGain || diff > biggestGain.diff) {
      biggestGain = { factor, diff };
    }
    if (!biggestDrop || diff < biggestDrop.diff) {
      biggestDrop = { factor, diff };
    }
  });

  return {
    factorDiffs,
    overallDiff,
    biggestGain,
    biggestDrop,
  };
}
