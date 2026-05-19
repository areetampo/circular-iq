/**
 * @module CopyButton
 * @description Clipboard copy control with animated check feedback (share links, ids).
 */

import { Check, Copy } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';

import { cn } from '@/utils/cn';

// ─── Private sub-component ────────────────────────────────────────────────────

/**
 * CopyIcon sub-component that displays copy and check icons with transition animation
 * Shows copy icon by default, transforms to checkmark when hasCopied is true
 *
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes for icon container
 * @param {boolean} [props.hasCopied=false] - Whether to show checkmark instead of copy icon (default: false)
 * @param {number} [props.size=16] - Icon size in pixels (default: 16)
 * @param {number} [props.strokeWidth=2.5] - Icon stroke width (default: 2.5)
 * @returns {JSX.Element} Rendered CopyIcon component
 */
function CopyIcon({ className, hasCopied = false, size = 16, strokeWidth = 2.5 }) {
  return (
    <div
      className={cn('relative flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <Copy
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'absolute inset-0 transition-all duration-300 ease-in-out',
          hasCopied ? 'scale-75 opacity-0' : 'scale-100 opacity-100',
        )}
      />
      <Check
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'absolute inset-0 transition-all duration-300 ease-in-out',
          hasCopied ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
        )}
      />
    </div>
  );
}

CopyIcon.propTypes = {
  /** Additional CSS classes for icon container */
  className: PropTypes.string,
  /** Whether to show checkmark instead of copy icon (default: false) */
  hasCopied: PropTypes.bool,
  /** Icon size in pixels (default: 16) */
  size: PropTypes.number,
  /** Icon stroke width (default: 2.5) */
  strokeWidth: PropTypes.number,
};

// ─── Style maps (mirrored from Button.jsx) ───────────────────────────────────

const variantStyles = {
  primary:
    'bg-(--color-accent) text-white hover:bg-(--color-accent-hover) border border-transparent',
  ghost:
    'bg-(--color-accent-soft-10) text-(--color-text-secondary) border border-transparent hover:text-(--color-text-primary) hover:bg-(--color-hover-accent-strong)',
  ghastly:
    'bg-transparent text-(--color-text-muted) border border-transparent hover:bg-(--color-hover-subtle) hover:text-(--color-text-primary)',
  dim: 'text-(--color-text-primary)/50 border border-transparent hover:text-(--color-text-primary)',
  dark: 'text-(--color-text-primary)/80 border border-transparent hover:text-(--color-text-primary)',
  bordered:
    'bg-transparent text-(--color-text-secondary) border-[1.5px] border-(--color-border-ui) hover:bg-(--color-accent-light) text-xs tracking-wide uppercase',
  danger:
    'bg-(--color-error) text-white border border-(--color-error-border-strong) hover:opacity-90 transition-opacity',
  teal: 'bg-(--color-success) text-white hover:bg-(--color-success-hover) border border-transparent',
  'info-soft': 'text-(--color-info) bg-(--color-info-soft-ui) hover:bg-(--color-info)/20',
  'info-text': 'text-(--color-info)',
  'success-soft':
    'text-(--color-success) bg-(--color-success-soft-ui) hover:bg-(--color-success)/20',
  'warning-soft':
    'text-(--color-warning) bg-(--color-warning-soft-ui) hover:bg-(--color-warning)/20',
  'danger-soft': 'text-(--color-error) bg-(--color-error-soft-ui) hover:bg-(--color-error)/20',
  'danger-text': 'text-(--color-error)',
};

const sizeStyles = {
  xs: 'px-1.5 py-1 text-[0.65rem]',
  sm: 'px-1.5 py-1.5 text-xs',
  md: 'px-1.5 py-1.5 text-sm',
  lg: 'px-3 py-2 text-base',
};

// Icon-only mode: square padding so the button stays compact
const iconOnlySizeStyles = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

const iconSizeMap = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 18,
};

