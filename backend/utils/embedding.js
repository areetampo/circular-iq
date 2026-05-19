/**
 * @module embedding
 * @description Centralized embedding model parameters and utility functions used across
 * SQL migrations, pipeline scripts, scoring/search routes, and database vector operations.
 * Single source of truth — do not change EMBEDDING_DIMENSION without a DB migration.
 */

import { logger } from '#utils/logger.js';

/**
 * OpenAI embedding model identifier
 * @type {string}
 */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Vector dimension for text-embedding-3-small from OpenAI
 * DO NOT CHANGE without migration - this is baked into DB schema
 * @type {number}
 */
const EMBEDDING_DIMENSION = 1536;

/**
 * Batch size for OpenAI embedding API calls
 * Higher = faster but higher memory/cost; OpenAI default is ~2000
 * @type {number}
 */
const EMBEDDING_BATCH_SIZE = 20;

/**
 * Delay between batches to respect rate limits (milliseconds)
 * @type {number}
 */
const EMBEDDING_BATCH_DELAY_MS = 500;

/**
 * Timeout for OpenAI embedding requests (milliseconds)
 * @type {number}
 */
const EMBEDDING_REQUEST_TIMEOUT_MS = 30000;

/**
 * Maximum retries for embedding API with exponential backoff
 * @type {number}
 */
const EMBEDDING_MAX_RETRIES = 3;

/**
 * Initial retry delay in milliseconds (doubles on each retry)
 * @type {number}
 */
const EMBEDDING_RETRY_DELAY_MS = 1000;

/**
 * Maximum length for a single chunk of text to embed (characters)
 * Leave room for metadata and processing overhead
 * @type {number}
 */
const EMBEDDING_MAX_CHUNK_LENGTH = 8000;

/**
 * Minimum length for text to embed (characters)
 * Skip very short content to save API calls
 * @type {number}
 */
const EMBEDDING_MIN_TEXT_LENGTH = 50;

/**
 * Weight for vector similarity in hybrid search (0-1)
 * 0.8 = 80% vector, 20% keyword
 * @type {number}
 */
const VECTOR_SEARCH_VECTOR_WEIGHT = 0.8;

/**
 * Validate embedding vector dimensions
 * @param {Array<number>} embedding - Vector to validate
 * @returns {boolean} True if dimensions match expected size
 */
function isValidEmbedding(embedding) {
  return (
    Array.isArray(embedding) &&
    embedding.length === EMBEDDING_DIMENSION &&
    embedding.every((val) => typeof val === 'number')
  );
}

/**
 * Validate text length for embedding
 * @param {string} text - Text to validate
 * @returns {boolean} True if within acceptable range
 */
function isValidTextForEmbedding(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return (
    trimmed.length >= EMBEDDING_MIN_TEXT_LENGTH && trimmed.length <= EMBEDDING_MAX_CHUNK_LENGTH
  );
}

/**
 * Average tokens per word for estimation (OpenAI's text-embedding-3-small is ~1.3)
 * Used for cost estimation and chunking heuristics
 * @type {number}
 */
const TOKENS_PER_WORD = 1.3;

/**
 * Maximum safe tokens for embedding input
 * OpenAI's text-embedding-3-small has a max of 8191 tokens; we set a lower threshold to be safe
 * @type {number}
 */
const MAX_SAFE_TOKENS = 8000;

/**
 * Pricing table for embedding models (USD per million tokens)
 * Source: OpenAI pricing as of 2024-06
 * Adjust as needed when using different models or if prices change
 * @type {Object<string, number>}
 */
const PRICING_TABLE = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
  'text-embedding-ada-002': 0.1,
};

/**
 * Cost per million tokens for the selected embedding model
 * @type {number}
 */
const ratePerMillion = PRICING_TABLE[EMBEDDING_MODEL] || 0.1;

/**
 * Estimate the cost of embedding a given number of tokens
 * @param {number} totalTokens - Total number of tokens to embed
 * @returns {number} Estimated cost in USD
 */
const estimatedCost = (totalTokens) => (totalTokens / 1_000_000) * ratePerMillion;

/**
 * Estimate token count for a string.
 * @param {string} text - Text to estimate tokens for
 * @param {Object} tokenEncoder - Optional token encoder (from tiktoken)
 * @returns {number} Estimated token count
 */
function estimateTokens(text, tokenEncoder = null) {
  if (!tokenEncoder) return Math.ceil(text.trim().split(/\s+/).length * TOKENS_PER_WORD);
  return tokenEncoder.encode(text).length;
}

/**
 * Generate deterministic pseudo-embedding for testing
 * @param {string} text - Text to generate fake embedding for
 * @returns {Array<number>} Fake embedding vector
 */
function fakeEmbedding(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const vec = new Array(EMBEDDING_DIMENSION);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    vec[i] = ((h + i * 2654435761) % 1000) / 1000;
  }
  return vec;
}

/**
 * Retry logic with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = EMBEDDING_MAX_RETRIES) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = EMBEDDING_RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn({ attempt: attempt + 1, delayMs: delay, error }, 'Embedding retry');
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export {
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
  EMBEDDING_REQUEST_TIMEOUT_MS,
  estimatedCost,
  estimateTokens,
  fakeEmbedding,
  isValidEmbedding,
  isValidTextForEmbedding,
  MAX_SAFE_TOKENS,
  retryWithBackoff,
  VECTOR_SEARCH_VECTOR_WEIGHT,
};
