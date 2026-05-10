/** Score classification helpers */

/**
 * Format factor names to readable title case
 * Converts snake_case or camelCase to Title Case with spaces
 * @param {string} factorName - Raw factor name
 * @returns {string} Formatted factor name
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
