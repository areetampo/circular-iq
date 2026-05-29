/**
 * Parses My Assessments sort tokens (`field_asc` / `field_desc`) for API query params.
 *
 * @param {string|number|null} [sortBy='created_at_desc'] - Sort token from UI state, such as `overall_score_desc` or `name_asc`.
 * @returns {{ field: string, order: 'asc'|'desc' }} API sort field plus normalized direction.
 */
export function parseSortBy(sortBy = 'created_at_desc') {
  const parts = String(sortBy).split('_');
  const order = parts[parts.length - 1] === 'desc' ? 'desc' : 'asc';
  const field = parts.slice(0, -1).join('_');
  return { field, order };
}
