/**
 * @module Button
 * @description Accessible button/link primitive with variants, icons, and loading state (React Aria).
 */
import PropTypes from 'prop-types';
import { forwardRef, useRef } from 'react';
import { mergeProps, useButton } from 'react-aria';

import { cn } from '@/utils/cn';

import Spinner from './Spinner';

const variantStyles = {
  primary:
    'bg-(--color-accent) text-white hover:bg-(--color-accent-hover) border border-transparent',
  ghost:
    'bg-(--color-accent-soft-10) text-(--color-text-secondary) border border-transparent hover:text-(--color-text-primary) hover:bg-(--color-hover-accent-strong)',
  ghastly:
    'bg-transparent text-(--color-text-muted) border border-transparent hover:bg-(--color-hover-subtle) hover:text-(--color-text-primary)',
  bordered:
    'bg-transparent text-(--color-text-secondary) border-[1.5px] border-(--color-border-ui) hover:bg-(--color-accent-light) text-xs tracking-wide uppercase',
  danger:
    'bg-(--color-error) text-white border border-(--color-error-border-strong) hover:opacity-90 transition-opacity',
  teal: 'bg-(--color-success) text-white hover:bg-(--color-success-hover) border border-transparent',
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

const iconSizeMap = {
  xs: 11,
  sm: 13,
  md: 16, // default
  lg: 18,
};

const iconStrokeWidthMap = {
  xs: 2,
  sm: 2,
  md: 2, // default
  lg: 2,
};

const spinnerColorMap = {
  primary: '#ffffff',
  ghost: '#8b6f47',
  ghastly: '#8b6f47',
  bordered: '#8b6f47',
  danger: '#ffffff',
  teal: '#ffffff',
  'info-soft': '#8b6f47',
  'success-soft': '#8b6f47',
  'warning-soft': '#8b6f47',
  'danger-soft': '#8b6f47',
};

const spinnerSizeMap = {
  xs: 12,
  sm: 14,
  md: 15, // default
  lg: 20,
};

/**
 * Button component with consistent styling and accessibility features
 * Supports icons, loading states, and various visual variants
 * Built with React Aria for proper keyboard and screen reader support
 *
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {'primary'|'ghost'|'ghastly'|'bordered'|'danger'|'teal'|'info-soft'|'success-soft'|'warning-soft'|'danger-soft'} props.variant - Visual style variant (default: 'primary')
 * @param {'xs'|'sm'|'md'|'lg'} props.size - Button size (default: 'md')
 * @param {Function} props.onPress - Click handler function
 * @param {boolean} props.isDisabled - Whether button is disabled (default: false)
 * @param {boolean} props.isLoading - Whether to show loading state (default: false)
 * @param {React.ElementType} props.icon - Icon component to display (Lucide icon)
 * @param {Object} props.iconProps - Additional props to pass to icon component
 * @param {number} props.iconSize - Custom icon size in pixels (overrides size-based sizing)
 * @param {number} props.iconStrokeWidth - Custom icon stroke width (overrides size-based sizing)
 * @param {boolean} props.iconRight - Whether to position icon on the right (default: false)
 * @param {React.ElementType} props.loadingIcon - Custom loading icon component
 * @param {boolean} props.spinLoadingIcon - Whether to spin the loading icon (default: false)
 * @param {boolean} props.loadingIconInline - Whether to show loading icon inline (default: false)
 * @param {boolean} props.fullWidth - Whether button should take full width (default: false)
 * @param {React.ReactNode} props.children - Button content
 * @param {React.ElementType} props.as - Component to render as (default: 'button')
 * @param {string} props.to - Navigation target for links
 * @param {string} props.href - URL for link elements
 * @param {string} props.type - HTML button type (default: 'button')
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered Button component
 *
 * @example
 * Basic button
 * <Button onPress={handleClick}>Click me</Button>
 *
 * @example
 * Button with icon and loading state
 * <Button
 *   icon={Save}
 *   isLoading={loading}
 *   onPress={handleSave}
 *   variant="primary"
 * >
 *   Save
 * </Button>
 *
 * @example
 * Link button
 * <Button as={Link} to="/home" variant="ghost">
 *   Go Home
 * </Button>
 */
const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    onPress,
    isDisabled = false,
    isLoading = false,
    icon,
    iconProps,
    iconSize,
    iconStrokeWidth,
    iconRight = false,
    loadingIcon,
    spinLoadingIcon = false,
    loadingIconInline = false,
    fullWidth = false,
    children,
    as: Component = 'button',
    to,
    href,
    type = 'button',
    ...props
  },
  ref,
) {
  const resolvedSize = sizeStyles[size] ?? sizeStyles.md;
  const isButtonDisabled = isDisabled || isLoading;

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
      ...props,
      onPress,
      isDisabled: isButtonDisabled,
      elementType: Element,
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
    const pressHandler = onPress;
    if (pressHandler) pressHandler(event);
  };

  const baseClasses = cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-sans transition-colors duration-200 outline-none size-fit',
    variantStyles[variant] || variantStyles.primary,
    resolvedSize,
    isButtonDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
    fullWidth && 'w-full',
    className,
  );

  const spinnerColor = spinnerColorMap[variant] || spinnerColorMap.ghost;
  const spinnerSize = spinnerSizeMap[size] || spinnerSizeMap.md;
  iconSize = iconSize || iconSizeMap[size] || iconSizeMap.md;
  iconStrokeWidth = iconStrokeWidth || iconStrokeWidthMap[size] || iconStrokeWidthMap.md;

  // Render lucide-icon with appropriate size
  const renderIcon = () => {
    if (!icon) return null;
    const IconComponent = icon;
    return <IconComponent size={iconSize} strokeWidth={iconStrokeWidth} {...iconProps} />;
  };

  // Render loading icon or spinner
  const renderLoadingIcon = () => {
    if (loadingIcon) {
      const LoadingIconComponent = loadingIcon;
      return (
        <LoadingIconComponent
          size={iconSize}
          strokeWidth={iconStrokeWidth}
          className={cn(spinLoadingIcon && 'animate-spin')}
        />
      );
    }
    return <Spinner color={spinnerColor} size={spinnerSize} />;
  };

  // Content rendering: original content always keeps its layout (icon + text side by side)
  // The wrapper span always has the same classes – only its visibility changes.
  // Loading icon is absolutely positioned over the same area, does not affect button size.
  const content = (
    <span className="relative inline-flex items-center justify-center">
      {/* Original children – always in layout, never changes display style */}
      <span
        className={cn(
          'inline-flex items-center justify-center gap-1.5',
          isLoading && !loadingIconInline ? 'invisible' : 'visible',
        )}
      >
        {!iconRight && !isLoading && renderIcon()}
        {!iconRight && isLoading && loadingIconInline && renderLoadingIcon()}
        {children}
        {iconRight && isLoading && loadingIconInline && renderLoadingIcon()}
        {iconRight && !isLoading && renderIcon()}
      </span>

      {/* Loading icon or spinner – absolute, centered, only shown when loading and not inline */}
      {isLoading && !loadingIconInline && (
        <span className="absolute inset-0 flex items-center justify-center">
          {renderLoadingIcon()}
        </span>
      )}
    </span>
  );

  if (isLink) {
    return (
      <Element
        {...props}
        ref={buttonRef}
        className={baseClasses}
        onClick={handleLinkClick}
        to={to}
        href={href || to}
        aria-disabled={isButtonDisabled}
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
  /** Visual style variant (default: 'primary') */
  variant: PropTypes.oneOf([
    'primary',
    'ghost',
    'ghastly',
    'bordered',
    'danger',
    'teal',
    'info-soft',
    'success-soft',
    'warning-soft',
    'danger-soft',
  ]),
  /** Button size (default: 'md') */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  /** Whether button should take full width (default: false) */
  fullWidth: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Button content */
  children: PropTypes.node,
  /** Whether button is disabled (default: false) */
  isDisabled: PropTypes.bool,
  /** Whether to show loading state (default: false) */
  isLoading: PropTypes.bool,
  /** Icon component to display (Lucide icon) */
  icon: PropTypes.elementType,
  /** Additional props to pass to icon component */
  iconProps: PropTypes.object,
  /** Custom icon size in pixels (overrides size-based sizing) */
  iconSize: PropTypes.number,
  /** Custom icon stroke width (overrides size-based sizing) */
  iconStrokeWidth: PropTypes.number,
  /** Whether to position icon on the right (default: false) */
  iconRight: PropTypes.bool,
  /** Custom loading icon component */
  loadingIcon: PropTypes.elementType,
  /** Whether to spin the loading icon (default: false) */
  spinLoadingIcon: PropTypes.bool,
  /** Whether to show loading icon inline (default: false) */
  loadingIconInline: PropTypes.bool,
  /** Click handler function */
  onPress: PropTypes.func,
  /** Component to render as (default: 'button') */
  as: PropTypes.elementType,
  /** Navigation target for links */
  to: PropTypes.string,
  /** URL for link elements */
  href: PropTypes.string,
  /** HTML button type (default: 'button') */
  type: PropTypes.string,
};

export default Button;
