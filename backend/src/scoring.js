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
  // Robust comparison that handles multi-vector rows and weights benchmarks
  if (!databaseCases || databaseCases.length === 0) {
    return { error: 'No database cases available for comparison' };
  }

  // Aggregate raw rows into per-source summaries (handles multi-vector storage)
  const sources = aggregateMultiVectorResults(databaseCases);

  // Determine weighting factors for benchmarking
  // Each source contributes to the benchmark proportional to its relevance (combined_similarity)
  const factors = Object.keys(userScores || {});
  const weightedSums = {};
  const weightTotals = {};

  for (const s of sources) {
    // prefer embedded scores if present
    const docScore = extractDocumentOverallScore(s);
    const relevance = s.combined_similarity || 0; // 0..1

    // compute per-factor values (from metadata.scores if present)
    const metaScores = (s.metadata && s.metadata.scores) || {};

    for (const factor of factors) {
      const val =
        typeof metaScores[factor] === 'number'
          ? metaScores[factor]
          : typeof s[factor] === 'number'
            ? s[factor]
            : null;

      if (val !== null && !isNaN(val)) {
        weightedSums[factor] = (weightedSums[factor] || 0) + val * relevance;
        weightTotals[factor] = (weightTotals[factor] || 0) + relevance;
      }
    }
  }

  // Build comparison object with weighted benchmarks and statistics
  const comparison = {};
  for (const factor of factors) {
    const totalW = weightTotals[factor] || 0;
    if (totalW === 0) continue;
    const weightedAvg = weightedSums[factor] / totalW;
    const variance = userScores[factor] - weightedAvg;

    comparison[factor] = {
      userScore: userScores[factor],
      benchmark_weighted_average: Math.round(weightedAvg),
      gap: Math.round(weightedAvg - userScores[factor]),
      percentile_estimate: Math.round(100 * estimatePercentile(userScores[factor], weightedAvg)),
      z_score: computeZScore(userScores[factor], weightedAvg, totalW),
      isOverestimated: variance < -12, // user score much higher than benchmark => negative gap
      isUnderestimated: variance > 12,
    };
  }

  return comparison;
}

/**
 * Group multi-vector rows by source and compute aggregated similarity metrics.
 * Accepts rows which may be returned from `match_documents`, `search_documents_hybrid`,
 * or similar RPCs. Each row may include `metadata.field_name` === 'problem'|'solution'|'doc'
 */
export function aggregateMultiVectorResults(rows = [], opts = {}) {
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
    let totalW = wProblem + wSolution + wDoc;
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
 * Deduplicate rows by source_id and produce a compact list of unique cases.
 * Uses either maximum similarity or weighted-average (above) to represent case relevance.
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

/** Extract overall score from a source metadata if present */
function extractDocumentOverallScore(source) {
  return (
    (source.metadata && source.metadata.scores && source.metadata.scores.overall_score) || null
  );
}

/** Estimate percentile roughly from a mean benchmark (simple mapping) */
function estimatePercentile(value, benchmark) {
  // If value equals benchmark -> 50th percentile; linear mapping for +/-30 pts
  const diff = value - benchmark;
  const pct = 50 + (diff / 60) * 100; // diff +-30 -> +-50 percentiles
  return Math.max(1, Math.min(99, pct));
}

/** Compute a z-like score as (x - mu) / sigma_estimate. sigma_estimate derived from weight (higher weight => lower sigma) */
function computeZScore(x, mu, weightTotal) {
  // rough heuristic: treat weightTotal (sum of similarities) => variance shrinker
  const sigma = Math.max(5, 30 / Math.sqrt(Math.max(1, weightTotal))); // minimum spread 5
  return Number(((x - mu) / sigma).toFixed(2));
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
