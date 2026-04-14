import { Check, Copy } from 'lucide-react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

/**
 * CopyIcon Component
 * Animated copy icon that transitions to checkmark when clicked
 *
 * @param {boolean} hasCopied - Whether the icon should show checkmark state
 * @param {string} color - Color for the icons (default: 'var(--color-text-primary)')
 * @param {number} size - Size for the icons in pixels (default: 16)
 * @param {number} strokeWidth - Stroke width for the icons (default: 2)
 */
export function CopyIcon({
  copyIconClassname,
  hasCopied = false,
  color,
  size = 16,
  strokeWidth = 2,
}) {
  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', copyIconClassname)}
      style={{ width: size, height: size }}
    >
      <Copy
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'absolute inset-0 transition-all duration-300 ease-in-out',
          hasCopied ? 'scale-75 opacity-0' : 'scale-100 opacity-100',
        )}
        style={{ color: color }}
      />
      <Check
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'absolute inset-0 transition-all duration-300 ease-in-out',
          hasCopied ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
        )}
        style={{ color: color }}
      />
    </div>
  );
}

CopyIcon.propTypes = {
  /** SPecific classname for copy icon (not copy button) */
  copyIconClassname: PropTypes.string,
  /** Whether the icon should show checkmark state */
  hasCopied: PropTypes.bool,
  /** Color for the icons (default: 'var(--color-text-primary)') */
  color: PropTypes.string,
  /** Size for the icons in pixels (default: 16) */
  size: PropTypes.number,
  /** Stroke width for the icons (default: 2) */
  strokeWidth: PropTypes.number,
};
