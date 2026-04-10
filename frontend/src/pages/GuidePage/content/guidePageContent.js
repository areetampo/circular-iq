// Import all drawer content
import {
  ASSESSMENT_METHODOLOGY_CONTENT,
  BUSINESS_CONTEXT_HEADING_CONTENT,
  BUSINESS_PROBLEM_CONTENT,
  BUSINESS_SOLUTION_CONTENT,
  EVALUATION_CRITERIA_CONTENT,
  EVALUATION_PARAMETERS_HEADING_CONTENT,
  SAMPLE_TEST_CASES_HEADING_CONTENT,
  SPECIFIC_PARAMETER_CONTENT,
  parameterGuidance,
} from '@/constants/drawers';

// Original content
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

// Transferred content from drawers/GuidePageContent.js

// Assessment Methodology Content (shared with AssessmentMethodology drawer)
export const ASSESSMENT_METHODOLOGY = {
  ...ASSESSMENT_METHODOLOGY_CONTENT,
  // Transform drawer format to GuidePage format
  items: ASSESSMENT_METHODOLOGY_CONTENT.items.map((item) => ({
    icon: item.icon, // Keep the icon component reference
    title: item.title,
    description: item.description,
    borderColor:
      item.accentBorder === 'border-blue-400'
        ? 'var(--info)'
        : item.accentBorder === 'border-emerald-400'
          ? 'var(--success)'
          : item.accentBorder === 'border-orange-400'
            ? 'var(--warning)'
            : item.accentBorder === 'border-purple-400'
              ? 'var(--accent)'
              : 'var(--border)',
    bgColor:
      item.gradientFrom === 'from-blue-50'
        ? 'var(--info-soft)'
        : item.gradientFrom === 'from-emerald-50'
          ? 'var(--success-soft)'
          : item.gradientFrom === 'from-orange-50'
            ? 'var(--warning-soft)'
            : item.gradientFrom === 'from-purple-50'
              ? 'var(--accent-soft)'
              : 'var(--surface)',
  })),
};

// Business Problem Content (shared with BusinessProblem drawer)
export const BUSINESS_PROBLEM = {
  elements: BUSINESS_PROBLEM_CONTENT.elements,
  writingTips: BUSINESS_PROBLEM_CONTENT.writingTips,
  example: BUSINESS_PROBLEM_CONTENT.example,
};

// Business Solution Content (shared with BusinessSolution drawer)
export const BUSINESS_SOLUTION = {
  components: BUSINESS_SOLUTION_CONTENT?.components || [],
  pitfalls: BUSINESS_SOLUTION_CONTENT?.pitfalls || [],
  example: BUSINESS_SOLUTION_CONTENT?.example || '',
};

// Evaluation Criteria Content (shared with EvaluationCriteria drawer)
export const EVALUATION_CRITERIA = {
  ...EVALUATION_CRITERIA_CONTENT,
  // Transform color names to CSS variables for GuidePage
  valueSections: EVALUATION_CRITERIA_CONTENT.valueSections.map((section) => ({
    ...section,
    color:
      section.color === 'blue'
        ? 'var(--info)'
        : section.color === 'emerald'
          ? 'var(--success)'
          : section.color === 'teal'
            ? 'var(--accent)'
            : 'var(--foreground)',
    borderColor:
      section.borderColor === 'border-blue-500'
        ? 'var(--info)'
        : section.borderColor === 'border-emerald-600'
          ? 'var(--success)'
          : section.borderColor === 'border-teal-600'
            ? 'var(--accent)'
            : 'var(--border)',
  })),
  metrics: EVALUATION_CRITERIA_CONTENT.metrics.map((metric) => ({
    ...metric,
    color:
      metric.color === 'blue'
        ? 'var(--info)'
        : metric.color === 'emerald'
          ? 'var(--success)'
          : 'var(--foreground)',
  })),
};

// Evaluation Parameters Content (shared with EvaluationParametersHeading drawer)
export const EVALUATION_PARAMETERS = {
  ...EVALUATION_PARAMETERS_HEADING_CONTENT,
  factors: parameterGuidance || {},
  metrics: parameterGuidance || {},
};

// Sample Test Cases Content (shared with SampleTestCases drawer)
export const SAMPLE_TEST_CASES = {
  ...SAMPLE_TEST_CASES_HEADING_CONTENT,
  // Add any additional GuidePage-specific content here
};

// Business Context Content (shared with BusinessContextHeading drawer)
export const BUSINESS_CONTEXT = {
  ...BUSINESS_CONTEXT_HEADING_CONTENT,
  // Add any additional GuidePage-specific content here
};

// Specific Evaluation Parameters Content (shared with SpecificEvaluationParameter drawer)
export const SPECIFIC_EVALUATION_PARAMETERS = {
  ...SPECIFIC_PARAMETER_CONTENT,
  // Add any additional GuidePage-specific content here
};

