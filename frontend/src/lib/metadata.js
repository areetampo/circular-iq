/** Extracts industry from assessment results. */

// Internal helper function - not exported
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

export function getIndustry(obj) {
  return getField(obj, 'industry');
}

export default { getIndustry };
