/**
 * Embedding Service
 *
 * Creates vector embeddings using OpenAI's text-embedding-3-small model.
 * Used by scoring controller and knowledge base search to vectorize text.
 *
 * Model: text-embedding-3-small (1536 dimensions)
 * Provider: OpenAI API
 * Rate limit: Per account, no per-request rate limiting applied here
 *
 * @module embedding.service
 */

// Embedding-related business logic
// currently used by scoring controller for generating embeddings and performing vector search

import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';

const client = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

/**
 * Generate OpenAI embedding for a text string
 *
 * Text is trimmed before embedding. Empty strings throw an error.
 *
 * @param {string} text - Text to embed (will be trimmed)
 * @returns {Promise<Array<number>>} Embedding vector (1536 dimensions)
 * @throws {Error} If text is empty or embedding API fails
 *
 * @example
 * const embedding = await createEmbedding('Circular economy business model');
 * logger.info(embedding.length); // 1536
 */
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
