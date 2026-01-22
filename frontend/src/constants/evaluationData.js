/**
 * Evaluation Data and Parameter Guidance
 *
 * Provides:
 * - Educational content for info modals
 * - Calibration guidance for parameter sliders
 * - Benchmark examples for each factor
 * - Score interpretation scales
 */

// View states
export const VIEWS = {
  LANDING: 'landing',
  EVALUATION: 'evaluation',
  RESULTS: 'results',
};

// Color scheme - Professional emerald theme
export const COLORS = {
  primary: '#34a83a', // Emerald green
  secondary: '#4a90e2', // Blue
  accent: '#ff9800', // Orange
  success: '#34a83a', // Green
  warning: '#ff9800', // Orange
  error: '#d32f2f', // Red
  textPrimary: '#333',
  textSecondary: '#666',
  background: '#f5f5f5',
  white: '#ffffff',
  // Background colors
  strongBg: '#e8f5e9', // Light green
  moderateBg: '#e3f2fd', // Light blue
  weakBg: '#fff3e0', // Light orange
  criticalBg: '#ffebee', // Light red
};

/**
 * Parameter Guidance - Complete educational content for each factor
 */
export const parameterGuidance = {
  public_participation: {
    name: 'Public Participation',
    category: 'Access Value (Social & Participation)',
    weight: 0.15,
    weightPercent: '15%',
    definition: 'Measures how easily various stakeholders can engage with your circular system.',
    methodology:
      'Based on barrier analysis: technical knowledge required, geographic access, cost of participation, time commitment.',
    calibration:
      'Consider: Who can participate? What do they need to do? What prevents participation?',
    scale: [
      {
        score: 90,
        label: 'Universal Access',
        description: 'Zero barriers to entry, widely accessible',
      },
      {
        score: 75,
        label: 'Easy Participation',
        description: 'Minor barriers, most people can engage',
      },
      {
        score: 60,
        label: 'Moderate Participation',
        description: 'Some effort required, selective engagement',
      },
      {
        score: 40,
        label: 'Limited Participation',
        description: 'Significant barriers, restricted groups',
      },
      {
        score: 20,
        label: 'Expert-Only Access',
        description: 'Highly specialized, limited to professionals',
      },
    ],
    examples: [
      {
        score: 85,
        case: 'Municipal curbside composting with free bins',
        reason: 'Effortless - just put waste in bin',
      },
      {
        score: 70,
        case: 'Product take-back requiring online registration',
        reason: 'Small barrier - registration needed',
      },
      {
        score: 50,
        case: 'Product take-back requiring shipping',
        reason: 'Moderate effort - shipping costs',
      },
      {
        score: 25,
        case: 'Industrial recycling partnerships',
        reason: 'B2B only, not for consumers',
      },
    ],
  },

  infrastructure: {
    name: 'Infrastructure & Accessibility',
    category: 'Access Value (Social & Participation)',
    weight: 0.15,
    weightPercent: '15%',
    definition:
      'Existing infrastructure availability, geographic reach, and logistical feasibility.',
    methodology:
      'Evaluates collection networks, processing facilities, distribution systems, and transportation logistics.',
    calibration:
      'Consider: What infrastructure already exists? How much needs to be built? Geographic gaps?',
    scale: [
      {
        score: 85,
        label: 'Excellent Infrastructure',
        description: 'Well-developed systems widely available',
      },
      { score: 70, label: 'Good Infrastructure', description: 'Adequate systems in major areas' },
      {
        score: 50,
        label: 'Moderate Infrastructure',
        description: 'Some systems available, gaps exist',
      },
      {
        score: 30,
        label: 'Limited Infrastructure',
        description: 'Few existing systems, building needed',
      },
      { score: 10, label: 'No Infrastructure', description: 'Would require entirely new systems' },
    ],
    examples: [
      {
        score: 80,
        case: 'Urban area with existing waste collection',
        reason: 'Can piggyback on existing systems',
      },
      {
        score: 55,
        case: 'Rural area with basic infrastructure',
        reason: 'Some systems available but sparse',
      },
      {
        score: 30,
        case: 'Emerging market with limited systems',
        reason: 'Significant infrastructure investment needed',
      },
      {
        score: 15,
        case: 'Remote region with no infrastructure',
        reason: 'Would build systems from scratch',
      },
    ],
  },

  market_price: {
    name: 'Market Price',
    category: 'Embedded Value (Economic & Material)',
    weight: 0.2,
    weightPercent: '20%',
    definition:
      'Economic value of recovered materials, revenue potential, and market demand strength.',
    methodology:
      'Considers commodity pricing, market size, demand volatility, and revenue predictability.',
    calibration:
      'Consider: What is the material worth? How stable is the market? Is demand growing or declining?',
    scale: [
      {
        score: 90,
        label: 'High Value',
        description: 'Strong market demand, stable premium pricing',
      },
      {
        score: 70,
        label: 'Good Value',
        description: 'Solid market, reasonable price, growing demand',
      },
      { score: 50, label: 'Moderate Value', description: 'Viable economics, market varies' },
      { score: 30, label: 'Low Value', description: 'Limited market, requires incentives' },
      { score: 10, label: 'Minimal Value', description: 'Barely profitable, heavily subsidized' },
    ],
    examples: [
      {
        score: 85,
        case: 'Aluminum recycling',
        reason: 'High commodity value, stable market, always in demand',
      },
      {
        score: 60,
        case: 'Plastic recycling',
        reason: 'Moderate value, market volatility, fluctuating demand',
      },
      {
        score: 40,
        case: 'Paper recycling',
        reason: 'Lower margins, market dependent on paper consumption',
      },
      { score: 20, case: 'Textile waste recovery', reason: 'Emerging market, low current value' },
    ],
  },

  maintenance: {
    name: 'Maintenance',
    category: 'Embedded Value (Economic & Material)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Ease of upkeep, cost of maintenance, and system durability.',
    methodology:
      'Evaluates technical complexity, required expertise, parts availability, and operational lifespan.',
    calibration:
      'Consider: How often does it break down? How expensive is maintenance? Is it easy to repair?',
    scale: [
      {
        score: 85,
        label: 'Very Low Maintenance',
        description: 'Minimal upkeep, highly durable, self-sustaining',
      },
      { score: 70, label: 'Low Maintenance', description: 'Occasional checkups, long lifespan' },
      { score: 50, label: 'Moderate Maintenance', description: 'Regular servicing required' },
      { score: 30, label: 'High Maintenance', description: 'Frequent repairs, expert needed' },
      {
        score: 10,
        label: 'Very High Maintenance',
        description: 'Constant upkeep, expensive, unreliable',
      },
    ],
    examples: [
      {
        score: 80,
        case: 'Simple mechanical sorting',
        reason: 'Straightforward design, minimal breakdowns',
      },
      {
        score: 55,
        case: 'Standard processing facility',
        reason: 'Regular maintenance routine required',
      },
      {
        score: 30,
        case: 'Specialized chemical processing',
        reason: 'Complex systems, frequent calibration',
      },
      {
        score: 15,
        case: 'Experimental technology',
        reason: 'Prototype stage, frequent adjustments needed',
      },
    ],
  },

  uniqueness: {
    name: 'Uniqueness',
    category: 'Embedded Value (Economic & Material)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Rarity of materials, competitive advantage, and innovation level.',
    methodology:
      'Assesses intellectual property, differentiation from competitors, and market exclusivity.',
    calibration:
      'Consider: Is this patented? Do competitors do this? How innovative is the approach?',
    scale: [
      {
        score: 90,
        label: 'Highly Unique',
        description: 'Proprietary technology, strong competitive moat',
      },
      {
        score: 70,
        label: 'Differentiated',
        description: 'Novel approach, some competitive advantage',
      },
      {
        score: 50,
        label: 'Somewhat Unique',
        description: 'Some differentiation, others doing similar',
      },
      { score: 30, label: 'Conventional', description: 'Standard approach, many competitors' },
      { score: 10, label: 'Commodity', description: 'No differentiation, highly commoditized' },
    ],
    examples: [
      {
        score: 85,
        case: 'Patented material recovery process',
        reason: 'Protected intellectual property',
      },
      {
        score: 60,
        case: 'Novel supply chain model',
        reason: 'Different approach, some imitators emerging',
      },
      {
        score: 40,
        case: 'Improved recycling technique',
        reason: 'Incremental innovation, multiple similar solutions',
      },
      {
        score: 15,
        case: 'Standard commodity recycling',
        reason: 'No differentiation, highly competitive',
      },
    ],
  },

  size_efficiency: {
    name: 'Size Efficiency',
    category: 'Processing Value (Technical & Operational)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Physical footprint, storage requirements, and transportation efficiency.',
    methodology:
      'Evaluates space requirements, scalability constraints, and logistics optimization.',
    calibration:
      'Consider: How much space is needed? How easily can it scale? Transportation friendly?',
    scale: [
      {
        score: 90,
        label: 'Extremely Efficient',
        description: 'Minimal footprint, digital or virtual',
      },
      {
        score: 75,
        label: 'Very Efficient',
        description: 'Compact facilities, limited space needs',
      },
      { score: 50, label: 'Moderate Footprint', description: 'Standard facility size' },
      { score: 30, label: 'Large Footprint', description: 'Significant space requirements' },
      { score: 10, label: 'Highly Space-Intensive', description: 'Massive infrastructure needs' },
    ],
    examples: [
      { score: 92, case: 'Digital material marketplace', reason: 'No physical footprint' },
      { score: 75, case: 'Compact sorting facility', reason: 'Optimized layout, minimal space' },
      { score: 50, case: 'Standard recycling center', reason: 'Typical warehouse size' },
      { score: 25, case: 'Large processing plant', reason: 'Substantial real estate requirements' },
    ],
  },

  chemical_safety: {
    name: 'Chemical Safety',
    category: 'Processing Value (Technical & Operational)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Environmental hazards and health risks (scored as inverse: higher = safer).',
    methodology: 'Assesses chemical exposure, toxicity levels, waste hazards, and disposal safety.',
    calibration:
      'Consider: How toxic are the materials? What are health risks? Disposal challenges?',
    scale: [
      {
        score: 90,
        label: 'Very Safe',
        description: 'Inert materials, minimal hazards, clean processes',
      },
      { score: 75, label: 'Generally Safe', description: 'Low hazards with standard precautions' },
      {
        score: 50,
        label: 'Manageable Hazards',
        description: 'Moderate risks, requires safety protocols',
      },
      {
        score: 30,
        label: 'Significant Hazards',
        description: 'High toxicity, strict protocols needed',
      },
      {
        score: 10,
        label: 'Extreme Hazards',
        description: 'Highly toxic, complex disposal required',
      },
    ],
    examples: [
      {
        score: 88,
        case: 'Paper and cardboard recycling',
        reason: 'Inert material, no chemical hazards',
      },
      {
        score: 70,
        case: 'Glass and metal recycling',
        reason: 'Generally safe, minimal chemical exposure',
      },
      {
        score: 50,
        case: 'Plastic recycling with cleaning',
        reason: 'Mild chemical exposure with protocols',
      },
      {
        score: 25,
        case: 'Electronic waste processing',
        reason: 'Heavy metals present, strict handling required',
      },
    ],
  },

  tech_readiness: {
    name: 'Tech Readiness',
    category: 'Processing Value (Technical & Operational)',
    weight: 0.1,
    weightPercent: '10%',
    definition:
      'Technology maturity level and implementation complexity (scored as inverse: higher = ready).',
    methodology: 'Based on TRL (Technology Readiness Level): 1-3=Lab, 4-6=Pilot, 7-9=Deployment.',
    calibration: 'Consider: Is this proven? Has it been tested? How complex to implement?',
    scale: [
      {
        score: 90,
        label: 'Deployment Ready',
        description: 'Proven technology, TRL 8-9, ready to scale',
      },
      { score: 75, label: 'Proven & Tested', description: 'Pilot demonstrated, TRL 6-7' },
      { score: 50, label: 'Demonstrated', description: 'Lab scale working, TRL 4-5' },
      { score: 30, label: 'Conceptual', description: 'Theory proven, TRL 2-3' },
      { score: 10, label: 'Emerging Concept', description: 'Theoretical stage, TRL 1' },
    ],
    examples: [
      {
        score: 88,
        case: 'Established recycling process',
        reason: 'Deployed globally for 20+ years',
      },
      {
        score: 70,
        case: 'Advanced sorting technology',
        reason: 'Several commercial installations running',
      },
      { score: 50, case: 'Pilot-stage separation tech', reason: 'Working at demonstration scale' },
      { score: 25, case: 'Lab-proven chemical process', reason: 'Early stage, needs optimization' },
    ],
  },
};

