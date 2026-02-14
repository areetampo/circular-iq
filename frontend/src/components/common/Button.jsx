import React from 'react';
import { Button as HeroButton } from '@heroui/react';
import { clsx } from 'clsx';
import PropTypes from 'prop-types';

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
    'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200 data-[focus-visible=true]:outline-emerald-500 data-[disabled=true]:bg-emerald-100 data-[disabled=true]:text-emerald-300 data-[disabled=true]:opacity-70',

  // Info variant - Blue theme for informational actions
  info: 'bg-blue-500 text-white hover:bg-blue-700 active:bg-blue-800 data-[focus-visible=true]:outline-blue-500 data-[disabled=true]:bg-blue-400 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Info-soft variant - Soft blue theme
  'info-soft':
    'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 data-[focus-visible=true]:outline-blue-500 data-[disabled=true]:bg-blue-100 data-[disabled=true]:text-blue-400 data-[disabled=true]:opacity-70',

  // Warning variant - Orange/amber theme
  warning:
    'bg-red-600 text-white hover:bg-amber-700 active:bg-amber-800 data-[focus-visible=true]:outline-amber-500 data-[disabled=true]:bg-red-500 data-[disabled=true]:text-white/80 data-[disabled=true]:opacity-50',

  // Warning-soft variant - Soft orange/amber theme
  'warning-soft':
    'bg-amber-200 text-amber-700 border border-amber-200 hover:bg-amber-100 active:bg-amber-200 data-[focus-visible=true]:outline-amber-500 data-[disabled=true]:bg-amber-100 data-[disabled=true]:text-amber-400 data-[disabled=true]:opacity-70',

  // Teal variant - Teal theme for circular economy emphasis
  teal: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 data-[focus-visible=true]:outline-teal-500 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-70',

  // Teal-soft variant - Soft teal theme
  'teal-soft':
    'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 active:bg-teal-200 data-[focus-visible=true]:outline-teal-500 data-[disabled=true]:bg-teal-100 data-[disabled=true]:text-teal-300 data-[disabled=true]:opacity-70',

  // Neutral variant - Clean gray theme
  neutral:
    'bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800 data-[focus-visible=true]:outline-slate-500 data-[disabled=true]:bg-slate-400 data-[disabled=true]:text-white/70 data-[disabled=true]:opacity-60',

  // Neutral-soft variant - Soft gray theme
  'neutral-soft':
    'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 data-[focus-visible=true]:outline-slate-500 data-[disabled=true]:bg-slate-100 data-[disabled=true]:text-slate-400 data-[disabled=true]:opacity-70',
};

/**
 * Custom Button component extending heroui Button
 * Supports all heroui variants plus custom circular economy themed variants
 */
export function Button({ className, variant, ...props }) {
  // Check if using custom variant
  const isCustomVariant = variant && customVariantStyles[variant];

  if (isCustomVariant) {
    // Apply custom variant styles
    return (
      <HeroButton
        className={clsx(
          customVariantStyles[variant],
          'data-[disabled=true]:cursor-not-allowed',
          className,
        )}
        variant={undefined} // Don't pass custom variant to heroui
        {...props}
      />
    );
  }

  // Use heroui's native variant
  return (
    <HeroButton
      className={clsx('data-[disabled=true]:cursor-not-allowed', className)}
      variant={variant}
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
    'warning',
    'warning-soft',
    'teal',
    'teal-soft',
    'neutral',
    'neutral-soft',
    'light', // Keep heroui's light variant
    'shadow', // Keep heroui's shadow variant
    'bordered', // Keep heroui's bordered variant
    'flat', // Keep heroui's flat variant
  ]),
  className: PropTypes.string,
  children: PropTypes.node,
};

Button.defaultProps = {
  variant: 'primary',
};

export default Button;
