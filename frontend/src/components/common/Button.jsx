import { Button as HeroButton, Spinner } from '@heroui/react';
import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { cn } from '@/utils/cn';

/**
 * Variant styles for the luxury minimal button system
 * Based on UI 39-42 specifications
 */
const variantStyles = {
  // Primary — used for main CTAs. Warm but lighter, not heavy dark brown.
  primary: [
    'bg-[var(--color-accent)] text-white',
    'hover:bg-[var(--color-accent-hover)]',
    'border border-transparent',
    'transition-colors duration-150',
  ].join(' '),

  // Secondary — bordered, no fill. Used for secondary actions.
  secondary: [
    'bg-transparent text-[var(--color-text-primary)]',
    'border border-[var(--color-border-strong)]',
    'hover:border-[var(--color-primary-900)]',
    'transition-colors duration-150',
  ].join(' '),

  // Ghost — no border, minimal. Used for tertiary/icon actions.
  ghost: [
    'bg-[rgba(184,145,106,0.1)] text-[var(--color-text-secondary)]',
    'border border-transparent',
    'hover:text-[var(--color-text-primary)] hover:bg-[rgba(184,145,106,0.2)]',
    'transition-colors duration-150',
  ].join(' '),

  // Danger — for destructive actions.
  danger: [
    'bg-transparent text-[var(--color-error)]',
    'border border-[rgba(139,58,58,0.3)]',
    'hover:bg-[rgba(139,58,58,0.06)]',
    'transition-colors duration-150',
  ].join(' '),

  // Results-action — top of results/comparison page. Small, uppercase, minimal.
  'results-action': [
    'bg-transparent text-[var(--color-text-secondary)]',
    'border-[1.5px] border-[var(--color-border)]',
    'hover:bg-[var(--color-accent-light)]',
    'text-xs tracking-wide uppercase',
    'transition-colors duration-150',
  ].join(' '),

  // Dialog variants
  'dialog-primary': [
    'bg-[var(--color-accent)] text-white w-full',
    'hover:bg-[var(--color-accent-hover)]',
    'transition-colors duration-150',
  ].join(' '),

  'dialog-secondary': [
    'bg-transparent text-[var(--color-text-secondary)] w-full',
    'border border-[var(--color-border-strong)]',
    'hover:bg-[var(--color-accent-light)]',
    'transition-colors duration-150',
  ].join(' '),

  // Eco-soft — used on test case cards
  'eco-soft': [
    'bg-transparent text-[var(--color-accent)]',
    'border border-[var(--color-border)]',
    'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]',
    'text-xs',
    'transition-colors duration-150',
  ].join(' '),

  // Teal — special variant for main CTA on landing page
  teal: [
    'bg-[var(--color-success)] text-white',
    'hover:bg-[var(--color-success-hover)]',
    'border border-transparent',
    'transition-colors duration-150',
  ].join(' '),

  // Neutral-soft — used for export buttons
  'neutral-soft': [
    'bg-transparent text-[var(--color-text-secondary)]',
    'border border-[var(--color-border)]',
    'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
    'transition-colors duration-150',
  ].join(' '),
};

/**
 * Size styles using Tailwind naming convention
 */
const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm', // default
  lg: 'px-5 py-2.5 text-base',
};

/**
 * Custom Button component with luxury minimal variant system
 * Replaces the old complex variant system with the new simplified one
 *
 * @param {Object} props - Button props
 * @param {string} props.variant - Button variant (primary, secondary, ghost, danger, dialog-primary, dialog-secondary, results-action)
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {boolean} props.isLoading - Show loading state
 * @param {boolean} props.isDisabled - Disable button
 * @param {boolean} props.disabled - Disable button (alias for isDisabled)
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.children - Button content
 */
export const Button = forwardRef(function Button(
  {
    className = '',
    variant = 'primary',
    size = 'md',
    isDisabled = false,
    disabled = false,
    isLoading = false,
    children,
    onPress,
    onClick,
    ...props
  },
  ref,
) {
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;
  const isButtonDisabled = isDisabled || disabled || isLoading;
  const baseClasses =
    'transition-colors duration-150 rounded-lg font-[var(--font-sans)] inline-flex items-center justify-center gap-2 outline-none';

  const buttonContent = isLoading ? (
    <span className="flex w-full items-center justify-center gap-2">
      <Spinner size="sm" color="current" />
    </span>
  ) : (
    children
  );

  // Handle both onPress and onClick for compatibility
  const handlePress = onPress || onClick;

  return (
    <HeroButton
      ref={ref}
      className={cn(
        baseClasses,
        variantStyles[variant] || variantStyles.primary,
        resolvedSize,
        isButtonDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
      variant="flat"
      size={undefined}
      isDisabled={isButtonDisabled}
      disabled={isButtonDisabled}
      onPress={handlePress}
      {...props}
    >
      {buttonContent}
    </HeroButton>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'tertiary',
    'ghost',
    'danger',
    'dialog-primary',
    'dialog-secondary',
    'results-action',
    'eco-soft',
    'teal',
    'neutral-soft',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onPress: PropTypes.func,
  onClick: PropTypes.func,
};

export default Button;