/**
 * Score interpretation categories
 */
export const scoreRanges = {
  'Strong (75-100)': {
    color: COLORS.success,
    backgroundColor: COLORS.strongBg,
    description: 'Excellent - This factor is a major strength',
  },
  'Moderate (50-74)': {
    color: COLORS.secondary,
    backgroundColor: COLORS.moderateBg,
    description: 'Good - This factor is viable',
  },
  'Weak (25-49)': {
    color: COLORS.accent,
    backgroundColor: COLORS.weakBg,
    description: 'Challenging - Needs improvement',
  },
  'Critical (0-24)': {
    color: COLORS.error,
    backgroundColor: COLORS.criticalBg,
    description: 'Problematic - Major weakness',
  },
};

/**
 * Integrity gap warning levels
 */
export const integrityGapLevels = {
  high: {
    color: COLORS.error,
    icon: '⚠️',
    label: 'Critical Inconsistency',
    description: 'Significant contradiction between scores and evidence',
  },
  medium: {
    color: COLORS.accent,
    icon: '⚡',
    label: 'Notable Inconsistency',
    description: 'Possible inflation in self-assessment',
  },
  low: {
    color: COLORS.secondary,
    icon: 'ℹ️',
    label: 'Minor Gap',
    description: 'Small discrepancy worth noting',
  },
};

