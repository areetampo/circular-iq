/** Date, number, and string formatting helpers. */

/**
 * Format number as percentage with rounding
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format similarity score for display
 * @param {number} similarity - Similarity from 0-1
 * @returns {string} Formatted similarity percentage
 */
export function formatSimilarity(similarity) {
  if (typeof similarity !== 'number') return '0%';
  return `${Math.round(similarity * 100)}%`;
}

/**
 * Format audit verdict for display
 * @param {string} verdict - Raw verdict text
 * @returns {string} Formatted verdict
 */
export function formatVerdict(verdict) {
  if (!verdict) return 'No verdict available';
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Max length (default 200)
 * @returns {string} Truncated text with ellipsis
 */
export function truncateText(text, length = 200) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString('en-US');
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default 'USD')
 * @returns {string} Formatted currency
 */
export function formatCurrency(amount, currency = 'USD') {
  if (typeof amount !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format date to readable string
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

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

/**
 * Get current timestamp
 * @returns {string} Current timestamp formatted as readable string
 */
export function getCurrentTimestampFormatted() {
  return formatTimestamp(new Date());
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

  // pluralise: p(2, 'hr', 'hrs') → "2 hrs"
  const p = (n, singular, plural = singular + 's') => `${n} ${n === 1 ? singular : plural}`;

  // 1. Under 1 minute
  if (diffMins < 1) return 'few seconds ago';

  // 2. Under 1 hour — mins only
  if (diffHrs < 1) return `${p(diffMins, 'min', 'mins')} ago`;

  // 3 & 4. Under 24 hours — hr[s] + min[s] (omit mins if 0)
  if (diffDays < 1) {
    const m = diffMins % 60;
    const minPart = m > 0 ? ` ${p(m, 'min', 'mins')}` : '';
    return `${p(diffHrs, 'hr', 'hrs')}${minPart} ago`;
  }

  // 5 & 6. Under 7 days — day[s] + hr[s] (omit hrs if 0)
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

  // Convert remaining calendar days → week string or day string (never both)
  const subUnit = (d) => {
    if (d <= 0) return '';
    if (d >= 7) return ` ${p(Math.floor(d / 7), 'w', 'w')}`;
    return ` ${p(d, 'day', 'days')}`;
  };

  // 7. Under 1 calendar month — weeks + days (omit days if 0)
  //    (we reach here only when calYears === 0 && calMonths === 0)
  if (calYears === 0 && calMonths === 0) {
    const weeks = Math.floor(diffDays / 7);
    const d = diffDays % 7;
    const dayPart = d > 0 ? ` ${p(d, 'day', 'days')}` : '';
    return `${p(weeks, 'w', 'w')}${dayPart} ago`;
  }

  // 8. Under 1 year — mo + (weeks or days, omit if 0)
  if (calYears === 0) {
    return `${p(calMonths, 'mo', 'mo')}${subUnit(calDays)} ago`;
  }

  // 9. 1+ years — yr[s] + month[s]  OR  yr[s] + w  OR  yr[s] only
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
 * Format a list with truncation support
 * Truncates list to specified max items and provides full list for display
 * @param {Array} items - Array of items (can have 'industry' property or be strings)
 * @param {number} maxDisplay - Max items to display before truncating (default 2)
 * @returns {Object} Object with display (string), all (array), extra (count)
 */
export function formatTruncatedList(items = [], maxDisplay = 2) {
  if (!Array.isArray(items) || items.length === 0) {
    return { display: 'N/A', all: [], extra: 0 };
  }

  const formatted = items.map((item) => toTitleCase(item.industry || item));

  const hasExtra = formatted.length > maxDisplay;
  const displayed = formatted.slice(0, maxDisplay);
  const extra = hasExtra ? formatted.length - maxDisplay : 0;

  // Format display string: "A, B" or "A"
  const display = displayed.join(', ');

  return {
    display,
    all: formatted,
    extra,
  };
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
 * * @param {string} str - The target string.
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
 * * @param {string} urlStr - The raw URL or domain string to be cleaned.
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
  } catch (e) {
    // Fallback if the string is completely mangled
    return urlStr;
  }
}

/**
 * Format file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get initials from username
 * @param {string} username - Username string
 * @returns {string} Initials (max 2 chars)
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
