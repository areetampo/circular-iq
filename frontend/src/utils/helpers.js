/**
 * Frontend Helper Functions
 *
 * Utilities for:
 * - Score formatting and color coding
 * - API communication
 * - Data transformation
 * - Number formatting
 */

import { COLORS, confidenceLevels } from '../constants/evaluationData.js';

/**
 * Get color for score based on ranges
 * @param {number} score - Score from 0-100
 * @returns {Object} Color info {color, backgroundColor, label}
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
 * Format number as percentage with rounding
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format similarity score for display
 * @param {number} similarity - Similarity from 0-1
 * @returns {string} Formatted similarity percentage
 */
export function formatSimilarity(similarity) {
  if (typeof similarity !== 'number') return '0%';
  return `${Math.round(similarity * 100)}%`;
}

/**
 * Call backend API to score a business idea
 * @param {string} businessProblem - Problem description
 * @param {string} businessSolution - Solution description
 * @param {Object} parameters - Scoring parameters
 * @returns {Promise<Object>} API response with scores and audit
 */
export async function submitForScoring(businessProblem, businessSolution, parameters) {
  // Vite uses import.meta.env instead of process.env
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessProblem,
        businessSolution,
        parameters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Scoring API error:', error);
    throw error;
  }
}

/**
 * Validate input before submission
 * @param {string} problem - Problem description
 * @param {string} solution - Solution description
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateInput(problem, solution) {
  const MIN_LENGTH = 50;

  if (!problem || !solution) {
    return {
      valid: false,
      error: 'Both problem and solution are required',
    };
  }

  if (problem.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Problem must be at least ${MIN_LENGTH} characters`,
    };
  }

  if (solution.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Solution must be at least ${MIN_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Format parameter name from snake_case to Title Case
 * @param {string} parameter - Parameter name
 * @returns {string} Formatted name
 */
