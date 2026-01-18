import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // must match .env
})

export async function generateReasoning (idea, scores, parameters) {
  const prompt = `
You are evaluating a business idea using circular economy principles.

Business idea:
${idea}

Computed scores:
${JSON.stringify(scores, null, 2)}

Input parameters:
${JSON.stringify(parameters, null, 2)}

Explain:
- Why the scores make sense
- Key strengths
- Key weaknesses
- Improvement suggestions
`

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  })

  return response.choices[0].message.content
}
