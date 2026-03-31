/**
 * Analytics helper utilities to reduce code duplication
 */

/**
 * Validate that request query filter values are simple strings or null
 * @param {*} val - Value to sanitize
 * @returns {string|null} - Sanitized string or null
 */
export function sanitizeFilter(val) {
  if (val == null) return null;
  if (Array.isArray(val)) return null;
  if (typeof val === 'object') return null;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'all') return null;
  return str;
}

/**
 * Convert value to safe number, defaulting to 0 for invalid values
 * @param {*} value - Value to convert
 * @returns {number} - Safe number
 */
export function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Format month key for date grouping
 * @param {Date} date - Date to format
 * @returns {string} - Formatted month key (YYYY-MM)
 */
export function formatMonthKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Build array of recent months for analytics
 * @param {number} count - Number of months to generate
 * @returns {Array} - Array of month objects with key and label
 */
export function buildRecentMonths(count = 6) {
  const now = new Date();
  const months = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({
      key: formatMonthKey(monthDate),
      label: monthDate.toISOString().slice(0, 7),
    });
  }

  return months;
}

/**
 * Calculate percentage safely
 * @param {number} value - Numerator
 * @param {number} total - Denominator
 * @returns {number} - Percentage (0-100)
 */
export function safePercentage(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} - Rounded number
 */
export function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}
