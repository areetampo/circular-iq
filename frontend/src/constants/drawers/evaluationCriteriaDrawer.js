/** Drawer and guide-page copy for the three value dimensions, factors, metrics, and calculation steps. */

export const EVALUATION_CRITERIA_CONTENT = {
  heading: 'Evaluation Criteria',
  subheading: 'Three core value dimensions with specific factors',
  description:
    'Our AI-powered evaluation framework assesses business ideas across three core value dimensions, each comprising specific factors.',
  metrics: [
    { number: 3, label: 'Core Value Types', color: 'blue' },
    { number: 8, label: 'Evaluation Factors', color: 'emerald' },
    { number: 100, label: 'Maximum Score', color: 'emerald' },
  ],
  valueSections: [
    {
      title: 'Access Value',
      color: 'blue',
      description: 'Evaluates accessibility and participation aspects',
      factors: [
        {
          title: 'Public Participation',
          description:
            'Measures how easily stakeholders, communities, and end-users can engage with and contribute to the circular system.',
        },
        {
          title: 'Infrastructure & Accessibility',
          description:
            'Assesses the availability of necessary infrastructure and ease of access to circular economy resources and processes.',
        },
      ],
      gridCols: 'md:grid-cols-2',
      borderColor: 'border-blue-500',
    },
    {
      title: 'Embedded Value',
      color: 'emerald',
      description: 'Evaluates inherent and economic value of resources',
      factors: [
        {
          title: 'Market Price',
          description:
            'Evaluates the economic value and market demand for recovered or repurposed materials.',
        },
        {
          title: 'Maintenance',
          description:
            'Assesses the ease and cost of maintaining products, materials, or systems throughout their lifecycle.',
        },
        {
          title: 'Uniqueness',
          description:
            'Measures the rarity, specialty, or distinctive value of materials and their potential for reuse.',
        },
      ],
      gridCols: 'md:grid-cols-3',
      borderColor: 'border-emerald-600',
    },
    {
      title: 'Processing Value',
      color: 'teal',
      description: 'Evaluates technical and operational factors',
      factors: [
        {
          title: 'Size',
          description:
            'Considers the physical dimensions and volume, affecting handling, storage, and transportation efficiency.',
        },
        {
          title: 'Chemical Toxicity',
          description:
            'Assesses potential environmental and health hazards, impacting safe processing and disposal methods.',
        },
        {
          title: 'Technology Needed',
          description:
            'Evaluates the complexity and availability of technology required for effective processing and recovery.',
        },
      ],
      gridCols: 'md:grid-cols-3',
      borderColor: 'border-teal-600',
    },
  ],
  calculationSteps: [
    {
      number: 1,
      title: 'AI Analysis',
      description:
        'Our machine learning model analyzes your business description against each of the 8 factors',
    },
    {
      number: 2,
      title: 'Weighted Scoring',
      description: 'Each value type contributes proportionally to the overall circularity score',
    },
    {
      number: 3,
      title: 'Comprehensive Report',
      description:
        'Receive detailed insights, strengths, and actionable recommendations for improvement',
    },
  ],
  sections: {
    howWeCalculate: 'How We Calculate Your Score',
  },
};
