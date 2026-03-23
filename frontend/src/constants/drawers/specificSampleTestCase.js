/**
 * Constants for Specific Sample Test Case View Details Drawer
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
    material_complexity: 'Material Complexity',
    materialComplexity: 'Material Complexity',
    has_existing_partnerships: 'Partnerships',
    partnerships: 'Partnerships',
  },
};

// Helper function to format business context labels and values
export const getContextFieldLabel = (key) => {
  return TEST_CASE_DETAIL_CONTENT.contextFieldLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
};

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

// Helper function to get context field icons
export const getContextFieldIcon = (key) => {
  const normalizedKey = key.toLowerCase().replace(/_/g, '');
  const iconMap = {
    businessmodeltype: 'Package',
    operationalstage: 'TrendingUp',
    targetgeography: 'Globe',
    annualvolume: 'Layers',
    annualvolumeestimate: 'Layers',
    materialcomplexity: 'Layers',
    hasexistingpartnerships: 'Briefcase',
    partnerships: 'Briefcase',
  };
  return iconMap[normalizedKey] || null;
};