/**
 * Confidence level interpretation
 */
export const confidenceLevels = {
  high: {
    min: 75,
    max: 100,
    color: COLORS.success,
    label: 'High Confidence',
    description: 'Strong evidence supports this assessment',
  },
  moderate: {
    min: 50,
    max: 74,
    color: COLORS.secondary,
    label: 'Moderate Confidence',
    description: 'Assessment is reasonable but has some uncertainty',
  },
  low: {
    min: 0,
    max: 49,
    color: COLORS.accent,
    label: 'Low Confidence',
    description: 'Limited evidence or conflicting signals',
  },
};

/**
 * Info modal content for form help
 */
export const formHelp = {
  problemGuide: {
    title: 'How to Describe Your Business Problem',
    content: `
    <h4>What to include:</h4>
    <ul>
      <li>The environmental challenge you're addressing</li>
      <li>Current scale of the problem</li>
      <li>Who is affected (consumers, businesses, communities)</li>
      <li>Why existing solutions are inadequate</li>
    </ul>

    <h4>Example:</h4>
    <p>"Single-use plastic packaging generates 8 million tons of ocean waste annually. Current recycling recovers only 30%. We address the 70% that ends up in landfills and oceans through an innovative collection network."</p>

    <p><strong>Minimum length:</strong> 50 characters (aim for 200+ for detailed analysis)</p>
    `,
  },

  solutionGuide: {
    title: 'How to Describe Your Business Solution',
    content: `
    <h4>What to include:</h4>
    <ul>
      <li>Your specific approach to solving the problem</li>
      <li>Materials or processes involved</li>
      <li>How your solution closes the circular loop</li>
      <li>Key competitive advantages</li>
      <li>Scale and geographic scope</li>
    </ul>

    <h4>Example:</h4>
    <p>"We collect used packaging via drop-off points and mail-back programs, processing it into compostable feedstock. Our hub-and-spoke model reaches 95% of urban areas. Materials are processed using water-based separation, with zero chemical waste."</p>

    <p><strong>Minimum length:</strong> 50 characters (aim for 200+ for detailed analysis)</p>
    `,
  },
};

