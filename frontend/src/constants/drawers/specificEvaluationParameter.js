/**
 * @module specificEvaluationParameter
 * @description Content for the specific evaluation parameter info drawer.
 * Provides sections for parameter weight, scoring guidelines, and tips.
 */

/**
 * Specific parameter content object.
 * @type {Object}
 */
export const SPECIFIC_PARAMETER_CONTENT = {
  sections: {
    weight: {
      title: 'Parameter Weight',
      description:
        'This shows how much this parameter contributes to your overall circularity score.',
    },
    scoring: {
      title: 'Scoring Guidelines',
      description: 'Higher scores indicate better alignment with circular economy principles.',
    },
    tips: {
      title: 'Scoring Tips',
      description:
        'Focus on quantifiable metrics and specific examples when describing this parameter.',
    },
  },
  labels: {
    weight: 'Weight in Final Score',
    score: 'Your Score',
    maxScore: 'Maximum Possible',
  },
};
