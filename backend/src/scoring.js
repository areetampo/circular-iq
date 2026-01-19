export function calculateScores({
  public_participation,
  infrastructure,
  market_price,
  maintenance,
  uniqueness,
  size_efficiency,
  chemical_safety,
  tech_readiness,
}) {
  // Ensure all values are numbers and within valid range (0-100)
  const values = {
    public_participation: Math.max(0, Math.min(100, Number(public_participation) || 0)),
    infrastructure: Math.max(0, Math.min(100, Number(infrastructure) || 0)),
    market_price: Math.max(0, Math.min(100, Number(market_price) || 0)),
    maintenance: Math.max(0, Math.min(100, Number(maintenance) || 0)),
    uniqueness: Math.max(0, Math.min(100, Number(uniqueness) || 0)),
    size_efficiency: Math.max(0, Math.min(100, Number(size_efficiency) || 0)),
    chemical_safety: Math.max(0, Math.min(100, Number(chemical_safety) || 0)),
    tech_readiness: Math.max(0, Math.min(100, Number(tech_readiness) || 0)),
  };

  // Calculate overall score with equal weighting for all 8 factors
  const overall =
    (values.public_participation +
      values.infrastructure +
      values.market_price +
      values.maintenance +
      values.uniqueness +
      values.size_efficiency +
      values.chemical_safety +
      values.tech_readiness) /
    8;

  return {
    overall_score: Math.round(overall),
    sub_scores: {
      public_participation: values.public_participation,
      infrastructure: values.infrastructure,
      market_price: values.market_price,
      maintenance: values.maintenance,
      uniqueness: values.uniqueness,
      size_efficiency: values.size_efficiency,
      chemical_safety: values.chemical_safety,
      tech_readiness: values.tech_readiness,
    },
  };
}
