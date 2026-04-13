// Button.jsx
import PropTypes from 'prop-types';
import { forwardRef, useRef } from 'react';
import { mergeProps, useButton } from 'react-aria';

import { cn } from '@/utils/cn';

/**
 * Spinner component for loading state
 */
const Spinner = ({ size = 'sm' }) => (
  <svg
    className={cn(
      'animate-spin',
      size === 'sm' && 'size-4',
      size === 'md' && 'size-5',
      size === 'lg' && 'size-6',
    )}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Variant styles (same as before)
 */
const variantStyles = {
  primary: [
    'bg-[var(--color-accent)] text-white',
    'hover:bg-[var(--color-accent-hover)]',
    'border border-transparent',
    'transition-colors duration-150',
  ].join(' '),
  secondary: [
    'bg-transparent text-[var(--color-text-primary)]',
    'border border-[var(--color-border-strong)]',
    'hover:border-[var(--color-primary-900)]',
    'transition-colors duration-150',
  ].join(' '),
  ghost: [
    'bg-[rgba(184,145,106,0.1)] text-[var(--color-text-secondary)]',
    'border border-transparent',
    'hover:text-[var(--color-text-primary)] hover:bg-[rgba(184,145,106,0.2)]',
    'transition-colors duration-150',
  ].join(' '),
  ghastly: [
    'bg-transparent text-(--color-text-muted)',
    'border border-transparent',
    'hover:bg-[rgba(180,160,130,0.12)] hover:text-(--color-text-primary)',
    'transition-colors duration-150',
  ].join(' '),
  danger: [
    'bg-(--color-error) text-white',
    'border border-[rgba(139,58,58,0.3)]',
    'hover:opacity-90',
    'transition-opacity duration-150',
  ].join(' '),
  'results-action': [
    'bg-transparent text-[var(--color-text-secondary)]',
    'border-[1.5px] border-[var(--color-border-ui)]',
    'hover:bg-[var(--color-accent-light)]',
    'text-xs tracking-wide uppercase',
    'transition-colors duration-150',
  ].join(' '),
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
  'eco-soft': [
    'bg-transparent text-[var(--color-accent)]',
    'border border-[var(--color-border-ui)]',
    'hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]',
    'text-xs',
    'transition-colors duration-150',
  ].join(' '),
  teal: [
    'bg-[var(--color-success)] text-white',
    'hover:bg-[var(--color-success-hover)]',
    'border border-transparent',
    'transition-colors duration-150',
  ].join(' '),
  'neutral-soft': [
    'bg-transparent text-[var(--color-text-secondary)]',
    'border border-[var(--color-border-ui)]',
    'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
    'transition-colors duration-150',
  ].join(' '),
};

const sizeStyles = {
  xs: 'px-2 py-1 text-[0.65rem]',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

/**
 * Custom Button using native elements – no HeroUI dependency.
 * Supports `as` (component override) and `to` for anchor/routing.
 */
export const Button = forwardRef(function Button(
  {
    className = '',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isDisabled = false,
    disabled = false,
    isLoading = false,
    children,
    onPress, // will be used by useButton
    onClick, // fallback, merged by useButton
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

  // Determine if we render an anchor or a button
  let Element = Component;
  let isLink = Element !== 'button';
  if (to && Component === 'button') {
    Element = 'a';
    isLink = true;
  }

  // Create a ref for useButton (only used for button elements)
  const internalRef = useRef(null);
  const buttonRef = ref || internalRef;

  // Use useButton only when Element is 'button' (or a custom component that behaves like a button)
  // For anchor links, we keep the manual click handling (links don't use useButton)
  let buttonProps = {};
  if (!isLink) {
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
    buttonProps = ariaButtonProps;
  }

  // For links, we create a simple click handler that prevents navigation when disabled
  const handleLinkClick = (event) => {
    if (isButtonDisabled) {
      event.preventDefault();
      return;
    }
    const pressHandler = onPress || onClick;
    if (pressHandler) pressHandler(event);
  };

  const baseClasses = cn(
    'transition-colors duration-150 rounded-lg font-sans inline-flex items-center justify-center gap-2 outline-none cursor-pointer',
    variantStyles[variant] || variantStyles.primary,
    resolvedSize,
    isButtonDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
    fullWidth && 'w-full',
    className,
  );

  const content = isLoading ? (
    <span className="flex w-full items-center justify-center gap-2">
      <Spinner size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} />
    </span>
  ) : (
    children
  );

  // Render anchor (link) – manual handling
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

  // Render button – using useButton props
  const finalProps = mergeProps(buttonProps, {
    className: baseClasses,
    type,
    disabled: isButtonDisabled ? true : undefined,
    'aria-disabled': isButtonDisabled,
    // Merge any additional props passed directly (but avoid overriding buttonProps)
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
    /* your variants */
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
