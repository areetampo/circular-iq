/**
 * @module formatting
 * @description Date, number, URL, and string formatting helpers shared across the app.
 * Used by results pages, uptime monitor charts, navbar, and assessment lists.
 */

/**
 * Formats a timestamp into a human-readable string.
 *
 * @param {number|string|Date} timestamp - The value to format.
 * @param {Object} [options={}] - Configuration for the output format.
 * @param {boolean} [options.showYear=true] - Include year in output.
 * @param {boolean} [options.showMonth=true] - Include month in output.
 * @param {boolean} [options.showDay=true] - Include day in output.
 * @param {boolean} [options.showSeconds=false] - Whether to include seconds.
 * @param {boolean} [options.showMs=false] - Whether to include milliseconds.
 * @param {boolean} [options.use24Hour=false] - Use 24-hour format instead of AM/PM.
 * @param {boolean} [options.showTimezone=true] - Append short timezone name (e.g. GMT).
 * @returns {string} The formatted date string or an error message.
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
  } = {},
) {
  if (!timestamp) return '[Unknown time]';

  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '[Invalid timestamp]';

  const localeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  };

  if (showYear) localeOptions.year = 'numeric';
  if (showMonth) localeOptions.month = 'short';
  if (showDay) localeOptions.day = 'numeric';
  if (showSeconds || showMs) localeOptions.second = '2-digit';
  if (showMs) localeOptions.fractionalSecondDigits = 3;
  if (showTimezone) localeOptions.timeZoneName = 'short';

  return d.toLocaleString('en-GB', localeOptions);
}

/**
 * Formats a timestamp into a relative human-readable string.
 *
 * Rules:
 *  <1 min   → "few seconds ago"
 *  <1 hr    → "N mins ago"
 *  <1 day   → "N hr [N mins] ago"          (mins omitted if 0)
 *  <7 days  → "N day[s] [N hr[s]] ago"     (hrs omitted if 0)
 *  <1 month → "N w [N day[s]] ago"         (days omitted if 0)
 *  <1 year  → "N mo [N w | N day[s]] ago"  (sub-unit omitted if 0; days ≥7 → weeks)
 *  ≥1 year  → "N yr[s] [N month[s] | N w] ago"
 *               months shown if >0; else weeks if calDays ≥7; else nothing
 *
 * @param {number|string|Date} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '[Unknown time]';
  const past = new Date(timestamp);
  const now = new Date();
  if (isNaN(past.getTime())) return '[Invalid timestamp]';

  const diffMs = now - past;
  if (diffMs < 0) return 'in the future';

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  // pluralise: p(2, 'hr', 'hrs') ΓåÆ "2 hrs"
  const p = (n, singular, plural = singular + 's') => `${n} ${n === 1 ? singular : plural}`;

  // 1. Under 1 minute
  if (diffMins < 1) return `${p(diffSecs, 'second', 'seconds')} ago`;

  // 2. Under 1 hour ΓÇö mins only
  if (diffHrs < 1) return `${p(diffMins, 'min', 'mins')} ago`;

  // 3 & 4. Under 24 hours ΓÇö hr[s] + min[s] (omit mins if 0)
  if (diffDays < 1) {
    const m = diffMins % 60;
    const minPart = m > 0 ? ` ${p(m, 'min', 'mins')}` : '';
    return `${p(diffHrs, 'hr', 'hrs')}${minPart} ago`;
  }

  // 5 & 6. Under 7 days ΓÇö day[s] + hr[s] (omit hrs if 0)
  if (diffDays < 7) {
    const h = diffHrs % 24;
    const hrPart = h > 0 ? ` ${p(h, 'hr', 'hrs')}` : '';
    return `${p(diffDays, 'day', 'days')}${hrPart} ago`;
  }

  // --- Calendar-accurate from here ---
  let calYears = now.getFullYear() - past.getFullYear();
  let calMonths = now.getMonth() - past.getMonth();
  let calDays = now.getDate() - past.getDate();

  if (calDays < 0) {
    calMonths -= 1;
    calDays += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (calMonths < 0) {
    calYears -= 1;
    calMonths += 12;
  }

  // Convert remaining calendar days ΓåÆ week string or day string (never both)
  const subUnit = (d) => {
    if (d <= 0) return '';
    if (d >= 7) return ` ${p(Math.floor(d / 7), 'w', 'w')}`;
    return ` ${p(d, 'day', 'days')}`;
  };

  // 7. Under 1 calendar month ΓÇö weeks + days (omit days if 0)
  //    (we reach here only when calYears === 0 && calMonths === 0)
  if (calYears === 0 && calMonths === 0) {
    const weeks = Math.floor(diffDays / 7);
    const d = diffDays % 7;
    const dayPart = d > 0 ? ` ${p(d, 'day', 'days')}` : '';
    return `${p(weeks, 'w', 'w')}${dayPart} ago`;
  }

  // 8. Under 1 year ΓÇö mo + (weeks or days, omit if 0)
  if (calYears === 0) {
    return `${p(calMonths, 'mo', 'mo')}${subUnit(calDays)} ago`;
  }

  // 9. 1+ years ΓÇö yr[s] + month[s]  OR  yr[s] + w  OR  yr[s] only
  //    (days < 7 are discarded at the year scale)
  let suffix = '';
  if (calMonths > 0) {
    suffix = ` ${p(calMonths, 'month', 'months')}`;
  } else if (calDays >= 7) {
    suffix = ` ${p(Math.floor(calDays / 7), 'w', 'w')}`;
  }
  return `${p(calYears, 'yr', 'yrs')}${suffix} ago`;
}

/**
 * Format str from snake_case to Title Case
 * @param {string} str - str name.g. "material_reuse"
 * @returns {string} Formatted string e.g. "Material Reuse" or "N/A" if empty
 */
