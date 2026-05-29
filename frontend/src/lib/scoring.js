/**
 * Formats snake_case or camelCase factor keys to Title Case labels for results UI.
 *
 * @param {string} factorName - Score factor key from API payloads or local result objects.
 * @returns {string} Human-readable factor label such as "Technical Feasibility".
 */
export function formatFactorName(factorName) {
  if (!factorName) return '';

  return (
    factorName
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Add space before uppercase letters (for camelCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Convert to title case
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim()
  );
}
