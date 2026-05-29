/**
 * OpenAI `text-embedding-3-small` wrapper for scoring and CE case hybrid search.
 */

import OpenAI from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';

const client = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

/**
 * Embeds trimmed text via OpenAI `text-embedding-3-small` (1536 dims) for scoring and CE search.
 * Logs duration through `globalThis.logger.logOperation`.
 *
 * @param {string} text - Source text sent to OpenAI after emptiness is checked with `trim()`.
 * @returns {Promise<number[]>} 1536-dimensional vector.
 * @throws {Error} When text is empty or the OpenAI API fails.
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
