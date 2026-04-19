import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';

let openaiClient = new OpenAI({
  apiKey: BACKEND_CONFIG.openai.apiKey,
});

export function setOpenAIClient(client) {
  openaiClient = client;
}

// Place this above the Promise.all in cleanSimilarCases
const IMPACT_ARTIFACT_PATTERNS = [
  /^Score:\s*\d+\/\d+/i,
  /^\d+\s*certifications?$/i,
  /^BAT-AEL:\s*[\d.,]+\s*mg\/l$/i,
  /^[\d.,]+\s*mg\/l$/i,
];

/**
 * Main export function: Generate complete audit with metadata and gap analysis
 *
 * @param {string} businessProblem - The environmental/circular economy problem addressed
 * @param {string} businessSolution - How the business solves the problem
 * @param {Object} scores - Calculated scores object with overall_score and sub_scores
 * @param {Array} similarDocs - Top matching documents from database with similarity scores
 * @returns {Promise<Object>} Complete response including metadata, audit, gap analysis
 */
export async function generateCompleteAudit(
  businessProblem,
  businessSolution,
  scores,
  similarDocs = [],
) {
  // Extract metadata
  const metadata = await extractMetadata(businessProblem, businessSolution);

  // Generate reasoning and audit analysis
  const audit = await generateReasoning(businessProblem, businessSolution, scores, similarDocs);

  // Calculate gap analysis
  const gap_analysis = calculateGapAnalysis(scores, similarDocs);

  return {
    metadata,
    audit,
    gap_analysis,
  };
}

/**
 * Extract structured metadata (industry, scale, strategy) from problem/solution
 *
 * @param {string} businessProblem - The environmental/circular economy problem addressed
 * @param {string} businessSolution - How the business solves the problem
 * @returns {Promise<Object>} Extracted metadata {industry, scale, strategy, circular_metrics}
 */
export async function extractMetadata(businessProblem, businessSolution) {
  const combinedText = `Problem: ${businessProblem}\n\nSolution: ${businessSolution}`;

  const systemPrompt = `You are an expert circular economy analyst. Extract structured metadata from the given business problem and solution.
Return a JSON object with:
- industry: One of [packaging, energy, waste_management, agriculture, manufacturing, textiles, electronics, water, transportation, construction, other]
- scale: One of [prototype, pilot, regional, commercial, global]
- r_strategy: Primary R-strategy from [Refuse, Reduce, Reuse, Repair, Refurbish, Remanufacture, Repurpose, Recycle, Recover]
- primary_material: Main material/waste stream addressed (e.g., "plastic", "e-waste", "food waste")
- geographic_focus: Primary region/market (e.g., "EU", "Asia", "North America", "global")
- short_description: 1-sentence summary of the solution

Be concise and precise. If uncertain, use "other" or infer from context.`;

  const userPrompt = `Extract metadata from this circular economy business idea:\n\n${combinedText}`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const metadata = JSON.parse(response.choices[0].message.content);
    return metadata;
  } catch (error) {
    // Fallback metadata if extraction fails
    return {
      industry: 'other',
      scale: 'commercial',
      r_strategy: 'Recycle',
      primary_material: 'materials',
      geographic_focus: 'global',
      short_description: 'Circular economy solution',
    };
  }
}

/**
 * Calculate gap analysis comparing user scores to benchmarks from similar cases
 *
 * @param {Object} userScores - User's calculated scores {overall_score, sub_scores}
 * @param {Array} similarCases - Top matching cases from database
 * @returns {Object} Gap analysis with benchmarks and recommendations
 */
