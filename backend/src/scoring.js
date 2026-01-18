export function calculateScores ({
  recyclability,
  energy_efficiency,
  reuse_cycles,
  lifespan_years
}) {
  const reuseScore = Math.min(reuse_cycles * 10, 100)
  const lifespanScore = Math.min(lifespan_years * 2, 100)

  const overall =
    0.3 * recyclability +
    0.25 * energy_efficiency +
    0.25 * reuseScore +
    0.2 * lifespanScore

  return {
    overall_score: Math.round(overall),
    sub_scores: {
      recyclability,
      energy_efficiency,
      design_for_reuse: reuseScore,
      lifecycle_impact: lifespanScore
    }
  }
}
