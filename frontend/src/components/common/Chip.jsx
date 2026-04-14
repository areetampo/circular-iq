import { Chip as HeroChip } from '@heroui/react';
import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { cn } from '@/utils/cn';

/**
 * Variant styles for the luxury minimal chip system
 * Based on UI-59 specifications and design references
 */
const variantStyles = {
  // Industry filter chips - used in MyAssessmentsPage filter bar
  // Full radius, with active/inactive states
  filter: [
    'font-medium text-xs',
    'border transition-all duration-200 cursor-pointer',
    'hover:border-(--color-accent) hover:text-(--color-accent)',
  ].join(' '),

  // Public/Private chips - simple design for AssessmentListItem
  // Minimal, clean appearance with color tints
  'access-type': [
    'text-[0.625rem] font-medium text-xs border',
    'transition-all duration-200',
    'opacity-85',
  ].join(' '),

  // Source chips - for database evidence cards
  // Clean, informational style with distinct appearance
  source: [
    'font-medium text-xs',
    'bg-[oklch(0.92_0.02_240/0.6)] text-[oklch(0.4_0.05_240)]',
    'border border-[oklch(0.8_0.03_240)]',
    'transition-all duration-200',
  ].join(' '),

  // Percentage match chips - simplified with reduced font weight
  // Only shows percentage, no text labels
  match: ['text-xs font-medium', 'border transition-all duration-200'].join(' '),

  // Recycling/Reuse strategy chips - for database evidence cards
  // Eco-themed styling with distinct appearance
  strategy: [
    'font-medium text-xs',
    'bg-(--color-chip-strategy-bg) text-(--color-chip-strategy-text)',
    'border border-(--color-chip-strategy-border)',
    'transition-all duration-200',
  ].join(' '),

  // Materials chips - for database evidence cards
  // Different styling to distinguish from source chips
  materials: [
    'font-medium text-xs',
    'bg-(--color-chip-materials-bg) text-(--color-chip-materials-text)',
    'border border-(--color-chip-materials-border)',
    'transition-all duration-200',
  ].join(' '),

  // Factor classification chips - for scoring factors
  // Used throughout results pages
  factor: [
    'font-medium text-xs',
    'bg-(--color-chip-factor-bg) text-(--color-chip-factor-text)',
    'border border-(--color-chip-factor-border)',
    'transition-all duration-200',
  ].join(' '),

  // Status chips - for various status indicators
  // Can be combined with color prop
  status: [
    'font-semibold text-xs tracking-wider uppercase',
    'bg-(--color-chip-factor-bg) text-(--color-chip-factor-text)',
    'border border-(--color-chip-factor-border)',
    'transition-all duration-200',
  ].join(' '),

  // Info chips - for general informational purposes
  // Neutral, clean style
  info: [
    'font-medium text-xs',
    'bg-(--color-chip-factor-bg) text-(--color-chip-factor-text)',
    'border border-(--color-chip-factor-border)',
    'transition-all duration-200',
  ].join(' '),

  // Case reference chips - for case numbers and references
  case: [
    'text-xs',
    'bg-(--color-chip-factor-bg) text-(--color-chip-factor-text)',
    'border border-(--color-chip-factor-border)',
    'transition-all duration-200',
  ].join(' '),

  // Severity chips - for gap analysis severity levels
  // Color-coded based on severity
  severity: ['font-bold text-xs', 'border transition-all duration-200'].join(' '),
};

/**
 * Size styles using Tailwind naming convention
 */
const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm', // default
  lg: 'px-4 py-1.5 text-base',
};

/**
 * Color overrides for specific variants
 */
const getColorOverrides = (variant, color, active) => {
  if (variant === 'filter') {
    return active
      ? 'border-(--color-accent) text-(--color-accent) bg-(--color-accent-light)'
      : 'border-(--color-border-ui) text-(--color-text-muted) bg-transparent';
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

  if (variant === 'match') {
    switch (color) {
      case 'strong':
        return 'bg-(--color-match-strong-bg) text-(--color-match-strong-text) border-(--color-match-strong-border)';
      case 'decent':
        return 'bg-(--color-match-decent-bg) text-(--color-match-decent-text) border-(--color-match-decent-border)';
      case 'weak':
        return 'bg-(--color-match-weak-bg) text-(--color-match-weak-text) border-(--color-match-weak-border)';
      default:
        return 'bg-(--color-match-default-bg) text-(--color-match-default-text) border-(--color-match-default-border)';
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

  if (variant === 'status') {
    switch (color) {
      case 'success':
        return 'bg-(--color-success-soft-ui) text-(--color-success) border-(--color-success-border)';
      case 'warning':
        return 'bg-(--color-warning-soft-ui) text-(--color-warning) border-(--color-warning-border)';
      case 'danger':
        return 'bg-(--color-error-soft-ui) text-(--color-error) border-(--color-error-border)';
      default:
        return 'bg-(--color-chip-materials-bg) text-(--color-chip-materials-text) border-(--color-chip-materials-border)';
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
 * Custom Chip component with luxury minimal variant system
 * Overrides HeroUI Chip component with consistent styling
 *
 * @param {Object} props - Chip props
 * @param {string} props.variant - Chip variant (filter, access-type, source, match, strategy, factor, status, info, case, severity)
 * @param {string} props.size - Chip size (sm, md, lg)
 * @param {string} props.color - Color override (success, warning, danger, strong, decent, weak, high, medium, low)
 * @param {boolean} props.active - Active state for filter variant
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.children - Chip content
 */
export const Chip = forwardRef(function Chip(
  {
    className = '',
    variant = 'info',
    size = 'sm',
    color,
    active = false,
    children,
    onClick,
    ...props
  },
  ref,
) {
  const resolvedSize = sizeStyles[size] ?? sizeStyles.sm;
  const baseClasses =
    'inline-flex items-center justify-center gap-1 outline-none rounded-full whitespace-nowrap max-w-50';

  const variantClasses = variantStyles[variant] || variantStyles.info;
  const colorOverrides = getColorOverrides(variant, color, active);

  // For access-type variant, use inline styles instead of Tailwind classes with opacity modifiers
  const accessTypeStyles =
    variant === 'access-type' && colorOverrides.backgroundColor
      ? {
          backgroundColor: colorOverrides.backgroundColor,
          color: colorOverrides.color,
          borderColor: colorOverrides.borderColor,
          borderWidth: colorOverrides.borderWidth,
        }
      : {};

  return (
    <HeroChip
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses,
        resolvedSize,
        variant === 'access-type' ? '' : colorOverrides,
        className,
      )}
      variant="flat"
      size={undefined}
      onClick={onClick}
      style={accessTypeStyles}
      {...props}
    >
      <span className="flex items-center justify-center truncate">{children}</span>
    </HeroChip>
  );
});

Chip.displayName = 'Chip';

Chip.propTypes = {
  variant: PropTypes.oneOf([
    'filter',
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
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf([
    'default',
    'accent',
    'success',
    'warning',
    'danger',
    'strong',
    'decent',
    'weak',
    'high',
    'medium',
    'low',
    'public',
    'private',
  ]),
  active: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
};

export default Chip;
