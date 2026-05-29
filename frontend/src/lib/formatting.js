/**
 * Date, number, URL, and string formatting helpers shared across the app.
 * Used by results pages, uptime monitor charts, navbar, and assessment lists.
 */

/**
 * Returns the user's local timezone label formatted for UI displays like chart axis subtitles.
 *
 * @param {{ style?: 'minimal'|'full' }} [options] - Controls whether output is localized or the full IANA zone.
 * @param {'minimal'|'full'} [options.style='minimal'] - `minimal` uses a localized abbreviation; `full` returns the IANA id.
 * `minimal` returns a short localized abbreviation (e.g., "GMT+1", "EST"),
 * while `full` returns the IANA timezone identifier (e.g., "Europe/London").
 * @returns {string} Timezone label such as "IST" or "Asia/Calcutta".
 *
 * @example
 * // Assuming user is in New York (EST)
 * getTimezoneLabel(); // Returns "EST"
 * getTimezoneLabel({ style: 'full' }); // Returns "America/New_York"
 */
export function getTimezoneLabel(options = {}) {
  const { style = 'minimal' } = options;

  const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (style === 'full') return resolved;

  const parts = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(
    new Date(),
  );
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? resolved;
}

/**
 * Formats a timestamp into a strictly ordered day-month-year format with custom time settings.
 *
 * @param {number|string|Date} timestamp - Value accepted by `Date`; falsy/invalid values return bracketed fallback labels.
 * @param {{ showYear?: boolean, showMonth?: boolean, showDay?: boolean, showSeconds?: boolean, showMs?: boolean, use24Hour?: boolean, showTimezone?: boolean, timezoneStyle?: 'minimal'|'full' }} [options] - Date/time visibility options.
 * @param {boolean} [options.showYear=true] - Include the numeric year.
 * @param {boolean} [options.showMonth=true] - Include the short month name.
 * @param {boolean} [options.showDay=true] - Include the day of month.
 * @param {boolean} [options.showSeconds=false] - Include seconds in the time portion.
 * @param {boolean} [options.showMs=false] - Include millisecond precision.
 * @param {boolean} [options.use24Hour=true] - Use 24-hour time instead of AM/PM.
 * @param {boolean} [options.showTimezone=true] - Append the current timezone label.
 * @param {'minimal'|'full'} [options.timezoneStyle='minimal'] - Label style forwarded to `getTimezoneLabel`.
 * @returns {string} Display timestamp such as "24 May 2026, 13:05 IST".
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
 * @param {number|string|Date} timestamp - Past timestamp to compare with the current browser time.
 * @returns {string} Relative label such as "2 hrs ago", "1 mo 2 w ago", or "in the future".
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

  // pluralise: p(2, 'hr', 'hrs') -> "2 hrs"
  const p = (n, singular, plural = singular + 's') => `${n} ${n === 1 ? singular : plural}`;

  // 1. Under 1 minute
  if (diffMins < 1) return `${p(diffSecs, 'second', 'seconds')} ago`;

  // 2. Under 1 hour -> mins only
  if (diffHrs < 1) return `${p(diffMins, 'min', 'mins')} ago`;

  // 3 & 4. Under 24 hours -> hr[s] + min[s] (omit mins if 0)
  if (diffDays < 1) {
    const m = diffMins % 60;
    const minPart = m > 0 ? ` ${p(m, 'min', 'mins')}` : '';
    return `${p(diffHrs, 'hr', 'hrs')}${minPart} ago`;
  }

  // 5 & 6. Under 7 days -> day[s] + hr[s] (omit hrs if 0)
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

  // Convert remaining calendar days -> week string or day string (never both)
  const subUnit = (d) => {
    if (d <= 0) return '';
    if (d >= 7) return ` ${p(Math.floor(d / 7), 'w', 'w')}`;
    return ` ${p(d, 'day', 'days')}`;
  };

  // 7. Under 1 calendar month -> weeks + days (omit days if 0)
  //    (we reach here only when calYears === 0 && calMonths === 0)
  if (calYears === 0 && calMonths === 0) {
    const weeks = Math.floor(diffDays / 7);
    const d = diffDays % 7;
    const dayPart = d > 0 ? ` ${p(d, 'day', 'days')}` : '';
    return `${p(weeks, 'w', 'w')}${dayPart} ago`;
  }

  // 8. Under 1 year -> mo + (weeks or days, omit if 0)
  if (calYears === 0) {
    return `${p(calMonths, 'mo', 'mo')}${subUnit(calDays)} ago`;
  }

  // 9. 1+ years -> yr[s] + month[s]  OR  yr[s] + w  OR  yr[s] only
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
 * Converts a duration object to a compact human-readable label with optional unit toggles.
 * All duration input fields are optional and can be mixed and matched.
 *
 * @param {{ days?: number, hours?: number, minutes?: number, seconds?: number, ms?: number, combineSecAndMs?: boolean, showDays?: boolean, showHours?: boolean, showMinutes?: boolean, showSeconds?: boolean, showMs?: boolean }} [options={}] - Duration parts and unit visibility controls.
 * @param {number} [options.days=0] - Whole days to include in the total duration.
 * @param {number} [options.hours=0] - Whole hours to include in the total duration.
 * @param {number} [options.minutes=0] - Whole minutes to include in the total duration.
 * @param {number} [options.seconds=0] - Whole seconds to include in the total duration.
 * @param {number} [options.ms=0] - Milliseconds to include in the total duration.
 * @param {boolean} [options.combineSecAndMs=false] - If true, combines seconds and ms into a decimal string for values >= 1000ms (e.g., "22.555s"). Takes precedence over showSeconds/showMs if true and total remaining time >= 1000ms.
 * @param {boolean} [options.showDays=true] - Whether to include days in the output string.
 * @param {boolean} [options.showHours=true] - Whether to include hours in the output string.
 * @param {boolean} [options.showMinutes=true] - Whether to include minutes in the output string.
 * @param {boolean} [options.showSeconds=true] - Whether to include seconds in the output string.
 * @param {boolean} [options.showMs=true] - Whether to include milliseconds in the output string.
 * @returns {string} Compact duration label such as "1 day 5 hrs", "15 mins", or "0 seconds".
 *
 * @example
 * // --- Default Visibility (All units true) ---
 * formatDuration({ minutes: 15 });                          // "15 mins"
 * formatDuration({ hours: 25 });                            // "1 day 1 hr"
 * formatDuration({ seconds: 5, ms: 200 });                  // "5 secs 200 ms"
 * formatDuration({ ms: 72455 });                            // "1 min 12 secs 455 ms"
 *
 * // --- Toggling Unit Visibility ---
 * // Force hiding minutes/seconds from a large ms pool
 * formatDuration({ ms: 90000, showSeconds: false });        // "1 min" (15000ms remainder dropped)
 * formatDuration({ days: 2, hours: 5, showDays: false });   // "5 hrs"
 *
 * // --- Combined Seconds and Milliseconds ---
 * formatDuration({ ms: 22555, combineSecAndMs: true });     // "22.555 s"
 * formatDuration({ ms: 200, combineSecAndMs: true });       // "200 ms" (< 1000ms fallback)
 * formatDuration({ minutes: 1, ms: 12455, combineSecAndMs: true }); // "1 min 12.455 s"
 *
 * // --- Hiding Combined Layout Fallbacks ---
 * formatDuration({ ms: 2500, combineSecAndMs: true, showSeconds: false }); // "2.5 s" (combineSecAndMs overrides showSeconds if >= 1000ms)
 * formatDuration({ ms: 350, combineSecAndMs: true, showMs: false });       // "0 seconds" (< 1000ms honors showMs flag)
 *
 * // --- Edge Cases & Fallbacks ---
 * formatDuration();                                         // "0 seconds"
 * formatDuration({ minutes: 30, showMinutes: false });      // "0 seconds" (nothing left to show)
 * formatDuration({ ms: -500 });                             // "0 seconds" (handles negative totals)
 */
