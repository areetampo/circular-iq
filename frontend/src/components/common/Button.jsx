// Button.jsx
import PropTypes from 'prop-types';
import { forwardRef, useRef } from 'react';
import { mergeProps, useButton } from 'react-aria';

import { Spinner } from '@/components/common';
import { cn } from '@/utils/cn';

const variantStyles = {
  primary:
    'bg-(--color-accent) text-white hover:bg-(--color-accent-hover) border border-transparent',
  ghost:
    'bg-(--color-accent-soft-10) text-(--color-text-secondary) border border-transparent hover:text-(--color-text-primary) hover:bg-(--color-hover-accent-strong)',
  ghastly:
    'bg-transparent text-(--color-text-muted) border border-transparent hover:bg-(--color-hover-subtle) hover:text-(--color-text-primary)',
  danger:
    'bg-(--color-error) text-white border border-(--color-error-border-strong) hover:opacity-90 transition-opacity',
  'results-action':
    'bg-transparent text-(--color-text-secondary) border-[1.5px] border-(--color-border-ui) hover:bg-(--color-accent-light) text-xs tracking-wide uppercase',
  'dialog-primary': 'bg-(--color-accent) text-white w-full hover:bg-(--color-accent-hover)',
  'dialog-secondary':
    'bg-transparent text-(--color-text-secondary) w-full border border-(--color-border-strong) hover:bg-(--color-accent-light)',
  teal: 'bg-(--color-success) text-white hover:bg-(--color-success-hover) border border-transparent',
  'neutral-soft': 'text-(--color-accent) bg-(--color-accent-soft-ui) hover:bg-(--color-accent)/20',
  'info-soft': 'text-(--color-info) bg-(--color-info-soft-ui) hover:bg-(--color-info)/20',
  'success-soft':
    'text-(--color-success) bg-(--color-success-soft-ui) hover:bg-(--color-success)/20',
  'warning-soft':
    'text-(--color-warning) bg-(--color-warning-soft-ui) hover:bg-(--color-warning)/20',
  'danger-soft': 'text-(--color-error) bg-(--color-error-soft-ui) hover:bg-(--color-error)/20',
};

const sizeStyles = {
  xs: 'px-2 py-1 text-[0.65rem]',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const spinnerColorMap = {
  primary: '#ffffff',
  secondary: '#4B5563',
  ghost: '#4B5563',
  ghastly: '#4B5563',
  danger: '#ffffff',
  teal: '#ffffff',
  'dialog-primary': '#ffffff',
  'dialog-secondary': '#4B5563',
  'results-action': '#4B5563',
  'eco-soft': '#4B5563',
  'neutral-soft': '#4B5563',
};

const spinnerSizeMap = {
  xs: 12,
  sm: 14,
  md: 16, // default
  lg: 20,
};

const getSpinnerColor = (variant) => spinnerColorMap[variant] || '#ffffff';
const getSpinnerSize = (size) => spinnerSizeMap[size] || 16;

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isDisabled = false,
    disabled = false,
    isLoading = false,
    children,
    onPress,
    onClick,
    as: Component = 'button',
    to,
    href,
    type = 'button',
    ...props
  },
  ref,
) {
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;
  const isButtonDisabled = isDisabled || disabled || isLoading;

  let Element = Component;
  let isLink = Element !== 'button';
  if (to && Component === 'button') {
    Element = 'a';
    isLink = true;
  }

  const internalRef = useRef(null);
  const buttonRef = ref || internalRef;

  const { buttonProps: ariaButtonProps } = useButton(
    {
      onPress,
      onClick,
      isDisabled: isButtonDisabled,
      elementType: Element,
      ...props,
    },
    buttonRef,
  );

  let buttonProps = {};
  if (!isLink) {
    buttonProps = ariaButtonProps;
  }

  const handleLinkClick = (event) => {
    if (isButtonDisabled) {
      event.preventDefault();
      return;
    }
    const pressHandler = onPress || onClick;
    if (pressHandler) pressHandler(event);
  };

  const baseClasses = cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-sans transition-colors duration-200 outline-none',
    variantStyles[variant] || variantStyles.primary,
    resolvedSize,
    isButtonDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
    fullWidth && 'w-full',
    className,
  );

  const spinnerColor = getSpinnerColor(variant);
  const spinnerSize = getSpinnerSize(size);

  // ✅ Content rendering: original content always keeps its layout (icon + text side by side)
  // The wrapper span always has the same classes – only its visibility changes.
  // Spinner is absolutely positioned over the same area, does not affect button size.
  const content = (
    <span className="relative inline-flex items-center justify-center">
      {/* Original children – always in layout, never changes display style */}
      <span
        className={cn(
          'inline-flex items-center justify-center gap-1.5',
          isLoading ? 'invisible' : 'visible',
        )}
      >
        {children}
      </span>

      {/* Spinner – absolute, centered, only shown when loading */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner color={spinnerColor} size={spinnerSize} />
        </span>
      )}
    </span>
  );

  if (isLink) {
    return (
      <Element
        ref={buttonRef}
        className={baseClasses}
        onClick={handleLinkClick}
        to={to}
        href={href || to}
        aria-disabled={isButtonDisabled}
        {...props}
      >
        {content}
      </Element>
    );
  }

  const finalProps = mergeProps(buttonProps, {
    className: baseClasses,
    type,
    disabled: isButtonDisabled ? true : undefined,
    'aria-disabled': isButtonDisabled,
  });

  return (
    <Element ref={buttonRef} {...finalProps}>
      {content}
    </Element>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'ghost',
    'ghastly',
    'danger',
    'results-action',
    'dialog-primary',
    'dialog-secondary',
    'eco-soft',
    'teal',
    'neutral-soft',
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  isDisabled: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onPress: PropTypes.func,
  onClick: PropTypes.func,
  as: PropTypes.elementType,
  to: PropTypes.string,
  href: PropTypes.string,
  type: PropTypes.string,
};

export default Button;
