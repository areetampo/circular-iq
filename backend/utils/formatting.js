/**
 * @module formatting
 * @description Utility functions for formatting and converting values.
 * Provides safe number conversion and timestamp formatting with configurable options.
 */

/**
 * Convert value to safe number, defaulting to 0 for invalid values.
 * Handles null, undefined, NaN, and non-numeric inputs gracefully.
 *
 * @param {*} value - Value to convert (number, string, or any type)
 * @returns {number} Safe number value (0 for invalid inputs)
 *
 * @example
 * safeNumber(42) // Returns: 42
 * safeNumber('123') // Returns: 123
 * safeNumber(null) // Returns: 0
 * safeNumber('invalid') // Returns: 0
 */
export function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Formats a timestamp into a human-readable string using locale-specific formatting.
 * Supports flexible display options for date, time, and timezone components.
 *
 * @param {number|string|Date} timestamp - Timestamp to format (Unix timestamp, ISO string, or Date object)
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.showYear=true] - Include year in output
 * @param {boolean} [options.showMonth=true] - Include month in output
 * @param {boolean} [options.showDay=true] - Include day in output
 * @param {boolean} [options.showSeconds=false] - Include seconds in time
 * @param {boolean} [options.showMs=false] - Include milliseconds in time
 * @param {boolean} [options.use24Hour=false] - Use 24-hour format instead of 12-hour
 * @param {boolean} [options.showTimezone=true] - Include timezone in output
 * @param {'short'|'long'} [options.timezoneStyle='short'] - Timezone display style
 * @returns {string} Formatted timestamp string, or error message for invalid input
 *
 * @example
 * formatTimestamp(1704067200000) // Returns: '01 Jan 2024, 00:00'
 * formatTimestamp('2024-01-01T00:00:00Z', { showSeconds: true }) // Returns: '01 Jan 2024, 00:00:00'
 * formatTimestamp(null) // Returns: '[Unknown time]'
 */
export function formatTimestamp(
  timestamp,
  {
    showYear = true,
    showMonth = true,
    showDay = true,
    showSeconds = false,
    showMs = false,
    use24Hour = false,
    showTimezone = true,
    timezoneStyle = 'short', // 'short' | 'long'
  } = {},
) {
  if (!timestamp) return '[Unknown time]';

  const d = new Date(timestamp);

  if (isNaN(d.getTime())) {
    return '[Invalid timestamp]';
  }

  return d.toLocaleString('en-GB', {
    year: showYear ? 'numeric' : undefined,
    month: showMonth ? 'short' : undefined,
    day: showDay ? 'numeric' : undefined,

    hour: '2-digit',
    minute: '2-digit',

    second: showSeconds || showMs ? '2-digit' : undefined,

    fractionalSecondDigits: showMs ? 3 : undefined,

    hour12: !use24Hour,

    timeZoneName: showTimezone ? timezoneStyle : undefined,
  });
}
