import { useQueries } from '@tanstack/react-query';
import { getAssessmentById } from '@/features/assessments';

export default function useAssessmentComparison(id1, id2) {
  // Fetch both assessments in parallel using useQueries
  const queries = useQueries({
    queries: [
      {
        queryKey: ['assessment', id1],
        queryFn: () => getAssessmentById(id1),
        enabled: !!id1,
      },
      {
        queryKey: ['assessment', id2],
        queryFn: () => getAssessmentById(id2),
        enabled: !!id2,
      },
    ],
  });

  const [query1, query2] = queries;

  // Extract assessment data
  const assessment1 = query1.data?.assessment ?? query1.data ?? null;
  const assessment2 = query2.data?.assessment ?? query2.data ?? null;

  // Determine loading and error states
  const isLoading = query1.isLoading || query2.isLoading;
  const isError = query1.isError || query2.isError;
  const error = query1.error?.message || query2.error?.message || null;

  // Derive comparison metrics
  const comparisonData = deriveComparison(assessment1, assessment2);

  return {
    assessment1,
    assessment2,
    comparisonData,
    loading: isLoading,
    isLoading,
    error,
    isError,
    refetch: () => {
      query1.refetch();
      query2.refetch();
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
