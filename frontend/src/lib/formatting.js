/** Date, number, and string formatting helpers. */

import { FRONTEND_CONFIG } from '@/config';

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
 * Format parameter name from snake_case to Title Case
 * @param {string} parameter - Parameter name
 * @returns {string} Formatted name
 */
export function formatParameterName(parameter) {
  if (!parameter) return '';
  return parameter
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
 * Format timestamp to readable string with time
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '[Unknown time]';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '[Invalid timestamp]';
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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
 * Convert text to title case, replacing underscores with spaces
 * @param {string} txt - Input text
 * @returns {string} Title-cased string or 'N/A' if empty
 */
export function titleize(txt) {
  return txt
    ? String(txt)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : 'N/A';
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

  const formatted = items.map((item) => titleize(item.industry || item));

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
  const milliseconds = timeMs % 1000;

  if (minutes > 0) {
    return `${minutes}m ${seconds}.${milliseconds}s`;
  } else if (seconds > 0) {
    return `${seconds}.${milliseconds}s`;
  } else {
    return `${milliseconds}ms`;
  }
}

/**
 * Formats a URL into a "presentable" editorial string by removing the protocol,
 * 'www' prefix, and port numbers, while preserving the domain and path.
 *
 * @example
 * Returns "xerneas.app/dashboard"
 * cleanUrl("https://www.xerneas.app:3000/dashboard")
 * * @param {string} urlStr - The full URL string to be formatted.
 * @returns {string} The cleaned, presentable version of the URL (e.g., "domain.com/path").
 */
export function cleanUrl(urlStr) {
  try {
    const url = new URL(urlStr);

    // 1. Get hostname and remove 'www.'
    const host = url.hostname.replace(/^www\./, '');

    // 2. Handle Port: Do not keep it only if Production mode
    const isProd = FRONTEND_CONFIG.isProd;
    const port = !isProd && url.port ? `:${url.port}` : '';

    // 3. Get the path
    const path = url.pathname;

    // Combine them: domain:port/path
    return `${host}${port}${path}`.replace(/\/$/, '');
  } catch (e) {
    return urlStr;
  }
}
