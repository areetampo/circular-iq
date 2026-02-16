/**
 * Session utilities
 * Includes anonymous session helpers (localStorage-based) and
 * re-exports core storage helpers for evaluation state.
 */

import {
  getSessionId,
  saveEvaluationState,
  loadEvaluationState,
  clearEvaluationState,
  storage,
} from '@/lib/storage';

const ANONYMOUS_SESSION_KEY = 'circularity_anonymous_session';
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
    const stored = localStorage.getItem(ANONYMOUS_SESSION_KEY);
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
