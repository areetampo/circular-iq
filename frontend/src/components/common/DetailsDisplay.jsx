import { ScrollShadow } from '@heroui/react';
import { AlertTriangle, Ghost, Home, Info, RotateCw, ServerOff, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { Button, CopyButton } from '@/components/common';
import { cn } from '@/utils/cn';

// Variant-specific styling
const variants = {
  neutral: {
    iconBg: '',
    borderColor: '--color-border-ui',
    iconColor: '--color-text-muted',
    titleColor: '--color-text-primary',
    messageColor: '--color-text-muted',
    defaultIcon: Ghost,
  },
  error: {
    iconBg: '--color-error-soft-ui',
    borderColor: '--color-error-soft-ui',
    iconColor: '--color-error',
    titleColor: '--color-error',
    messageColor: '--color-text-secondary',
    defaultIcon: XCircle,
  },
  warning: {
    iconBg: '--color-warning-soft-ui',
    borderColor: '--color-warning-soft-ui',
    iconColor: '--color-warning',
    titleColor: '--color-warning',
    messageColor: '--color-text-secondary',
    defaultIcon: AlertTriangle,
  },
  info: {
    iconBg: '--color-info-soft-ui',
    borderColor: '--color-info-soft-ui',
    iconColor: '--color-info',
    titleColor: '--color-info',
    messageColor: '--color-text-secondary',
    defaultIcon: Info,
  },
  404: {
    iconBg: '--color-accent-soft-ui',
    borderColor: '--color-accent-soft-ui',
    iconColor: '--color-accent',
    titleColor: '--color-text-primary',
    messageColor: '--color-text-secondary',
    defaultIcon: ServerOff,
  },
};

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
export default function DetailsDisplay({
  variant = 'error',
  icon: CustomIcon,
  title = 'An Error Occurred',
  showTitle = true,
  message = 'Something went wrong. Please try again later.',
  showMessage = true,
  children,
  actions = [],
  showDefaultActions = true,
  fullScreen = false,
  errorDetails = null,
  className,
}) {
  const style = variants[variant] || variants.error;
  const Icon = CustomIcon || style.defaultIcon;

  // Default actions
  const defaultActions = showDefaultActions
    ? [
        {
          label: 'Refresh Page',
          icon: RotateCw,
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
        className={cn('w-full max-w-lg rounded-4xl bg-transparent p-8', 'border-4 border-dashed')}
        style={{
          borderColor: `var(${style.borderColor})`,
        }}
      >
        {/* Icon + title */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full p-2.5" style={{ backgroundColor: `var(${style.iconBg})` }}>
              <Icon
                strokeWidth={2}
                size={32}
                className={cn(`text-(${style.iconColor})`, variant === 'warning' ? 'pb-1' : '')}
              />
            </div>
          </div>

          {showTitle && (
            <h1 className={cn('font-sniglet text-2xl', `text-(${style.titleColor})`)}>{title}</h1>
          )}

          {showMessage && (
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
          <div className="mb-4 rounded-sm border-l-4 border-l-(--color-danger) bg-(--color-error-soft-ui) p-3">
            <CopyButton
              value={errorDetailsMsg}
              size={16}
              strokeWidth={2.5}
              color="var(--color-danger)"
              description="Error Details (Dev env only)"
              noBorder
              className="mb-1 -ml-2 gap-2 font-medium"
            />
            <ScrollShadow hideScrollBar size={30} className="scrollbar-hide max-h-45 p-2 pb-5">
              <pre className="font-mono text-xs/relaxed wrap-break-word whitespace-pre-wrap text-(--color-danger)">
                {errorDetailsMsg}
              </pre>
            </ScrollShadow>
          </div>
        )}

        {/* Actions */}
        {allActions.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {allActions.map((action, index) => {
              const ActionIcon = action.icon;

              // Determine which component to use as the base
              // Use HashLink if smooth is present, otherwise standard Link, otherwise 'button'
              const Component =
                action.smooth !== undefined ? HashLink : action.to ? Link : 'button';

              return (
                <Button
                  key={index}
                  as={Component} // Pass the component type here
                  to={action.to}
                  smooth={action.smooth} // HashLink will use this, standard Link will ignore it
                  onPress={action.onPress || action.onClick}
                  variant={action.variant || 'ghost'}
                  className={cn('gap-2', action.className)}
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

DetailsDisplay.propTypes = {
  /** Visual variant: 'neutral', 'error', 'warning', 'info', '404' */
  variant: PropTypes.oneOf(['neutral', 'error', 'warning', 'info', '404']),
  /** Custom icon component (Lucide icon) */
  icon: PropTypes.elementType,
  /** Main heading/title */
  title: PropTypes.string.isRequired,
  /** to show the title or not */
  showTitle: PropTypes.bool,
  /** Descriptive message */
  message: PropTypes.string,
  /** to show the message or not */
  showMessage: PropTypes.bool,
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