export function formatDuration(options = {}) {
  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    ms = 0,
    combineSecAndMs = false,
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    showMs = true,
  } = options;

  // Convert everything down to the smallest unit (ms) to sum it up accurately
  const msInSecond = 1000;
  const msInMinute = 60 * msInSecond;
  const msInHour = 60 * msInMinute;
  const msInDay = 24 * msInHour;

  const totalMs =
    days * msInDay + hours * msInHour + minutes * msInMinute + seconds * msInSecond + ms;

  if (totalMs <= 0) return '0 seconds';

  // Break down the total ms into chronological chunks
  const wholeDays = Math.floor(totalMs / msInDay);
  let remainder = totalMs % msInDay;

  const wholeHours = Math.floor(remainder / msInHour);
  remainder %= msInHour;

  const wholeMinutes = Math.floor(remainder / msInMinute);
  remainder %= msInMinute;

  const parts = [];
  if (showDays && wholeDays > 0) parts.push(`${wholeDays} day${wholeDays === 1 ? '' : 's'}`);
  if (showHours && wholeHours > 0) parts.push(`${wholeHours} hr${wholeHours === 1 ? '' : 's'}`);
  if (showMinutes && wholeMinutes > 0)
    parts.push(`${wholeMinutes} min${wholeMinutes === 1 ? '' : 's'}`);

  // Handle seconds and ms based on configuration options
  if (combineSecAndMs && remainder >= msInSecond) {
    // combineSecAndMs handles values >= 1s explicitly as a unified decimal
    const combinedSeconds = remainder / msInSecond;
    parts.push(`${combinedSeconds} s`);
  } else {
    const wholeSeconds = Math.floor(remainder / msInSecond);
    const wholeMs = remainder % msInSecond;

    if (showSeconds && wholeSeconds > 0) {
      parts.push(`${wholeSeconds} sec${wholeSeconds === 1 ? '' : 's'}`);
    }
    if (showMs && wholeMs > 0) {
      parts.push(`${wholeMs} ms`);
    }
  }

  // Fallback case: if values are masked by configurations or hit 0
  if (parts.length === 0) {
    return '0 seconds';
  }

  return parts.join(' ');
}

