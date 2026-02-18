/**
 * Session utilities
 * Unified session management for both anonymous and authenticated users
 * Uses a single localStorage structure with expiry handling
 */

import {
  getSessionId,
  saveEvaluationState,
  loadEvaluationState,
  clearEvaluationState,
  hasEvaluationContent,
  storage,
} from '@/lib/storage';

// Re-export storage helpers for backward compatibility
export {
  getSessionId,
  saveEvaluationState,
  loadEvaluationState,
  clearEvaluationState,
  hasEvaluationContent,
  storage,
};

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

/**
 * Clear current session
 */
export function clearSession() {
  return clearEvaluationState();
}

/**
 * Check if session currently contains a results snapshot
 * (keeps API name for compatibility but semantics simplified)
 */
export function hasUnsavedResults() {
  const state = loadEvaluationState();
  return Boolean(state?.results);
}

/**
 * Get the most recent session data (for compatibility)
 */
export function getMostRecentSession() {
  return loadEvaluationState();
}

// Legacy compatibility exports (in case old code references these)
export const getAnonymousSession = getSession;
export const saveAnonymousSession = saveSession;
export const clearAnonymousSession = clearSession;
export const hasValidAnonymousSession = hasEvaluationContent;
