/**
 * Shared derivations for the values consumed by assessment detail and comparison columns.
 */

import { categorizeIntegrityGaps } from '@/utils/content';

/**
 * Derives display-ready score, gap, case, factor, and viability values from a scoring result.
 * Business viability mirrors the ResultsPage formula: 70% overall score plus 30% audit confidence.
 *
 * @param {Record<string, unknown>|null|undefined} scoringResult - Scoring result payload containing overall score, sub-scores, audit data, and similar-case summaries.
 * @returns {{ overallScore: number, strengths: Array<unknown>, gaps: Array<unknown>, casesSummaries: Array<unknown>, topFactor: [string, number]|null, focusFactor: [string, number]|null, resolvedBusinessViabilityScore: number }} Values passed into results cards, with missing scores defaulted to zero and absent factors represented as null.
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
  // Match ResultsPage weighting so standalone and comparison views show the same viability score.
  const computeBusinessViabilityScore = (res) => {
    if (!res) return 0;
    const confidence = res.audit?.confidence_score;
    const normalizedConfidence =
      confidence !== null && confidence <= 1
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
    resolvedBusinessViabilityScore,
  };
};
