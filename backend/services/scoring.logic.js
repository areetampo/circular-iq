/**
 * @module scoring.logic
 * @description Deterministic scoring logic for circular economy evaluation.
 * Computes scores using an 8-factor framework without LLM involvement in numeric calculations.
 * Provides functions for score calculation, tier classification, parameter consistency,
 * R-strategy alignment, integrity gap identification, and vector search result deduplication.
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

  const weightedScoreCard = generateWeightedScoreCard(validatedParams, weights);
  const circularEconomyTier = classifyCircularEconomyTier(Math.round(overall_score));
  const parameterConsistency = calculateParameterConsistency(validatedParams);

  const technical_feasibility = Math.round(
    validatedParams.tech_readiness * 0.4 +
      validatedParams.size_efficiency * 0.3 +
      validatedParams.chemical_safety * 0.3,
  );

  const economic_viability = Math.round(
    validatedParams.market_price * 0.5 +
      validatedParams.maintenance * 0.3 +
      validatedParams.uniqueness * 0.2,
  );

  const circularity_potential = Math.round(
    validatedParams.public_participation * 0.2 +
      validatedParams.infrastructure * 0.2 +
      validatedParams.market_price * 0.2 +
      validatedParams.maintenance * 0.1 +
      validatedParams.uniqueness * 0.1 +
      validatedParams.size_efficiency * 0.1 +
      validatedParams.chemical_safety * 0.05 +
      validatedParams.tech_readiness * 0.05,
  );

  const risk_level = (() => {
    const critical = ['tech_readiness', 'market_price', 'chemical_safety'];
    const lowCount = critical.filter((k) => validatedParams[k] < 30).length;
    if (lowCount >= 2) return 'high';
    if (lowCount === 1 || validatedParams.tech_readiness < 50) return 'medium';
    return 'low';
  })();

  const derived_metrics = {
    technical_feasibility,
    economic_viability,
    circularity_potential,
    risk_level,
  };

  return {
    overall_score: Math.round(overall_score),
    confidence_level: confidence,
    sub_scores: validatedParams,
    derived_metrics,
    weights: weights,
    score_breakdown: generateScoreBreakdown(validatedParams, weights),
    // NEW FIELDS
    weighted_score_card: weightedScoreCard,
    circular_economy_tier: circularEconomyTier,
    parameter_consistency: parameterConsistency,
  };
}

/**
 * Generate a weighted score card showing each factor's contribution
 * to the overall score.
 * @param {Object} validatedParams - Clamped 0-100 sub_scores
 * @param {Object} weights - Factor weights
 * @returns {Object} Score card with per-factor contribution breakdown
 */
export function generateWeightedScoreCard(validatedParams, weights) {
  const factors = Object.keys(weights);
  const entries = {};

  let totalContribution = 0;

  factors.forEach((key) => {
    const raw = validatedParams[key];
    const weight = weights[key];
    const contribution = Math.round(raw * weight * 100) / 100; // 2 dp
    totalContribution += contribution;

    // Classify each factor
    let classification;
    if (raw >= 75) classification = 'Strong';
    else if (raw >= 50) classification = 'Moderate';
    else if (raw >= 25) classification = 'Weak';
    else classification = 'Critical';

    entries[key] = {
      raw_score: raw,
      weight: weight,
      weight_percent: `${Math.round(weight * 100)}%`,
      contribution: Math.round(contribution * 100) / 100,
      contribution_percent: `${Math.round((contribution / 100) * 100)}%`,
      classification,
    };
  });

  // Sort factors by contribution descending for easy reading
  const ranked = Object.entries(entries)
    .sort(([, a], [, b]) => b.contribution - a.contribution)
    .map(([key], rank) => ({ key, rank: rank + 1 }));

  ranked.forEach(({ key, rank }) => {
    entries[key].rank = rank;
  });

  return {
    factors: entries,
    total: Math.round(totalContribution),
    top_contributor: ranked[0]?.key || null,
    bottom_contributor: ranked[ranked.length - 1]?.key || null,
  };
}

/**
 * Classify overall score into a named circular economy tier.
 * @param {number} overallScore - 0-100
 * @returns {Object} Tier classification with description and next milestone
 */
