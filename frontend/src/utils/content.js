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
 * Extract case information for evidence cards
 * @param {Object} caseItem - Case object with similarity, id, content
 * @param {number} index - Index of the case
 * @returns {Object} Formatted case info
 */
export function extractCaseInfo(caseItem, index) {
  const matchPercentage = caseItem.similarity ? Math.round(caseItem.similarity * 10000) / 100 : 0;
  const sourceCaseId = caseItem.id || index + 1;
  const content = caseItem.content || '';

  return {
    matchPercentage,
    sourceCaseId,
    content,
  };
}

/**
 * Get match strength label and color based on similarity percentage
 * @param {number} similarity - Similarity score (0-1)
 * @returns {Object} {label, color}
 */
export function getMatchStrength(similarity) {
  const percentage = similarity * 100;
  if (percentage >= 80) return { label: 'Excellent Match', color: 'strong' };
  if (percentage >= 60) return { label: 'Strong Match', color: 'decent' };
  if (percentage >= 40) return { label: 'Decent Match', color: 'decent' };
  return { label: 'Poor Match', color: 'weak' };
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

/**
 * Extract summary from long text
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Maximum summary length (default 200)
 * @returns {string} Summary
 */
export function extractSummary(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text || '';

  // Try to find a sentence boundary near the max length
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastPeriod > maxLength * 0.7) {
    return text.substring(0, lastPeriod + 1);
  }

  if (lastSpace > maxLength * 0.7) {
    return text.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Parse markdown-like content to HTML
 * Simple parser for basic formatting
 * @param {string} content - Content with markdown
 * @returns {string} HTML string
 */
export function parseMarkdownToHtml(content) {
  if (!content) return '';

  let html = content;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraphs
  html = '<p>' + html + '</p>';

  return html;
}

/**
 * Extract keywords from text
 * @param {string} text - Text to analyze
 * @param {number} count - Number of keywords to extract (default 5)
 * @returns {Array<string>} Array of keywords
 */
export function extractKeywords(text, count = 5) {
  if (!text) return [];

  // Common stop words to exclude
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'this',
    'that',
    'these',
    'those',
  ]);

  // Extract words, filter and count
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Count frequency
  const frequency = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word);
}
