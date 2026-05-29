/**
 * Sanitizes controller errors before they are serialized into HTTP JSON responses.
 * Only application-owned error codes are allowed to expose their messages; database,
 * auth library, and network failures are replaced by caller-provided fallback text.
 */

/**
 * Application error codes whose `.message` values are safe to send to clients.
 * Every code here was set explicitly in application code, not by a library.
 *
 * Add new codes here as your domain grows; never add library/DB codes.
 *
 * @type {Set<string>}
 */
const SAFE_CODES = new Set([
  // Assessment domain
  'NOT_FOUND',
  'FORBIDDEN',
  'NOT_PUBLIC',
  'DUPLICATE_NAME',
  'TITLE_LENGTH_INVALID',
  'INVALID_FORMAT',
  'INVALID_IDS',
  // Scoring domain
  'MISSING_FIELDS',
  'PROBLEM_TOO_SHORT',
  'SOLUTION_TOO_SHORT',
  'JUNK_INPUT',
  'MISSING_PARAMETERS',
  'INVALID_PARAMETER_VALUE',
  'INPUT_TOO_LONG',
  // Search domain
  'MISSING_QUERY',
  'QUERY_TOO_LONG',
  'INVALID_MODE',
  'INVALID_VECTOR_WEIGHT',
  'EMBEDDING_FAILED',
  // Auth / profile
  'PROFILE_NOT_FOUND',
  'RATE_LIMIT_EXCEEDED',
]);

/**
 * Returns `true` when the error was thrown intentionally by application code
 * and its message is safe to forward to the client.
 *
 * @param {unknown} error - Value caught by route/controller error handling.
 * @returns {boolean} `true` only when `error.code` is one of the application-owned public codes.
 */
function isSafeError(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (/** @type {Record<string, unknown>} */ (error).code) === 'string' &&
    SAFE_CODES.has(/** @type {Record<string, any>} */ (error).code)
  );
}

/**
 * Builds a sanitized `{ error, code }` payload for an HTTP JSON response.
 *
 * - If `error` is a known application error, its message and code pass through.
 * - Otherwise the `fallback` string is used and code is forced to `'INTERNAL_ERROR'`,
 * preventing DB internals, stack traces, or library messages from reaching clients.
 *
 * Always pair with `logger.error({ error }, ...)` *before* calling this so the
 * real error is preserved in your logs.
 *
 * @param {unknown} error - Original failure object; unsafe messages are replaced with `fallback`.
 * @param {string} [fallback='Internal server error'] - Generic human-readable message for unexpected failures.
 * @returns {{ error: string, code: string }} Public response payload with either the safe app code or `INTERNAL_ERROR`.
 *
 * @example
 * } catch (error) {
 * logger.error({ error }, 'Failed to save assessment');
 * const status = error?.code === 'TITLE_LENGTH_INVALID' ? 400 : 500;
 * res.status(status).json({
 * ...toClientError(error, 'Failed to save assessment'),
 * timestamp: new Date().toISOString(),
 * });
 * }
 */
export function toClientError(error, fallback = 'Internal server error') {
  if (isSafeError(error)) {
    const appError = /** @type {Record<string, any>} */ (error);
    return {
      // Fall back to the code string if .message is missing or empty
      error:
        typeof appError.message === 'string' && appError.message ? appError.message : appError.code,
      code: appError.code,
    };
  }
  return { error: fallback, code: 'INTERNAL_ERROR' };
}
