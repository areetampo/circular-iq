export async function scoreIdea(input) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "circular economy scoring framework",
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  const { data: documents } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: 8,
  });

  const context = documents.map(d => d.content).join("\n---\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are a circular economy evaluator.
Use ONLY the provided context.
Produce numeric scores from 0–100.
Explain assumptions briefly.
`,
      },
      {
        role: "user",
        content: `
Context:
${context}

Business idea:
${input.description}

Parameters:
- Recyclability: ${input.recyclability}
- Energy usage: ${input.energyUsage}
- Product lifespan (years): ${input.lifespan}
- Reuse cycles: ${input.reuseCycles}

Return JSON with:
overall_score
sub_scores
reasoning
`,
      },
    ],
  });

  return JSON.parse(completion.choices[0].message.content);
}
