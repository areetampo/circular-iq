/**
 * @module assessments.utils
 * @description Helpers for normalising saved assessment records into scoring result shape.
 * Prefer `result_json` when present; otherwise compose from legacy column fields.
 */

/**
 * Reconstructs a scoring result object from a saved assessment row.
 *
 * @param {Object|null} assessment - Assessment record from the API or database.
 * @returns {Object|null} Scoring result shape for results/export UI, or null if no assessment.
 */
export function reconstructScoringResult(assessment) {
  if (!assessment) return null;

  if (assessment.result_json) {
    return assessment.result_json;
  }

  return {
    businessProblem: assessment.business_problem,
    businessSolution: assessment.business_solution,
    evaluation_parameters: assessment.evaluation_parameters,
    business_context: assessment.business_context,

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
    weighted_score_card:
      assessment.weighted_score_card ?? assessment.result_json?.weighted_score_card ?? null,
    circular_economy_tier:
      assessment.circular_economy_tier ?? assessment.result_json?.circular_economy_tier ?? null,
    parameter_consistency:
      assessment.parameter_consistency ?? assessment.result_json?.parameter_consistency ?? null,
    r_strategy_alignment:
      assessment.r_strategy_alignment ?? assessment.result_json?.r_strategy_alignment ?? null,
    context: assessment.context ?? assessment.result_json?.context ?? null,
    metadata: {
      industry: assessment.industry ?? assessment.result_json?.metadata?.industry,
      scale: assessment.scale ?? assessment.result_json?.metadata?.scale,
      r_strategy: assessment.r_strategy ?? assessment.result_json?.metadata?.r_strategy,
      primary_material:
        assessment.primary_material ?? assessment.result_json?.metadata?.primary_material,
      geographic_focus:
        assessment.geographic_focus ?? assessment.result_json?.metadata?.geographic_focus,
      ...assessment.metadata,
    },
    processing_info: {},
  };
}
