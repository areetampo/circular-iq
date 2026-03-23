/** Score classification helpers: colours, labels, formatting. */

import { COLORS, confidenceLevels } from '@/constants/evaluationData.js';

/**
 * Get color for score based on ranges
 * @param {number} score - Score from 0-100
 * @returns {Object} Color info {color, backgroundColor, label, range}
 */
export function getScoreColor(score) {
  if (score >= 75) {
    return {
      color: COLORS.success,
      backgroundColor: COLORS.strongBg,
      label: 'Strong',
      range: 'Strong (75-100)',
    };
  }
  if (score >= 50) {
    return {
      color: COLORS.secondary,
      backgroundColor: COLORS.moderateBg,
      label: 'Moderate',
      range: 'Moderate (50-74)',
    };
  }
  if (score >= 25) {
    return {
      color: COLORS.accent,
      backgroundColor: COLORS.weakBg,
      label: 'Weak',
      range: 'Weak (25-49)',
    };
  }
  return {
    color: COLORS.error,
    backgroundColor: COLORS.criticalBg,
    label: 'Critical',
    range: 'Critical (0-24)',
  };
}

/**
 * Get Tailwind text color class for a score
 * @param {number} score - Score from 0-100
 * @returns {string} Tailwind text color class
 */
export function getScoreClass(score) {
  if (score >= 75) return 'text-green-700';
  if (score >= 50) return 'text-blue-600';
  if (score >= 25) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get confidence level info
 * @param {number} confidence - Confidence from 0-100
 * @returns {Object} Confidence level {color, label, description}
 */
export function getConfidenceLevel(confidence) {
  if (confidence >= 75) return confidenceLevels.high;
  if (confidence >= 50) return confidenceLevels.moderate;
  return confidenceLevels.low;
}

/**
 * Group parameters by category
 * @param {Object} parameters - All parameters
 * @returns {Object} Grouped by category
 */
export function groupParametersByCategory(parameters) {
  return {
    'Access Value': {
      public_participation: parameters.public_participation,
      infrastructure: parameters.infrastructure,
    },
    'Embedded Value': {
      market_price: parameters.market_price,
      maintenance: parameters.maintenance,
      uniqueness: parameters.uniqueness,
    },
    'Processing Value': {
      size_efficiency: parameters.size_efficiency,
      chemical_safety: parameters.chemical_safety,
      tech_readiness: parameters.tech_readiness,
    },
  };
}

/**
 * Get risk level badge color
 * @param {string} riskLevel - 'low', 'medium', 'high'
 * @returns {string} Tailwind class string
 */
export function getRiskBadgeColor(riskLevel) {
  switch (riskLevel?.toLowerCase()) {
    case 'low':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'medium':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    case 'high':
      return 'text-red-700 bg-red-100 border-red-200';
    default:
      return 'text-gray-700 bg-gray-100 border-gray-200';
  }
}

/**
 * Format factor name from snake_case to Title Case
 * @param {string} snakeCaseKey - e.g. 'public_participation'
 * @returns {string} Title Case string
 */
export function formatFactorName(snakeCaseKey) {
  return snakeCaseKey
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get similarity percent
 * @param {number} similarity - 0-1
 * @returns {number} Percent
 */
export function getSimilarityPercent(similarity) {
  return Math.round((similarity || 0) * 100);
}

/**
 * Get rating badge text based on overall score
 * @param {number} score - Overall score from 0-100
 * @returns {string} Rating label
 */
export function getRatingBadge(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Needs Improvement';
  return 'Critical';
}

/**
 * Calculate weighted score from parameters
 * @param {Object} scores - Parameter scores
 * @param {Object} weights - Parameter weights (optional)
 * @returns {number} Weighted score
 */
export function calculateWeightedScore(scores, weights = null) {
  // Default weights from evaluationData
  const defaultWeights = {
    public_participation: 0.15,
    infrastructure: 0.15,
    market_price: 0.2,
    maintenance: 0.1,
    uniqueness: 0.1,
    size_efficiency: 0.1,
    chemical_safety: 0.1,
    tech_readiness: 0.1,
  };

  const w = weights || defaultWeights;
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, score] of Object.entries(scores)) {
    if (w[key]) {
      weightedSum += score * w[key];
      totalWeight += w[key];
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Get top performing parameters
 * @param {Object} scores - Parameter scores
 * @param {number} count - Number of top parameters to return (default 3)
 * @returns {Array} Array of [key, score] sorted by score descending
 */
export function getTopParameters(scores, count = 3) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count);
}

/**
 * Get lowest performing parameters
 * @param {Object} scores - Parameter scores
 * @param {number} count - Number of parameters to return (default 3)
 * @returns {Array} Array of [key, score] sorted by score ascending
 */
export function getLowestParameters(scores, count = 3) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, count);
}

/**
 * Normalize score to 0-100 range
 * @param {number} score - Score to normalize
 * @param {number} min - Minimum possible value
 * @param {number} max - Maximum possible value
 * @returns {number} Normalized score (0-100)
 */
export function normalizeScore(score, min = 0, max = 100) {
  if (max === min) return 50; // Avoid division by zero
  return Math.round(((score - min) / (max - min)) * 100);
}