// Export all content as a single bundle for easy importing
export const GUIDE_PAGE_CONTENT = {
  overview: {
    methodologyItems: ASSESSMENT_METHODOLOGY_CONTENT.items,
    intro:
      'The Circular Economy Assessor evaluates your business idea against 40,000+ real-world case studies using a three-layer pipeline — from optional business context inputs through deterministic scoring to LLM-enriched insights. Use this guide to understand how to write strong submissions, interpret your scores, and get the most from the assessment.',
    layers: [
      {
        number: 1,
        name: 'Business Context',
        color: 'accent',
        description:
          'Optional structured inputs that calibrate the AI to your specific business stage and model.',
        outputs: [
          'Business Model Type',
          'Operational Stage',
          'Target Geography',
          'Annual Volume',
          'Material Complexity',
          'Existing Partnerships',
        ],
      },
      {
        number: 2,
        name: 'Deterministic Outputs',
        color: 'success',
        description:
          'Fully reproducible, no-LLM calculations run on every assessment regardless of AI availability.',
        outputs: [
          'Weighted Score Card',
          'CE Tier',
          'Parameter Consistency',
          'R-Strategy Alignment',
        ],
      },
      {
        number: 3,
        name: 'Extended LLM Output',
        color: 'info',
        description:
          'GPT-4o-mini analysis grounded in your 3 closest knowledge-base matches, with evidence-based reasoning.',
        outputs: [
          'Improvement Roadmap',
          'SDG Alignment',
          'Market Opportunity',
          'Audit Verdict',
          'Similar Cases',
        ],
      },
    ],
  },
  businessProblem: {
    subtitle:
      'Describe the environmental or circular economy challenge your business addresses. The AI uses this to find semantically similar real-world cases and calibrate your score against them.',
    intro:
      'A strong problem statement is specific, quantified, and grounded in real-world data. Vague or generic descriptions will match poorly against the knowledge base and reduce scoring accuracy.',
    elements: BUSINESS_PROBLEM_CONTENT.elements,
    writingTips: BUSINESS_PROBLEM_CONTENT.writingTips,
    example: BUSINESS_PROBLEM_CONTENT.example,
  },
  businessSolution: {
    subtitle:
      "Explain how your business closes the loop — what materials you use, how they're processed, how they return to use, and what the economics look like.",
    intro:
      'The AI is looking for evidence of genuine circularity: closed loops, recovered materials re-entering the system, and quantifiable outcomes. The more specific and technical your description, the more accurate the comparison to real-world benchmarks.',
    components: BUSINESS_SOLUTION_CONTENT.components,
    pitfalls: BUSINESS_SOLUTION_CONTENT.pitfalls,
    proTips: BUSINESS_SOLUTION_CONTENT.proTips,
    example: BUSINESS_SOLUTION_CONTENT.example,
  },
  businessContext: {
    intro:
      'These optional fields improve AI calibration by providing structured context about your business, enabling stage-appropriate benchmarking and more precise recommendations. None are required, but each one you fill in sharpens the scoring.',
    fields: BUSINESS_CONTEXT_HEADING_CONTENT.fields,
  },
  evaluationCriteria: {
    intro:
      'Your submission is assessed across three value dimensions, each containing specific factors. The AI analyses your business description against each factor independently, then combines them into a weighted overall circularity score.',
    metrics: EVALUATION_CRITERIA_CONTENT.metrics,
    valueSections: [
      {
        id: 'access-value',
        title: 'Access Value',
        color: 'info',
        description: 'Social participation and infrastructure accessibility',
        paramKeys: ['public_participation', 'infrastructure'],
      },
      {
        id: 'embedded-value',
        title: 'Embedded Value',
        color: 'success',
        description: 'Economic worth and technical integration',
        paramKeys: ['market_price', 'maintenance', 'uniqueness'],
      },
      {
        id: 'processing-value',
        title: 'Processing Value',
        color: 'accent',
        description: 'Environmental efficiency and technical readiness',
        paramKeys: ['size_efficiency', 'chemical_safety', 'tech_readiness'],
      },
    ],
    calculationSteps: EVALUATION_CRITERIA_CONTENT.calculationSteps,
  },
  evaluationParameters: {
    intro:
      'Each parameter is scored 0–100 and weighted according to its importance in circular economy success. Click any card to jump to the full scoring guide for that parameter, including the 5-level scale and real-world example cases.',
    parameters: parameterGuidance,
  },
  sampleTestCases: {
    intro:
      'The platform includes pre-filled assessment submissions based on real circular economy business models. Loading one populates the entire form so you can see exactly what a strong submission looks like before writing your own.',
    description: SAMPLE_TEST_CASES_HEADING_CONTENT.description,
    benefits: SAMPLE_TEST_CASES_HEADING_CONTENT.benefits,
    steps: SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.steps,
    tip: SAMPLE_TEST_CASES_HEADING_CONTENT.sections.tip,
  },
};

// Export parameter guidance for direct access
export { parameterGuidance };