export function classifyCircularEconomyTier(overallScore) {
  if (overallScore >= 76) {
    return {
      tier: 'Leader',
      range: '76–100',
      badge_color: 'green',
      description:
        'This solution demonstrates strong circular economy principles with viable economics ' +
        'and proven technical feasibility. Ready for scale or already operating at meaningful volume.',
      next_milestone:
        'Focus on maximising impact through replication, partnerships, and policy engagement. ' +
        'Consider publishing case studies to advance industry benchmarks.',
      percentile_estimate: 'Top 15% of assessed solutions',
    };
  }
  if (overallScore >= 61) {
    return {
      tier: 'Established',
      range: '61–75',
      badge_color: 'blue',
      description:
        'A well-developed circular solution with solid fundamentals. Most dimensions are performing ' +
        'adequately but 1–2 areas are limiting full potential.',
      next_milestone:
        'Identify the 1–2 lowest-scoring factors and allocate focused resources there. ' +
        'A targeted improvement in your weakest dimension can unlock the next tier.',
      percentile_estimate: 'Top 35% of assessed solutions',
    };
  }
  if (overallScore >= 41) {
    return {
      tier: 'Developing',
      range: '41–60',
      badge_color: 'amber',
      description:
        'The solution shows genuine circular economy intent but faces significant barriers in ' +
        'multiple dimensions. Viable with the right investment and partnerships.',
      next_milestone:
        'Prioritise market validation and at least one supply chain partnership. ' +
        'Consider a pilot programme to de-risk before full deployment.',
      percentile_estimate: 'Middle 30% of assessed solutions',
    };
  }
  return {
    tier: 'Emerging',
    range: '0–40',
    badge_color: 'red',
    description:
      'Early-stage or concept-level solution. Core circular economy mechanisms are not yet ' +
      'sufficiently developed for commercial viability without substantial improvement.',
    next_milestone:
      'Focus on validating the core hypothesis: is there real market demand and a feasible ' +
      'collection / processing pathway? Start with the two highest-weight factors: ' +
      'market_price and infrastructure.',
    percentile_estimate: 'Bottom 20% of assessed solutions',
  };
}

/**
 * Score the internal consistency of the 8 parameters.
 * Detects known contradictory patterns (from identifyIntegrityGaps logic)
 * and penalises implausible combinations.
 * Returns 0-100 where 100 = perfectly consistent, 0 = highly contradictory.
 *
 * @param {Object} params - Validated sub_scores
 * @returns {Object} Consistency analysis
 */
export function calculateParameterConsistency(params) {
  const penalties = [];
  let totalPenalty = 0;

  // Each rule: condition → penalty (0-25) + explanation
  const rules = [
    {
      condition: params.market_price > 70 && params.tech_readiness < 40,
      penalty: 20,
      issue: 'High market value claimed but technology is not mature enough to capture it.',
      factors: ['market_price', 'tech_readiness'],
    },
    {
      condition: params.uniqueness > 75 && params.maintenance < 35,
      penalty: 15,
      issue: 'Highly innovative materials typically require higher maintenance, not lower.',
      factors: ['uniqueness', 'maintenance'],
    },
    {
      condition: params.public_participation > 75 && params.infrastructure < 40,
      penalty: 20,
      issue: 'High community participation is difficult without adequate infrastructure.',
      factors: ['public_participation', 'infrastructure'],
    },
    {
      condition: params.chemical_safety > 85 && params.market_price < 20,
      penalty: 10,
      issue: 'Extremely safe materials with near-zero market value is an unusual combination.',
      factors: ['chemical_safety', 'market_price'],
    },
    {
      condition: params.tech_readiness > 80 && params.size_efficiency < 20,
      penalty: 12,
      issue: 'Mature technology solutions typically have optimised footprints.',
      factors: ['tech_readiness', 'size_efficiency'],
    },
    {
      condition: params.market_price > 80 && params.infrastructure < 25,
      penalty: 18,
      issue: 'High-value recovered materials require adequate infrastructure to reach the market.',
      factors: ['market_price', 'infrastructure'],
    },
    {
      // Suspiciously uniform high scores
      condition: (() => {
        const values = Object.values(params);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return max - min < 8 && values.every((v) => v > 65);
      })(),
      penalty: 25,
      issue:
        'All scores are suspiciously uniform and high. Real-world solutions always have ' +
        'relative weaknesses. Consider calibrating more carefully.',
      factors: Object.keys(params),
    },
  ];

  rules.forEach((rule) => {
    if (rule.condition) {
      totalPenalty += rule.penalty;
      penalties.push({ issue: rule.issue, penalty: rule.penalty, factors: rule.factors });
    }
  });

  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  let rating;
  if (score >= 85) rating = 'High';
  else if (score >= 65) rating = 'Moderate';
  else if (score >= 40) rating = 'Low';
  else rating = 'Very Low';

  return {
    score,
    rating,
    penalty_total: totalPenalty,
    issues_found: penalties.length,
    issues: penalties,
    interpretation:
      score >= 85
        ? 'Parameter choices are internally coherent and plausible.'
        : score >= 65
          ? 'Minor inconsistencies detected. Review flagged factor combinations.'
          : 'Significant inconsistencies detected. Scores may be overestimated in key areas.',
  };
}

