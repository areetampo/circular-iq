/**
 * Input-quality heuristics for the landing-page evaluation form (spam / gibberish detection).
 */

/**
 * Unique-token ratio after normalizing punctuation — low values suggest repetitive spam.
 *
 * @param {string} text - Text input to inspect after punctuation and whitespace normalization.
 * @returns {number} Ratio in [0, 1]; 0 when empty.
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
 * Share of characters outside `[a-z0-9\s.,_-]` — high density flags symbol-heavy gibberish.
 *
 * @param {string} text - Text input whose symbol density indicates possible gibberish.
 * @returns {number} Density in [0, 1].
 */
export const nonLetterDensity = (text) => {
  const total = text.length || 1;
  const matches = text.match(/[^a-z0-9\s.,_-]/gi) || [];
  return matches.length / total;
};

/**
 * Fraction of non-space text occupied by the most frequent character (keyboard mash detection).
 *
 * @param {string} text - Text input checked for repeated-character keyboard-mash patterns.
 * @returns {number} Ratio in [0, 1].
 */
export const dominantCharRatio = (text) => {
  const clean = text.replace(/\s/g, '');
  if (!clean.length) return 0;
  const freq = {};
  for (const ch of clean) freq[ch] = (freq[ch] || 0) + 1;
  return Math.max(...Object.values(freq)) / clean.length;
};
