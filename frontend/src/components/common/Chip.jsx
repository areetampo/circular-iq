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
    'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
  ].join(' '),

  // Public/Private chips - simple design for AssessmentListItem
  // Minimal, clean appearance with color tints
  'access-type': ['text-[0.625rem] font-medium text-xs border', 'transition-all duration-200'].join(
    ' ',
  ),

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
    'bg-[#c3e6c3] text-[#1a4016]',
    'border border-[#a8d2a8]',
    'transition-all duration-200',
  ].join(' '),

  // Materials chips - for database evidence cards
  // Different styling to distinguish from source chips
  materials: [
    'font-medium text-xs',
    'bg-[#e0d4c0] text-[#3a2c18]',
    'border border-[#d0c0b0]',
    'transition-all duration-200',
  ].join(' '),

  // Factor classification chips - for scoring factors
  // Used throughout results pages
  factor: [
    'font-medium text-xs',
    'bg-[#d4c8b8] text-[#3a2f1f]',
    'border border-[#c0b4a4]',
    'transition-all duration-200',
  ].join(' '),

  // Status chips - for various status indicators
  // Can be combined with color prop
  status: [
    'font-semibold text-xs tracking-wider uppercase',
    'bg-[#d4c8b8] text-[#3a2f1f]',
    'border border-[#c0b4a4]',
    'transition-all duration-200',
  ].join(' '),

  // Info chips - for general informational purposes
  // Neutral, clean style
  info: [
    'font-medium text-xs',
    'bg-[#d4c8b8] text-[#3a2f1f]',
    'border border-[#c0b4a4]',
    'transition-all duration-200',
  ].join(' '),

  // Case reference chips - for case numbers and references
  case: [
    'text-xs',
    'bg-[#d4c8b8] text-[#3a2f1f]',
    'border border-[#c0b4a4]',
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
      ? 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-light)]'
      : 'border-(--color-border-ui) text-[var(--color-text-muted)] bg-transparent';
  }

  if (variant === 'access-type') {
    switch (color) {
      case 'public':
        return 'bg-[#e8f5e8] text-[#2d5a2d]/70 border-[#2d5a2d]/20';
      case 'private':
        return 'bg-[#ffe8e8] text-[#a52a2a]/70 border-[#a52a2a]/20';
      default:
        return 'bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border-ui)]';
    }
  }

  if (variant === 'match') {
    switch (color) {
      case 'strong':
        return 'bg-[#b8e6b8] text-[#1a4016] border-[#b8e6b8]';
      case 'decent':
        return 'bg-[#e6d4b8] text-[#7a4c1a] border-[#e6d4b8]';
      case 'weak':
        return 'bg-[#f8d7d7] text-[#7f1d1d] border-[#f8d7d7]';
      default:
        return 'bg-[#d4c8b8] text-[#2a1f0f] border-[#c0b4a4]';
    }
  }

  if (variant === 'severity') {
    switch (color) {
      case 'high':
        return 'bg-[#f8d7d7] text-[#7f1d1d] border-[#fca5a5]';
      case 'medium':
        return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
      case 'low':
        return 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]';
      default:
        return 'bg-[#d4c8b8] text-[#2a1f0f] border-[#c0b4a4]';
    }
  }

  if (variant === 'status') {
    switch (color) {
      case 'success':
        return 'bg-[rgba(74,124,89,0.15)] text-[#4a7c59] border-[rgba(74,124,89,0.3)]';
      case 'warning':
        return 'bg-[rgba(176,125,58,0.15)] text-[#b07d3a] border-[rgba(176,125,58,0.3)]';
      case 'danger':
        return 'bg-[rgba(139,58,58,0.15)] text-[#8b3a3a] border-[rgba(139,58,58,0.3)]';
      default:
        return 'bg-[#e0d4c0] text-[#3a2c18] border-[#d0c0b0]';
    }
  }

  if (color && variant !== 'match' && variant !== 'severity' && variant !== 'status') {
    switch (color) {
      case 'success':
        return 'border-[var(--color-success)] text-[var(--color-success)]';
      case 'warning':
        return 'border-[var(--color-warning)] text-[var(--color-warning)]';
      case 'danger':
        return 'border-[var(--color-error)] text-[var(--color-error)]';
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

  return (
    <HeroChip
      ref={ref}
      className={cn(baseClasses, variantClasses, resolvedSize, colorOverrides, className)}
      variant="flat"
      size={undefined}
      onClick={onClick}
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
