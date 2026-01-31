import { useEffect, useState } from 'react';
import { getAssessmentById } from '@/features/assessments';

export default function useAssessmentComparison(id1, id2) {
  const [assessment1, setAssessment1] = useState(null);
  const [assessment2, setAssessment2] = useState(null);
  const [comparisonData, setComparisonData] = useState({
    factorDiffs: {},
    overallDiff: 0,
    biggestGain: null,
    biggestDrop: null,
  });
  const [loading, setLoading] = useState(!!id1 && !!id2);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id1 || !id2) {
      setAssessment1(null);
      setAssessment2(null);
      setComparisonData({
        factorDiffs: {},
        overallDiff: 0,
        biggestGain: null,
        biggestDrop: null,
      });
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchAssessments = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both assessments in parallel
        const [result1, result2] = await Promise.all([
          getAssessmentById(id1),
          getAssessmentById(id2),
        ]);

        // Extract assessment data (handle both direct and wrapped responses)
        const a1 = result1.assessment || result1;
        const a2 = result2.assessment || result2;

        if (!isActive) return;
        setAssessment1(a1);
        setAssessment2(a2);

        // Derive comparison metrics
        const comparison = deriveComparison(a1, a2);
        setComparisonData(
          comparison ?? {
            factorDiffs: {},
            overallDiff: 0,
            biggestGain: null,
            biggestDrop: null,
          },
        );
      } catch (err) {
        setError(err?.message || 'Failed to compare assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();

    return () => {
      isActive = false;
    };
  }, [id1, id2]);

  return {
    assessment1,
    assessment2,
    comparisonData,
    loading,
    error,
  };
}

function deriveComparison(a1, a2) {
  if (!a1?.result_json || !a2?.result_json) return null;

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
