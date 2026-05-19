/**
 * @module guidePageContent
 * @description Content for the Guide page.
 * Provides comprehensive guide content including getting started instructions,
 * scoring and benchmarking explanations, results interpretation, and evaluation parameters.
 */

// Import all drawer content
import { Cog, DollarSign, Users } from 'lucide-react';

import {
  ASSESSMENT_METHODOLOGY_CONTENT,
  BUSINESS_CONTEXT_HEADING_CONTENT,
  BUSINESS_PROBLEM_CONTENT,
  BUSINESS_SOLUTION_CONTENT,
  EVALUATION_CRITERIA_CONTENT,
  SAMPLE_TEST_CASES_HEADING_CONTENT,
  parameterGuidance,
} from '@/constants/drawers';

// Transferred content from drawers/GuidePageContent.js

// Getting Started Content
const GETTING_STARTED = {
  subtitle: 'Everything you need to run your first assessment',
  intro:
    'The assessment takes 5–10 minutes to complete. You can run it anonymously (up to 20 free assessments) or sign in for unlimited saves and comparison tools.',
  anonymousVsAuth: {
    anonymous: {
      title: 'Anonymous (no sign-in)',
      points: [
        'Up to 20 assessments per IP address',
        'Results saved in browser localStorage - cleared if you clear browser data',
        'No access to comparison tool or assessment history',
        'Public share links not available',
      ],
    },
    authenticated: {
      title: 'Signed In',
      points: [
        'Unlimited assessments stored permanently in your account',
        'Full assessment history with rename and delete',
        'Side-by-side comparison of any two saved assessments',
        'Public share links with opaque URLs (results visible without login)',
        'Export individual or comparison results as PDF or CSV',
      ],
    },
  },
  quickstartSteps: [
    {
      number: 1,
      title: 'Describe your business problem',
      description:
        'Write at least 200 characters describing the environmental or circular economy challenge your business addresses. Include specific numbers and context.',
    },
    {
      number: 2,
      title: 'Describe your solution',
      description:
        'Explain how your business solves the problem with technical detail — materials, processes, circularity loop, and metrics. Also minimum 200 characters.',
    },
    {
      number: 3,
      title: 'Set your evaluation parameters',
      description:
        'Score your business across 8 factors (0–100) or use the auto-fill toggle to let the AI infer them from your descriptions.',
    },
    {
      number: 4,
      title: 'Optionally add business context',
      description:
        'Fill in the 6 context fields (business model type, stage, geography, etc.) to improve AI calibration. These are optional but improve accuracy.',
    },
    {
      number: 5,
      title: 'Run the assessment',
      description:
        'The full pipeline takes 3–8 seconds. Results include a circularity score, tier badge, 3 similar real-world cases, and an AI-generated improvement roadmap.',
    },
  ],
  bestPracticeTips: [
    {
      title: 'Use specific numbers',
      description:
        'Phrases like "8 million tonnes of ocean plastic" score significantly better than "a lot of plastic waste". The AI rewards quantification.',
    },
    {
      title: 'Name your materials explicitly',
      description:
        'Say "post-consumer PET bottles" not "recycled plastic". Specific material names match better against the knowledge base.',
    },
    {
      title: 'Close the loop in your solution',
      description:
        'Explicitly describe how materials return to productive use. The circularity loop is the single most important signal in the scoring model.',
    },
    {
      title: 'Load a test case first',
      description:
        'Before writing your own submission, load one of the sample test cases to see what a strong submission looks like at your detail level.',
    },
    {
      title: 'Be honest with parameter scores',
      description:
        'The AI runs an integrity check comparing your self-assessed scores against the evidence in your descriptions. Overestimating will be flagged.',
    },
    {
      title: 'Describe your geography specifically',
      description:
        'Say "urban municipalities in Western Europe" not just "global". Geographic specificity narrows the knowledge-base search to cases with matching regulatory and infrastructure contexts.',
    },
    {
      title: 'Mention regulatory or certification context',
      description:
        'References to ISO standards, EPA compliance, EU directives, or industry certifications help the AI identify cases from comparable regulatory environments — improving benchmark relevance.',
    },
  ],
};

