import { CONFIDENCE_LEVELS, SIMILARITY_LEVELS, SEVERITY_CONFIG } from '../constants/evaluationData.js';

export function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_LEVELS.high.min) {
    return {
      level: 'high',
      ...CONFIDENCE_LEVELS.high
    };
  } else if (score >= CONFIDENCE_LEVELS.medium.min) {
    return {
      level: 'medium',
      ...CONFIDENCE_LEVELS.medium
    };
  } else {
    return {
      level: 'low',
      ...CONFIDENCE_LEVELS.low
    };
  }
}

export function extractProblem(content) {
  if (!content) return 'No problem description available';
  
  const problemMatch = content.match(/Problem:\s*([^.]+(?:\.[^.]+)*?)(?=\s*Solution:|$)/i);
  if (problemMatch && problemMatch[1]) {
    return problemMatch[1].trim();
  }
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences[0]?.trim() || content.substring(0, 200) + '...';
}

export function extractSolution(content) {
  if (!content) return 'No solution description available';
  
  const solutionMatch = content.match(/Solution:\s*(.+?)(?=\s*$|Problem:|Materials:|Impact:)/is);
  if (solutionMatch && solutionMatch[1]) {
    return solutionMatch[1].trim();
  }
  
  const problemEnd = content.indexOf('Solution:');
  if (problemEnd !== -1) {
    const solutionText = content.substring(problemEnd + 9).trim();
    return solutionText || 'No solution description available';
  }
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences[1]?.trim() || content.substring(200, 400) + '...';
}

export function getSeverityIcon(severity) {
  const config = SEVERITY_CONFIG[severity?.toLowerCase()] || SEVERITY_CONFIG.low;
  return config.icon;
}

export function getSeverityConfig(severity) {
  return SEVERITY_CONFIG[severity?.toLowerCase()] || SEVERITY_CONFIG.low;
}

export function formatSimilarityLevel(similarity) {
  const percentage = similarity * 100;
  
  if (percentage >= SIMILARITY_LEVELS.high.min * 100) {
    return {
      level: 'high',
      percentage: percentage.toFixed(1),
      ...SIMILARITY_LEVELS.high
    };
  } else if (percentage >= SIMILARITY_LEVELS.medium.min * 100) {
    return {
      level: 'medium',
      percentage: percentage.toFixed(1),
      ...SIMILARITY_LEVELS.medium
    };
  } else {
    return {
      level: 'low',
      percentage: percentage.toFixed(1),
      ...SIMILARITY_LEVELS.low
    };
  }
}

export function getSimilarityLevel(similarity) {
  return formatSimilarityLevel(similarity).level;
}

export function formatScore(score) {
  return Math.round(score);
}

export function getScoreColor(score, threshold = 75) {
  return score >= threshold ? '#34a83a' : '#666';
}

export function extractMetadata(metadataObj) {
  if (!metadataObj) return {};
  
  if (typeof metadataObj === 'string') {
    try {
      return JSON.parse(metadataObj);
    } catch (e) {
      return {};
    }
  }
  
  return metadataObj;
}

export function extractKeyLearnings(caseItem, integrityGaps = [], strengths = []) {
  const learnings = [];
  
  const caseId = caseItem.id;
  
  const relatedGaps = integrityGaps.filter(gap => 
    gap.evidence_source_id === caseId
  );
  relatedGaps.forEach(gap => {
    learnings.push(`⚠️ ${gap.issue}`);
  });
  
  const relatedStrengths = strengths.filter(strength => 
    strength.evidence_source_id === caseId
  );
  relatedStrengths.forEach(strength => {
    learnings.push(`✓ ${strength.aspect}`);
  });
  
  if (learnings.length === 0) {
    const metadata = extractMetadata(caseItem.metadata);
    if (metadata.category) {
      learnings.push(`Similar approach in ${metadata.category} sector`);
    }
    if (metadata.materials) {
      learnings.push(`Uses similar materials: ${metadata.materials}`);
    }
    if (learnings.length === 0) {
      learnings.push('Demonstrates proven circular economy implementation');
    }
  }
  
  return learnings;
}

export function findSupportingCases(recommendation, similarCases) {
  if (!recommendation || !similarCases) return [];
  
  const keywords = recommendation.toLowerCase().split(/\s+/).filter(word => word.length > 4);
  
  return similarCases.filter(caseItem => {
    const content = caseItem.content?.toLowerCase() || '';
    return keywords.some(keyword => content.includes(keyword));
  }).slice(0, 2);
}

export function validateInputLength(text, minLength = 200) {
  return {
    isValid: text.trim().length >= minLength,
    currentLength: text.trim().length,
    remainingChars: Math.max(0, minLength - text.trim().length)
  };
}

export function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
