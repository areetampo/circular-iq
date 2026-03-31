/**
 * Form utility functions to reduce code duplication
 */

/**
 * Normalizes context object by removing undefined values for comparison
 * @param {Object} ctx - Context object to normalize
 * @returns {Object} - Normalized context object
 */
export const normalizeContext = (ctx) => {
  if (!ctx) return {};
  const normalized = {};
  Object.keys(ctx).forEach((key) => {
    if (ctx[key] !== undefined) {
      normalized[key] = ctx[key];
    }
  });
  return normalized;
};

/**
 * Compares two form input objects for equality
 * @param {Object} a - First input object
 * @param {Object} b - Second input object
 * @returns {boolean} - Whether inputs are equal
 */
export const inputsEqual = (a = {}, b = {}) => {
  try {
    const aBP = (a.businessProblem || '').trim();
    const bBP = (b.businessProblem || '').trim();
    const aBS = (a.businessSolution || '').trim();
    const bBS = (b.businessSolution || '').trim();
    const aParams = a.evaluationParameters || {};
    const bParams = b.evaluationParameters || {};
    const aContext = a.businessContext || {};
    const bContext = b.businessContext || {};

    const aContextNorm = normalizeContext(aContext);
    const bContextNorm = normalizeContext(bContext);

    return (
      aBP === bBP &&
      aBS === bBS &&
      JSON.stringify(aParams) === JSON.stringify(bParams) &&
      JSON.stringify(aContextNorm) === JSON.stringify(bContextNorm)
    );
  } catch (err) {
    return false;
  }
};

/**
 * Performs shallow equality check between two objects
 * @param {Object} objA - First object
 * @param {Object} objB - Second object
 * @returns {boolean} - Whether objects are shallowly equal
 */
export const shallowEqual = (objA = {}, objB = {}) => {
  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key) => Object.prototype.hasOwnProperty.call(objB, key) && objA[key] === objB[key],
  );
};

/**
 * Checks if text has sufficient unique word ratio
 * @param {string} text - Text to check
 * @returns {number} - Unique word ratio (0-1)
 */
export const uniqueWordRatio = (text) => {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 0;
  const uniq = new Set(words);
  return uniq.size / words.length;
};

/**
 * Calculates non-letter character density in text
 * @param {string} text - Text to analyze
 * @returns {number} - Non-letter density (0-1)
 */
export const nonLetterDensity = (text) => {
  const total = text.length || 1;
  const matches = text.match(/[^a-z0-9\s.,_-]/gi) || [];
  return matches.length / total;
};
