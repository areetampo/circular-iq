/**
 * @module sortUtils
 * @description Parses My Assessments sort tokens (`field_asc` / `field_desc`) for API query params.
 */

/**
 * Splits a combined sort key into `{ field, order }` for the assessments list API.
 *
 * @param {string} [sortBy='created_at_desc'] - e.g. `overall_score_desc`, `name_asc`.
 * @returns {{ field: string, order: 'asc'|'desc' }}
 */
export function parseSortBy(sortBy = 'created_at_desc') {
  const parts = String(sortBy).split('_');
  const order = parts[parts.length - 1] === 'desc' ? 'desc' : 'asc';
  const field = parts.slice(0, -1).join('_');
  return { field, order };
}
