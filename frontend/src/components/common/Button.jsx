import { Button as HeroButton, Spinner } from '@heroui/react';
import { clsx } from 'clsx';
import PropTypes from 'prop-types';

/**
 * Size styles using Tailwind naming convention.
 * "md" matches the previous default appearance exactly.
 * HeroUI's own size prop is bypassed so we have full control over sizing.
 */
const sizeStyles = {
  xs: 'h-6  px-2  text-[11px] font-medium   rounded-md  gap-1   [&>svg]:size-3',
  sm: 'h-7  px-3  text-xs     font-medium   rounded-md  gap-1.5 [&>svg]:size-3.5',
  md: 'h-9  px-4  text-sm     font-semibold rounded-md  gap-2   [&>svg]:size-4', // default
  lg: 'h-11 px-4  text-base   font-semibold rounded-md  gap-2   [&>svg]:size-[18px]',
  xl: 'h-13 px-5  text-xl     font-semibold rounded-md  gap-2.5 [&>svg]:size-5',
  '2xl': 'h-16 px-6  text-2xl  font-bold     rounded-md  gap-3   [&>svg]:size-6',
};

/**
 * Custom variant styles for circular economy themed buttons
 * Simple, clean designs following heroui's principles
 */
const customVariantStyles = {
  // Primary variant - Warm tan main CTA
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)] data-[focus-visible=true]:outline-[var(--accent)] data-[disabled=true]:opacity-50',

  // Secondary variant - Warm border, foreground text
  secondary:
    'bg-transparent text-[var(--foreground)] border border-[var(--border-strong)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] active:bg-[var(--accent-soft)] data-[focus-visible=true]:outline-[var(--accent)] data-[disabled=true]:opacity-50',

  // Ghost variant - No border, muted text
  ghost:
    'bg-transparent text-muted border border-transparent hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)] active:bg-[var(--accent-soft)] data-[focus-visible=true]:outline-[var(--accent)] data-[disabled=true]:opacity-50',

  // Tertiary variant - Surface background with border
  tertiary:
    'bg-[var(--surface-raised)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] active:bg-[var(--accent-soft)] data-[focus-visible=true]:outline-[var(--accent)] data-[disabled=true]:opacity-50',

  // Danger variant - Red for destructive actions
  danger:
    'bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 active:bg-[var(--danger)]/80 data-[focus-visible=true]:outline-[var(--danger)] data-[disabled=true]:opacity-50',

  // Danger-soft variant - Soft red theme
  'danger-soft':
    'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30 hover:bg-[var(--danger-soft)]/80 active:bg-[var(--danger-soft)]/60 data-[focus-visible=true]:outline-[var(--danger)] data-[disabled=true]:opacity-50',

  // Success/Eco variant - Green theme for positive/eco actions
  success:
    'bg-[var(--success)] text-white hover:bg-[var(--success)]/90 active:bg-[var(--success)]/80 data-[focus-visible=true]:outline-[var(--success)] data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Eco-soft variant - Soft green theme
  'eco-soft':
    'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--success-soft)]/80 hover:border-[var(--success)]/50 active:bg-[var(--success-soft)]/60 data-[focus-visible=true]:outline-[var(--success)] data-[disabled=true]:bg-[var(--success-soft)] data-[disabled=true]:text-[var(--success)]/50 data-[disabled=true]:opacity-70',

  // Info variant - Blue theme for informational actions
  info: 'bg-[var(--info)] text-white hover:bg-[var(--info)]/90 active:bg-[var(--info)]/80 data-[focus-visible=true]:outline-[var(--info)] data-[disabled=true]:bg-[var(--info)]/80 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Info-soft variant - Soft blue theme
  'info-soft':
    'bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info)]/30 hover:bg-[var(--info-soft)]/80 hover:border-[var(--info)]/50 active:bg-[var(--info-soft)]/60 data-[focus-visible=true]:outline-[var(--info)] data-[disabled=true]:bg-[var(--info-soft)] data-[disabled=true]:text-[var(--info)]/50 data-[disabled=true]:opacity-70',

  // Yellow variant
  yellow:
    'bg-[var(--warning)] text-white hover:bg-[var(--warning)]/90 active:bg-[var(--warning)]/80 data-[focus-visible=true]:outline-[var(--warning)] data-[disabled=true]:bg-[var(--warning)]/80 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Yellow-soft variant - Soft yellow theme
  'yellow-soft':
    'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 hover:bg-[var(--warning-soft)]/80 hover:border-[var(--warning)]/50 active:bg-[var(--warning-soft)]/60 data-[focus-visible=true]:outline-[var(--warning)] data-[disabled=true]:bg-[var(--warning-soft)] data-[disabled=true]:text-[var(--warning)]/50 data-[disabled=true]:opacity-95',

  // Teal variant
  teal: 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 active:bg-[var(--accent)]/80 data-[focus-visible=true]:outline-[var(--accent)] data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-70',

  // Teal-soft variant - Soft teal theme
  'teal-soft':
    'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent-soft)]/80 hover:border-[var(--accent)]/50 active:bg-[var(--accent-soft)]/60 data-[focus-visible=true]:outline-[var(--accent)] data-[disabled=true]:bg-[var(--accent-soft)] data-[disabled=true]:text-[var(--accent)]/50 data-[disabled=true]:opacity-70',

  // Neutral variant - Clean gray theme
  neutral:
    'bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/90 active:bg-[var(--foreground)]/80 data-[focus-visible=true]:outline-[var(--foreground)] data-[disabled=true]:bg-[var(--foreground)]/80 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Neutral-soft variant - Soft gray theme
  'neutral-soft':
    'bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-raised)] hover:border-[var(--border)] active:bg-[var(--surface)] data-[focus-visible=true]:outline-[var(--foreground)] data-[disabled=true]:bg-[var(--surface)] data-[disabled=true]:text-muted data-[disabled=true]:opacity-70',
};