const iconStrokeWidthMap = {
  xs: 2.5,
  sm: 2.5,
  md: 2.5,
  lg: 2.5,
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CopyButton component for copying text to clipboard with visual feedback
 * Shows a copy icon that transforms to a checkmark when copied
 *
 * @param {Object} props - Component props
 * @param {string} [props.copyValue={}] - Text value to copy to clipboard
 * @param {boolean} [props.isDisabled={false}] - Whether the button is disabled (default: false)
 * @param {string} [props.title={}] - Text to display next to icon (empty for icon-only mode)
 * @param {string} [props.titleCn={}] - Additional CSS classes for the title text
 * @param {'primary'|'ghost'|'ghastly'|'dim'|'dark'|'bordered'|'danger'|'teal'|'info-soft'|'info-text'|'success-soft'|'warning-soft'|'danger-soft'|'danger-text'} [props.variant={'ghastly'}] - Visual style variant (default: 'ghastly')
 * @param {'xs'|'sm'|'lg'} [props.size={'md'}] - Button size (default: 'md')
 * @param {number} [props.iconSize={}] - Custom icon size in pixels (overrides size-based sizing)
 * @param {number} [props.iconStrokeWidth={}] - Custom icon stroke width (overrides size-based sizing)
 * @param {boolean} [props.noBorder={false}] - Remove border styling (default: false)
 * @param {string} props.buttonCn - Additional CSS classes for the button element
 * @param {string} props.iconCn - Additional CSS classes for the icon container
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered CopyButton component
 *
 * @example
 * Icon-only copy button
 * <CopyButton copyValue="text-to-copy" variant="ghost" size="sm" />
 *
 * @example
 * Copy button with title
 * <CopyButton
 *   copyValue="https://example.com"
 *   title="Copy URL"
 *   variant="primary"
 * />
 */
export default function CopyButton({
  copyValue = '',
  isDisabled = false,
  title = '',
  titleCn,
  variant = 'ghastly',
  size = 'md',
  iconSize,
  iconStrokeWidth,
  noBorder = false,
  buttonCn,
  iconCn,
  ...props
}) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (isDisabled || !copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }, [copyValue, isDisabled]);

  const resolvedIconSize = iconSize ?? iconSizeMap[size] ?? iconSizeMap.md;
  const resolvedStrokeWidth = iconStrokeWidth ?? iconStrokeWidthMap[size] ?? iconStrokeWidthMap.md;

  const hasTitle = Boolean(title);

  const baseClasses = cn(
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-sans transition-colors duration-200 outline-none',
    variantStyles[variant] ?? variantStyles.ghost,
    hasTitle
      ? (sizeStyles[size] ?? sizeStyles.md)
      : (iconOnlySizeStyles[size] ?? iconOnlySizeStyles.md),
    // noBorder strips whatever border the variant applies
    noBorder && '!border-transparent',
    isDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
    buttonCn,
  );

  return (
    <button
      {...props}
      onClick={handleClick}
      className={baseClasses}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={title || 'Copy'}
    >
      <CopyIcon
        copyIconClassname={iconCn}
        hasCopied={hasCopied}
        size={resolvedIconSize}
        strokeWidth={resolvedStrokeWidth}
      />
      {hasTitle && <span className={cn('leading-none', titleCn)}>{title}</span>}
    </button>
  );
}

CopyButton.propTypes = {
  /** Text value to copy to clipboard */
  copyValue: PropTypes.string,
  /** Whether button is disabled (default: false) */
  isDisabled: PropTypes.bool,
  /** Text to display next to icon (empty for icon-only mode) */
  title: PropTypes.string,
  /** Additional CSS classes for title text */
  titleCn: PropTypes.string,
  /** Visual style variant (default: 'ghastly') */
  variant: PropTypes.oneOf([
    'primary',
    'ghost',
    'ghastly',
    'dim',
    'dark',
    'bordered',
    'danger',
    'teal',
    'info-soft',
    'info-text',
    'success-soft',
    'warning-soft',
    'danger-soft',
    'danger-text',
  ]),
  /** Button size (default: 'md') */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  /** Custom icon size in pixels (overrides size-based sizing) */
  iconSize: PropTypes.number,
  /** Custom icon stroke width (overrides size-based sizing) */
  iconStrokeWidth: PropTypes.number,
  /** Remove border styling (default: false) */
  noBorder: PropTypes.bool,
  /** Additional CSS classes for button element */
  buttonCn: PropTypes.string,
  /** Additional CSS classes for icon container */
  iconCn: PropTypes.string,
};