export function toTitleCase(str) {
  if (!str) return 'N/A';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format processing time from milliseconds to readable format
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} Formatted time string
 */
export function formatProcessingTime(timeMs) {
  if (!timeMs) return '';

  const minutes = Math.floor(timeMs / 60000);
  const seconds = Math.floor((timeMs % 60000) / 1000);

  // Divide by 10 and floor to get exactly the first two digits (0-99)
  const msDigits = Math.floor((timeMs % 1000) / 10);

  // Optional: Pad with a leading zero so "5ms" becomes "05ms" for consistent width
  const msFormatted = String(msDigits).padStart(2, '0');

  if (minutes > 0) {
    return `${minutes}m ${seconds}.${msFormatted}s`;
  } else if (seconds > 0) {
    return `${seconds}.${msFormatted}s`;
  } else {
    // If it's pure milliseconds, you might want the raw digits
    // or the padded version depending on your preference
    return `${msDigits}ms`;
  }
}

/**
 * Removes a specific number of characters from the end of a string
 * and appends an ellipsis.
 * @param {string} str - The target string.
 * @param {number} charsToRemove - How many characters to cut off.
 * @returns {string} The truncated string.
 */
export function truncate(str, charsToRemove) {
  if (!str || typeof str !== 'string') return '';
  if (charsToRemove <= 0) return str;

  // If we are removing more than the string has, just return the ellipsis
  if (charsToRemove >= str.length) return '...';

  const newLength = str.length - charsToRemove;
  return str.substring(0, newLength) + '...';
}

/**
 * Cleans and formats a URL string based on provided transformation options.
 * Useful for displaying "pretty" URLs in the UI or normalizing URLs for comparison.
 * @param {string} urlStr - The raw URL or domain string to be cleaned.
 * @param {Object} [options={}] - Transformation settings.
 * @param {boolean} [options.stripProtocol=true] - Remove 'http://' or 'https://'.
 * @param {boolean} [options.stripWww=false] - Remove the 'www.' prefix from the hostname.
 * @param {boolean} [options.stripPort=false] - Remove the port number (e.g., ':5173').
 * @param {boolean} [options.stripQuery=true] - Remove query parameters (e.g., '?id=1').
 * @param {boolean} [options.stripTrailingSlash=true] - Remove the final forward slash.
 * @returns {string} The formatted URL string. If parsing fails, returns the original input.
 */
