/**
 * Scoring System - Deterministic 8-Factor Circular Economy Evaluation
 *
 * All scores are computed deterministically by code.
 * No LLM involvement in numeric calculations - only qualitative explanations.
 */

/**
 * Calculate circular economy business scores using the 8-factor framework
 *
 * @param {Object} parameters - User-provided scores for 8 factors (0-100 each)
 * @returns {Object} Overall score and breakdown of all sub-scores
 */
export function calculateScores(parameters) {
  // Define the 8 evaluation factors with their weights
  const weights = {
    public_participation: 0.15, // Access Value - Social
    infrastructure: 0.15, // Access Value - Operational
    market_price: 0.2, // Embedded Value - Economic
    maintenance: 0.1, // Embedded Value - Material
    uniqueness: 0.1, // Embedded Value - Innovation
    size_efficiency: 0.1, // Processing Value - Technical
    chemical_safety: 0.1, // Processing Value - Safety
    tech_readiness: 0.1, // Processing Value - Implementation
  };

  // Validate input parameters
  const validatedParams = validateParameters(parameters, weights);

  // Calculate weighted overall score
  const overall_score = Object.keys(weights).reduce((sum, key) => {
    return sum + validatedParams[key] * weights[key];
  }, 0);

  // Determine confidence level based on score distribution
  const confidence = calculateConfidenceLevel(validatedParams);

  return {
    overall_score: Math.round(overall_score),
    confidence_level: confidence,
    sub_scores: validatedParams,
    weights: weights,
    score_breakdown: generateScoreBreakdown(validatedParams, weights),
  };
}

/**
 * Validate and normalize input parameters
 * @private
 */
function validateParameters(parameters, weights) {
  const validated = {};

  for (const key of Object.keys(weights)) {
    let value = parameters[key];

    // Ensure value is a number
    if (typeof value !== 'number') {
      value = 0;
    }

    // Clamp to 0-100 range
    value = Math.max(0, Math.min(100, value));

    validated[key] = value;
  }

  return validated;
}

/**
 * Calculate confidence level based on score distribution
 * High variance or extreme scores = lower confidence
 * @private
 */
function calculateConfidenceLevel(scores) {
  const values = Object.values(scores);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate variance
  const variance =
    values.reduce((sum, val) => {
      return sum + Math.pow(val - mean, 2);
    }, 0) / values.length;

  const stdDev = Math.sqrt(variance);

  // High standard deviation = less confident in the score
  // (Indicates inconsistent or cherry-picked metrics)
  let confidence = 100 - stdDev * 0.5; // Scale std dev to 0-50 range
  confidence = Math.max(30, Math.min(100, confidence)); // Clamp to 30-100

  return Math.round(confidence);
}

/**
 * Generate detailed breakdown of score calculation
 * @private
 */
function generateScoreBreakdown(scores, weights) {
  const categories = {
    'Access Value (Social & Participation)': {
      factors: ['public_participation', 'infrastructure'],
      description: 'How easily can stakeholders engage with the system?',
    },
    'Embedded Value (Economic & Material)': {
      factors: ['market_price', 'maintenance', 'uniqueness'],
      description: 'What is the economic and material value created?',
    },
    'Processing Value (Technical & Operational)': {
      factors: ['size_efficiency', 'chemical_safety', 'tech_readiness'],
      description: 'How technically feasible and safe is implementation?',
    },
  };

  const breakdown = {};

  for (const [category, data] of Object.entries(categories)) {
    let categorySum = 0;
    let categoryWeight = 0;

    for (const factor of data.factors) {
      categorySum += scores[factor] * weights[factor];
      categoryWeight += weights[factor];
    }

    breakdown[category] = {
      score: Math.round(categorySum / categoryWeight),
      weight: (categoryWeight * 100).toFixed(0) + '%',
      description: data.description,
      factors: data.factors.map((f) => ({
        name: formatFactorName(f),
        score: scores[f],
        weight: weights[f],
      })),
    };
  }

  return breakdown;
}

/**
 * Format factor name from snake_case to Title Case
 * @private
 */
