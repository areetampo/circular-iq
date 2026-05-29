/**
 * Anonymous `session_id` in localStorage and thin wrappers over evaluation state persistence.
 */

import { loadEvaluationState, saveEvaluationState } from '@/lib/storage';

// Session storage key
const SESSION_ID_KEY = 'session_id';

/**
 * Stable anonymous `session_id` in localStorage; creates one on first visit unless renewed.
 *
 * @param {boolean} [forceRenew=false] - When true, replaces any existing id.
 * @returns {string} Persisted or newly generated anonymous session identifier.
 */
export function getSessionId(forceRenew = false) {
  // If force renew is requested, create new session ID
  if (!forceRenew) {
    const existingSid = localStorage.getItem(SESSION_ID_KEY);
    if (existingSid) return existingSid;
  }

  // Create new session ID
  const sid = generateSimpleUUID();
  try {
    localStorage.setItem(SESSION_ID_KEY, sid);
  } catch (error) {
    logger.warn('[SESSION:ID_SAVE_FAILED]', error);
  }
  return sid;
}

/**
 * Creates a lightweight pseudo-UUID for anonymous browser sessions.
 *
 * @returns {string} Hyphenated random identifier shaped like a UUID.
 */
function generateSimpleUUID() {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * Persists evaluation inputs/results via `saveEvaluationState`.
 *
 * @param {{ inputs?: Object, results?: Object, timestamp?: string }} data - Session payload to persist.
 * @returns {boolean} True when the session payload is stored successfully.
 */
export function saveSession(data) {
  return saveEvaluationState({
    inputs: data.inputs || null,
    results: data.results || null,
    timestamp: data.timestamp || new Date().toISOString(),
  });
}

/**
 * Loads the current anonymous evaluation session snapshot.
 *
 * @returns {{
 *   inputs?: Object,
 *   results?: Object|null,
 *   timestamp?: string,
 *   expiresAt?: string
 * }|null} Evaluation state from localStorage, or null when missing/expired/invalid.
 */
export function getSession() {
  return loadEvaluationState();
}
