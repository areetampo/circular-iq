import { AlertTriangle, Home, Info, RefreshCcw, ServerOff, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { Button, CopyButton } from '@/components/common';
import { cn } from '@/utils/cn';

/**
 * Reusable error display component with beautiful, consistent styling
 * Used across error boundaries, error states, and error pages
 *
 * Variants:
 * - error: Red theme for critical errors
 * - warning: Yellow/amber theme for warnings
 * - info: Blue theme for informational messages
 * - 404: Special theme for not found pages
 */
export default function ErrorDisplay({
  variant = 'error',
  icon: CustomIcon,
  title = 'An Error Occurred',
  message = 'Something went wrong. Please try again later.',
  children,
  actions = [],
  showDefaultActions = true,
  fullScreen = false,
  errorDetails = null,
  className,
}) {
  // Variant-specific styling
  const variants = {
    error: {
      cardBg: '--color-bg-elevated',
      iconBg: '--color-error-b',
      iconColor: '--color-error',
      titleColor: '--color-error',
      messageColor: '--color-text-secondary',
      defaultIcon: XCircle,
    },
    warning: {
      cardBg: '--color-bg-elevated',
      iconBg: '--color-warning-b',
      iconColor: '--color-warning',
      titleColor: '--color-warning',
      messageColor: '--color-text-secondary',
      defaultIcon: AlertTriangle,
    },
    info: {
      cardBg: '--color-bg-elevated',
      iconBg: '--color-info-b',
      iconColor: '--color-info',
      titleColor: '--color-info',
      messageColor: '--color-text-secondary',
      defaultIcon: Info,
    },
    404: {
      cardBg: '--color-bg-elevated',
      iconBg: '--color-accent-light',
      iconColor: '--color-accent',
      titleColor: '--color-text-primary',
      messageColor: '--color-text-secondary',
      defaultIcon: ServerOff,
    },
  };

  const style = variants[variant] || variants.error;
  const Icon = CustomIcon || style.defaultIcon;

  // Default actions
  const defaultActions = showDefaultActions
    ? [
        {
          label: 'Refresh Page',
          icon: RefreshCcw,
          onPress: () => window.location.reload(),
          variant: 'ghost',
        },
        {
          label: 'Return Home',
          icon: Home,
          as: Link,
          to: '/',
          variant: 'ghost',
        },
      ]
    : [];

  const allActions = [...actions, ...defaultActions];

  const errorDetailsMsg =
    errorDetails instanceof Error
      ? errorDetails.stack || errorDetails.message
      : typeof errorDetails === 'object'
        ? JSON.stringify(errorDetails, null, 2) // Pretty-print if it's a standard object
        : String(errorDetails);

  return (
    <div
      className={cn(
        `flex items-center justify-center px-6 py-20`,
        `${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'}`,
        className,
      )}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-4xl bg-transparent p-8',
          `border-4 border-dashed border-(--color-danger)/20`,
        )}
      >
        {/* Icon + title */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            {/* iconBg/10 creates that soft transparent background dynamically */}
            <div className="rounded-full p-2.5" style={{ backgroundColor: `var(${style.iconBg})` }}>
              <Icon
                strokeWidth={2}
                size={32}
                className={cn(
                  `text-(${style.iconColor})`,
                  `${variant === 'warning' ? 'pb-1' : ''}`,
                )}
              />
            </div>
          </div>

          <h1 className={cn('font-display text-2xl font-bold', `text-(${style.titleColor})`)}>
            {title}
          </h1>

          {message && (
            <p
              className={cn(
                'mx-auto mt-2 max-w-md text-sm/relaxed',
                `text-(${style.messageColor})`,
              )}
            >
              {message}
            </p>
          )}
        </div>

        {/* Custom children */}
        {children && <div className="mb-4 text-center">{children}</div>}

        {/* Error details (dev only) */}
        {import.meta.env.DEV && errorDetails && (
          <div className="mb-4 rounded-sm border-l-4 border-l-(--color-danger) bg-(--color-danger)/10 p-3">
            <CopyButton
              value={errorDetailsMsg}
              size={16}
              strokeWidth={2.5}
              color="var(--color-danger)"
              description="Error Details (Dev env only)"
              noBorder
              className="mb-1 -ml-2 gap-2 font-medium"
            />
            <pre className="scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-[var(--color-danger)]/30 scrollbar-track-transparent /* Standard CSS arbitrary values for Chrome/Safari */ mt-2 max-h-48 overflow-auto font-mono text-xs/relaxed wrap-break-word whitespace-pre-wrap text-(--color-danger) [&::-webkit-scrollbar]:w-1! [&::-webkit-scrollbar-thumb]:rounded-full! [&::-webkit-scrollbar-thumb]:bg-(--color-danger)/20! hover:[&::-webkit-scrollbar-thumb]:bg-(--color-danger)/40!">
              {errorDetailsMsg}
            </pre>
          </div>
        )}

        {/* Actions */}
        {allActions.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {allActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={index}
                  onPress={action.onPress || action.onClick}
                  variant={action.variant || 'ghost'}
                  size={action.size || 'md'}
                  className={cn('gap-2', action.className)}
                  {...(action.to && { as: Link, to: action.to })}
                >
                  {ActionIcon && <ActionIcon size={15} />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

ErrorDisplay.propTypes = {
  /** Visual variant: 'error', 'warning', 'info', '404' */
  variant: PropTypes.oneOf(['error', 'warning', 'info', '404']),
  /** Custom icon component (Lucide icon) */
  icon: PropTypes.elementType,
  /** Main heading/title */
  title: PropTypes.string.isRequired,
  /** Descriptive message */
  message: PropTypes.string,
  /** Additional custom content */
  children: PropTypes.node,
  /** Array of action buttons: [{ label, icon, onClick, variant, size, className }] */
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      onClick: PropTypes.func.isRequired,
      variant: PropTypes.string,
      size: PropTypes.string,
      className: PropTypes.string,
    }),
  ),
  /** Show default "Refresh" and "Return Home" buttons */
  showDefaultActions: PropTypes.bool,
  /** Use full screen height */
  fullScreen: PropTypes.bool,
  /** Error details to show in dev mode */
  errorDetails: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  /** Additional CSS classes */
  className: PropTypes.string,
};