/**
 * Parameter groups for organized display
 */
export const parameterGroups = {
  'Access Value': ['public_participation', 'infrastructure'],
  'Embedded Value': ['market_price', 'maintenance', 'uniqueness'],
  'Processing Value': ['size_efficiency', 'chemical_safety', 'tech_readiness'],
};

/**
 * Parameter labels for display
 */
export const parameterLabels = {
  public_participation: { label: 'Public Participation', category: 'Access Value' },
  infrastructure: { label: 'Infrastructure & Accessibility', category: 'Access Value' },
  market_price: { label: 'Market Price', category: 'Embedded Value' },
  maintenance: { label: 'Maintenance', category: 'Embedded Value' },
  uniqueness: { label: 'Uniqueness', category: 'Embedded Value' },
  size_efficiency: { label: 'Size Efficiency', category: 'Processing Value' },
  chemical_safety: { label: 'Chemical Safety', category: 'Processing Value' },
  tech_readiness: { label: 'Tech Readiness', category: 'Processing Value' },
};

/**
 * Factor definitions for info modals
 */
export const factorDefinitions = {
  public_participation: {
    title: 'Public Participation',
    desc: 'Measures how easily stakeholders, communities, and end-users can engage with and contribute to the circular system.',
    category: 'Access Value',
  },
  infrastructure: {
    title: 'Infrastructure & Accessibility',
    desc: 'Availability of necessary infrastructure and ease of access to circular economy resources and processes.',
    category: 'Access Value',
  },
  market_price: {
    title: 'Market Price',
    desc: 'Economic value and market demand for recovered or repurposed materials.',
    category: 'Embedded Value',
  },
  maintenance: {
    title: 'Maintenance',
    desc: 'Ease and cost of maintaining products, materials, or systems throughout their lifecycle.',
    category: 'Embedded Value',
  },
  uniqueness: {
    title: 'Uniqueness',
    desc: 'Rarity, specialty, or distinctive value of materials and their potential for reuse.',
    category: 'Embedded Value',
  },
  size_efficiency: {
    title: 'Size Efficiency',
    desc: 'Physical dimensions and volume, affecting handling, storage, and transportation efficiency.',
    category: 'Processing Value',
  },
  chemical_safety: {
    title: 'Chemical Safety',
    desc: 'Potential environmental and health hazards, impacting safe processing and disposal methods.',
    category: 'Processing Value',
  },
  tech_readiness: {
    title: 'Tech Readiness',
    desc: 'Complexity and availability of technology required for effective processing and recovery.',
    category: 'Processing Value',
  },
};