/**
 * Custom Button component extending heroui Button
 * Supports all heroui variants plus custom circular economy themed variants.
 *
 * Size prop uses Tailwind naming: xs | sm | md (default) | lg | xl | 2xl
 * Loading state: pass isLoading=true to show loading spinner and prevent clicks
 */
export function Button({
  className,
  variant,
  size = 'md',
  isDisabled = false,
  disabled = false,
  isLoading = false,
  children,
  ...props
}) {
  const isCustomVariant = variant && customVariantStyles[variant];
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;
  const isButtonDisabled = isDisabled || disabled || isLoading;

  const buttonContent = isLoading ? (
    <span className="flex items-center justify-center gap-2 w-full">
      <Spinner size="sm" color="current" />
    </span>
  ) : (
    children
  );

  if (isCustomVariant) {
    return (
      <HeroButton
        className={clsx(
          customVariantStyles[variant],
          resolvedSize,
          'data-[disabled=true]:cursor-not-allowed focus:outline-none',
          className,
        )}
        variant={undefined}
        size={undefined}
        isDisabled={isButtonDisabled}
        disabled={isButtonDisabled}
        {...props}
      >
        {buttonContent}
      </HeroButton>
    );
  }

  return (
    <HeroButton
      className={clsx(resolvedSize, 'data-[disabled=true]:cursor-not-allowed', className)}
      variant={variant}
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
    'tertiary',
    'outline',
    'ghost',
    'danger',
    'danger-soft',
    'success',
    'eco-soft',
    'info',
    'info-soft',
    'yellow',
    'yellow-soft',
    'teal',
    'teal-soft',
    'neutral',
    'neutral-soft',
    'light',
    'shadow',
    'bordered',
    'flat',
  ]),
  /* default size is 'md' */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  className: PropTypes.string,
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default Button;
