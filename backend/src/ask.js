import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateReasoning(businessProblem, businessSolution, scores, parameters, similarDocs = []) {
  const contextText =
    similarDocs.length > 0
      ? similarDocs
          .map(
            (doc, idx) =>
              `
Case ${idx + 1} (Similarity: ${(doc.similarity * 100).toFixed(1)}%):
Content: ${doc.content}
Metadata: ${JSON.stringify(doc.metadata || {})}
`,
          )
          .join('\n')
      : 'No direct matches found in the specialized dataset.';

  const systemRole = `
You are a Senior Circular Economy Auditor with expertise in sustainability science, materials engineering, and business model analysis.

Your role is to provide EVIDENCE-BASED analysis by comparing the user's business idea against real-world circular economy projects from the GreenTechGuardians database.

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

Your analysis should feel like a professional audit, not a cheerleading session.
`;

  const userPrompt = `
USER SUBMISSION:
Problem: ${businessProblem}
Solution: ${businessSolution}

USER'S SELF-ASSESSMENT SCORES:
${JSON.stringify(scores, null, 2)}

DATABASE EVIDENCE (Top ${similarDocs.length} Similar Projects):
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

CRITICAL: Be honest. If the user's scores are too high, say so with evidence. If the idea is unproven, cite that similar ideas struggled. Make this feel like a professional audit.
IMPORTANT: similar_cases_summaries must be an array with exactly ${similarDocs.length} strings.
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemRole },
      { role: 'user', content: userPrompt },
    ],
  });

  const aiResponse = JSON.parse(response.choices[0].message.content);
  
  return validateAndNormalizeResponse(aiResponse, similarDocs.length);
}

function validateAndNormalizeResponse(aiResponse, expectedCasesCount) {
  const normalized = {
    confidence_score: aiResponse.confidence_score || 0,
    is_junk_input: aiResponse.is_junk_input || false,
    audit_verdict: aiResponse.audit_verdict || 'Unable to generate verdict',
    comparative_analysis: aiResponse.comparative_analysis || 'Unable to compare with database cases',
    integrity_gaps: Array.isArray(aiResponse.integrity_gaps) ? aiResponse.integrity_gaps.map(gap => ({
      issue: gap.issue || 'Unknown issue',
      evidence_source_id: gap.evidence_source_id || null,
      severity: ['low', 'medium', 'high'].includes(gap.severity) ? gap.severity : 'medium'
    })) : [],
    strengths: Array.isArray(aiResponse.strengths) ? aiResponse.strengths.map(strength => ({
      aspect: strength.aspect || 'Unknown strength',
      evidence_source_id: strength.evidence_source_id || null
    })) : [],
    technical_recommendations: Array.isArray(aiResponse.technical_recommendations) 
      ? aiResponse.technical_recommendations 
      : [],
    similar_cases_summaries: Array.isArray(aiResponse.similar_cases_summaries) 
      ? aiResponse.similar_cases_summaries.slice(0, expectedCasesCount)
      : Array(expectedCasesCount).fill('Unable to generate case summary'),
    key_metrics_comparison: {
      market_readiness: aiResponse.key_metrics_comparison?.market_readiness || 'No comparison available',
      scalability: aiResponse.key_metrics_comparison?.scalability || 'No comparison available',
      economic_viability: aiResponse.key_metrics_comparison?.economic_viability || 'No comparison available'
    }
  };

  if (normalized.similar_cases_summaries.length < expectedCasesCount) {
    const deficit = expectedCasesCount - normalized.similar_cases_summaries.length;
    normalized.similar_cases_summaries.push(...Array(deficit).fill('Unable to generate case summary'));
  }

  return normalized;
}
