/** LocalStorage helpers with JSON serialisation.
 *
 * Storage Keys:
 * - session_id: Unique identifier for this browser session
 * - session_evaluation_state: Current evaluation form state + unsaved results
 *
 * Location: src/lib/storage.js
 */

// ============================================================================
// Evaluation State Management
// ============================================================================

// Storage keys
const SESSION_EVALUATION_STATE_KEY = 'session_evaluation_state';

// Session expiry
const SESSION_EXPIRY_DAYS = 30;

/**
 * Save evaluation state with unified structure
 * Supports partial updates: only provided fields are updated, others are preserved
 * @param {Object} state - State to save (can be partial)
 * @param {Object} state.inputs - User inputs (businessProblem, businessSolution, parameters)
 * @param {Object|null} state.results - Complete results object (null to clear, undefined to preserve existing)
 */
export function saveEvaluationState(state) {
  try {
    // Load existing state to support partial updates
    const existingState = loadEvaluationState() || {};

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const stateToSave = {
      // Always update inputs if provided. Use nullish coalescing so empty strings
      // and empty objects are persisted ("" is a valid value and must not be
      // treated as 'not provided'). The previous implementation used `||` and
      // therefore ignored empty strings.
      inputs: {
        businessProblem:
          state?.inputs?.businessProblem ??
          state?.businessProblem ??
          existingState.inputs?.businessProblem ??
          '',
        businessSolution:
          state?.inputs?.businessSolution ??
          state?.businessSolution ??
          existingState.inputs?.businessSolution ??
          '',
        evaluationParameters:
          state?.inputs?.evaluationParameters ??
          state?.evaluationParameters ??
          existingState.inputs?.evaluationParameters ??
          {},
        businessContext:
          state?.inputs?.businessContext ??
          state?.businessContext ??
          existingState.inputs?.businessContext ??
          {},
      },
      // PRESERVE existing results unless explicitly provided or set to null
      // If `state.results` is provided (including an empty object), we treat this as
      // an intentional update of the snapshot. When a new snapshot is stored we
      // ensure it contains the frozen inputs that generated the result so the
      // snapshot is self-contained and immutable thereafter. If the caller did
      // not include those fields we fall back to provided `state.inputs` or the
      // previously persisted `existingState.inputs`.
      results:
        state.results !== undefined
          ? (function () {
              // Explicit clear
              if (!state.results) return state.results || state.calculatedResults || null;

              // Ensure snapshot contains businessProblem / businessSolution / parameters
              const srcInputs = state.inputs || existingState.inputs || {};

              const ensured = {
                businessProblem:
                  state.results.businessProblem ??
                  state.results.problem ??
                  srcInputs.businessProblem ??
                  '',
                businessSolution:
                  state.results.businessSolution ??
                  state.results.solution ??
                  srcInputs.businessSolution ??
                  '',
                // Use explicit `evaluationParameters` on the result,
                // otherwise fall back to the inputs snapshot
                evaluationParameters:
                  state.results.evaluationParameters ??
                  state.results.evaluation_parameters ??
                  srcInputs.evaluationParameters ??
                  {},
                businessContext: state.results.businessContext ?? srcInputs.businessContext ?? {},
                // Preserve all original result fields (scores, metadata, similar_cases, etc.)
                ...state.results,
              };

              return ensured;
            })()
          : existingState.results || null,
      timestamp: state.timestamp || existingState.timestamp || now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem(SESSION_EVALUATION_STATE_KEY, JSON.stringify(stateToSave));
    return true;
  } catch (error) {
    logger.error('Failed to save evaluation state:', error);
    return false;
  }
}

/**
 * Load evaluation state from localStorage
 * Returns null if expired or not found
 */
export function loadEvaluationState() {
  try {
    const stored = localStorage.getItem(SESSION_EVALUATION_STATE_KEY);

    if (!stored) return null;

    const state = JSON.parse(stored);

    // Check expiry
    if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
      clearEvaluationState();
      return null;
    }

    return state;
  } catch (error) {
    logger.error('Failed to load evaluation state:', error);
    return null;
  }
}

/**
 * Clear evaluation state from localStorage
 */
export function clearEvaluationState() {
  try {
    localStorage.removeItem(SESSION_EVALUATION_STATE_KEY);
    return true;
  } catch (error) {
    logger.error('Failed to clear evaluation state:', error);
    return false;
  }
}

/**
 * Check if evaluation state has any meaningful content
 */
export function hasEvaluationContent() {
  const state = loadEvaluationState();
  if (!state) return false;

  const hasInputs = Boolean(
    state.inputs?.businessProblem?.trim() ||
    state.inputs?.businessSolution?.trim() ||
    Object.keys(state.inputs?.businessContext || {}).length > 0 ||
    Object.keys(state.inputs?.evaluationParameters || {}).length > 0,
  );

  const hasResults = Boolean(state.results);

  return hasInputs || hasResults;
}

// ============================================================================
// Form Persistence Management
// ============================================================================

// Storage keys for form persistence
const SHARE_FORM_KEY = 'share_form_state';
const COMPARE_FORM_KEY = 'compare_form_state';
const FORM_EXPIRY_HOURS = 24; // Forms persist for 24 hours

/**
 * Save share form state to sessionStorage
 * @param {string} publicId - The assessment ID to persist
 */
export function saveShareFormState(publicId) {
  try {
    const state = {
      publicId: publicId?.trim() || '',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + FORM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
    };
    sessionStorage.setItem(SHARE_FORM_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    logger.error('Failed to save share form state:', error);
    return false;
  }
}

/**
 * Load share form state from sessionStorage
 * Returns null if expired or not found
 */
export function loadShareFormState() {
  try {
    const stored = sessionStorage.getItem(SHARE_FORM_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored);

    // Check expiry
    if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
      sessionStorage.removeItem(SHARE_FORM_KEY);
      return null;
    }

    return state;
  } catch (error) {
    logger.error('Failed to load share form state:', error);
    return null;
  }
}

/**
 * Clear share form state from sessionStorage
 */
export function clearShareFormState() {
  try {
    sessionStorage.removeItem(SHARE_FORM_KEY);
    return true;
  } catch (error) {
    logger.error('Failed to clear share form state:', error);
    return false;
  }
}

/**
 * Save compare form state to sessionStorage
 * @param {string} publicId1 - First assessment ID
 * @param {string} publicId2 - Second assessment ID
 */
export function saveCompareFormState(publicId1, publicId2) {
  try {
    const state = {
      publicId1: publicId1?.trim() || '',
      publicId2: publicId2?.trim() || '',
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + FORM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
    };
    sessionStorage.setItem(COMPARE_FORM_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    logger.error('Failed to save compare form state:', error);
    return false;
  }
}

/**
 * Load compare form state from sessionStorage
 * Returns null if expired or not found
 */
export function loadCompareFormState() {
  try {
    const stored = sessionStorage.getItem(COMPARE_FORM_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored);

    // Check expiry
    if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
      sessionStorage.removeItem(COMPARE_FORM_KEY);
      return null;
    }

    return state;
  } catch (error) {
    logger.error('Failed to load compare form state:', error);
    return null;
  }
}

/**
 * Clear compare form state from sessionStorage
 */
export function clearCompareFormState() {
  try {
    sessionStorage.removeItem(COMPARE_FORM_KEY);
    return true;
  } catch (error) {
    logger.error('Failed to clear compare form state:', error);
    return false;
  }
}