export function calculateGapAnalysis(userScores, similarCases = []) {
  if (!similarCases.length) return { has_benchmarks: false };

  const factors = Object.keys(userScores.sub_scores || {});

  // Collect per-factor values from similar cases' metadata.scores
  const factorValues = {};
  factors.forEach((factor) => {
    factorValues[factor] = similarCases
      .map((doc) => doc.metadata?.scores?.[factor])
      .filter((v) => typeof v === 'number');
  });

  // Build percentile benchmarks per factor
  const benchmarks = {};
  factors.forEach((factor) => {
    const vals = [...factorValues[factor]].sort((a, b) => a - b);
    if (!vals.length) return;
    benchmarks[factor] = {
      p25: vals[Math.floor(vals.length * 0.25)] ?? vals[0],
      p50: vals[Math.floor(vals.length * 0.5)] ?? vals[0],
      p75: vals[Math.floor(vals.length * 0.75)] ?? vals[vals.length - 1],
      count: vals.length,
    };
  });

  // Classify each factor and build opportunity/strength lists
  const comparisons = {};
  const opportunities = [];
  const strengths = [];

  factors.forEach((factor) => {
    if (!benchmarks[factor]) return;
    const userScore = userScores.sub_scores[factor];
    const { p25, p75 } = benchmarks[factor];
    let status;
    if (userScore < p25) status = 'below_average';
    else if (userScore > p75) status = 'above_average';
    else status = 'average';

    comparisons[factor] = { userScore, ...benchmarks[factor], status };
    if (status === 'below_average') opportunities.push(factor);
    if (status === 'above_average') strengths.push(factor);
  });

  return {
    has_benchmarks: true,
    benchmarks,
    comparisons,
    opportunities,
    strengths,
    message: `Compared against ${similarCases.length} similar cases from the dataset.`,
  };
}

/**
 * Generate AI-powered reasoning and audit analysis for a circular economy business idea
 *
 * @param {string} businessProblem - The environmental/circular economy problem addressed
 * @param {string} businessSolution - How the business solves the problem
 * @param {Object} scores - Calculated scores object with overall_score and sub_scores
 * @param {Array} similarDocs - Top matching documents from database with similarity scores
 * @returns {Promise<Object>} Complete audit analysis with evidence-based recommendations
 */
export async function generateReasoning(
  businessProblem,
  businessSolution,
  scores,
  similarDocs = [],
  context = null,
  emitter = null,
) {
  // Validate inputs
  if (!businessProblem || !businessSolution) {
    throw new Error('Business problem and solution are required');
  }

  if (!scores || typeof scores.overall_score !== 'number') {
    throw new Error('Valid scores object is required');
  }

  // Format the dataset matches into context for the AI
  const contextText = formatDatabaseContext(similarDocs);

  const gapAnalysis = calculateGapAnalysis(scores, similarDocs);
  const gapContext = buildGapContext(gapAnalysis);

  const systemRole = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    businessProblem,
    businessSolution,
    scores,
    similarDocs,
    contextText,
    gapContext,
    context,
  );

  // If the OpenAI client is not configured for chat completions (e.g. in unit tests),
  // return a minimal mock analysis so scoring can proceed without external calls.
  if (!openaiClient?.chat?.completions?.create) {
    return enhanceAnalysis(
      {
        confidence_score: 50,
        is_junk_input: false,
        audit_verdict: 'Mock audit analysis (no LLM available)',
        comparative_analysis: 'No comparative analysis available.',
        integrity_gaps: [],
        strengths: [],
        technical_recommendations: [],
        similar_cases_summaries: [],
        key_metrics_comparison: {
          market_readiness: 'Unavailable',
          scalability: 'Unavailable',
          economic_viability: 'Unavailable',
        },
      },
      similarDocs,
      scores,
    );
  }

  try {
    const stream = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemRole },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      stream: true,
    });

    let buffer = '';
    const emittedStages = new Set();

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      buffer += content;

      // Emit sub-stage progress when sections first appear
      if (emitter) {
        if (buffer.includes('"strengths"') && !emittedStages.has('audit_strengths')) {
          emitter('audit_strengths', 'Analysing strengths…');
          emittedStages.add('audit_strengths');
        }
        if (
          (buffer.includes('"gaps"') || buffer.includes('"weaknesses"')) &&
          !emittedStages.has('audit_gaps')
        ) {
          emitter('audit_gaps', 'Identifying gaps…');
          emittedStages.add('audit_gaps');
        }
        if (buffer.includes('"recommendations"') && !emittedStages.has('audit_recommendations')) {
          emitter('audit_recommendations', 'Building recommendations…');
          emittedStages.add('audit_recommendations');
        }
        if (buffer.includes('"sdg_alignment"') && !emittedStages.has('audit_sdg')) {
          emitter('audit_sdg', 'Mapping SDG alignment…');
          emittedStages.add('audit_sdg');
        }
        if (buffer.includes('"improvement_roadmap"') && !emittedStages.has('audit_roadmap')) {
          emitter('audit_roadmap', 'Generating improvement roadmap…');
          emittedStages.add('audit_roadmap');
        }
        if (buffer.includes('"market_opportunity"') && !emittedStages.has('audit_market')) {
          emitter('audit_market', 'Assessing market opportunity…');
          emittedStages.add('audit_market');
        }
      }
    }

    let analysis;
    try {
      analysis = JSON.parse(buffer);
    } catch (parseErr) {
      logger.error(
        { parseErr, bufferLength: buffer.length },
        'Failed to parse streamed LLM response as JSON',
      );
      throw new Error('Audit generation returned malformed output. Please try again.');
    }

    // Validate and enhance the response
    return enhanceAnalysis(analysis, similarDocs, scores);
  } catch (error) {
    throw new Error(`Failed to generate audit analysis: ${error.message}`);
  }
}