// Scoring & Benchmarking Content
const SCORING_BENCHMARKING = {
  subtitle: 'How your score is calculated and what it means',
  intro:
    'Your circularity score is not a simple average — it is a weighted combination of 8 factors calibrated against real-world benchmarks from 40,000+ case studies. Understanding the scoring model helps you interpret your results and target improvements.',
  tiers: [
    {
      name: 'Leader',
      range: '80–100',
      color: 'success',
      description:
        'Top-tier circular economy performance. Your initiative demonstrates best-practice circularity across most dimensions and compares favourably with established real-world programmes.',
      badge: '🏆',
    },
    {
      name: 'Established',
      range: '60–79',
      color: 'info',
      description:
        'Strong circular economy fundamentals with clear room for improvement. Most commercially viable circular businesses land in this tier at maturity.',
      badge: '⬆',
    },
    {
      name: 'Developing',
      range: '40–59',
      color: 'warning',
      description:
        'Core circular intent is present but key gaps exist — often in infrastructure, market viability, or loop closure. The improvement roadmap will target these specifically.',
      badge: '🔧',
    },
    {
      name: 'Emerging',
      range: '0–39',
      color: 'accent',
      description:
        'Early-stage circular concept. The assessment has identified significant barriers to circularity. Use the recommendations as a development roadmap.',
      badge: '🌱',
    },
  ],
  weightedScoring: {
    explanation:
      'Each of the 8 evaluation parameters contributes to the final score according to its weight. Parameters are not equal — Market Price (20%) has twice the influence of Size Efficiency (10%). This reflects how much each factor determines the real-world viability of circular economy initiatives based on evidence from the knowledge base.',
    formula: 'Final Score = Σ (Parameter Score × Parameter Weight)',
    note: "The Weighted Score Card in your results breaks this down per factor, showing each parameter's raw score, its weighted contribution, and whether it is a Strong, Moderate, Weak, or Critical dimension.",
  },
  consistencyCheck: {
    explanation:
      'The Parameter Consistency analysis checks whether your 8 parameter scores make logical sense together. For example: if you claim high Market Price (85) but low Tech Readiness (20), the system flags this as potentially inconsistent — high-value recovered materials typically require sophisticated processing technology.',
    rules: [
      'High Market Price with very low Tech Readiness is flagged',
      'High Public Participation with no Infrastructure is flagged',
      'High Uniqueness with very low Market Price is questioned',
      'Uniform high scores across all 8 parameters are scrutinised for overestimation',
    ],
    note: 'Consistency scores above 70 indicate internally coherent self-assessment. Below 50 usually means the AI detected unrealistic score combinations.',
  },
  knowledgeBase: {
    summary:
      'Your score is calibrated against 40,000+ document chunks from 34 curated datasets. The 3 closest matches to your submission are selected via hybrid search (vector cosine similarity + BM25 keyword matching) and used as the benchmark for the AI audit.',
    sources: [
      { name: 'Ellen MacArthur Foundation', count: '3,825+', type: 'Case studies' },
      { name: 'GreenTechGuardians', count: '2,286', type: 'Case studies' },
      { name: 'Eurostat', count: '501+', type: 'Environmental records' },
      { name: 'Academic & government datasets', count: '6,000+', type: 'Research records' },
      { name: 'Corporate sustainability reports', count: '~27,000', type: 'Mixed document chunks' },
    ],
    searchNote:
      'Hybrid search combines semantic similarity (OpenAI text-embedding-3-small, 1536 dimensions) with BM25 keyword ranking. This means even niche or highly technical submissions find relevant benchmarks - pure vector search alone misses keyword-specific matches.',
  },
  rStrategy: {
    explanation:
      'R-Strategy Alignment checks whether your evaluation parameter scores match the circular strategy your descriptions imply. The system detects your primary strategy from 9 profile types and compares it against your scores.',
    strategies: [
      { code: 'Refuse', description: 'Redesigning products to eliminate waste from the start' },
      { code: 'Reduce', description: 'Minimising material input and waste generation' },
      { code: 'Reuse', description: 'Using products or components again without reprocessing' },
      { code: 'Repair', description: 'Maintaining and restoring products to working order' },
      { code: 'Refurbish', description: 'Restoring products to a specified quality standard' },
      { code: 'Remanufacture', description: 'Rebuilding products to original specifications' },
      { code: 'Repurpose', description: 'Using components or materials for a different function' },
      { code: 'Recycle', description: 'Processing materials to recover feedstock' },
      { code: 'Recover', description: 'Energy recovery as a last resort before disposal' },
    ],
  },
};

