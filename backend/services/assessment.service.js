// Business logic related to assessments (outside of controller ops)

export function normalizeIndustry(industry) {
  if (typeof industry !== 'string') return null;
  const val = industry.trim();
  return val === '' ? null : val;
}

// Additional pure helper functions could land here as needed
