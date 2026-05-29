/** Resolves assessment fields from top-level, `result_json`, or nested `metadata`. */

/**
 * Reads `field` from an assessment object, checking top-level, `result_json`, and `metadata`.
 *
 * @param {Object|null|undefined} obj - Assessment or scoring result payload.
 * @param {string} field - Property name to resolve (e.g. `'industry'`).
 * @returns {*|null} Resolved value or `null` when absent.
 */
function getField(obj, field) {
  if (!obj) return null;

  // Direct top-level field
  if (obj[field]) return obj[field];

  // Some responses embed result under result_json
  if (obj.result_json && obj.result_json[field]) return obj.result_json[field];

  // Prefer metadata top-level
  if (obj.metadata && obj.metadata[field]) return obj.metadata[field];

  // Fallback: nested metadata inside result_json
  if (obj.result_json && obj.result_json.metadata && obj.result_json.metadata[field])
    return obj.result_json.metadata[field];

  return null;
}

/**
 * Extracts the industry label from any supported assessment payload nesting.
 *
 * @param {Object|null|undefined} obj - Assessment or scoring result payload.
 * @returns {string|null} Industry label from any supported payload nesting, or `null` when absent.
 */
export function getIndustry(obj) {
  return getField(obj, 'industry');
}
