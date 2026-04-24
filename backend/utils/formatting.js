/**
 * Formats a timestamp into a human-readable string.
 * @param {number|string|Date} timestamp - The value to format.
 * @param {Object} [options={}] - Configuration for the output format.
 * @param {boolean} [options.showSeconds=false] - Whether to include seconds.
 * @param {boolean} [options.showMilliseconds=false] - Whether to include milliseconds.
 * @param {boolean} [options.use24Hour=false] - Use 24-hour format instead of AM/PM.
 * @returns {string} The formatted date string or an error message.
 */
export function formatTimestamp(
  timestamp,
  { showSeconds = false, showMilliseconds = false, use24Hour = false } = {},
) {
  if (!timestamp) return '[Unknown time]';

  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '[Invalid timestamp]';

  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds || showMilliseconds ? '2-digit' : undefined,
    fractionalSecondDigits: showMilliseconds ? 3 : undefined,
    hour12: !use24Hour,
  });
}
