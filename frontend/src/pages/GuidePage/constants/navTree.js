/**
 * Structured Guide page navigation and R-strategy class maps consumed by TOC and scoring sections.
 */

/**
 * Hierarchical sidebar TOC for the Guide page, grouped by parent section and child anchor ids.
 * Child ids are observed by `useGuideScrollSpy` for scroll highlighting.
 *
 * @type {Array<{ id: string, label: string, children?: Array<{ id: string, label: string }> }>}
 */
export const NAV_TREE = [
  {
    id: 'overview',
    label: 'Overview',
    children: [
      { id: 'how-it-works', label: 'How It Works' },
      { id: 'data-sources', label: 'Data Sources' },
      { id: 'assessment-layers', label: 'Assessment Layers' },
    ],
  },
  {
    id: 'getting-started',
    label: 'Getting Started',
    children: [
      { id: 'quickstart-steps', label: 'Quickstart Steps' },
      { id: 'anon-vs-auth', label: 'Anonymous vs Signed In' },
      { id: 'tips-for-best-results', label: 'Tips for Best Results' },
    ],
  },
  {
    id: 'business-problem',
    label: 'Business Problem',
    children: [
      { id: 'problem-elements', label: 'Essential Elements' },
      { id: 'problem-tips', label: 'Writing Tips' },
      { id: 'problem-example', label: 'Example' },
    ],
  },
  {
    id: 'business-solution',
    label: 'Business Solution',
    children: [
      { id: 'solution-components', label: 'Critical Components' },
      { id: 'circularity-loop', label: 'Circularity Loop' },
      { id: 'solution-pitfalls', label: 'Common Pitfalls' },
      { id: 'solution-tips', label: 'Pro Tips' },
      { id: 'solution-example', label: 'Example' },
    ],
  },
  {
    id: 'business-context',
    label: 'Business Context',
    children: [
      { id: 'context-why', label: 'Why It Matters' },
      { id: 'context-fields', label: 'Field Definitions' },
    ],
  },
  {
    id: 'evaluation-criteria',
    label: 'Evaluation Criteria',
    children: [
      { id: 'access-value', label: 'Access Value' },
      { id: 'embedded-value', label: 'Embedded Value' },
      { id: 'processing-value', label: 'Processing Value' },
      { id: 'score-calculation', label: 'Score Calculation' },
    ],
  },
  {
    id: 'evaluation-parameters',
    label: 'Evaluation Parameters',
    children: [
      { id: 'parameter-overview', label: 'Parameter Overview' },
      { id: 'param-public_participation', label: 'Public Participation' },
      { id: 'param-infrastructure', label: 'Infrastructure' },
      { id: 'param-market_price', label: 'Market Price' },
      { id: 'param-maintenance', label: 'Maintenance' },
      { id: 'param-uniqueness', label: 'Uniqueness' },
      { id: 'param-size_efficiency', label: 'Size Efficiency' },
      { id: 'param-chemical_safety', label: 'Chemical Safety' },
      { id: 'param-tech_readiness', label: 'Tech Readiness' },
    ],
  },
  {
    id: 'scoring-benchmarking',
    label: 'Scoring & Benchmarking',
    children: [
      { id: 'circularity-tiers', label: 'Circularity Tiers' },
      { id: 'weighted-scoring', label: 'Weighted Scoring' },
      { id: 'consistency-check', label: 'Consistency Check' },
      { id: 'knowledge-base', label: 'Knowledge Base' },
      { id: 'r-strategy', label: 'R-Strategy Alignment' },
    ],
  },
  {
    id: 'understanding-results',
    label: 'Understanding Results',
    children: [
      { id: 'results-overview', label: 'Results Overview' },
      { id: 'improvement-roadmap', label: 'Improvement Roadmap' },
      { id: 'sdg-alignment', label: 'SDG Alignment' },
      { id: 'database-evidence', label: 'Database Evidence' },
      { id: 'saving-exporting', label: 'Saving & Exporting' },
    ],
  },
  {
    id: 'sample-test-cases',
    label: 'Sample Test Cases',
    children: [{ id: 'test-cases-how-to', label: 'How to Use' }],
  },
];

/**
 * Left-border Tailwind classes keyed by R-strategy label for guide strategy chips.
 *
 * @type {Record<string, string>}
 */
export const R_STRATEGY_COLORS = {
  Refuse: 'border-l-2 border-(--color-success)',
  Reduce: 'border-l-2 border-(--color-success)',
  Reuse: 'border-l-2 border-(--color-info)',
  Repair: 'border-l-2 border-(--color-info)',
  Refurbish: 'border-l-2 border-(--color-accent)',
  Remanufacture: 'border-l-2 border-(--color-accent)',
  Repurpose: 'border-l-2 border-(--color-accent)',
  Recycle: 'border-l-2 border-(--color-text-muted)',
  Recover: 'border-l-2 border-(--color-text-muted)',
};
