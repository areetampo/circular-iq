import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { cn } from '@/utils/cn';

import TruncatedTextTooltip from './TruncatedTextTooltip';

/**
 * Variant styles for the luxury minimal chip system
 * Based on UI-59 specifications and design references
 *
 * NOTE: All styles previously in index.css under the CHIP section are
 * co-located here. You can safely delete those overrides from index.css.
 *
 * Where index.css used `!important` to win over these classes, that value
 * is the one kept here. rounded-full is enforced everywhere per design spec.
 */
const variantStyles = {
  // Industry filter chips - used in MyAssessmentsPage filter bar
  filter: [
    'rounded-full border font-medium whitespace-nowrap',
    'border-[1.5px] border-(--color-border-ui) bg-transparent text-black/60',
    'transition-all duration-150 ease-in-out cursor-pointer',
  ].join(' '),

  // Tag chips — compact label chips
  tag: [
    'rounded-full border font-medium normal-case',
    'border-(--color-border-subtle) bg-(--color-chip-bg) text-(--color-text-secondary)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Public/Private chips - simple design for AssessmentListItem
  // Minimal, clean appearance with color tints
  'access-type': [
    'font-medium border rounded-full',
    'transition-all duration-150 ease-in-out',
    'opacity-90',
  ].join(' '),

  // Source chips - for database evidence cards
  source: [
    'font-medium rounded-full',
    'bg-[oklch(0.92_0.02_240/0.6)] text-[oklch(0.4_0.05_240)]',
    'border border-[oklch(0.8_0.03_240)]',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Percentage match chips
  match: [
    'rounded-full font-medium shadow-sm',
    'border',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Recycling/Reuse strategy chips - for database evidence cards
  strategy: [
    'font-medium rounded-full',
    'bg-(--color-chip-strategy-bg) text-(--color-chip-strategy-text)',
    'border border-(--color-chip-strategy-border)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Materials chips - for database evidence cards
  materials: [
    'font-medium rounded-full',
    'bg-(--color-chip-materials-bg) text-(--color-chip-materials-text)',
    'border border-(--color-chip-materials-border)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Factor classification chips - for scoring factors
  factor: [
    'font-medium rounded-full',
    'bg-(--color-chip-factor-bg) text-(--color-chip-factor-text)',
    'border border-(--color-chip-factor-border)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Status chips - for various status indicators, can be combined with color prop
  status: [
    'rounded-full border font-semibold tracking-[0.06em] uppercase',
    'border-(--color-border-faint) bg-(--color-chip-bg-faint) text-(--color-text-secondary)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Info chips - for general informational purposes
  info: [
    'rounded-full border font-medium',
    'border-(--color-border-subtle) bg-(--color-chip-bg) text-(--color-text-secondary)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Case reference chips - for case numbers and references
  case: [
    'rounded-full',
    'bg-(--color-chip-factor-bg) text-(--color-chip-factor-text)',
    'border border-(--color-chip-factor-border)',
    'transition-all duration-150 ease-in-out',
  ].join(' '),

  // Severity chips - for gap analysis severity levels, color-coded based on severity
  severity: ['rounded-full font-bold', 'border transition-all duration-150 ease-in-out'].join(' '),

  // Score pills - for sample test case score displays
  'score-pill': [
    'rounded-full border font-medium font-sniglet',
    'transition-all duration-150 ease-in-out',
  ].join(' '),
};

/**
 * Size styles - applied to all chip variants.
 */
const sizeStyles = {
  xs: 'px-1.5 py-0 text-[0.65rem]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

/**
 * Color overrides for specific variants depending on state
 */
const getColorOverrides = (variant, color, active) => {
  if (variant === 'filter') {
    return active
      ? 'border-(--color-accent)/60 bg-(--color-accent-soft-ui)'
      : 'border-(--color-border-ui) hover:bg-(--color-accent-soft-ui) text-(--color-text-secondary) bg-transparent cursor-pointer';
  }

  if (variant === 'access-type') {
    switch (color) {
      case 'public':
        return {
          backgroundColor: 'var(--color-access-public-bg)',
          color: 'var(--color-access-public-text)',
          borderColor: 'var(--color-access-public-border)',
          borderWidth: 1,
        };
      case 'private':
        return {
          backgroundColor: 'var(--color-access-private-bg)',
          color: 'var(--color-access-private-text)',
          borderColor: 'var(--color-access-private-border)',
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border-ui)',
          borderWidth: 1,
        };
    }
  }

  if (variant === 'info') {
    // Matches .chip--info--* in index.css — uses -chip-bg tokens, not -soft-ui
    switch (color) {
      case 'success':
        return 'border-(--color-success-border) bg-(--color-success-chip-bg) text-(--color-success)';
      case 'warning':
        return 'border-(--color-warning-border) bg-(--color-warning-chip-bg) text-(--color-warning)';
      case 'danger':
        return 'border-(--color-error-border) bg-(--color-error-chip-bg) text-(--color-error)';
      default:
        return '';
    }
  }

  if (variant === 'match') {
    // utils/content - getMatchStrength() returns excellent/strong/...
    switch (color) {
      case 'excellent':
        return 'bg-(--color-success-soft-ui) text-(--color-success) border-(--color-success-border)';
      case 'strong':
        return 'bg-(--color-accent-soft-ui) text-(--color-accent) border-(--color-accent-border)';
      case 'decent':
        return 'bg-(--color-warning-soft-ui) text-(--color-warning) border-(--color-warning-border)';
      case 'poor':
        return 'bg-(--color-error-soft-ui) text-(--color-error) border-(--color-error-border)';
      default:
        return 'bg-(--color-danger-soft-ui) text-(--color-text-secondary)';
    }
  }

  if (variant === 'severity') {
    switch (color) {
      case 'high':
        return 'bg-(--color-severity-high-bg) text-(--color-severity-high-text) border-(--color-severity-high-border)';
      case 'medium':
        return 'bg-(--color-severity-medium-bg) text-(--color-severity-medium-text) border-(--color-severity-medium-border)';
      case 'low':
        return 'bg-(--color-severity-low-bg) text-(--color-severity-low-text) border-(--color-severity-low-border)';
      default:
        return 'bg-(--color-match-default-bg) text-(--color-match-default-text) border-(--color-match-default-border)';
    }
  }

  if (variant === 'score-pill') {
    switch (color) {
      case 'success':
        return 'bg-(--color-success-soft-ui) text-(--color-success) border-(--color-success-border)';
      case 'accent':
        return 'bg-(--color-accent-soft-ui) text-(--color-accent) border-(--color-accent-border)';
      case 'warning':
        return 'bg-(--color-warning-soft-ui) text-(--color-warning) border-(--color-warning-border)';
      case 'error':
        return 'bg-(--color-error-soft-ui) text-(--color-error) border-(--color-error-border)';
      default:
        return '';
    }
  }

  if (variant === 'status') {
    switch (color) {
      case 'success':
        return 'border-(--color-success-border) bg-(--color-success-soft-ui) text-(--color-success)';
      case 'warning':
        return 'border-(--color-warning-border) bg-(--color-warning-soft-ui) text-(--color-warning)';
      case 'danger':
        return 'border-(--color-error-border) bg-(--color-error-soft-ui) text-(--color-error)';
      default:
        return '';
    }
  }

  if (color && variant !== 'match' && variant !== 'severity' && variant !== 'status') {
    switch (color) {
      case 'success':
        return 'border-(--color-success) text-(--color-success)';
      case 'warning':
        return 'border-(--color-warning) text-(--color-warning)';
      case 'danger':
        return 'border-(--color-error) text-(--color-error)';
      default:
        return '';
    }
  }

  return '';
};

/**
 * Custom Chip component with minimal variant system
 * Pure custom implementation without HeroUI dependencies
 *
 * All CSS that was previously in index.css under the CHIP section is
 * now co-located here — that block can be safely removed from index.css.
 *
 * @param {Object} props - Chip props
 * @param {string} props.variant - Chip variant:
 *   filter | tag | access-type | source | match | strategy |
 *   materials | factor | status | info | case | severity | score-pill
 * @param {string} props.size - Chip size (xs | sm | md | lg)
 * @param {string} props.color - Color override:
 *   default | accent | success | warning | danger | error |
 *   strong | decent | weak | high | medium | low | public | private
 * @param {boolean} props.active - Active state for filter variant
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.children - Chip content
 */
const Chip = forwardRef(function Chip(
  {
    className,
    variant = 'info',
    size = 'sm',
    color,
    active = false,
    limit = 30,
    children,
    onClick,
    style,
    ...props
  },
  ref,
) {
  const resolvedSize = sizeStyles[size] ?? sizeStyles.sm;

  const baseClasses =
    'inline-flex items-center justify-center gap-1 outline-none rounded-full font-sans tracking-[0.01em] whitespace-nowrap overflow-hidden';

  const variantClasses = variantStyles[variant] || variantStyles.info;
  const colorOverrides = getColorOverrides(variant, color, active);

  // Handle icon + text combinations vs plain text
  let iconContent = null;
  let textContent = children;

  if (Array.isArray(children)) {
    // Handle array of children (icon + text)
    const textChild = children.find((child) => typeof child === 'string');
    const iconChild = children.find((child) => typeof child !== 'string');
    if (textChild) textContent = textChild;
    if (iconChild) iconContent = iconChild;
  }

  // For access-type variant, color overrides are inline styles (object), not class strings
  const accessTypeStyles =
    variant === 'access-type' &&
    typeof colorOverrides === 'object' &&
    colorOverrides.backgroundColor
      ? {
          backgroundColor: colorOverrides.backgroundColor,
          color: colorOverrides.color,
          borderColor: colorOverrides.borderColor,
          borderWidth: colorOverrides.borderWidth,
        }
      : {};

  return (
    <span
      ref={ref}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(e);
            }
          : undefined
      }
      style={variant === 'access-type' ? accessTypeStyles : style}
      className={cn(
        baseClasses,
        variantClasses,
        resolvedSize,
        onClick && 'transition-colors duration-150 select-none',
        variant === 'access-type' ? '' : colorOverrides,
        className,
      )}
      {...props}
    >
      {iconContent && iconContent}
      <TruncatedTextTooltip limit={limit} tooltipDelay={100}>
        {textContent}
      </TruncatedTextTooltip>
    </span>
  );
});

Chip.displayName = 'Chip';

Chip.propTypes = {
  variant: PropTypes.oneOf([
    'filter',
    'tag',
    'access-type',
    'source',
    'match',
    'strategy',
    'materials',
    'factor',
    'status',
    'info',
    'case',
    'severity',
    'score-pill',
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  color: PropTypes.oneOf([
    'default',
    'accent',
    'success',
    'warning',
    'danger',
    'error',
    'excellent',
    'strong',
    'decent',
    'poor',
    'high',
    'medium',
    'low',
    'public',
    'private',
  ]),
  active: PropTypes.bool,
  limit: PropTypes.number,
  score: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  style: PropTypes.object,
};

export default Chip;
