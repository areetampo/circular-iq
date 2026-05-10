/**
 * Content Utilities
 * Functions for extracting and parsing content from various sources
 *
 * Location: src/utils/content.js
 */

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
 * Get match strength label and color based on similarity percentage
 * @param {number} similarity - Similarity score (0-1)
 * @returns {string} matchStrength
 */
export function getMatchStrength(similarity) {
  const percentage = similarity * 100;
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'strong';
  if (percentage >= 40) return 'decent';
  return 'poor';
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

  // In full project, strengths come separately
  // This function just returns gaps in expected format
  return {
    strengths: [],
    gaps: integrityGaps,
  };
}
