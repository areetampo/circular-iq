import React from 'react';
import { Button as HeroButton } from '@heroui/react';
import { clsx } from 'clsx';
import PropTypes from 'prop-types';

/**
 * Size styles using Tailwind naming convention.
 * "md" matches the previous default appearance exactly.
 * HeroUI's own size prop is bypassed so we have full control over sizing.
 */
const sizeStyles = {
  xs: 'h-6  px-2  text-[11px] font-medium   rounded-3xl  gap-1   [&>svg]:size-3',
  sm: 'h-7  px-3  text-xs     font-medium   rounded-3xl  gap-1.5 [&>svg]:size-3.5',
  md: 'h-9  px-4  text-sm     font-semibold rounded-3xl  gap-2   [&>svg]:size-4', // default
  lg: 'h-11 px-4  text-base   font-semibold rounded-3xl  gap-2   [&>svg]:size-[18px]',
  xl: 'h-13 px-5  text-xl     font-semibold rounded-3xl gap-2.5 [&>svg]:size-5',
  '2xl': 'h-16 px-6  text-2xl    font-bold     rounded-3xl gap-3   [&>svg]:size-6',
};

/**
 * Custom variant styles for circular economy themed buttons
 * Simple, clean designs following heroui's principles
 */
const customVariantStyles = {
  // Success/Eco variant - Green theme for positive/eco actions
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 data-[focus-visible=true]:outline-emerald-500 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Eco-soft variant - Soft green theme
  'eco-soft':
    'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200 data-[focus-visible=true]:outline-emerald-500 data-[disabled=true]:bg-emerald-50 data-[disabled=true]:text-emerald-300 data-[disabled=true]:opacity-70',

  // Info variant - Blue theme for informational actions
  info: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 data-[focus-visible=true]:outline-blue-500 data-[disabled=true]:bg-blue-400 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Info-soft variant - Soft blue theme
  'info-soft':
    'bg-blue-100/50 text-blue-700 border border-blue-200 hover:bg-blue-200/50 hover:border-blue-300 active:bg-blue-200 data-[focus-visible=true]:outline-blue-500 data-[disabled=true]:bg-blue-50 data-[disabled=true]:text-blue-300 data-[disabled=true]:opacity-70',

  // Yellow varian
  yellow:
    'bg-yellow-400/90 text-slate-900 hover:bg-yellow-500/80 active:bg-yellow-600 data-[focus-visible=true]:outline-yellow-400 data-[disabled=true]:bg-yellow-300 data-[disabled=true]:text-slate-400 data-[disabled=true]:opacity-60',

  // Yellow-soft variant - Soft yellow theme
  'yellow-soft':
    'bg-yellow-200 text-yellow-800 border border-yellow-200 hover:bg-yellow-300 hover:border-yellow-300 active:bg-yellow-200 data-[focus-visible=true]:outline-yellow-400 data-[disabled=true]:bg-yellow-50 data-[disabled=true]:text-yellow-300 data-[disabled=true]:opacity-95',

  teal: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 data-[focus-visible=true]:outline-teal-500 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-70',

  // Teal-soft variant - Soft teal theme
  'teal-soft':
    'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:border-teal-300 active:bg-teal-200 data-[focus-visible=true]:outline-teal-500 data-[disabled=true]:bg-teal-50 data-[disabled=true]:text-teal-300 data-[disabled=true]:opacity-70',

  // Neutral variant - Clean gray theme
  neutral:
    'bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800 data-[focus-visible=true]:outline-slate-500 data-[disabled=true]:bg-slate-500 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Neutral-soft variant - Soft gray theme
  'neutral-soft':
    'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:bg-slate-200 data-[focus-visible=true]:outline-slate-500 data-[disabled=true]:bg-slate-50 data-[disabled=true]:text-slate-300 data-[disabled=true]:opacity-70',
};

/**
 * Custom Button component extending heroui Button
 * Supports all heroui variants plus custom circular economy themed variants.
 *
 * Size prop uses Tailwind naming: xs | sm | md (default) | lg | xl | 2xl
 */
export function Button({
  className,
  variant,
  size = 'md',
  isDisabled = false,
  disabled = false,
  ...props
}) {
  const isCustomVariant = variant && customVariantStyles[variant];
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;

  if (isCustomVariant) {
    return (
      <HeroButton
        className={clsx(
          customVariantStyles[variant],
          resolvedSize,
          'data-[disabled=true]:cursor-not-allowed',
          className,
        )}
        variant={undefined} // Don't pass custom variant to heroui
        size={undefined} // We handle sizing ourselves
        isDisabled={isDisabled}
        disabled={disabled}
        {...props}
      />
    );
  }

  // Use heroui's native variant but still apply our size system
  return (
    <HeroButton
      className={clsx(resolvedSize, 'data-[disabled=true]:cursor-not-allowed', className)}
      variant={variant}
      size={undefined} // We handle sizing ourselves
      isDisabled={isDisabled}
      disabled={disabled}
      {...props}
    />
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
};

export default Button;