/**
 * Converts snake_case display keys to Title Case labels.
 *
 * @param {string} str - Snake-case label such as "material_reuse".
 * @returns {string} Title-cased label such as "Material Reuse", or "N/A" when empty.
 */
export function toTitleCase(str) {
  if (!str) return 'N/A';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Removes a specific number of characters from the end of a string
 * and appends an ellipsis.
 *
 * @param {string} str - Display text whose trailing characters should be replaced by an ellipsis.
 * @param {number} charsToRemove - How many characters to cut off.
 * @returns {string} Shortened text with "...", or the original text when no truncation is needed.
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
 *
 * @param {string} urlStr - URL or domain-like string; missing protocols are added only for parsing.
 * @param {{ stripProtocol?: boolean, stripWww?: boolean, stripPort?: boolean, stripQuery?: boolean, stripTrailingSlash?: boolean }} [options={}] - Transformation settings.
 * @param {boolean} [options.stripProtocol=false] - Remove 'http://' or 'https://'.
 * @param {boolean} [options.stripWww=false] - Remove the 'www.' prefix from the hostname.
 * @param {boolean} [options.stripPort=false] - Remove the port number (e.g., ':5173').
 * @param {boolean} [options.stripQuery=false] - Remove query parameters (e.g., '?id=1').
 * @param {boolean} [options.stripTrailingSlash=true] - Remove the final forward slash.
 * @returns {string} Display URL with requested parts removed, or the original input when parsing fails.
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
  } catch (error) {
    logger.warn('[FORMAT:CLEAN_URL_FAILED]', error);
    // Fallback if the string is completely mangled
    return urlStr;
  }
}

/**
 * Builds a compact avatar fallback from the first character of each username word.
 *
 * @param {string} username - Display username from profile or auth state.
 * @returns {string} Up to two uppercase initials, or "-" when no username is available.
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
