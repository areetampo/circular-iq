import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const response = await client.chat.completions.create({
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
  if (!similarCases || similarCases.length === 0) {
    return {
      has_benchmarks: false,
      message: 'No comparable cases found for benchmarking',
    };
  }

  // Extract scores from similar cases if available
  // First, try to extract from metadata.scores (if populated by our system)
  const comparableSimilarScores = similarCases
    .filter((c) => {
      // Check multiple places where scores might be stored
      return (
        c.metadata?.scores?.overall_score || (c.scores && c.scores.overall_score) || c.overall_score
      );
    })
    .map((c) => {
      return c.metadata?.scores?.overall_score || c.scores?.overall_score || c.overall_score || 0;
    })
    .filter((score) => score > 0); // Filter out zeros

  // If no scores in metadata, generate synthetic benchmarks based on similarity distribution
  if (comparableSimilarScores.length === 0) {
    // Create synthetic benchmarks based on document similarity and quality heuristics
    // Higher similarity = likely higher quality/performance
    const syntheticScores = similarCases
      .map((doc) => {
        const similarity = doc.similarity || 0;
        // Map similarity (0-1) to a score distribution (30-90)
        // Assumes docs with higher semantic similarity are more successful
        return Math.round(30 + similarity * 60);
      })
      .filter((s) => s > 0);

    if (syntheticScores.length > 0) {
      comparableSimilarScores.push(...syntheticScores);
    }
  }

  if (comparableSimilarScores.length === 0) {
    return {
      has_benchmarks: false,
      message: 'No reliable benchmark data for similar cases',
    };
  }

  // Calculate benchmark statistics
  comparableSimilarScores.sort((a, b) => b - a);
  const benchmarkData = {
    top_10_percentile:
      comparableSimilarScores[Math.floor(comparableSimilarScores.length * 0.1)] || 90,
    median: comparableSimilarScores[Math.floor(comparableSimilarScores.length * 0.5)] || 60,
    average: comparableSimilarScores.reduce((a, b) => a + b, 0) / comparableSimilarScores.length,
    min: Math.min(...comparableSimilarScores),
    max: Math.max(...comparableSimilarScores),
  };

  // Identify gaps for each sub-score
  const subScoreGaps = {};
  const userSubScores = userScores.sub_scores || {};

  for (const [factor, userScore] of Object.entries(userSubScores)) {
    // Collect factor scores from similar cases
    const factorScoresFromSimilar = similarCases
      .filter((c) => {
        // Check multiple places where sub-scores might be stored
        return (
          c.metadata?.scores?.sub_scores?.[factor] ||
          c.scores?.sub_scores?.[factor] ||
          c.sub_scores?.[factor]
        );
      })
      .map((c) => {
        return (
          c.metadata?.scores?.sub_scores?.[factor] ||
          c.scores?.sub_scores?.[factor] ||
          c.sub_scores?.[factor] ||
          0
        );
      })
      .filter((s) => s > 0);

    // If we have factor data, calculate benchmark
    if (factorScoresFromSimilar.length > 0) {
      const benchmark =
        factorScoresFromSimilar.reduce((a, b) => a + b, 0) / factorScoresFromSimilar.length;
      subScoreGaps[factor] = {
        user_score: Math.round(userScore),
        benchmark_average: Math.round(benchmark),
        gap: Math.round(benchmark - userScore),
        percentile: Math.round(
          (factorScoresFromSimilar.filter((s) => s <= userScore).length /
            factorScoresFromSimilar.length) *
            100,
        ),
      };
    }
  }

  return {
    has_benchmarks: true,
    overall_benchmarks: benchmarkData,
    sub_score_gaps: subScoreGaps,
    comparison_text: `Your score (${userScores.overall_score}) compares to similar cases: top 10% (${benchmarkData.top_10_percentile}), average (${Math.round(benchmarkData.average)}), median (${benchmarkData.median})`,
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

  const systemRole = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    businessProblem,
    businessSolution,
    scores,
    similarDocs,
    contextText,
  );

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemRole },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const analysis = JSON.parse(content);

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

Your role is to provide EVIDENCE-BASED analysis by comparing business ideas against real-world circular economy projects from the GreenTechGuardians database.

STRICT RULES:
1. **Integrity First**: If user scores seem inflated vs. database evidence, flag this clearly as an "Integrity Gap"
2. **Evidence-Based**: Every claim must reference specific database cases
3. **Constructive**: Balance critique with actionable recommendations
4. **Quantitative**: Use database similarity scores to validate user's self-assessment
5. **Output JSON only**: No preamble, no markdown, pure JSON

DATABASE CONTEXT:
You have access to real circular economy projects with known outcomes. Use these to:
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
function buildUserPrompt(businessProblem, businessSolution, scores, similarDocs, contextText) {
  const similarCasesInfo = similarDocs
    .slice(0, 3)
    .map(
      (doc, idx) =>
        `Case ${idx + 1} (ID: ${doc.id}, Similarity: ${(doc.similarity * 100).toFixed(1)}%): "${doc.content.substring(0, 200)}..."`,
    )
    .join('\n');

  return `USER SUBMISSION:
Problem: ${businessProblem}
Solution: ${businessSolution}

USER'S SELF-ASSESSMENT SCORES:
${JSON.stringify(scores, null, 2)}

DATABASE EVIDENCE (Top 3 Similar Projects):
${similarCasesInfo}

Full Context:
${contextText}

ANALYSIS REQUIRED:
Return EXACTLY this JSON structure:

{
  "confidence_score": <0-100, your confidence this idea is viable>,
  "is_junk_input": <boolean, true if input is nonsense>,

  "audit_verdict": "<2-3 sentence professional assessment of viability>",

  "comparative_analysis": "<How does this compare to the database cases? Are the user's scores realistic given the evidence?>",

  "integrity_gaps": [
    {
      "issue": "<Specific discrepancy between user claims and database evidence>",
      "evidence_source_id": <case ID that contradicts user's claim, or null>,
      "severity": "<low|medium|high>"
    }
  ],

  "strengths": [
    {
      "aspect": "<What's genuinely strong about this idea>",
      "evidence_source_id": <case ID that supports this, or null>
    }
  ],

  "technical_recommendations": [
    "<Specific, actionable recommendation based on database learnings>"
  ],

  "similar_cases_summaries": [
    "<One sentence: Why Case 1 is relevant and what it teaches>",
    "<One sentence: Why Case 2 is relevant and what it teaches>",
    "<One sentence: Why Case 3 is relevant and what it teaches>"
  ],

  "key_metrics_comparison": {
    "market_readiness": "<How user's tech_readiness compares to similar cases>",
    "scalability": "<Assessment based on infrastructure scores vs. database>",
    "economic_viability": "<Market_price reality check>"
  }
}

CRITICAL: Be honest. If the user's scores are too high, say so with evidence. If the idea is unproven, cite that similar ideas struggled. Make this feel like a professional audit.`;
}

/**
 * Format database context for inclusion in prompts
 * @private
 */
function formatDatabaseContext(similarDocs) {
  if (!similarDocs || similarDocs.length === 0) {
    return 'No matching projects found in the GreenTechGuardians database. Analysis based on general circular economy principles.';
  }

  return similarDocs
    .slice(0, 5)
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

    key_metrics_comparison: analysis.key_metrics_comparison || {
      market_readiness: 'Assessment unavailable',
      scalability: 'Assessment unavailable',
      economic_viability: 'Assessment unavailable',
    },
  };

  return enhanced;
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

  return null;
}

/**
 * Execute the LLM call to get reasoning
 * @private
 */
async function executeReasoningCall(systemRole, userPrompt, similarDocs) {
  const response = await client.chat.completions.create({
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
