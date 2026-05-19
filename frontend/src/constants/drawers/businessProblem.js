/**
 * @module businessProblem
 * @description Content for the business problem guide drawer.
 * Provides guidance on writing effective business problem descriptions
 * with elements, writing tips, and an example.
 */

/**
 * Business problem content object.
 * @type {Object}
 */
export const BUSINESS_PROBLEM_CONTENT = {
  title: 'Business Problem Guide',
  subtitle: 'Environmental or circular economy challenge',
  elements: [
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
  ],
  writingTips: [
    'Start with a compelling statistic or fact.',
    'Use specific numbers instead of vague terms.',
    'Connect the problem to economic or social costs.',
    'Reference industry standards or regulations when relevant.',
    'Cite sources if available (e.g., EPA, industry studies).',
  ],
  example:
    'Single-use plastic packaging creates 8 million tons of ocean waste annually, disrupting marine ecosystems and food chains. Current alternatives are cost-prohibitive (> $2/unit) or require industrial composting infrastructure that 75% of municipalities lack. This leaves a gap between demand for sustainable packaging and practical implementation at scale.',
};
