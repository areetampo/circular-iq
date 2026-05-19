/**
 * @module metadata
 * @description Metadata extraction helpers for assessment results.
 * Provides functions to extract fields like industry from assessment objects
 * with support for nested structures (result_json, metadata).
 */

/**
 * Reads `field` from an assessment object, checking top-level, `result_json`, and `metadata`.
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
 * Extract industry from an assessment or scoring result (checks top-level, result_json, metadata).
 * @param {Object|null|undefined} obj - Assessment or result object
 * @returns {string|null}
 */
export function getIndustry(obj) {
  return getField(obj, 'industry');
}

/**
 * Default export mirroring named helpers for legacy imports.
 * @type {{ getIndustry: typeof getIndustry }}
 */
export default { getIndustry };