function formatFactorName(factor) {
  return factor
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get color coding for score ranges
 * @param {number} score - Score from 0-100
 * @returns {string} Color code and classification
 */
export function getScoreColor(score) {
  if (score >= 75) return { color: '#34a83a', label: 'Strong' };
  if (score >= 50) return { color: '#4a90e2', label: 'Moderate' };
  if (score >= 25) return { color: '#ff9800', label: 'Weak' };
  return { color: '#d32f2f', label: 'Critical' };
}

/**
 * Generate score comparison with database benchmarks
 * Used for comparative analysis
 * @param {Object} userScores - User's sub_scores
 * @param {Array} databaseCases - Similar cases from database
 * @returns {Object} Comparison insights
 */
export function compareWithDatabase(userScores, databaseCases) {
  if (!databaseCases || databaseCases.length === 0) {
    return { error: 'No database cases available for comparison' };
  }

  // Extract scores from database cases (if available in metadata)
  const dbScores = databaseCases
    .filter((c) => c.metadata && c.metadata.scores)
    .map((c) => c.metadata.scores);

  if (dbScores.length === 0) {
    return { error: 'Database cases do not contain score data' };
  }

  // Calculate average scores from database
  const avgDbScores = {};
  const factors = Object.keys(userScores);

  for (const factor of factors) {
    const values = dbScores.map((s) => s[factor]).filter((v) => typeof v === 'number');

    if (values.length > 0) {
      avgDbScores[factor] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  // Calculate variance from database
  const comparison = {};
  for (const factor of factors) {
    if (avgDbScores[factor] !== undefined) {
      const variance = userScores[factor] - avgDbScores[factor];
      comparison[factor] = {
        userScore: userScores[factor],
        dbAverage: Math.round(avgDbScores[factor]),
        variance: Math.round(variance),
        isOverestimated: variance > 15,
        isUnderestimated: variance < -15,
        isRealistic: Math.abs(variance) <= 15,
      };
    }
  }

  return comparison;
}

/**
 * Identify integrity gaps based on scoring inconsistencies
 * @param {Object} userScores - User's sub_scores
 * @returns {Array} Array of potential integrity issues
 */
export function identifyIntegrityGaps(userScores) {
  const gaps = [];

  // Gap 1: High market price but low tech readiness
  if (userScores.market_price > 70 && userScores.tech_readiness < 40) {
    gaps.push({
      issue:
        'High market value claimed but low technology maturity - may indicate unrealistic market assumptions or unproven technology.',
      severity: 'medium',
    });
  }

  // Gap 2: High uniqueness but low maintenance
  if (userScores.uniqueness > 75 && userScores.maintenance < 35) {
    gaps.push({
      issue:
        'Unique materials claimed but very difficult to maintain - may indicate conflict between innovation and practicality.',
      severity: 'medium',
    });
  }

  // Gap 3: High participation but low infrastructure
  if (userScores.public_participation > 75 && userScores.infrastructure < 40) {
    gaps.push({
      issue:
        'High community participation expected but low infrastructure support - participation barriers likely exist.',
      severity: 'high',
    });
  }

  // Gap 4: Extremely high chemical safety with hazardous materials
  if (userScores.chemical_safety > 85 && userScores.market_price < 20) {
    gaps.push({
      issue:
        'Very high chemical safety score contradicts low market value - suggest either waste or low-value materials.',
      severity: 'low',
    });
  }

  // Gap 5: All scores suspiciously uniform (within 5 points)
  const scores = Object.values(userScores);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  if (max - min < 5 && scores.every((s) => s > 60)) {
    gaps.push({
      issue:
        'All scores are suspiciously uniform and high - suggest cherry-picked or unvalidated self-assessment.',
      severity: 'high',
    });
  }

  return gaps;
}

/**
 * Generate detailed score explanation for user understanding
 * @param {Object} scores - Sub-scores object
 * @returns {Object} Detailed explanations for each factor
 */
export function generateScoreExplanations(scores) {
  return {
    public_participation: {
      score: scores.public_participation,
      interpretation:
        scores.public_participation >= 75
          ? 'Excellent - broad stakeholder participation expected'
          : scores.public_participation >= 50
            ? 'Moderate - some barriers to participation exist'
            : 'Limited - participation restricted to specific groups',
      benchmark:
        'Municipal composting programs: 80-90 | Take-back schemes: 40-60 | B2B partnerships: 10-30',
    },
    infrastructure: {
      score: scores.infrastructure,
      interpretation:
        scores.infrastructure >= 75
          ? 'Strong existing infrastructure can support this'
          : scores.infrastructure >= 50
            ? 'Moderate infrastructure available, some gaps'
            : 'Limited infrastructure - significant investment needed',
      benchmark:
        'Urban areas with collection systems: 70-85 | Rural areas: 30-50 | Developing regions: 10-30',
    },
    market_price: {
      score: scores.market_price,
      interpretation:
        scores.market_price >= 75
          ? 'Strong market demand and high recovery value'
          : scores.market_price >= 50
            ? 'Moderate market value, viable economics'
            : 'Low market value - requires subsidies or policy support',
      benchmark: 'Aluminum recycling: 85-95 | Plastic recycling: 40-60 | Textile waste: 20-40',
    },
    maintenance: {
      score: scores.maintenance,
      interpretation:
        scores.maintenance >= 75
          ? 'Very easy to maintain, low operational cost'
          : scores.maintenance >= 50
            ? 'Moderate maintenance required'
            : 'High maintenance demands, complex operations',
      benchmark:
        'Simple collection systems: 80-90 | Processing facilities: 40-60 | R&D-heavy: 10-30',
    },
    uniqueness: {
      score: scores.uniqueness,
      interpretation:
        scores.uniqueness >= 75
          ? 'Highly innovative with strong competitive advantage'
          : scores.uniqueness >= 50
            ? 'Some innovation, differentiated approach'
            : 'Conventional approach, limited competitive advantage',
      benchmark:
        'Breakthrough technology: 80-95 | Established methods: 30-50 | Commodity recycling: 5-20',
    },
    size_efficiency: {
      score: scores.size_efficiency,
      interpretation:
        scores.size_efficiency >= 75
          ? 'Highly space-efficient, minimal footprint'
          : scores.size_efficiency >= 50
            ? 'Moderate space requirements'
            : 'Significant space and resources needed',
      benchmark: 'Digital platforms: 90-98 | Compact facilities: 60-75 | Large warehouses: 20-40',
    },
    chemical_safety: {
      score: scores.chemical_safety,
      interpretation:
        scores.chemical_safety >= 75
          ? 'Minimal environmental/health risks'
          : scores.chemical_safety >= 50
            ? 'Manageable risks with proper controls'
            : 'Significant hazards - strict protocols required',
      benchmark:
        'Inert material processing: 85-95 | Standard recycling: 50-70 | Hazardous waste: 20-40',
    },
    tech_readiness: {
      score: scores.tech_readiness,
      interpretation:
        scores.tech_readiness >= 75
          ? 'Proven technology, ready for deployment'
          : scores.tech_readiness >= 50
            ? 'Technology exists but needs adaptation'
            : 'Emerging technology, significant R&D needed',
      benchmark: 'Established processes: 80-95 | Pilot stage: 40-60 | Lab stage: 10-30',
    },
  };
}
