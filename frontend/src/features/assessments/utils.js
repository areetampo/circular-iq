export function getAverageScore(item) {
  return (
    (typeof item.averageScore === 'number' && item.averageScore) ||
    (typeof item.average_score === 'number' && item.average_score) ||
    0
  );
}

export function sortByAverageScoreDesc(a, b) {
  return getAverageScore(b) - getAverageScore(a);
}

/**
 * Reconstruct the full scoring API response shape from a saved assessment row
 * @param {Object} assessment - Assessment row from database
 * @returns {Object} Full scoring API response shape
 */
export function reconstructScoringResult(assessment) {
  if (!assessment) return null;

  // If result_json exists, use it directly (preferred)
  if (assessment.result_json) {
    return assessment.result_json;
  }

  // Fallback: compose from individual columns
  return {
    businessProblem: assessment.business_problem,
    businessSolution: assessment.business_solution,
    parameters: assessment.input_parameters,
    input_parameters: assessment.input_parameters,

    overall_score: assessment.overall_score,
    confidence_level: assessment.confidence_level,

    sub_scores: assessment.sub_scores,
    derived_metrics: {
      technical_feasibility: assessment.technical_feasibility,
      economic_viability: assessment.economic_viability,
      circularity_potential: assessment.circularity_potential,
      risk_level: assessment.risk_level,
    },
    score_breakdown: assessment.score_breakdown,
    audit: assessment.audit,
    gap_analysis: assessment.gap_analysis,
    similar_cases: assessment.similar_cases,
    metadata: {
      industry: assessment.industry,
      scale: assessment.scale,
      r_strategy: assessment.r_strategy,
      primary_material: assessment.primary_material,
      geographic_focus: assessment.geographic_focus,
      ...assessment.metadata,
    },
    processing_info: {
      // Not stored, so omit or use defaults
    },
  };
}

export function sortByAverageScoreAsc(a, b) {
  return getAverageScore(a) - getAverageScore(b);
}
