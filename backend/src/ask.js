import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Added similarDocs as the 4th parameter
export async function generateReasoning(idea, scores, parameters, similarDocs = []) {
  // Format the dataset matches into a string for the AI to read
  const contextText =
    similarDocs.length > 0
      ? similarDocs
          .map((doc) => `- Match (Score: ${doc.similarity.toFixed(2)}): ${doc.content}`)
          .join('\n')
      : 'No direct matches found in the specialized dataset.';

  const systemRole = `
You are a Senior Circular Economy Auditor. You output ONLY JSON.
You have access to a database of existing Circular Economy projects and research. 

STRICT RULES:
1. If 'idea' is junk (like 'xyz', '---'), set is_junk_input: true and confidence_score: 0.
2. Use the provided DATABASE CONTEXT to see if the user's idea is realistic.
3. If the user's scores are significantly higher than similar successful projects in the context, flag this as an "Integrity Gap".
`;

  const userPrompt = `
USER DATA:
Idea: ${idea}
Calculated Scores: ${JSON.stringify(scores)}

DATABASE CONTEXT:
${contextText}

Return EXACTLY this JSON structure:
{
  "confidence_score": number,
  "is_junk_input": boolean,
  "audit_verdict": "string",
  "comparative_analysis": "string",
  "integrity_gaps": [
    { "issue": "string", "evidence_source_id": "number_or_null" }
  ],
  "technical_recommendations": ["string"]
}
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

  return JSON.parse(response.choices[0].message.content);
}