export function formatParameterName(parameter) {
  return parameter
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get severity icon for integrity gaps
 * @param {string} severity - Severity level (low, medium, high)
 * @returns {string} Icon character
 */
export function getSeverityIcon(severity) {
  switch (severity) {
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return 'ℹ️';
    default:
      return '•';
  }
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
 * Calculate category averages
 * @param {Object} parameters - All parameters
 * @returns {Object} Category averages
 */
export function calculateCategoryAverages(parameters) {
  const grouped = groupParametersByCategory(parameters);
  const averages = {};

  for (const [category, params] of Object.entries(grouped)) {
    const values = Object.values(params);
    const sum = values.reduce((a, b) => a + b, 0);
    averages[category] = Math.round(sum / values.length);
  }

  return averages;
}

/**
 * Format audit verdict for display
 * @param {string} verdict - Raw verdict text
 * @returns {string} Formatted verdict
 */
export function formatVerdict(verdict) {
  if (!verdict) return 'No verdict available';
  // Capitalize first letter if needed
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

/**
 * Extract problem and solution from similar case
 * Uses structured metadata if available, falls back to content parsing
 * @param {Object} caseItem - Case object with metadata and content
 * @returns {Object} {problem, solution}
 */
export function extractProblemSolution(caseItem) {
  // Strategy 1: Use structured metadata fields (preferred)
  if (caseItem?.metadata?.fields) {
    const { problem, solution } = caseItem.metadata.fields;
    if (problem && solution) {
      return {
        problem: problem.trim(),
        solution: solution.trim(),
      };
    }
  }

  // Strategy 2: Parse from content string (fallback)
  const content = typeof caseItem === 'string' ? caseItem : caseItem?.content;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return {
      problem: 'Problem data unavailable',
      solution: 'Solution data unavailable',
    };
  }

  // Normalize content: trim and clean up extra whitespace but preserve structure
  const normalizedContent = content.trim();

  // Strategy 1: Look for explicit "Problem: ... Solution:" pattern with flexible spacing
  const explicitMatch = normalizedContent.match(/Problem:\s*(.+?)(?:\n\nSolution:|Solution:)/is);
  const solutionMatch = normalizedContent.match(/Solution:\s*(.+?)$/is);

  if (explicitMatch && explicitMatch[1] && solutionMatch && solutionMatch[1]) {
    return {
      problem: explicitMatch[1].trim(),
      solution: solutionMatch[1].trim(),
    };
  }

  // Strategy 2: If only one matched, still use them
  if (explicitMatch && explicitMatch[1]) {
    let problem = explicitMatch[1].trim();
    let solution = solutionMatch ? solutionMatch[1].trim() : '';

    if (!solution) {
      // Try to find anything after "Solution:"
      const solIdx = normalizedContent.toLowerCase().indexOf('solution:');
      if (solIdx !== -1) {
        solution = normalizedContent.substring(solIdx + 9).trim();
      }
    }

    if (solution && solution.length > 10) {
      return {
        problem: problem,
        solution: solution,
      };
    }
  }

  // Strategy 3: Split by common solution indicators if structured pattern not found
  const separators = [
    'proposed solution',
    'our solution',
    'we propose',
    'however',
    'instead',
    'this solution',
    'the solution',
  ];

  for (const sep of separators) {
    const index = normalizedContent.toLowerCase().indexOf(sep);
    if (index > 100) {
      // Must have meaningful problem text before separator
      const problem = normalizedContent.substring(0, index).trim();
      const solution = normalizedContent.substring(index).trim();

      if (problem.length > 50 && solution.length > 50) {
        return {
          problem: problem,
          solution: solution,
        };
      }
    }
  }

  // Strategy 4: Split content roughly in half if no clear markers
  if (normalizedContent.length > 300) {
    const midpoint = normalizedContent.length / 2;
    // Find a sentence boundary near the midpoint
    const beforeMid = normalizedContent.lastIndexOf('.', midpoint);
    const afterMid = normalizedContent.indexOf('.', midpoint);

    let splitPoint = -1;
    if (beforeMid > 100 && Math.abs(midpoint - beforeMid) < Math.abs(midpoint - afterMid)) {
      splitPoint = beforeMid;
    } else if (afterMid !== -1) {
      splitPoint = afterMid;
    }

    if (splitPoint > 100 && splitPoint < normalizedContent.length - 100) {
      const problem = normalizedContent.substring(0, splitPoint + 1).trim();
      const solution = normalizedContent.substring(splitPoint + 1).trim();

      if (problem.length > 50 && solution.length > 50) {
        return {
          problem: problem,
          solution: solution,
        };
      }
    }
  }

  // Final fallback: split at rough middle
  const part1 = normalizedContent.substring(0, Math.min(250, normalizedContent.length / 2)).trim();
  const part2 = normalizedContent.substring(Math.max(250, normalizedContent.length / 2)).trim();

  return {
    problem: part1 || 'Problem data not clearly formatted',
    solution: part2 || 'Solution data not clearly formatted',
  };
}

/**
 * Extract case information for evidence cards
 * @param {Object} caseItem - Case object with similarity, id, content
 * @param {number} index - Index of the case
 * @returns {Object} Formatted case info
 */
export function extractCaseInfo(caseItem, index) {
  const matchPercentage = caseItem.similarity ? Math.round(caseItem.similarity * 100) : 0;
  const sourceCaseId = caseItem.id || index + 1;
  const content = caseItem.content || '';

  return {
    matchPercentage,
    sourceCaseId,
    content,
  };
}

/**
 * Categorize integrity gaps (separate strengths from gaps)
 * @param {Array} integrityGaps - Array of integrity gaps from audit
 * @returns {Object} Object with strengths and gaps arrays
 */
export function categorizeIntegrityGaps(integrityGaps) {
  if (!Array.isArray(integrityGaps)) {
    return { strengths: [], gaps: [] };
  }

  // In the full project, strengths come separately
  // This function just returns gaps in the expected format
  return {
    strengths: [],
    gaps: integrityGaps,
  };
}

/** * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, length = 200) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Delay function for async operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Local storage helpers
 */
export const storage = {
  save: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage save error:', error);
    }
  },

  load: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },
};

export default {
  getScoreColor,
  getConfidenceLevel,
  formatPercentage,
  formatSimilarity,
  submitForScoring,
  validateInput,
  formatParameterName,
  getSeverityIcon,
  groupParametersByCategory,
  calculateCategoryAverages,
  formatVerdict,
  extractProblemSolution,
  truncateText,
  delay,
  storage,
};
