/**
 * Storage and Session Management
 * Handles localStorage operations, session IDs, and evaluation state
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
    const key = 'gtg_session_id';
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = generateSimpleUUID();
      localStorage.setItem(key, sid);
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
    localStorage.setItem('gtg_eval_state', JSON.stringify(state));
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
    const raw = localStorage.getItem('gtg_eval_state');
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
    localStorage.removeItem('gtg_eval_state');
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
    localStorage.setItem('gtg_assessments', JSON.stringify(assessments));

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
    const raw = localStorage.getItem('gtg_assessments');
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
    localStorage.setItem('gtg_assessments', JSON.stringify(assessments));
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

    localStorage.setItem('gtg_assessments', JSON.stringify(assessments));
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
