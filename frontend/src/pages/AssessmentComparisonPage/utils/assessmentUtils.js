import { categorizeIntegrityGaps } from '@/utils/content';

/**
 * Compute assessment data for display in AssessmentColumn
 * Used by both AssessmentComparisonPage and AssessmentViewPage
 *
 * @param {Object} scoringResult - The scoring result object
 * @returns {Object} Assessment data object with all computed properties
 */
export const computeAssessmentData = (scoringResult) => {
  const overallScore = scoringResult?.overall_score ?? 0;
  const { strengths, gaps } = categorizeIntegrityGaps(scoringResult?.audit?.integrity_gaps);
  const casesSummaries = scoringResult?.audit?.similar_cases_summaries || [];
  const subScoreEntries = Object.entries(scoringResult?.sub_scores || {});
  const topFactor =
    subScoreEntries.length > 0
      ? subScoreEntries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
      : null;
  const focusFactor =
    subScoreEntries.length > 0
      ? subScoreEntries.reduce((worst, curr) => (curr[1] < worst[1] ? curr : worst))
      : null;
  const avgFactorScore =
    subScoreEntries.length > 0
      ? Math.round(subScoreEntries.reduce((sum, [, val]) => sum + val, 0) / subScoreEntries.length)
      : 0;

  // Business viability (exact formula from ResultsPage)
  const computeBusinessViabilityScore = (res) => {
    if (!res) return 0;
    const confidence = res.audit?.confidence_score;
    const normalizedConfidence =
      confidence != null && confidence <= 1
        ? (Number(confidence) || 0) * 100
        : Number(confidence) || 0;
    return Math.round((Number(res.overall_score) || 0) * 0.7 + normalizedConfidence * 0.3);
  };

  const resolvedBusinessViabilityScore = computeBusinessViabilityScore(scoringResult);

  return {
    overallScore,
    strengths,
    gaps,
    casesSummaries,
    topFactor,
    focusFactor,
    avgFactorScore,
    resolvedBusinessViabilityScore,
  };
};
