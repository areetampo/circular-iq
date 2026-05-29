/** Centered empty, error, or info panel with icon, copy support, and configurable actions. */

import { ScrollShadow } from '@heroui/react';
import { AlertTriangle, Ghost, Home, Info, RotateCw, ServerOff, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { cn } from '@/utils/cn';

import Button from './Button';
import CopyButton from './CopyButton';

// Variant styles drive icon choice and CSS variable tokens for each status panel.
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
 * Renders a centered status panel used by error boundaries, empty states, and inline messages.
 * Default actions use React Router Link; callers above ErrorBoundary should disable them.
 */
export default function DetailsDisplay({
  variant = 'error',
  icon: CustomIcon,
  title = 'An Error Occurred',
  showTitle = true,
  description = 'Something went wrong. Please try again later.',
  showDescription = true,
  children,
  actions = [],
  showDefaultActions = true,
  fullScreen = false,
  errorDetails = null,
  className,
  ...props
}) {
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const style = variants[variant] || variants.error;
  const Icon = CustomIcon || style.defaultIcon;

  // Default actions assume the component is rendered inside a Router.
  const defaultActions = showDefaultActions
    ? [
        {
          variant: 'ghost',
          label: 'Refresh Page',
          icon: RotateCw,
          onPress: handleRefresh,
        },
        {
          variant: 'ghost',
          label: 'Return Home',
          icon: Home,
          as: Link,
          to: '/',
        },
      ]
    : [];

  const allActions = [...defaultActions, ...actions];

  const errorDetailsMsg =
    errorDetails instanceof Error
      ? errorDetails.stack || errorDetails.message
      : typeof errorDetails === 'object'
        ? JSON.stringify(errorDetails, null, 2) // Keep nested dev errors readable in the panel.
        : String(errorDetails);

  return (
    <div
      {...props}
      className={cn(
        'flex items-center justify-center px-6 pt-10',
        fullScreen ? 'min-h-screen' : 'min-h-[40vh]',
        className,
      )}
    >
      <div
        className={cn('w-full max-w-lg rounded-4xl bg-transparent p-8', 'border-4 border-dashed')}
        style={{
          borderColor: `var(${style.borderColor})`,
        }}
      >
        {/* Icon and title share the variant token set so status colors stay consistent. */}
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

          {showDescription && (
            <p
              className={cn(
                'mx-auto mt-2 max-w-md text-sm/relaxed',
                `text-(${style.messageColor})`,
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* Custom children appear between the message and actions for contextual details. */}
        {children && <div className="mb-4 text-center">{children}</div>}

        {/* Error details stay development-only to avoid exposing internals in production. */}
        {import.meta.env.DEV && errorDetails && (
          <div className="mb-4 rounded-sm border-l-4 border-l-(--color-danger) bg-(--color-error-soft-ui) p-3">
            <CopyButton
              variant="danger-text"
              copyValue={errorDetailsMsg}
              title="Error Details (Dev env only)"
              titleCn="font-sniglet tracking-wide"
              noBorder
            />
            <ScrollShadow hideScrollBar size={30} className="scrollbar-hide max-h-47 p-2">
              <pre className="font-mono text-[0.65rem]/relaxed wrap-break-word whitespace-pre-wrap text-(--color-danger)">
                {errorDetailsMsg}
              </pre>
            </ScrollShadow>
          </div>
        )}

        {/* Actions support buttons, router links, and hash links from one configuration object. */}
        {allActions.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {allActions.map((action, index) => {
              const ActionIcon = action.icon;

              // Smooth hash links need HashLink; route navigation uses Link; everything else is a button.
              const Component =
                action.smooth !== undefined ? HashLink : action.to ? Link : 'button';

              return (
                <Button
                  key={index}
                  {...(ActionIcon && { icon: ActionIcon })}
                  {...(ActionIcon && { iconSize: 15 })}
                  {...(ActionIcon && action.iconRight && { iconRight: 15 })}
                  as={Component}
                  to={action.to}
                  state={action.state}
                  smooth={action.smooth}
                  onPress={action.onPress}
                  variant={action.variant || 'ghost'}
                  className={cn('gap-2', action.className)}
                >
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
  /** Visual variant: 'neutral', 'error', 'warning', 'info', '404' (default: 'error') */
  variant: PropTypes.oneOf(['neutral', 'error', 'warning', 'info', '404']),
  /** Custom icon component (Lucide icon) */
  icon: PropTypes.elementType,
  /** Main heading/title (default: 'An Error Occurred') */
  title: PropTypes.string,
  /** Whether to display title (default: true) */
  showTitle: PropTypes.bool,
  /** Descriptive message (default: 'Something went wrong. Please try again later.') */
  description: PropTypes.string,
  /** Whether to display description (default: true) */
  showDescription: PropTypes.bool,
  /** Additional custom content */
  children: PropTypes.node,
  /** Array of action buttons: [{ label, icon, onPress, variant, size, className, state, as, to, smooth, iconRight }] */
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      onPress: PropTypes.func.isRequired,
      variant: PropTypes.string,
      size: PropTypes.string,
      className: PropTypes.string,
      state: PropTypes.object, // For Link navigation state
      as: PropTypes.elementType, // Component type (Link, HashLink, button)
      to: PropTypes.string, // Navigation target
      smooth: PropTypes.bool, // For HashLink smooth scrolling
      iconRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]), // Icon positioning
    }),
  ),
  /** Whether to show default "Refresh" and "Return Home" buttons (default: true) */
  showDefaultActions: PropTypes.bool,
  /** Whether to use full screen height (default: false) */
  fullScreen: PropTypes.bool,
  /** Error details to show in dev mode (string, object, or Error instance) */
  errorDetails: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.instanceOf(Error),
  ]),
  /** Additional CSS classes */
  className: PropTypes.string,
};
