/** Labels, headings, and context-field helpers for the sample test case detail drawer. */

import { Briefcase, Globe, Layers, Package, TrendingUp } from 'lucide-react';

/**
 * Structured labels, headings, and field maps used to render sample test case details.
 * Supports both snake_case and camelCase context keys from sample data or restored assessment payloads.
 */
export const TEST_CASE_DETAIL_CONTENT = {
  subheading: 'Detailed assessment results and business information',
  headings: {
    overview: 'Case Overview',
    businessProblem: 'Business Problem',
    businessSolution: 'Business Solution',
    evaluationParameters: 'Evaluation Parameters',
    businessContext: 'Business Context',
    results: 'Assessment Results',
  },
  sections: {
    businessProblem: {
      title: 'Business Problem',
      subtitle: 'Environmental or circular economy challenge',
    },
    businessSolution: {
      title: 'Business Solution',
      subtitle: 'How the solution addresses the problem',
    },
    businessContext: {
      title: 'Business Context',
    },
    evaluationParameters: {
      title: 'Evaluation Parameters',
      subtitle: 'Score breakdown across assessment factors',
    },
  },
  labels: {
    score: 'Circularity Score',
    industry: 'Industry',
    businessModelType: 'Business Model Type',
    operationalStage: 'Operational Stage',
    targetGeography: 'Target Geography',
    annualVolume: 'Annual Material Volume',
    materialComplexity: 'Material Complexity',
    partnerships: 'Partnerships',
    notSpecified: '[Not specified]',
  },
  contextFieldLabels: {
    business_model_type: 'Business Model Type',
    businessModelType: 'Business Model Type',
    operational_stage: 'Operational Stage',
    operationalStage: 'Operational Stage',
    target_geography: 'Target Geography',
    targetGeography: 'Target Geography',
    annual_volume_estimate: 'Annual Material Volume',
    annualVolume: 'Annual Material Volume',
    materialComplexity: 'Material Complexity',
    material_complexity: 'Material Complexity',
    has_existing_partnerships: 'Partnerships',
    partnerships: 'Partnerships',
  },
};

/**
 * Resolves a business-context field key to the drawer display label.
 *
 * @param {string} key - Context key from a sample test case.
 * @returns {string} Known label or a spaced fallback derived from the key.
 */
export const getContextFieldLabel = (key) => {
  return TEST_CASE_DETAIL_CONTENT.contextFieldLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

/**
 * Formats a context value for drawer display.
 *
 * @param {string} key - Context key associated with the value.
 * @param {string|number|boolean|null|undefined} value - Raw context value from a sample test case.
 * @returns {string} Title-cased display value, "Yes" for true, or "[Not specified]" for empty/false values.
 */
export const getContextValueLabel = (key, value) => {
  if (value === null || value === undefined || value === '' || value === false) {
    return TEST_CASE_DETAIL_CONTENT.labels.notSpecified;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  // Format hyphenated values to title case
  return String(value)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Resolves the icon component used for a context field.
 *
 * @param {string} key - Context key to normalize before icon lookup.
 * @returns {import('react').ComponentType|null} Matching icon component, or null when no icon is configured.
 */
export const getContextFieldIcon = (key) => {
  const normalizedKey = key.toLowerCase().replace(/_/g, '');
  const iconMap = {
    businessmodeltype: Package,
    operationalstage: TrendingUp,
    targetgeography: Globe,
    annualvolume: Layers,
    annualvolumeestimate: Layers,
    materialcomplexity: Layers,
    hasexistingpartnerships: Briefcase,
    partnerships: Briefcase,
  };
  return iconMap[normalizedKey] || null;
};