/**
 * Score how well the 8 factor scores align with the detected R-strategy.
 * Each strategy has a different ideal factor profile based on CE theory.
 *
 * @param {Object} params - Validated sub_scores
 * @param {string} rStrategy - Detected R-strategy from metadata (e.g. 'Recycle')
 * @returns {Object} Alignment analysis
 */
export function calculateRStrategyAlignment(params, rStrategy) {
  // Ideal factor importance weights per R-strategy
  // Values indicate how critical each factor is for this strategy (0-1)
  const strategyProfiles = {
    Refuse: {
      public_participation: 0.9, // needs broad behaviour change
      market_price: 0.7, // substitute must be economically viable
      uniqueness: 0.8, // differentiation is key
      tech_readiness: 0.6,
      infrastructure: 0.5,
      maintenance: 0.5,
      size_efficiency: 0.4,
      chemical_safety: 0.5,
    },
    Reduce: {
      tech_readiness: 0.8, // efficiency technology
      market_price: 0.7,
      size_efficiency: 0.8, // physical reduction matters
      maintenance: 0.6,
      uniqueness: 0.6,
      public_participation: 0.5,
      infrastructure: 0.4,
      chemical_safety: 0.5,
    },
    Reuse: {
      infrastructure: 0.9, // collection/return logistics critical
      public_participation: 0.9, // consumer behaviour change
      maintenance: 0.8, // product must survive multiple uses
      market_price: 0.6,
      tech_readiness: 0.5,
      uniqueness: 0.5,
      size_efficiency: 0.6,
      chemical_safety: 0.6,
    },
    Repair: {
      tech_readiness: 0.7,
      maintenance: 0.9, // repairability is core
      public_participation: 0.8,
      infrastructure: 0.7,
      market_price: 0.6,
      uniqueness: 0.5,
      size_efficiency: 0.4,
      chemical_safety: 0.5,
    },
    Refurbish: {
      tech_readiness: 0.8,
      maintenance: 0.8,
      market_price: 0.7,
      infrastructure: 0.7,
      size_efficiency: 0.5,
      uniqueness: 0.6,
      public_participation: 0.5,
      chemical_safety: 0.6,
    },
    Remanufacture: {
      tech_readiness: 0.9, // high-tech disassembly and reassembly
      maintenance: 0.9,
      size_efficiency: 0.7,
      market_price: 0.8,
      infrastructure: 0.8,
      chemical_safety: 0.7,
      uniqueness: 0.6,
      public_participation: 0.4,
    },
    Repurpose: {
      uniqueness: 0.8, // creative value creation
      market_price: 0.7,
      tech_readiness: 0.6,
      public_participation: 0.6,
      maintenance: 0.5,
      infrastructure: 0.5,
      size_efficiency: 0.5,
      chemical_safety: 0.5,
    },
    Recycle: {
      infrastructure: 0.9, // collection and processing network
      market_price: 0.9, // commodity value drives economics
      chemical_safety: 0.8, // processing safety
      tech_readiness: 0.7,
      size_efficiency: 0.6,
      maintenance: 0.5,
      public_participation: 0.6,
      uniqueness: 0.3,
    },
    Recover: {
      tech_readiness: 0.8,
      chemical_safety: 0.9, // energy/material recovery safety
      infrastructure: 0.8,
      market_price: 0.6,
      size_efficiency: 0.7,
      maintenance: 0.6,
      public_participation: 0.4,
      uniqueness: 0.3,
    },
  };

  // Normalise strategy name (LLM may return lowercase or with spaces)
  const normalised = Object.keys(strategyProfiles).find(
    (k) => k.toLowerCase() === (rStrategy || '').toLowerCase().trim(),
  );

  if (!normalised) {
    return {
      strategy: rStrategy || 'Unknown',
      alignment_score: null,
      rating: 'Unknown',
      message: 'Strategy not recognised — cannot compute alignment.',
      critical_factors: [],
      misaligned_factors: [],
    };
  }

  const profile = strategyProfiles[normalised];

  // For each critical factor (importance > 0.7), check if score is adequate
  const criticalFactors = Object.entries(profile)
    .filter(([, importance]) => importance >= 0.7)
    .map(([key]) => key);

  const misalignedFactors = criticalFactors.filter((key) => params[key] < 50);
  const wellAlignedFactors = criticalFactors.filter((key) => params[key] >= 70);

  // Weighted alignment score: for each factor, score = param_value * importance
  // Normalise to 0-100
  let weightedSum = 0;
  let importanceSum = 0;
  Object.entries(profile).forEach(([key, importance]) => {
    weightedSum += (params[key] / 100) * importance;
    importanceSum += importance;
  });

  const alignmentScore = Math.round((weightedSum / importanceSum) * 100);

  let rating;
  if (alignmentScore >= 75) rating = 'Strong Alignment';
  else if (alignmentScore >= 55) rating = 'Moderate Alignment';
  else if (alignmentScore >= 35) rating = 'Weak Alignment';
  else rating = 'Poor Alignment';

  const message =
    alignmentScore >= 75
      ? `Your factor scores strongly support a ${normalised} strategy.`
      : alignmentScore >= 55
        ? `Your factor scores moderately support a ${normalised} strategy, with room to strengthen ` +
          `${criticalFactors.slice(0, 2).join(' and ')}.`
        : misalignedFactors.length > 0
          ? `${normalised} strategy requires strong ${criticalFactors.slice(0, 2).join(' and ')}, ` +
            `but ${misalignedFactors.join(', ')} ${misalignedFactors.length === 1 ? 'is' : 'are'} ` +
            `below threshold.`
          : `Your scores show weak overall alignment with a ${normalised} strategy — ` +
            `consider reviewing your critical factor scores: ${criticalFactors.slice(0, 2).join(', ')}.`;

  return {
    strategy: normalised,
    alignment_score: alignmentScore,
    rating,
    message,
    critical_factors: criticalFactors,
    misaligned_factors: misalignedFactors,
    well_aligned_factors: wellAlignedFactors,
    profile_used: profile,
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

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // 1. Variance penalty: very uniform OR very spread scores reduce confidence
  // Optimal stddev is 10-20 (realistic differentiation). Very low or very high hurts.
  const variancePenalty =
    stdDev < 5
      ? 15 // suspiciously uniform
      : stdDev > 30
        ? 10 // wildly inconsistent
        : 0;

  // 2. Extreme scores penalty: scores at exact 0 or 100 reduce credibility
  const extremeCount = values.filter((v) => v === 0 || v === 100).length;
  const extremePenalty = extremeCount * 5;

  // 3. Low mean penalty: very low overall scores suggest the solution is underdeveloped,
  // making self-assessment less reliable
  const lowMeanPenalty = mean < 30 ? 10 : mean < 45 ? 5 : 0;

  // 4. Baseline: start at 85 (self-assessment always has inherent uncertainty),
  // not 100 (which would imply perfect knowledge)
  const raw = 85 - variancePenalty - extremePenalty - lowMeanPenalty;
  return Math.max(30, Math.min(90, Math.round(raw)));
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
 * Group multi-vector rows by source and compute aggregated similarity metrics.
 * Accepts rows which may be returned from `match_documents`, `search_documents_hybrid`,
 * or similar RPCs. Each row may include `metadata.field_name` === 'problem'|'solution'|'doc'
 */
function aggregateMultiVectorResults(rows = [], opts = {}) {
  const map = new Map();
  for (const r of rows || []) {
    if (!r || !r.metadata) continue;

    const meta = r.metadata || {};
    const fields = meta.fields || {};
    const sourceId = meta.source_id || fields.id || fields.ID || meta.source_row || String(r.id);
    const entry = map.get(sourceId) || {
      source_id: sourceId,
      metadata: meta,
      rows: [],
      combined_similarity: 0,
      problem_similarities: [],
      solution_similarities: [],
      doc_similarities: [],
    };

    // similarity may be `similarity` or `combined_score` depending on RPC used
    const sim = typeof r.combined_score === 'number' ? r.combined_score : r.similarity || 0;
    const fieldName = (meta.field_name || fields.field_name || '').toLowerCase();

    entry.rows.push(Object.assign({}, r, { similarity: sim, field_name: fieldName }));

    if (fieldName === 'problem') entry.problem_similarities.push(sim);
    else if (fieldName === 'solution') entry.solution_similarities.push(sim);
    else entry.doc_similarities.push(sim);

    map.set(sourceId, entry);
  }

  // Compute aggregated combined_similarity for each source
  const result = [];
  for (const v of map.values()) {
    // If both problem and solution vectors exist, combine them with configurable weights
    const pAvg = average(v.problem_similarities);
    const sAvg = average(v.solution_similarities);
    const dAvg = average(v.doc_similarities);

    // weights: give priority to problem/solution vectors, fallback to doc-level
    const wProblem = opts.wProblem ?? 0.45;
    const wSolution = opts.wSolution ?? 0.45;
    const wDoc = opts.wDoc ?? 0.1;

    // If one type is missing, redistribute its weight proportionally
    let adjustedWProblem = wProblem;
    let adjustedWSolution = wSolution;
    let adjustedWDoc = wDoc;

    if (isNaN(pAvg)) {
      adjustedWProblem = 0;
    }
    if (isNaN(sAvg)) {
      adjustedWSolution = 0;
    }
    if (isNaN(dAvg)) {
      adjustedWDoc = 0;
    }
    const sumAdj = adjustedWProblem + adjustedWSolution + adjustedWDoc || 1;
    adjustedWProblem /= sumAdj;
    adjustedWSolution /= sumAdj;
    adjustedWDoc /= sumAdj;

    // Combined similarity is weighted average of available similarities
    const combined =
      (isNaN(pAvg) ? 0 : pAvg * adjustedWProblem) +
      (isNaN(sAvg) ? 0 : sAvg * adjustedWSolution) +
      (isNaN(dAvg) ? 0 : dAvg * adjustedWDoc);

    // Normalize to 0..1 (some RPCs already return 0..1, others 0..1 rounded)
    const combinedNorm = Math.max(0, Math.min(1, combined));

    result.push({
      ...v,
      problem_avg: isNaN(pAvg) ? null : pAvg,
      solution_avg: isNaN(sAvg) ? null : sAvg,
      doc_avg: isNaN(dAvg) ? null : dAvg,
      combined_similarity: combinedNorm,
    });
  }

  // Sort by combined_similarity desc
  return result.sort((a, b) => b.combined_similarity - a.combined_similarity);
}

/**
 * Deduplicates vector search rows by `source_id` and returns a compact case list for the frontend.
 * Delegates to `aggregateMultiVectorResults` for weighted problem/solution/doc similarity.
 *
 * @param {Array<Object>} [rows=[]] - Raw search rows (may include duplicate `source_id`).
 * @param {Object} [opts={}] - Weight options passed to `aggregateMultiVectorResults`.
 * @param {number} [opts.wProblem=0.5] - Weight for problem-vector similarity.
 * @param {number} [opts.wSolution=0.4] - Weight for solution-vector similarity.
 * @param {number} [opts.wDoc=0.1] - Weight for document-vector similarity.
 * @returns {Array<{id: string, title: string|null, metadata: Object, similarity: number, problem: number|null, solution: number|null}>}
 */
export function dedupeResultsWeighted(rows = [], opts = {}) {
  const aggregated = aggregateMultiVectorResults(rows, opts);
  // Map to simplified shape for frontend: title, problem, solution, similarity
  return aggregated.map((s) => ({
    id: s.source_id,
    title:
      (s.metadata && s.metadata.title) || (s.metadata.fields && s.metadata.fields.title) || null,
    metadata: s.metadata,
    similarity: s.combined_similarity,
    problem: s.problem_avg,
    solution: s.solution_avg,
  }));
}

/** Helper: compute average of numeric array or NaN */
function average(arr = []) {
  const nums = (arr || []).filter((n) => typeof n === 'number');
  if (nums.length === 0) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
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
