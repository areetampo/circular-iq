const WEIGHTS = {
  public_participation: 0.15,
  infrastructure: 0.15,
  market_price: 0.20,
  maintenance: 0.10,
  uniqueness: 0.10,
  size_efficiency: 0.10,
  chemical_safety: 0.10,
  tech_readiness: 0.10,
};

function validateWeights() {
  const sum = Object.values(WEIGHTS).reduce((acc, w) => acc + w, 0);
  if (Math.abs(sum - 1.0) > 0.0001) {
    throw new Error(`Weight validation failed: sum = ${sum}, expected 1.0`);
  }
}

validateWeights();

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

  const overall_score = Object.keys(WEIGHTS).reduce((sum, key) => {
    return sum + (values[key] * WEIGHTS[key]);
  }, 0);

  return {
    overall_score: Math.round(overall_score),
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
