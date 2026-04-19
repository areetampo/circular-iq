import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

import { cn } from '@/utils/cn';

import CopyIcon from './CopyIcon';

/**
 * CopyButton Component
 * Simple copy icon with stroke animation or box with description
 *
 * @param {string} value - Text value to copy to clipboard
 * @param {boolean} disabled - Disable the button
 * @param {string} className - Additional CSS classes
 * @param {string} description - Optional description text for box mode
 * @param {string} color - Color for the icons (default: 'var(--color-text-primary)')
 * @param {number} size - Size for the icons in pixels (default: 16)
 * @param {boolean} noBorder - Remove border from box mode
 */
export default function CopyButton({
  value = '',
  disabled = false,
  className,
  copyIconClassname,
  description = '',
  color,
  size = 16,
  strokeWidth = 2,
  noBorder = false,
  ...props
}) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [value, disabled]);

  // Simple icon mode (no description)
  if (!description) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-md transition-all duration-200 hover:bg-(--color-accent-light-mid) disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        <CopyIcon
          copyIconClassname={copyIconClassname}
          hasCopied={hasCopied}
          color={color}
          size={size}
          strokeWidth={strokeWidth}
        />
      </button>
    );
  }

  // Box mode with description
  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-2 py-0.5 transition-all duration-200 hover:bg-(--color-accent-light-mid) disabled:cursor-not-allowed disabled:opacity-50',
        noBorder ? '' : 'border-[1.5px]',
        className,
      )}
      style={!noBorder ? { borderColor: 'var(--color-border-dark-20)' } : {}}
      disabled={disabled}
      {...props}
    >
      <CopyIcon
        copyIconClassname={copyIconClassname}
        hasCopied={hasCopied}
        color={color}
        size={16}
        strokeWidth={strokeWidth}
      />
      <span className="text-sm text-(--text-primary)" style={{ color: color }}>
        {description}
      </span>
    </button>
  );
}

CopyButton.propTypes = {
  /** Text value to copy to clipboard */
  value: PropTypes.string,
  /** Disable the button */
  disabled: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** SPecific classname for copy icon (not copy button) */
  copyIconClassname: PropTypes.string,
  /** Optional description text for box mode */
  description: PropTypes.string,
  /** Color for the icons (default: 'var(--color-text-primary)') */
  color: PropTypes.string,
  /** Size for the icons */
  size: PropTypes.number,
  /** Stroke width for the icon */
  strokeWidth: PropTypes.number,
  /** Remove border from box mode */
  noBorder: PropTypes.bool,
};