// Understanding Results Content
const UNDERSTANDING_RESULTS = {
  subtitle: 'How to read and act on your assessment report',
  intro:
    'Your results page contains six distinct sections generated by the three-layer pipeline. This guide explains what each section shows and how to use it.',
  sections: [
    {
      title: 'Score Overview',
      description:
        'Shows your overall circularity score (0–100), CE tier badge, and a radar chart breaking down performance across the three value dimensions. The percentile estimate shows where you rank against all scored submissions in the database.',
    },
    {
      title: 'Weighted Score Card',
      description:
        'A table showing each of the 8 parameters with its raw score, weight, weighted contribution, and a Strong/Moderate/Weak/Critical classification. The top 2 contributors and bottom 2 contributors are highlighted.',
    },
    {
      title: 'Database Evidence',
      description:
        'The 3 most semantically similar real-world projects from the 40,000+ document knowledge base. Each shows a cleaned summary, industry, R-strategy, geographic focus, and the similarity score that caused it to be selected. These are the benchmarks your score was calibrated against.',
    },
    {
      title: 'Audit Summary',
      description:
        "The AI's comparative analysis of your submission against the 3 similar cases. Includes: an integrity gap list (where your self-assessed scores may be overestimated relative to evidence), identified strengths, and specific technical recommendations.",
    },
    {
      title: 'Improvement Roadmap',
      description:
        '3 prioritised improvement actions generated by GPT-4o-mini. Each action shows the target evaluation factor, estimated effort level (Low/Medium/High), expected impact, and suggested timeframe. Actions are ordered by impact-to-effort ratio.',
    },
    {
      title: 'SDG Alignment',
      description:
        '2–4 UN Sustainable Development Goals that your initiative most directly supports, with a specific rationale for each. Grounded in your submission content and the database evidence — not generic SDG mapping.',
    },
  ],
  improvementRoadmapDetail: {
    howGenerated:
      'Each action is generated by GPT-4o-mini after reading your submission alongside the 3 closest knowledge-base matches. Actions are grounded in the specific gaps between your description and your benchmark cases - not generic circular economy advice.',
    actionFields: [
      { field: 'Target Parameter', desc: 'Which of the 8 evaluation factors the action addresses' },
      {
        field: 'Effort',
        desc: 'Estimated implementation effort: Low (operational change), Medium (partnership or process), or High (infrastructure or capital)',
      },
      { field: 'Impact', desc: 'Expected score improvement if the action is fully implemented' },
      {
        field: 'Timeframe',
        desc: 'Suggested timeline: Quick Win (under 3 months), Short-Term (3-12 months), or Strategic (12+ months)',
      },
    ],
  },
  sdgDetail: {
    explanation:
      'SDG mapping is performed by GPT-4o-mini after reviewing your submission and the database evidence. Only SDGs with a clear, specific connection to your described activities are included - the model is instructed to avoid broad or tenuous mappings.',
    commonSDGs: [
      {
        goal: 'SDG 12',
        name: 'Responsible Consumption and Production',
        relevance: 'Most circular economy initiatives map here',
      },
      {
        goal: 'SDG 13',
        name: 'Climate Action',
        relevance: 'Relevant when carbon footprint reduction is quantified',
      },
      {
        goal: 'SDG 9',
        name: 'Industry, Innovation and Infrastructure',
        relevance: 'Relevant for novel processing technology or infrastructure',
      },
      {
        goal: 'SDG 11',
        name: 'Sustainable Cities and Communities',
        relevance: 'Relevant for urban waste or local logistics models',
      },
      {
        goal: 'SDG 14/15',
        name: 'Life Below/On Land',
        relevance: 'Relevant when ocean plastic or land pollution is the core problem',
      },
    ],
  },
  savingAndExporting: {
    saving: [
      {
        action: 'Save assessment',
        how: 'Click "Save" in the Results action bar. Requires sign-in. Saved assessments appear in My Assessments with the date and circularity score.',
      },
      {
        action: 'Rename assessment',
        how: 'Open My Assessments, click the three-dot menu on any saved assessment, and choose Rename.',
      },
      {
        action: 'Compare two assessments',
        how: 'Select any two saved assessments in My Assessments and click Compare. The comparison shows score differences, factor-by-factor deltas, and side-by-side database evidence.',
      },
      {
        action: 'Share results publicly',
        how: 'Click "Share" in the Results action bar to generate a public link. Anyone with the link can view your results without signing in.',
      },
    ],
    exporting: [
      {
        format: 'PDF',
        description:
          'Formatted report including score, tier, radar chart, factor breakdown, audit summary, and improvement roadmap. Suitable for presentations and stakeholder reports.',
      },
      {
        format: 'CSV',
        description:
          'Raw data export with all parameter scores, weighted contributions, metadata, and enrichment fields. Suitable for spreadsheet analysis or importing into other tools.',
      },
    ],
  },
  exportNote:
    'All results can be exported as PDF (formatted report) or CSV (raw data). Authenticated users can save assessments, rename them, and compare two assessments side-by-side using the Compare tool.',
};
// Export all content as a single bundle for easy importing
const GUIDE_PAGE_CONTENT = {
  overview: {
    methodologyItems: ASSESSMENT_METHODOLOGY_CONTENT.items,
    dataSources: ASSESSMENT_METHODOLOGY_CONTENT.dataSources,
    intro:
      'The Circular Economy Assessor evaluates your business idea against 40,000+ real-world case studies using a three-layer pipeline — from optional business context inputs through deterministic scoring to LLM-enriched insights. Use this guide to understand how to write strong submissions, interpret your scores, and get the most from your assessment.',
    layers: [
      {
        number: 1,
        name: 'Business Context',
        color: 'accent',
        description:
          'Optional structured inputs that calibrate AI to your specific business stage and model.',
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
  gettingStarted: {
    ...GETTING_STARTED,
    autoFillNote:
      'The auto-fill toggle on the evaluation parameters form uses your problem and solution text to infer approximate parameter scores. It is a starting point — review and adjust each score based on your actual situation. Auto-filled scores are typically conservative, designed to avoid the overestimation the integrity check penalises.',
  },
  businessProblem: {
    subtitle:
      'Describe environmental or circular economy challenge your business addresses. The AI uses this to find semantically similar real-world cases and calibrate your score against them.',
    intro:
      'A strong problem statement is specific, quantified, and grounded in real-world data. Vague or generic descriptions will match poorly against knowledge base and reduce scoring accuracy.',
    scoringImpact:
      'The problem statement feeds the semantic search step. A detailed, specific problem finds closer knowledge-base matches, which gives the AI better benchmarks to score against. Vague problems match broadly, producing less precise calibration and weaker recommendations.',
    elements: BUSINESS_PROBLEM_CONTENT.elements,
    writingTips: BUSINESS_PROBLEM_CONTENT.writingTips,
    example: BUSINESS_PROBLEM_CONTENT.example,
  },
  businessSolution: {
    subtitle:
      "Explain how your business closes the loop — what materials you use, how they're processed, how they return to use, and what the economics look like.",
    intro:
      'The AI is looking for evidence of genuine circularity: closed loops, recovered materials re-entering the system, and quantifiable outcomes. The more specific and technical your description, the more accurate the comparison to real-world benchmarks.',
    scoringImpact:
      'The solution description feeds both the semantic search and the AI audit layer. The audit compares your described processes and outcomes against the 3 closest real-world cases. Specific materials, named technologies, and quantified metrics give the AI concrete evidence to evaluate — abstract descriptions produce lower confidence scores and weaker integrity checks.',
    components: BUSINESS_SOLUTION_CONTENT.components,
    circularityLoopExplainer: {
      intro:
        'A genuine circular economy solution must demonstrate a closed material loop - where recovered or processed materials return to productive use rather than ending as waste. The AI specifically looks for this loop closure in your solution description.',
      strongLoop: [
        'Explicitly state what happens to the material at end-of-use',
        'Name who processes or recovers it and by what method',
        'Describe where the recovered material goes next (back into your product, sold to a partner, etc.)',
        'Quantify the recovery rate, even approximately (e.g. "85% of material recaptured")',
      ],
      weakLoop: [
        '"Recyclable" without describing your collection or recovery mechanism',
        '"Sustainable materials" without explaining end-of-life',
        'Donation or resale described as circularity without material recovery',
        'Composting without explaining how compost re-enters the system',
      ],
    },
    pitfalls: BUSINESS_SOLUTION_CONTENT.pitfalls,
    proTips: BUSINESS_SOLUTION_CONTENT.proTips,
    example: BUSINESS_SOLUTION_CONTENT.example,
  },
  businessContext: {
    intro:
      'These optional fields improve AI calibration by providing structured context about your business, enabling stage-appropriate benchmarking and more precise recommendations. None are required, but each one you fill in sharpens scoring.',
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
        icon: Users,
        iconColor: 'text-(--color-info)',
      },
      {
        id: 'embedded-value',
        title: 'Embedded Value',
        color: 'success',
        description: 'Economic worth and technical integration',
        paramKeys: ['market_price', 'maintenance', 'uniqueness'],
        icon: DollarSign,
        iconColor: 'text-(--color-success)',
      },
      {
        id: 'processing-value',
        title: 'Processing Value',
        color: 'accent',
        description: 'Environmental efficiency and technical readiness',
        paramKeys: ['size_efficiency', 'chemical_safety', 'tech_readiness'],
        icon: Cog,
        iconColor: 'text-(--color-accent)',
      },
    ],
    calculationSteps: EVALUATION_CRITERIA_CONTENT.calculationSteps,
  },
  evaluationParameters: {
    intro:
      'Each parameter is scored 0–100 and weighted according to its importance in circular economy success. Click any card to jump to the full scoring guide for that parameter, including the 5-level scale and real-world example cases.',
    parameterScoringNote:
      'Parameter scores are self-assessed (0–100). The AI does not override them — instead, it runs an integrity check comparing your scores against the evidence in your text descriptions and against your 3 benchmark cases. Scores that appear overestimated relative to the textual evidence are flagged in the Audit Summary.',
    parameters: parameterGuidance,
  },
  scoringBenchmarking: SCORING_BENCHMARKING,
  understandingResults: UNDERSTANDING_RESULTS,
  sampleTestCases: {
    intro:
      'The platform includes pre-filled assessment submissions based on real circular economy business models. Loading one populates the entire form so you can see exactly what a strong submission looks like before writing your own.',
    description: SAMPLE_TEST_CASES_HEADING_CONTENT.description,
    benefits: SAMPLE_TEST_CASES_HEADING_CONTENT.benefits,
    steps: SAMPLE_TEST_CASES_HEADING_CONTENT.sections.howTheyWork.steps,
    tip: SAMPLE_TEST_CASES_HEADING_CONTENT.sections.tip,
  },
};

export default GUIDE_PAGE_CONTENT;