/**
 * Build the system prompt for the AI auditor
 * @private
 */
function buildSystemPrompt() {
  return `You are a Senior Circular Economy Auditor with 15+ years of expertise in sustainability science, materials engineering, and business model innovation.

Your role is to provide EVIDENCE-BASED analysis by comparing business ideas against real-world circular economy projects from the internal dataset.

STRICT RULES:
1. **Integrity First**: If user scores seem inflated vs. database evidence, flag this clearly as an "Integrity Gap"
2. **Evidence-Based**: Every claim must reference specific database cases
3. **Constructive**: Balance critique with actionable recommendations
4. **Quantitative**: Use database similarity scores to validate user's self-assessment
5. **Output JSON only**: No preamble, no markdown, pure JSON

DATABASE CONTEXT:
You have access to real circular economy projects with known outcomes drawn from a curated dataset. Use these to:
- Validate feasibility claims
- Identify similar successful (or failed) approaches
- Benchmark the user's metrics against proven cases
- Spot unrealistic assumptions

CRITICAL: Be honest. If the user's scores are too high, say so with evidence. If the idea is unproven, cite that similar ideas struggled. Make this feel like a professional audit, not cheerleading.

Your analysis should feel like a professional audit report - precise, evidence-backed, and constructively critical where warranted.`;
}

/**
 * Build the user prompt with structured analysis requirements
 * @private
 */
