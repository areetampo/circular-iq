/**
 * @module formHelpers
 * @description Input-quality heuristics for the landing-page evaluation form (spam / gibberish detection).
 */

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

/**
 * Detects single-character flooding (e.g. "AAAA..." or "1111...")
 * @param {string} text - Text to analyze
 * @returns {number} - Dominant character ratio (0-1)
 */
export const dominantCharRatio = (text) => {
  const clean = text.replace(/\s/g, '');
  if (!clean.length) return 0;
  const freq = {};
  for (const ch of clean) freq[ch] = (freq[ch] || 0) + 1;
  return Math.max(...Object.values(freq)) / clean.length;
};
