export function parseSortBy(sortBy = 'created_at_desc') {
  const parts = String(sortBy).split('_');
  const order = parts[parts.length - 1] === 'desc' ? 'desc' : 'asc';
  const field = parts.slice(0, -1).join('_');
  return { field, order };
}