function buildGapContext(gapAnalysis) {
  if (!gapAnalysis || !gapAnalysis.has_benchmarks) return '';

  const parts = [];
  if (Array.isArray(gapAnalysis.opportunities) && gapAnalysis.opportunities.length) {
    parts.push(`Opportunities (areas to improve): ${gapAnalysis.opportunities.join(', ')}`);
  }
  if (Array.isArray(gapAnalysis.strengths) && gapAnalysis.strengths.length) {
    parts.push(`Strengths (areas of relative advantage): ${gapAnalysis.strengths.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return `GAP ANALYSIS SUMMARY:\n${parts.join('\n')}\n\n`;
}

function buildUserPrompt(
  businessProblem,
  businessSolution,
  scores,
  similarDocs,
  contextText,
  gapContext = '',
  context = null,
) {
  // Extract valid case IDs for evidence_source_id constraints
  const validCaseIds = (similarDocs || [])
    .slice(0, 4)
    .map((doc) => doc.id)
    .filter(Boolean);

  var similarCasesInfo =
    'No direct matches found in database for this specific query. Proceed with general circular economy principles.';

  if (similarDocs && similarDocs.length > 0) {
    similarCasesInfo = similarDocs
      .slice(0, 4)
      .map((doc, idx) => {
        const id = doc.id || 'N/A';
        const similarity = doc.similarity ? (doc.similarity * 100).toFixed(1) : 0;

        // Prefer structured fields from metadata — these are the clean, full
        // problem/solution texts, not the raw chunked content column
        const fields = doc.metadata?.fields || {};
        const problemText = fields.problem || doc.content || '';
        const solutionText = fields.solution || '';
        const impactText = fields.impact || '';
        const strategy = fields.circular_strategy || doc.metadata?.r_strategy || '';
        const materials = fields.materials || '';

        const parts = [`Case ${idx + 1} (ID: ${id}, Similarity: ${similarity}%)`];
        if (problemText) parts.push(`Problem: ${problemText.substring(0, 250)}`);
        if (solutionText) parts.push(`Solution: ${solutionText.substring(0, 250)}`);
        if (impactText) parts.push(`Impact: ${impactText.substring(0, 150)}`);
        if (strategy) parts.push(`Strategy: ${strategy}`);
        if (materials) parts.push(`Materials: ${materials}`);

        return parts.join('\n');
      })
      .join('\n\n---\n\n');
  }

  const contextBlock = context
    ? `\nBUSINESS CONTEXT (user-provided structured data):
Business Model Type: ${context.business_model_type || 'not specified'}
Operational Stage: ${context.operational_stage || 'not specified'}
Target Geography: ${context.target_geography || 'not specified'}
Annual Material Volume: ${context.annual_volume_estimate || 'not specified'}
Material Complexity: ${context.material_complexity || 'not specified'}
Existing Partnerships: ${
        context.has_existing_partnerships === true
          ? 'Yes'
          : context.has_existing_partnerships === false
            ? 'No'
            : 'not specified'
      }

Use this context to calibrate your analysis. A prototype-stage business should be judged differently
from a mature operation. Adjust your recommendations to be stage-appropriate.\n`
    : '';

  return `Analyze this circular economy business idea and return a JSON object with the following structure:

{
  "confidence_score": <integer 0-100, how confident you are in this assessment>,
  "is_junk_input": <boolean, true if this appears to be test/spam input>,
  "audit_verdict": "<2-3 sentences: Overall assessment of business viability and circular economy alignment>",
  "comparative_analysis": "<2-3 sentences: How this compares to similar projects in the dataset>",

  "integrity_gaps": [
    {
      "issue": "<Specific concern where user scores may be inflated vs. database evidence>",
      "evidence_source_id": "<The exact case ID (e.g. sei_00004) from DATABASE EVIDENCE that
      supports this gap, or null if no case directly applies. Never fabricate IDs.>",
      "severity": "<low|medium|high>"
    }
  ],

  "strengths": [
    {
      "aspect": "<Specific strength validated by database evidence>",
      "evidence_source_id": "<The exact case ID from DATABASE EVIDENCE, or null>"
    }
  ],

  "technical_recommendations": [
    "<Specific, actionable technical recommendations based on database evidence>"
  ],

  "similar_cases_summaries": [
    "<1-sentence summary of each similar case and its relevance>"
  ],

  "improvement_roadmap": [
    {
      "priority": <1|2|3>,
      "action": "<Specific, actionable step this business should take next>",
      "target_factor": "<which of the 8 factors this most improves>",
      "effort": "<low|medium|high>",
      "impact": "<low|medium|high>",
      "timeframe": "<e.g. 0-3 months | 3-12 months | 1-3 years>"
    }
  ],

  "sdg_alignment": [
    {
      "sdg_number": <integer 1-17>,
      "sdg_name": "<official SDG name>",
      "relevance": "<high|medium|low>",
      "rationale": "<1 sentence: why this solution contributes to this goal>"
    }
  ],

  "market_opportunity_summary": "<2-3 sentences: What is the realistic market opportunity for this solution given the scores and database evidence? Include a rough scale assessment (niche/regional/national/global) and any key market timing factors.>",

  "key_metrics_comparison": {
    "market_readiness": "<If cases available: how user's tech_readiness compares to similar cases.
    If no cases: 'No database comparison available.'>",
    "scalability": "<If cases available: infrastructure score vs database benchmarks.
    If no cases: 'No database comparison available.'>",
    "economic_viability": "<If cases available: market_price score vs database evidence.
    If no cases: 'No database comparison available.'>"
  }
}

BUSINESS PROBLEM:
${businessProblem}

BUSINESS SOLUTION:
${businessSolution}

USER SCORES:
${Object.entries(scores.sub_scores)
  .map(([factor, score]) => `${factor}: ${score}/100`)
  .join('\n')}

SIMILAR CASES FROM DATABASE:
${similarCasesInfo}

${gapContext}${contextBlock}

IMPORTANT for new fields:
- improvement_roadmap: exactly 3 items, ordered by priority (1=highest). Be specific — not "improve tech readiness" but "partner with an existing certified e-waste processor to outsource the technical processing step". target_factor MUST be one of these exact values only: public_participation, infrastructure, market_price, maintenance, uniqueness, size_efficiency, chemical_safety, tech_readiness. Do not use any other value.
Each of the 3 items must target a DIFFERENT target_factor — no two roadmap items may share the same target_factor value. Prioritise the three lowest-scoring or most strategically critical factors.
- sdg_alignment: return 2-4 SDGs most relevant to circular economy: SDG 12 (Responsible Consumption), SDG 13 (Climate Action), SDG 9 (Industry Innovation), SDG 8 (Decent Work), SDG 11 (Sustainable Cities), SDG 6 (Clean Water) are the most common. Only include SDGs with genuine relevance.
- market_opportunity_summary: grounded in the database evidence and scores, not generic statements.
- similar_cases_summaries: If no cases were provided in DATABASE EVIDENCE, return an empty array [].
  Otherwise return EXACTLY one entry per case provided, in order. Each entry must reference only
  the case data shown — do not invent or summarise cases that were not in the input.
- evidence_source_id fields: must be an exact ID from the DATABASE EVIDENCE section (e.g.
  "sei_00004") or null. Valid IDs for this request: [${validCaseIds.join(', ') || 'none available'}]. Do not use placeholder values
  like "CASE-1234", "N/A", or any invented identifier.
- key_metrics_comparison: If no similar cases were provided in DATABASE EVIDENCE, set all three
  fields to "No database comparison available — assessment based on general CE principles only."
  When cases ARE available, provide specific comparisons referencing actual case data, not invented
  benchmark ranges.

CRITICAL: Be honest. If the user's scores are too high, say so with evidence. If the idea is unproven, cite that similar ideas struggled. Make this feel like a professional audit.`;
}

/**
 * Format database context for inclusion in prompts
 * @private
 */
function formatDatabaseContext(similarDocs) {
  if (!similarDocs || similarDocs.length === 0) {
    return 'No matching projects found in the dataset. Analysis based on general circular economy principles.';
  }

  return similarDocs
    .slice(0, 4)
    .map((doc, idx) => {
      const metadata = doc.metadata || {};
      return `\n[Case ${idx + 1}] ID: ${doc.id}, Match: ${(doc.similarity * 100).toFixed(1)}%
Category: ${metadata.category || 'General'}
Content: ${doc.content}
Metadata: ${JSON.stringify(metadata)}`;
    })
    .join('\n');
}

/**
 * Enhance and validate the AI response
 * @private
 */
function enhanceAnalysis(analysis, similarDocs, scores) {
  // Ensure all required fields exist
  const enhanced = {
    confidence_score: Math.max(0, Math.min(100, analysis.confidence_score || 0)),
    is_junk_input: analysis.is_junk_input === true,
    audit_verdict: analysis.audit_verdict || 'Unable to generate assessment',
    comparative_analysis: analysis.comparative_analysis || 'No comparative analysis available',

    integrity_gaps: Array.isArray(analysis.integrity_gaps)
      ? analysis.integrity_gaps.map((gap) => ({
          issue: gap.issue || 'Unspecified issue',
          evidence_source_id: gap.evidence_source_id || null,
          severity: ['low', 'medium', 'high'].includes(gap.severity) ? gap.severity : 'low',
        }))
      : [],

    strengths: Array.isArray(analysis.strengths)
      ? analysis.strengths.map((str) => ({
          aspect: str.aspect || 'Unspecified strength',
          evidence_source_id: str.evidence_source_id || null,
        }))
      : [],

    technical_recommendations: Array.isArray(analysis.technical_recommendations)
      ? analysis.technical_recommendations.filter((r) => typeof r === 'string').slice(0, 5)
      : [],

    similar_cases_summaries: Array.isArray(analysis.similar_cases_summaries)
      ? analysis.similar_cases_summaries.filter((s) => typeof s === 'string').slice(0, 5)
      : [],

    improvement_roadmap: Array.isArray(analysis.improvement_roadmap)
      ? analysis.improvement_roadmap.slice(0, 3).map((item, i) => ({
          priority: item.priority || i + 1,
          action: item.action || 'No action specified',
          target_factor: item.target_factor || null,
          effort: ['low', 'medium', 'high'].includes(item.effort) ? item.effort : 'medium',
          impact: ['low', 'medium', 'high'].includes(item.impact) ? item.impact : 'medium',
          timeframe: item.timeframe || 'Not specified',
        }))
      : [],

    sdg_alignment: Array.isArray(analysis.sdg_alignment)
      ? analysis.sdg_alignment
          .filter((s) => s.sdg_number >= 1 && s.sdg_number <= 17)
          .slice(0, 4)
          .map((s) => ({
            sdg_number: s.sdg_number,
            sdg_name: s.sdg_name || `SDG ${s.sdg_number}`,
            relevance: ['high', 'medium', 'low'].includes(s.relevance) ? s.relevance : 'medium',
            rationale: s.rationale || '',
          }))
      : [],

    market_opportunity_summary:
      typeof analysis.market_opportunity_summary === 'string'
        ? analysis.market_opportunity_summary
        : 'Market opportunity assessment unavailable.',

    key_metrics_comparison: analysis.key_metrics_comparison || {
      market_readiness: 'Assessment unavailable',
      scalability: 'Assessment unavailable',
      economic_viability: 'Assessment unavailable',
    },
  };

  return enhanced;
}

/**
 * Clean and polish similar case text fields using LLM.
 * Fixes OCR artifacts, ends truncated sentences gracefully, and removes
 * pipeline noise — without adding or inventing information.
 *
 * Runs in parallel for all cases (Promise.all) so total latency is
 * the latency of the slowest single case, not sum of all.
 *
 * @param {Array} cases - Array of formatted similar case objects
 * @returns {Promise<Array>} Cases with cleaned text fields
 */
export async function cleanSimilarCases(cases) {
  if (!cases || cases.length === 0) return cases;

  const cleaned = await Promise.all(
    cases.map(async (c) => {
      try {
        // Pre-process impact field to filter out metadata artifacts
        const impact = IMPACT_ARTIFACT_PATTERNS.some((p) => p.test((c.impact || '').trim()))
          ? ''
          : c.impact;

        // Only include fields that have actual content — avoids LLM hallucinating
        // content for empty fields and wastes fewer tokens
        const rawLines = [
          c.summary ? `Summary: ${c.summary}` : null,
          c.problem ? `Problem: ${c.problem}` : null,
          c.solution ? `Solution: ${c.solution}` : null,
          impact ? `Impact: ${impact}` : null,
          c.circular_strategy ? `Strategy: ${c.circular_strategy}` : null, // ADD THIS
        ]
          .filter(Boolean)
          .join('\n');

        const prompt = `You are editing text from a circular economy case study database for display to business users.

Your tasks:
1. Fix OCR artifacts (e.g. "go als" → "goals", "weigh t" → "weight", "physcially" → "physically", "memebers" → "members", "strcutrual" → "structural", "exisintg" → "existing", "aƯordable" → "affordable", "diƯerent" → "different")
2. Remove trailing document-header noise (lines starting with "CIRCULAR ECONOMY CASE STUDIES")
3. If a sentence is truncated mid-word, end it at the last complete sentence — do NOT continue or add new content
4. Reframe "problem" text as a clear "Problem Addressed" statement — what challenge or need this project was solving. Start with "This project addressed..." or a similar user-facing framing.
5. Reframe "solution" text as a clear "Solution Implemented" description — what was actually done. Keep all specific details, numbers, and materials.
6. Clean the "summary" to be a single clean sentence describing what the project achieved.
7. Clean the "impact" field:
   - Fix OCR artifacts and truncation as with other fields.
   - If the impact reads as a project outcome, achievement, or measured result (e.g. "Diverted
     500 tonnes from landfill", "Reduced energy use by 50%"), keep it factual and unchanged
     beyond OCR fixes.
   - If the impact reads as a problem-context statistic or background fact rather than what the
     project achieved (e.g., "Textile agriculture accounts for 20% of agricultural water use"),
     reframe it as what the project contributed toward addressing that context, or set it to
     empty string if no outcome can be inferred from the problem/solution text.
   - Do NOT invent specific numbers or outcomes not present in the input.
8. REGULATORY CONTENT HANDLING: Detect if the solution text is regulatory/technical specification text (indicators: BAT-AEL patterns, footnote markers like "( 3 )", "≥ 95 %", "mg/l", "m3/t", numeric footnote references in brackets, EU regulatory citation patterns). If it is:
   - Rewrite the solution to describe the underlying environmental improvement technique in plain business language. Extract the actual practice (e.g., "adopting biological wastewater treatment systems targeting ≤10 mg/l BOD output") and state it as what was done.
   - Rewrite the impact to state the environmental outcome in plain language (e.g., "Reduced textile wastewater pollutant load to regulatory best-practice levels"). If the impact is just a technical threshold value (e.g., "BAT-AEL: 150 mg/l"), translate it to a meaningful plain-English outcome or set it to empty string.
9. If the 'solution' text describes a problem or challenge (e.g., 'Due to underdeveloped standards, products include toxic chemicals...') rather than an action taken, reframe it to describe what was done or recommended as a solution. Start with 'The solution involved...' or 'This initiative implemented...'. Do not just copy the problem text.
10. If 'Summary' was not provided, generate a concise one-sentence summary from the Problem and Solution text. Do not leave it empty if Problem or Solution content is available.
11. TITLE GENERATION: Generate a concise descriptive 5–8 word title in title case based on the
project's problem/solution content. Always generate one.
12. STRATEGY CONDENSATION: If the Strategy field is a verbose certification or multi-attribute
    string longer than 60 characters (e.g., "Cradle-to-Cradle Certified (General - Environmental
    Policy and Management: Silver, Material Health: Bronze, ...)"), condense it to its essential
    meaning in 3–8 words (e.g., "Cradle-to-Cradle Certified" or "C2C Certified — Multi-Category").
    If it is already concise (e.g., "Recycling", "Material Reuse", "Product-as-a-Service"), return
    it unchanged.

Do NOT invent information. Do NOT change facts, numbers, organisations, or proper nouns.
If a field was not provided, return an empty string for that key.

Return ONLY a JSON object with these exact keys:
{
  "summary": "...",
  "problem": "...",
  "solution": "...",
  "impact": "...",
  "generated_title": "<Always generate a concise 5–8 word descriptive title in title case based on the problem/solution content, e.g. 'Modular Lighting-as-a-Service for Offices'>",
  "circular_strategy": "<Condensed strategy label if input was verbose, otherwise unchanged>"
}

RAW TEXT TO CLEAN:
${rawLines}`;

        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 1100,
          response_format: { type: 'json_object' },
        });

        const result = JSON.parse(response.choices[0].message.content);
        return {
          ...c,
          // Only overwrite if the original had content AND cleanup returned content
          // This prevents empty-field hallucination from overwriting good data
          summary: result.summary || c.summary || '',
          problem: c.problem && result.problem ? result.problem : c.problem,
          solution: c.solution && result.solution ? result.solution : c.solution,
          impact: IMPACT_ARTIFACT_PATTERNS.some((p) => p.test((c.impact || '').trim()))
            ? ''
            : c.impact && result.impact
              ? result.impact
              : c.impact,
          title:
            c.title && !/^Case\s+[a-z0-9_]+$/i.test(c.title)
              ? c.title
              : result.generated_title || c.title || '',
          circular_strategy:
            c.circular_strategy && result.circular_strategy
              ? result.circular_strategy
              : c.circular_strategy,
        };
      } catch (_) {
        // If cleanup fails for any case, return original unchanged
        return c;
      }
    }),
  );

  return cleaned;
}

