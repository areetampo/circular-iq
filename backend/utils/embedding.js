/**
 * Shared embedding configuration, validation, token estimation, and retry helpers.
 * `EMBEDDING_DIMENSION` must remain aligned with the database vector column width; changing
 * it requires a migration and regenerated stored embeddings.
 */

import { logger } from '#utils/logger.js';

/** OpenAI embedding model used by search, scoring, and dataset ingestion. */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/** Vector width persisted in Supabase `vector` columns; changing this requires a migration. */
const EMBEDDING_DIMENSION = 1536;

/** Number of text inputs submitted per embedding API request by pipeline scripts. */
const EMBEDDING_BATCH_SIZE = 20;

/** Delay between embedding batches to reduce burst pressure on provider rate limits. */
const EMBEDDING_BATCH_DELAY_MS = 500;

/** Per-request timeout used when embedding generation calls the provider. */
const EMBEDDING_REQUEST_TIMEOUT_MS = 30000;

/** Default number of attempts made by `retryWithBackoff` before rethrowing the last error. */
const EMBEDDING_MAX_RETRIES = 3;

/** Initial retry delay in milliseconds; each subsequent retry doubles this value. */
const EMBEDDING_RETRY_DELAY_MS = 1000;

/** Maximum character length accepted for a single embedding input. */
const EMBEDDING_MAX_CHUNK_LENGTH = 8000;

/** Minimum trimmed character length accepted for persisted/searchable embedding text. */
const EMBEDDING_MIN_TEXT_LENGTH = 50;

/** Default hybrid-search vector weighting; the remaining score weight is keyword matching. */
const VECTOR_SEARCH_VECTOR_WEIGHT = 0.8;

/**
 * Checks whether a candidate vector can be stored in the configured embedding column.
 *
 * @param {Array<number>} embedding - Candidate vector returned by an embedding model or test fixture.
 * @returns {boolean} `true` when the vector has exactly `EMBEDDING_DIMENSION` numeric entries.
 */
function isValidEmbedding(embedding) {
  return (
    Array.isArray(embedding) &&
    embedding.length === EMBEDDING_DIMENSION &&
    embedding.every((val) => typeof val === 'number')
  );
}

/**
 * Checks whether text is inside the configured embedding length window.
 *
 * @param {string} text - Raw content that may be sent to the embedding model.
 * @returns {boolean} `true` for strings whose trimmed length fits the min/max character bounds.
 */
function isValidTextForEmbedding(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return (
    trimmed.length >= EMBEDDING_MIN_TEXT_LENGTH && trimmed.length <= EMBEDDING_MAX_CHUNK_LENGTH
  );
}

/** Heuristic token multiplier used when a real tokenizer is not supplied. */
const TOKENS_PER_WORD = 1.3;

/** Conservative token ceiling kept below the embedding model cap. */
const MAX_SAFE_TOKENS = 8000;

/** Provider pricing in USD per one million input tokens, keyed by embedding model id. */
const PRICING_TABLE = {
  'text-embedding-3-small': 0.02,
  'text-embedding-3-large': 0.13,
  'text-embedding-ada-002': 0.1,
};

/** Cost per million tokens for the selected embedding model, with ada pricing as fallback. */
const ratePerMillion = PRICING_TABLE[EMBEDDING_MODEL] || 0.1;

/**
 * Estimates provider cost for a token count using the configured embedding model rate.
 *
 * @param {number} totalTokens - Total number of embedding input tokens.
 * @returns {number} Estimated cost in USD for the supplied token count.
 */
const estimatedCost = (totalTokens) => (totalTokens / 1_000_000) * ratePerMillion;

/**
 * Estimates token count for embedding batching and cost reporting.
 *
 * @param {string} text - Chunk content to measure before embedding.
 * @param {{ encode: (text: string) => Array<unknown> }|null} [tokenEncoder=null] - Optional tokenizer; word-count estimation is used when absent.
 * @returns {number} Exact encoded length when a tokenizer is supplied, otherwise a rounded-up heuristic estimate.
 */
function estimateTokens(text, tokenEncoder = null) {
  if (!tokenEncoder) return Math.ceil(text.trim().split(/\s+/).length * TOKENS_PER_WORD);
  return tokenEncoder.encode(text).length;
}

/**
 * Generates deterministic pseudo-embeddings for tests and offline pipeline dry runs.
 *
 * @param {string} text - Stable input used to seed the pseudo-random vector.
 * @returns {Array<number>} Deterministic vector with `EMBEDDING_DIMENSION` values in the 0-1 range.
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
 * Runs an async operation with exponential backoff between failed attempts.
 * Each failed non-final attempt is logged with its one-based attempt number and delay.
 *
 * @template T
 * @param {() => Promise<T>} fn - Async operation to retry until it resolves or attempts are exhausted.
 * @param {number} [maxRetries=EMBEDDING_MAX_RETRIES] - Total attempts, including the initial call.
 * @returns {Promise<T>} Fulfilled value from the first successful attempt.
 * @throws {unknown} Last error thrown by `fn` after all retry attempts fail.
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
