import { Button as HeroButton, Spinner } from '@heroui/react';
import { clsx } from 'clsx';
import PropTypes from 'prop-types';

/**
 * Variant styles for the luxury minimal button system
 * Based on UI 21 specifications
 */
const variantStyles = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] border border-transparent',
  secondary:
    'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)]',
  danger:
    'bg-transparent text-[var(--color-error)] border border-[rgba(139,58,58,0.25)] hover:bg-[rgba(139,58,58,0.07)]',
  'dialog-primary':
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] w-full',
  'dialog-secondary':
    'bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-accent-light)] w-full',
  'results-action':
    'bg-transparent text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-xs tracking-wide uppercase',
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
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isDisabled = false,
  disabled = false,
  isLoading = false,
  children,
  ...props
}) {
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;
  const isButtonDisabled = isDisabled || disabled || isLoading;
  const baseClasses =
    'transition-colors duration-150 rounded-[var(--radius-md)] font-medium inline-flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-[var(--color-accent-light)] focus:ring-offset-1';

  const buttonContent = isLoading ? (
    <span className="flex items-center justify-center gap-2 w-full">
      <Spinner size="sm" color="current" />
    </span>
  ) : (
    children
  );

  return (
    <HeroButton
      className={clsx(
        baseClasses,
        variantStyles[variant] || variantStyles.primary,
        resolvedSize,
        isButtonDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
      variant="flat"
      size={undefined}
      isDisabled={isButtonDisabled}
      disabled={isButtonDisabled}
      {...props}
    >
      {buttonContent}
    </HeroButton>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'ghost',
    'danger',
    'dialog-primary',
    'dialog-secondary',
    'results-action',
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default Button;
