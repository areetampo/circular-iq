/**
 * UI Utilities
 * Helper functions for UI elements, icons, and display
 *
 * Location: src/utils/ui.js
 */

/**
 * Get severity icon for integrity gaps
 * @param {string} severity - Severity level (low, medium, high)
 * @returns {string} Icon component name
 */
export function getSeverityIcon(severity) {
  switch (severity) {
    case 'high':
      return 'AlertTriangle';
    case 'medium':
      return 'Zap';
    case 'low':
      return 'Info';
    default:
      return 'Circle';
  }
}

/**
 * Get status icon for different states
 * @param {string} status - Status type
 * @returns {string} Icon component name
 */
export function getStatusIcon(status) {
  const icons = {
    complete: 'Check',
    completed: 'Check',
    success: 'Check',
    pending: 'Clock',
    loading: 'Clock',
    error: 'X',
    failed: 'X',
    warning: 'AlertTriangle',
    info: 'Info',
    draft: 'FileText',
    archived: 'Archive',
  };
  return icons[status] || 'Circle';
}

/**
 * Generate color classes based on score/value
 * @param {number} value - Numeric value
 * @param {number} threshold - Threshold for good/bad
 * @returns {string} Tailwind color classes
 */
export function getValueColorClasses(value, threshold = 50) {
  if (value >= threshold) {
    return 'text-green-600 bg-green-50';
  }
  return 'text-red-600 bg-red-50';
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 chars)
 */
export function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a random color from predefined palette
 * Useful for avatars, badges, etc.
 * @param {string} seed - Seed string for consistency
 * @returns {string} Color hex code
 */
export function getRandomColor(seed) {
  const colors = [
    '#34a83a', // Green
    '#4a90e2', // Blue
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#e91e63', // Pink
    '#00bcd4', // Cyan
    '#ff5722', // Deep Orange
    '#8bc34a', // Light Green
  ];

  if (!seed) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Generate consistent color based on seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Generate gradient CSS for backgrounds
 * @param {string} color1 - First color
 * @param {string} color2 - Second color
 * @param {number} angle - Gradient angle (default 135)
 * @returns {string} CSS gradient string
 */
export function generateGradient(color1, color2, angle = 135) {
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Get contrast text color (black or white) for background
 * @param {string} hexColor - Background color in hex
 * @returns {string} 'black' or 'white'
 */
export function getContrastTextColor(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Generate CSS classes for badge based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Tailwind classes
 */
export function getScoreBadgeClasses(score) {
  if (score >= 75) {
    return 'bg-green-100 text-green-800 border-green-300';
  }
  if (score >= 50) {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  }
  if (score >= 25) {
    return 'bg-orange-100 text-orange-800 border-orange-300';
  }
  return 'bg-red-100 text-red-800 border-red-300';
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
 * Generate unique ID for elements
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substrin(2, 11)}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view smoothly
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollToElement(element, options = {}) {
  if (!element) return;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options,
  });
}
