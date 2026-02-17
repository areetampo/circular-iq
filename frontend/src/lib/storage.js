/**
 * Storage and Session Management
 * Handles localStorage operations, session IDs, and evaluation state
 *
 * Storage Key Naming Convention:
 * All keys use 'ce_' prefix (Circular Economy) for consistency and clarity
 * - ce_session_id: Unique identifier for this browser session (persisted across page reloads)
 * - ce_evaluation_state: Current evaluation form state + unsaved results
 * - ce_assessments: Locally saved assessments (offline capability)
 * - ce_anonymous_session: (see session.js) Anonymous user full session with inputs and results
 *
 * Location: src/lib/storage.js
 */

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get or create session ID for user tracking
 * @returns {string} Session ID
 */
export function getSessionId() {
  try {
    const key = 'ce_session_id';
    const legacyKey = 'gtg_session_id';

    // Prefer the new key, but fallback to legacy and migrate if present
    let sid = localStorage.getItem(key);
    if (sid) return sid;

    const legacySid = localStorage.getItem(legacyKey);
    if (legacySid) {
      try {
        localStorage.setItem(key, legacySid);
        localStorage.removeItem(legacyKey);
      } catch (e) {
        // ignore storage errors
      }
      return legacySid;
    }

    // Create new one when none present
    sid = generateSimpleUUID();
    try {
      localStorage.setItem(key, sid);
    } catch (e) {
      // ignore
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
 * Save evaluation state to localStorage
 * @param {Object} state - Evaluation state to save
 */
export function saveEvaluationState(state) {
  try {
    localStorage.setItem('ce_evaluation_state', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save evaluation state:', error);
    // ignore storage errors (private mode or disabled storage)
  }
}

/**
 * Load evaluation state from localStorage
 * @returns {Object|null} Saved state or null
 */
export function loadEvaluationState() {
  try {
    // Prefer new key, fallback to legacy 'gtg_eval_state' and migrate
    const key = 'ce_evaluation_state';
    const legacyKey = 'gtg_eval_state';

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

    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to load evaluation state:', error);
    return null;
  }
}

/**
 * Clear evaluation state from localStorage
 */
export function clearEvaluationState() {
  try {
    localStorage.removeItem('ce_evaluation_state');
  } catch (error) {
    console.warn('Failed to clear evaluation state:', error);
    // ignore storage errors
  }
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
