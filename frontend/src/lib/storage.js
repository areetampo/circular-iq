/**
 * Storage and Session Management
 * Handles localStorage operations, session IDs, and evaluation state
 *
 * Storage Key Naming Convention:
 * All keys use 'ce_' prefix (Circular Economy) for consistency and clarity
 * - ce_session_id: Unique identifier for this browser session (persisted across page reloads)
 * - ce_session_evaluation_state: Current evaluation form state + unsaved results
 * - ce_assessments: Locally saved assessments (offline capability)
 * - ce_anonymous_session: (see session.js) Anonymous user full session with inputs and results
 *
 * Location: src/lib/storage.js
 */

// ============================================================================
// Session Management
// ============================================================================

// Simplified storage keys
const SESSION_ID_KEY = 'session_id';
const session_evaluation_state_KEY = 'session_evaluation_state';

// Session expiry
const SESSION_EXPIRY_DAYS = 30;

/**
 * Get or create session ID for user tracking
 * @returns {string} Session ID
 */
export function getSessionId() {
  try {
    const legacyKey = 'gtg_session_id';
    const oldCeKey = 'ce_session_id';

    // Prefer the new key, but fallback to legacy keys and migrate if present
    let sid = localStorage.getItem(SESSION_ID_KEY);
    if (sid) return sid;

    // Try old ce_session_id key
    const oldSid = localStorage.getItem(oldCeKey);
    if (oldSid) {
      try {
        localStorage.setItem(SESSION_ID_KEY, oldSid);
        localStorage.removeItem(oldCeKey);
      } catch (e) {
        console.warn('Failed to migrate old session ID:', e);
      }
      return oldSid;
    }

    // Try legacy key
    const legacySid = localStorage.getItem(legacyKey);
    if (legacySid) {
      try {
        localStorage.setItem(SESSION_ID_KEY, legacySid);
        localStorage.removeItem(legacyKey);
      } catch (e) {
        console.warn('Failed to migrate legacy session ID:', e);
      }
      return legacySid;
    }

    // Create new one when none present
    sid = generateSimpleUUID();
    try {
      localStorage.setItem(SESSION_ID_KEY, sid);
    } catch (e) {
      console.warn('Failed to save session ID:', e);
    }
    return sid;
  } catch {
    // Fallback: in environments without localStorage
    return generateSimpleUUID();
  }
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

// ============================================================================
// Evaluation State Management
// ============================================================================

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

    localStorage.setItem(session_evaluation_state_KEY, JSON.stringify(stateToSave));
    return true;
  } catch (error) {
    console.error('Failed to save evaluation state:', error);
    return false;
  }
}

/**
 * Load evaluation state from localStorage
 * Returns null if expired or not found
 */
export function loadEvaluationState() {
  try {
    const legacyKey = 'gtg_eval_state';
    const oldCeKey = 'ce_session_evaluation_state';

    let stored = localStorage.getItem(session_evaluation_state_KEY);

    // Try old ce_session_evaluation_state key
    if (!stored) {
      stored = localStorage.getItem(oldCeKey);
      if (stored) {
        try {
          localStorage.setItem(session_evaluation_state_KEY, stored);
          localStorage.removeItem(oldCeKey);
        } catch (e) {
          // ignore
        }
      }
    }

    // Try legacy key
    if (!stored) {
      stored = localStorage.getItem(legacyKey);
      if (stored) {
        try {
          localStorage.setItem(session_evaluation_state_KEY, stored);
          localStorage.removeItem(legacyKey);
        } catch (e) {
          // ignore
        }
      }
    }

    if (!stored) return null;

    const state = JSON.parse(stored);

    // Check expiry
    if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
      clearEvaluationState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load evaluation state:', error);
    return null;
  }
}

/**
 * Clear evaluation state from localStorage
 */
export function clearEvaluationState() {
  try {
    localStorage.removeItem(session_evaluation_state_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear evaluation state:', error);
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
// Assessment Storage (for My Assessments page)
// ============================================================================

/**
 * Save assessment to local storage
 * @param {Object} assessment - Assessment data
 * @returns {string} Assessment ID
 */
export function saveAssessmentLocal(assessment) {
  try {
    const assessments = loadAssessmentsLocal();
    const id = assessment.id || generateSimpleUUID();
    const timestamp = new Date().toISOString();

    const assessmentWithMeta = {
      ...assessment,
      id,
      savedAt: timestamp,
      updatedAt: timestamp,
    };

    assessments[id] = assessmentWithMeta;
    localStorage.setItem('ce_assessments', JSON.stringify(assessments));

    return id;
  } catch (error) {
    console.error('Failed to save assessment:', error);
    throw error;
  }
}

/**
 * Load all assessments from local storage
 * @returns {Object} Object with assessment IDs as keys
 */
export function loadAssessmentsLocal() {
  try {
    const key = 'ce_assessments';
    const legacyKey = 'gtg_assessments';
    let raw = localStorage.getItem(key);
    if (!raw) {
      raw = localStorage.getItem(legacyKey);
      if (raw) {
        try {
          localStorage.setItem(key, raw);
          localStorage.removeItem(legacyKey);
        } catch (e) {
          // ignore
        }
      }
    }
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Failed to load assessments:', error);
    return {};
  }
}

/**
 * Load single assessment by ID
 * @param {string} id - Assessment ID
 * @returns {Object|null} Assessment or null
 */
export function loadAssessmentLocal(id) {
  try {
    const assessments = loadAssessmentsLocal();
    return assessments[id] || null;
  } catch (error) {
    console.warn('Failed to load assessment:', error);
    return null;
  }
}

/**
 * Delete assessment from local storage
 * @param {string} id - Assessment ID
 * @returns {boolean} Success
 */
export function deleteAssessmentLocal(id) {
  try {
    const assessments = loadAssessmentsLocal();
    delete assessments[id];
    localStorage.setItem('ce_assessments', JSON.stringify(assessments));
    return true;
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    return false;
  }
}

/**
 * Update existing assessment
 * @param {string} id - Assessment ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated assessment or null
 */
export function updateAssessmentLocal(id, updates) {
  try {
    const assessments = loadAssessmentsLocal();
    if (!assessments[id]) return null;

    assessments[id] = {
      ...assessments[id],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('ce_assessments', JSON.stringify(assessments));
    return assessments[id];
  } catch (error) {
    console.error('Failed to update assessment:', error);
    return null;
  }
}

// ============================================================================
// Generic Storage Helpers
// ============================================================================

/**
 * Generic localStorage wrapper with error handling
 */
export const storage = {
  /**
   * Save value to localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  save: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage save error:', error);
    }
  },

  /**
   * Load value from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Parsed value or default
   */
  load: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  },

  /**
   * Remove value from localStorage
   * @param {string} key - Storage key
   */
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  /**
   * Clear all localStorage
   */
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  has: (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};
