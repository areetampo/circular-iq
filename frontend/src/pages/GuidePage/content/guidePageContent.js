export const PROBLEM_ELEMENTS = [
  {
    title: 'Environmental Impact',
    description:
      'Specific waste, pollution, or resource depletion issue (e.g., "8M tons of plastic waste entering oceans annually").',
  },
  {
    title: 'Quantified Scale',
    description:
      'Use real numbers, percentages, or measurements to show magnitude (tons, percent of market, number of people affected).',
  },
  {
    title: 'Current Gaps',
    description:
      'Why existing solutions fail (cost barriers, infrastructure limits, behavior challenges, regulation issues).',
  },
  {
    title: 'Stakeholders Affected',
    description:
      'Who experiences this problem and how (consumers, businesses, communities, ecosystems).',
  },
  {
    title: 'Geographic Context',
    description: 'Where this problem is most acute (local, regional, national, global).',
  },
  {
    title: 'Urgency Indicators',
    description:
      'Why this needs solving now (regulatory pressure, market demand, environmental tipping points).',
  },
];

export const PROBLEM_WRITING_TIPS = [
  'Start with a compelling statistic or fact.',
  'Use specific numbers instead of vague terms.',
  'Connect problem to economic or social costs.',
  'Reference industry standards or regulations when relevant.',
  'Cite sources if available (e.g., EPA, industry studies).',
];

export const PROBLEM_EXAMPLE =
  'Single-use plastic packaging creates 8 million tons of ocean waste annually, disrupting marine ecosystems and food chains. Current alternatives are cost-prohibitive (> $2/unit) or require industrial composting infrastructure that 75% of municipalities lack. This leaves a gap between demand for sustainable packaging and practical implementation at scale.';

export const SOLUTION_COMPONENTS = [
  {
    title: 'Materials and Inputs',
    description:
      'Exact materials used with specifications (post-consumer PET, agricultural hemp fiber, recycled aluminum).',
  },
  {
    title: 'Processing Methods',
    description:
      'How materials are transformed (mechanical recycling, chemical recovery, biological processing).',
  },
  {
    title: 'Circular Design',
    description:
      'Design for disassembly, reuse, or material recovery (modular components, standard connections).',
  },
  {
    title: 'Business Model',
    description:
      'How circularity creates value (product-as-service, take-back programs, material leasing).',
  },
  {
    title: 'Partnerships',
    description:
      'Supply chain and ecosystem partnerships (waste collectors, manufacturers, retailers).',
  },
];

export const SOLUTION_PITFALLS = [
  {
    title: 'Vague Technical Details',
    description: 'Avoid general terms like "innovative process" without specifics.',
  },
  {
    title: 'Missing Quantification',
    description: 'Include numbers for efficiency, recovery rates, capacity.',
  },
  {
    title: 'Unclear Circular Loop',
    description: 'Clearly explain how materials flow back into production.',
  },
  {
    title: 'Ignoring Implementation',
    description: 'Address practical challenges and required infrastructure.',
  },
];

export const SOLUTION_EXAMPLE =
  'Our platform uses compostable packaging from agricultural hemp waste, combined with a hub-and-spoke collection model. Customers receive pre-addressed, compostable mailers; we aggregate returns at regional hubs; certified composting facilities process 95% of materials into soil amendments sold back to agriculture, creating a closed-loop system that reduces plastic waste by 80% while creating value from agricultural byproducts.';

export const CALCULATION_STEPS = [
  {
    number: 1,
    title: 'Factor Analysis',
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
];

export const METRICS = [
  {
    title: 'Access Value',
    description: 'Social participation and infrastructure accessibility',
    color: 'blue',
  },
  {
    title: 'Embedded Value',
    description: 'Economic worth and technical integration',
    color: 'green',
  },
  {
    title: 'Processing Value',
    description: 'Environmental efficiency and technical readiness',
    color: 'green',
  },
];

export const FACTOR_DEFINITIONS = {
  public_participation: {
    title: 'Public Participation',
    category: 'Access Value',
    desc: 'Measures how easily stakeholders can engage with your circular system.',
  },
  infrastructure: {
    title: 'Infrastructure & Accessibility',
    category: 'Access Value',
    desc: 'Existing infrastructure availability, geographic reach, and logistical feasibility.',
  },
  market_price: {
    title: 'Market Price',
    category: 'Embedded Value',
    desc: 'Economic value of recovered materials, revenue potential, and market demand strength.',
  },
  maintenance: {
    title: 'Maintenance',
    category: 'Embedded Value',
    desc: 'Ease of upkeep, cost of maintenance, and system durability.',
  },
  uniqueness: {
    title: 'Uniqueness',
    category: 'Embedded Value',
    desc: 'Rarity of materials, competitive advantage, and innovation level.',
  },
  size_efficiency: {
    title: 'Size Efficiency',
    category: 'Processing Value',
    desc: 'Physical footprint, storage requirements, and transportation efficiency.',
  },
  chemical_safety: {
    title: 'Chemical Safety',
    category: 'Processing Value',
    desc: 'Environmental hazards and health risks (scored as inverse: higher = safer).',
  },
  tech_readiness: {
    title: 'Tech Readiness',
    category: 'Processing Value',
    desc: 'Technology maturity level and implementation complexity (scored as inverse: higher = ready).',
  },
};
