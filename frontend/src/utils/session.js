/**
 * @module session
 * @description Session utilities for unified session management.
 * Supports both anonymous and authenticated users with a single localStorage structure.
 * Provides session ID generation, session data persistence, and retrieval.
 *
 * Functions:
 * - getSessionId: Get or create session ID for user tracking
 * - saveSession: Save session data (inputs, results, timestamp)
 * - getSession: Retrieve current session data
 */

import { loadEvaluationState, saveEvaluationState } from '@/lib/storage';

// Session storage key
const SESSION_ID_KEY = 'session_id';

/**
 * Get or create session ID for user tracking
 * @param {boolean} forceRenew - Force creation of new session ID even if one exists
 * @returns {string} Session ID
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
  } catch (e) {
    logger.warn('Failed to save session ID:', e);
  }
  return sid;
}

/**
 * Generate a simple UUID-like identifier
 * @private
 * @returns {string} UUID-like string
 */
function generateSimpleUUID() {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * Save session data (works for both anonymous and authenticated users)
 */
export function saveSession(data) {
  return saveEvaluationState({
    inputs: data.inputs || null,
    results: data.results || null,
    timestamp: data.timestamp || new Date().toISOString(),
  });
}

/**
 * Get current session data
 */
export function getSession() {
  return loadEvaluationState();
}
