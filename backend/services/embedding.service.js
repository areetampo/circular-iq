// Embedding-related business logic
// currently used by scoring controller for generating embeddings and performing vector search

import OpenAI from 'openai';
import { BACKEND_CONFIG } from '#config/backend.config.js';

const client = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

export async function createEmbedding(text) {
  if (!text || !text.trim()) {
    throw new Error('Cannot embed empty text');
  }
  const res = await client.embeddings.create({
    model: BACKEND_CONFIG.openai.embeddingModel || 'text-embedding-3-small',
    input: text,
  });
  const embedding = res.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding returned from OpenAI');
  }
  return embedding;
}