export function cleanUrl(urlStr, options = {}) {
  const defaults = {
    stripProtocol: false, // Removes http:// or https://
    stripWww: false, // Removes www.
    stripPort: false, // Removes :port
    stripQuery: false, // Removes ?query=params
    stripTrailingSlash: true, // Removes / at the end
  };

  const settings = { ...defaults, ...options };

  try {
    // 1. Pre-flight check: URL constructor requires a protocol to parse correctly.
    // If the string doesn't have one, we add a temporary one for parsing.
    const hasProtocol = urlStr.includes('://');
    const parseableUrl = hasProtocol ? urlStr : `http://${urlStr}`;
    const url = new URL(parseableUrl);

    // 2. Handle Protocol
    let protocol = settings.stripProtocol ? '' : url.protocol + '//';

    // 3. Handle Hostname (WWW)
    let host = url.hostname;
    if (settings.stripWww) {
      host = host.replace(/^www\./, '');
    }

    // 4. Handle Port
    // url.port is empty if it's the default (80/443)
    const port = !settings.stripPort && url.port ? `:${url.port}` : '';

    // 5. Handle Path & Trailing Slash
    let path = url.pathname;
    if (settings.stripTrailingSlash && path.length > 1) {
      path = path.replace(/\/$/, '');
    } else if (settings.stripTrailingSlash && path === '/') {
      path = '';
    }

    // 6. Handle Query
    const query = settings.stripQuery ? '' : url.search;

    return `${protocol}${host}${port}${path}${query}`;
  } catch (err) {
    logger.warn('Failed to clean URL:', err);
    // Fallback if the string is completely mangled
    return urlStr;
  }
}

/**
 * Converts a duration object to a compact human-readable label.
 * All fields are optional and summed before formatting.
 *
 * @param {Object} [duration={}]
 * @param {number} [duration.days=0]
 * @param {number} [duration.hours=0]
 * @param {number} [duration.minutes=0]
 * @param {number} [duration.seconds=0]
 * @param {number} [duration.ms=0]
 * @returns {string} e.g. "15 mins", "1 day", "1 hr 20 mins", "5 secs 200 ms"
 *
 * @example
 * formatDuration({ minutes: 15 }); // "15 mins"
 * formatDuration({ hours: 24 }); // "1 day"
 * formatDuration({ seconds: 5, ms: 200 }); // "5 secs 200 ms"
 */
export function formatDuration({ days = 0, hours = 0, minutes = 0, seconds = 0, ms = 0 } = {}) {
  // Convert everything down to the smallest unit (ms) to sum it up accurately
  const msInSecond = 1000;
  const msInMinute = 60 * msInSecond;
  const msInHour = 60 * msInMinute;
  const msInDay = 24 * msInHour;

  const totalMs =
    days * msInDay + hours * msInHour + minutes * msInMinute + seconds * msInSecond + ms;

  if (totalMs <= 0) return '0 seconds'; // fallback

  // Break down the total ms into chronological chunks
  const wholeDays = Math.floor(totalMs / msInDay);
  let remainder = totalMs % msInDay;

  const wholeHours = Math.floor(remainder / msInHour);
  remainder %= msInHour;

  const wholeMinutes = Math.floor(remainder / msInMinute);
  remainder %= msInMinute;

  const wholeSeconds = Math.floor(remainder / msInSecond);
  const wholeMs = remainder % msInSecond;

  const parts = [];
  if (wholeDays > 0) parts.push(`${wholeDays} day${wholeDays === 1 ? '' : 's'}`);
  if (wholeHours > 0) parts.push(`${wholeHours} hr${wholeHours === 1 ? '' : 's'}`);
  if (wholeMinutes > 0) parts.push(`${wholeMinutes} min${wholeMinutes === 1 ? '' : 's'}`);
  if (wholeSeconds > 0) parts.push(`${wholeSeconds} sec${wholeSeconds === 1 ? '' : 's'}`);
  if (wholeMs > 0) parts.push(`${wholeMs} ms`);

  // Fallback case: if nothing was pushed because values were all 0 but totalMs > 0
  if (parts.length === 0) {
    return '0 seconds';
  }

  return parts.join(' ');
}

/**
 * Returns the user's local timezone label for chart axis subtitles.
 *
 * @param {Object} [options={}]
 * @param {'minimal'|'full'} [options.style='minimal'] - `minimal` uses short name (e.g. GMT+1).
 * @returns {string}
 */
export function getTimezoneLabel({ style = 'minimal' } = {}) {
  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (style === 'full') return resolved;

  const parts = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(
    new Date(),
  );
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? resolved;
}

/**
 * Get initials from username.
 *
 * @param {string} username - Username string.
 * @returns {string} Initials (max 2 chars).
 */
export function getUserInitials(username) {
  if (!username) return '-';
  return username
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