/**
 * Initial parameter values
 */
export const initialParameters = {
  public_participation: 50,
  infrastructure: 50,
  market_price: 50,
  maintenance: 50,
  uniqueness: 50,
  size_efficiency: 50,
  chemical_safety: 50,
  tech_readiness: 50,
};

/**
 * Valid parameter keys
 */
export const validKeys = [
  'public_participation',
  'infrastructure',
  'market_price',
  'maintenance',
  'uniqueness',
  'size_efficiency',
  'chemical_safety',
  'tech_readiness',
];

/**
 * Category mapping for display
 */
export const categoryMapping = {
  public_participation: {
    name: 'Public Participation',
    desc: 'How easily stakeholders, communities, and end-users can engage with and contribute to the circular system',
  },
  infrastructure: {
    name: 'Infrastructure & Accessibility',
    desc: 'Availability of necessary infrastructure and ease of access to circular economy resources and processes',
  },
  market_price: {
    name: 'Market Price',
    desc: 'Economic value and market demand for recovered or repurposed materials',
  },
  maintenance: {
    name: 'Maintenance',
    desc: 'Ease and cost of maintaining products, materials, or systems throughout their lifecycle',
  },
  uniqueness: {
    name: 'Uniqueness',
    desc: 'Rarity, specialty, or distinctive value of materials and their potential for reuse',
  },
  size_efficiency: {
    name: 'Size Efficiency',
    desc: 'Physical dimensions and volume, affecting handling, storage, and transportation efficiency',
  },
  chemical_safety: {
    name: 'Chemical Safety',
    desc: 'Potential environmental and health hazards, impacting safe processing and disposal methods',
  },
  tech_readiness: {
    name: 'Tech Readiness',
    desc: 'Complexity and availability of technology required for effective processing and recovery',
  },
};

export default {
  VIEWS,
  COLORS,
  parameterGuidance,
  scoreRanges,
  integrityGapLevels,
  confidenceLevels,
  formHelp,
  parameterGroups,
  parameterLabels,
  factorDefinitions,
  initialParameters,
  validKeys,
  categoryMapping,
};
