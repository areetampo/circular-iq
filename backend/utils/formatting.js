/**
 * Numeric coercion and locale-aware timestamp formatting shared by API responses and logs.
 */

/**
 * Converts arbitrary input to a finite number while collapsing invalid values to zero.
 *
 * @param {unknown} value - Candidate numeric value from API payloads, database rows, or formatting inputs.
 * @returns {number} Finite numeric value; `NaN`, infinities, and non-numeric values become `0`.
 */
export function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Resolves the local timezone label used by timestamp formatting.
 *
 * @param {{ style?: 'minimal'|'full' }} [options] - Timezone label options.
 * @param {'minimal'|'full'} [options.style='minimal'] - `minimal` uses the locale abbreviation when available; `full` returns the IANA id.
 * @returns {string} Abbreviation such as `IST`, falling back to an IANA id such as `Asia/Calcutta`.
 */
function getTimezoneLabel(options = {}) {
  const { style = 'minimal' } = options;

  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (style === 'full') return resolved;

  const parts = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(
    new Date(),
  );
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? resolved;
}

/**
 * Formats a timestamp into ordered `day month year, time timezone` display text.
 * Invalid or missing inputs intentionally return bracketed labels so API consumers can render
 * the value without extra null checks.
 *
 * @param {number|string|Date} timestamp - Value accepted by `Date`; falsy values return `[Unknown time]`.
 * @param {{ showYear?: boolean, showMonth?: boolean, showDay?: boolean, showSeconds?: boolean, showMs?: boolean, use24Hour?: boolean, showTimezone?: boolean, timezoneStyle?: 'minimal'|'full' }} [options] - Date/time visibility options.
 * @param {boolean} [options.showYear=true] - Include the numeric year.
 * @param {boolean} [options.showMonth=true] - Include the short month name.
 * @param {boolean} [options.showDay=true] - Include the day of month.
 * @param {boolean} [options.showSeconds=false] - Include seconds in the time portion.
 * @param {boolean} [options.showMs=false] - Include millisecond precision.
 * @param {boolean} [options.use24Hour=true] - Use 24-hour time instead of AM/PM.
 * @param {boolean} [options.showTimezone=true] - Append the current timezone label.
 * @param {'minimal'|'full'} [options.timezoneStyle='minimal'] - Label style forwarded to `getTimezoneLabel`.
 * @returns {string} Display timestamp such as `24 May 2026, 13:05 IST`, or a bracketed fallback label.
 */
export function formatTimestamp(timestamp, options = {}) {
  const {
    showYear = true,
    showMonth = true,
    showDay = true,
    showSeconds = false,
    showMs = false,
    use24Hour = true,
    showTimezone = true,
    timezoneStyle = 'minimal',
  } = options;

  if (!timestamp) return '[Unknown time]';

  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '[Invalid timestamp]';

  const dateParts = [];
  if (showDay) dateParts.push(d.toLocaleDateString('en-GB', { day: 'numeric' }));
  if (showMonth) dateParts.push(d.toLocaleDateString('en-GB', { month: 'short' }));
  if (showYear) dateParts.push(d.toLocaleDateString('en-GB', { year: 'numeric' }));

  const dateString = dateParts.join(' ');

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  };
  if (showSeconds || showMs) timeOptions.second = '2-digit';
  if (showMs) timeOptions.fractionalSecondDigits = 3;

  let timeString = d.toLocaleTimeString('en-GB', timeOptions);

  if (showTimezone) {
    const tzLabel = getTimezoneLabel({ style: timezoneStyle });
    timeString += ` ${tzLabel}`;
  }

  return dateString ? `${dateString}, ${timeString}` : timeString;
}