/**
 * Validate junk input before processing
 * @param {string} problem - Business problem input
 * @param {string} solution - Business solution input
 * @returns {Object|null} Error object if junk input detected, null otherwise
 */
export function validateInput(problem, solution) {
  const minLength = 50; // Reasonable minimum for detailed input

  if (!problem || !solution) {
    return { is_junk: true, reason: 'Missing problem or solution' };
  }

  if (problem.length < minLength || solution.length < minLength) {
    return { is_junk: true, reason: 'Input too short to be meaningful' };
  }

  // Check for obvious spam/junk patterns
  const junkPatterns = [/^[a-z]{1,3}$/i, /^-{3,}$/, /^x{3,}$/, /^test|lorem|ipsum/i];
  if (junkPatterns.some((pattern) => pattern.test(problem) || pattern.test(solution))) {
    return { is_junk: true, reason: 'Input matches junk patterns' };
  }

  // Low uniqueness detection: many repeated words or filler
  function uniqueWordRatio(text) {
    const words = (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return 0;
    const uniq = new Set(words);
    return uniq.size / words.length;
  }

  const probUniq = uniqueWordRatio(problem);
  const solUniq = uniqueWordRatio(solution);
  if (probUniq < 0.3 || solUniq < 0.3) {
    return {
      is_junk: true,
      reason:
        'Input appears repetitive or low-information; please provide more detailed, specific descriptions.',
    };
  }

  // Non-letter density check (too many symbols/characters suggests junk)
  function nonLetterDensity(text) {
    const total = text.length || 1;
    const nonLetter = (text.match(/[^a-z0-9\s.,_-]/gi) || []).length;
    return nonLetter / total;
  }

  if (nonLetterDensity(problem) > 0.25 || nonLetterDensity(solution) > 0.25) {
    return {
      is_junk: true,
      reason:
        'Input contains excessive non-text characters; please provide plain-language descriptions.',
    };
  }

  return null;
}

/**
 * Execute the LLM call to get reasoning
 * @private
 */
async function executeReasoningCall(systemRole, userPrompt, similarDocs) {
  const response = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemRole },
      { role: 'user', content: userPrompt },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
}
