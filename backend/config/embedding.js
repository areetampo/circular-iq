/**
 * Embedding Configuration - Centralized Constants
 *
 * Single source of truth for embedding model parameters used across:
 * - SQL migrations (vector dimension)
 * - embed_and_store.js (OpenAI API calls)
 * - Scoring/search API routes
 * - Database vector operations
 *
 * @file Centralizes embedding configuration to prevent hardcoding across files
 */

/**
 * OpenAI embedding model identifier
 * @type {string}
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Vector dimension for text-embedding-3-small from OpenAI
 * DO NOT CHANGE without migration - this is baked into DB schema
 * @type {number}
 */
export const EMBEDDING_DIMENSION = 1536;

/**
 * Batch size for OpenAI embedding API calls
 * Higher = faster but higher memory/cost; OpenAI default is ~2000
 * @type {number}
 */
export const EMBEDDING_BATCH_SIZE = 20;

/**
 * Delay between batches to respect rate limits (milliseconds)
 * @type {number}
 */
export const EMBEDDING_BATCH_DELAY_MS = 500;

/**
 * Timeout for OpenAI embedding requests (milliseconds)
 * @type {number}
 */
export const EMBEDDING_REQUEST_TIMEOUT_MS = 30000;

/**
 * Maximum retries for embedding API with exponential backoff
 * @type {number}
 */
export const EMBEDDING_MAX_RETRIES = 3;

/**
 * Initial retry delay in milliseconds (doubles on each retry)
 * @type {number}
 */
export const EMBEDDING_RETRY_DELAY_MS = 1000;

/**
 * Maximum length for a single chunk of text to embed (characters)
 * Leave room for metadata and processing overhead
 * @type {number}
 */
export const EMBEDDING_MAX_CHUNK_LENGTH = 8000;

/**
 * Minimum length for text to embed (characters)
 * Skip very short content to save API calls
 * @type {number}
 */
export const EMBEDDING_MIN_TEXT_LENGTH = 50;

/**
 * Vector search similarity threshold (cosine distance, 0-1)
 * Results below this are filtered out
 * @type {number}
 */
export const VECTOR_SIMILARITY_THRESHOLD = 0.0;

/**
 * Default number of vector search results to return
 * @type {number}
 */
export const VECTOR_SEARCH_DEFAULT_LIMIT = 10;

/**
 * Maximum number of vector search results user can request
 * Prevents expensive queries
 * @type {number}
 */
export const VECTOR_SEARCH_MAX_LIMIT = 50;

/**
 * Weight for vector similarity in hybrid search (0-1)
 * 0.8 = 80% vector, 20% keyword
 * @type {number}
 */
export const VECTOR_SEARCH_VECTOR_WEIGHT = 0.8;

/**
 * SQL type definition for embedding column
 * Used in migrations to define vector column type
 * @type {string}
 */
export const VECTOR_COLUMN_TYPE = `extensions.vector(${EMBEDDING_DIMENSION})`;

/**
 * Get formatted vector type for SQL
 * @returns {string} e.g., "extensions.vector(1536)"
 */
export function getVectorColumnType() {
  return VECTOR_COLUMN_TYPE;
}

/**
 * Validate embedding vector dimensions
 * @param {Array<number>} embedding - Vector to validate
 * @returns {boolean} True if dimensions match expected size
 */
export function isValidEmbedding(embedding) {
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
export function isValidTextForEmbedding(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return (
    trimmed.length >= EMBEDDING_MIN_TEXT_LENGTH && trimmed.length <= EMBEDDING_MAX_CHUNK_LENGTH
  );
}

export default {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
  EMBEDDING_BATCH_SIZE,
  EMBEDDING_BATCH_DELAY_MS,
  EMBEDDING_REQUEST_TIMEOUT_MS,
  EMBEDDING_MAX_RETRIES,
  EMBEDDING_RETRY_DELAY_MS,
  EMBEDDING_MAX_CHUNK_LENGTH,
  EMBEDDING_MIN_TEXT_LENGTH,
  VECTOR_SIMILARITY_THRESHOLD,
  VECTOR_SEARCH_DEFAULT_LIMIT,
  VECTOR_SEARCH_MAX_LIMIT,
  VECTOR_SEARCH_VECTOR_WEIGHT,
  getVectorColumnType,
  isValidEmbedding,
  isValidTextForEmbedding,
};
