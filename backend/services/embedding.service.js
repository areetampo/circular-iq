/**
 * @module embedding.service
 * @description Vector embedding service for text vectorization using OpenAI's embeddings API.
 * Generates dense vector representations of text for semantic search and similarity operations.
 * Used by scoring controller and knowledge base search to vectorize queries and documents.
 *
 * Model: text-embedding-3-small (1536 dimensions, high performance)
 * Provider: OpenAI Embeddings API
 * Cost: Efficient, optimized for volume
 */

// Embedding-related business logic
// currently used by scoring controller for generating embeddings and performing vector search

import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';

const client = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

/**
 * Generate vector embedding for text using OpenAI's text-embedding-3-small model.
 * Text is trimmed before embedding. Empty strings throw an error to prevent wasted API calls.
 *
 * @param {string} text - Text to embed (will be trimmed of leading/trailing whitespace).
 * @returns {Promise<number[]>} Embedding vector with 1536 dimensions.
 * @throws {Error} If text is empty after trimming or embedding API fails.
 *
 * @example
 * const embedding = await createEmbedding('Circular economy business model');
 * logger.info({embeddingLength: embedding.length}); // 1536
 * logger.info({embeddingType: typeof embedding[0]}); // 'number'
 */
export async function createEmbedding(text) {
  const startTime = Date.now();

  if (!text || !text.trim()) {
    throw new Error('Cannot embed empty text');
  }

  try {
    const res = await client.embeddings.create({
      model: BACKEND_CONFIG.openai.embeddingModel || 'text-embedding-3-small',
      input: text,
    });
    const embedding = res.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding returned from OpenAI');
    }
    logger.logOperation('createEmbedding', 'openai/embedding', 'success', Date.now() - startTime);
    return embedding;
  } catch (error) {
    logger.logOperation('createEmbedding', 'openai/embedding', 'error', Date.now() - startTime);
    throw error;
  }
}
