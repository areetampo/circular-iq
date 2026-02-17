/**
 * Session utilities
 * Includes anonymous session helpers (localStorage-based) and
 * re-exports core storage helpers for evaluation state.
 *
 * Storage key naming convention: 'ce_' prefix for all Circular Economy app keys
 * - ce_session_id: Unique identifier for this browser session
 * - ce_evaluation_state: Current evaluation form state and results
 * - ce_anonymous_session: Anonymous user session with inputs and results
 * - ce_assessments: Locally saved assessments
 */

import {
  getSessionId,
  saveEvaluationState,
  loadEvaluationState,
  clearEvaluationState,
  storage,
} from '@/lib/storage';

const ANONYMOUS_SESSION_KEY = 'ce_anonymous_session';
const SESSION_EXPIRY_DAYS = 7;

/**
 * Save anonymous session data
 */
export function saveAnonymousSession(data) {
  const sessionData = {
    inputs: data.inputs || null,
    results: data.results || null,
    timestamp: new Date().toISOString(),
    hasUnsavedResults: data.hasUnsavedResults || false,
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  try {
    localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error('Failed to save anonymous session:', error);
    return false;
  }
}

/**
 * Get anonymous session data
 */
export function getAnonymousSession() {
  try {
    // Prefer new key, fallback to legacy key and migrate if needed
    const legacyKey = 'circularity_anonymous_session';
    let stored = localStorage.getItem(ANONYMOUS_SESSION_KEY);
    if (!stored) {
      stored = localStorage.getItem(legacyKey);
      if (stored) {
        try {
          localStorage.setItem(ANONYMOUS_SESSION_KEY, stored);
          localStorage.removeItem(legacyKey);
        } catch (e) {
          // ignore
        }
      }
    }

    if (!stored) return null;

    const session = JSON.parse(stored);

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      clearAnonymousSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get anonymous session:', error);
    return null;
  }
}

/**
 * Clear anonymous session
 */
export function clearAnonymousSession() {
  try {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear anonymous session:', error);
    return false;
  }
}

/**
 * Check if anonymous session exists and is valid
 */
export function hasValidAnonymousSession() {
  const session = getAnonymousSession();
  return session !== null;
}

// Re-export core storage helpers
export { getSessionId, saveEvaluationState, loadEvaluationState, clearEvaluationState, storage };

/**
 * Check if there are unsaved results in session
 */
export function hasUnsavedResults() {
  const anonSession = getAnonymousSession();
  if (anonSession?.hasUnsavedResults) return true;

  const evalState = loadEvaluationState();
  if (evalState?.hasUnsavedResults) return true;

  return false;
}

/**
 * Get the most recent session data (anonymous or authenticated)
 */
export function getMostRecentSession() {
  const anonSession = getAnonymousSession();
  const evalState = loadEvaluationState();

  if (anonSession && evalState) {
    const anonTime = new Date(anonSession.timestamp || 0).getTime();
    const evalTime = new Date(evalState.timestamp || 0).getTime();
    return anonTime > evalTime ? anonSession : evalState;
  }

  return anonSession || evalState || null;
}
