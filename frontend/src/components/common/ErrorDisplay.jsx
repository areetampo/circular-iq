import { Card } from '@heroui/react';
import { AlertCircle, AlertTriangle, Home, Info, RefreshCcw, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from '@/components/common';

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
  className = '',
}) {
  // Variant-specific styling
  const variants = {
    error: {
      containerBg: '',
      cardBorderColor: 'var(--danger)',
      cardBg: 'var(--surface)',
      iconBg: 'var(--danger-soft)',
      iconColor: 'var(--danger)',
      titleColor: 'var(--danger)',
      messageColor: 'var(--danger)',
      defaultIcon: XCircle,
    },
    warning: {
      containerBg: '',
      cardBorderColor: 'var(--warning)',
      cardBg: 'var(--surface)',
      iconBg: 'var(--warning-soft)',
      iconColor: 'var(--warning)',
      titleColor: 'var(--warning)',
      messageColor: 'var(--warning)',
      defaultIcon: AlertTriangle,
    },
    info: {
      containerBg: '',
      cardBorderColor: 'var(--info)',
      cardBg: 'var(--surface)',
      iconBg: 'var(--info-soft)',
      iconColor: 'var(--info)',
      titleColor: 'var(--info)',
      messageColor: 'var(--info)',
      defaultIcon: Info,
    },
    404: {
      containerBg: '',
      cardBorderColor: 'var(--border)',
      cardBg: 'var(--surface)',
      iconBg: 'var(--accent-soft)',
      iconColor: 'var(--accent)',
      titleColor: 'var(--foreground)',
      messageColor: 'var(--muted)',
      defaultIcon: AlertCircle,
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
          onClick: () => window.location.reload(),
          variant: 'tertiary',
        },
        {
          label: 'Return Home',
          icon: Home,
          onClick: () => (window.location.href = '/'),
          variant: 'tertiary',
        },
      ]
    : [];

  const allActions = [...actions, ...defaultActions];

  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? 'min-h-screen' : 'min-h-100'
      } px-6 py-12 bg-linear-to-br ${style.containerBg} ${className}`}
    >
      <Card
        className={`w-full max-w-2xl border-2 ${style.containerBg}`}
        style={{
          borderColor: style.cardBorderColor,
          backgroundColor: style.cardBg,
        }}
      >
        {/* Header Section */}
        <div className="p-6 pb-0 text-center">
          <div className={`flex justify-center mb-4`}>
            <div className="p-3 rounded-full" style={{ backgroundColor: style.iconBg }}>
              <Icon strokeWidth={2} size={48} style={{ color: style.iconColor }} />
            </div>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: style.titleColor }}>
            {title}
          </h1>
          {message && (
            <p className="text-base mt-3 max-w-lg mx-auto" style={{ color: style.messageColor }}>
              {message}
            </p>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 pt-3 space-y-6">
          {/* Custom children content */}
          {children && <div className="text-center">{children}</div>}

          {/* Error details (dev only) */}
          {import.meta.env.DEV && errorDetails && (
            <div
              className="p-4 border-l-4 rounded"
              style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                  Error Details (Development Only)
                </p>
              </div>
              <pre
                className="text-xs whitespace-pre-wrap break-all overflow-x-auto max-h-40"
                style={{ color: 'var(--danger)' }}
              >
                {typeof errorDetails === 'string' ? errorDetails : errorDetails.toString()}
              </pre>
            </div>
          )}

          {/* Actions */}
          {allActions.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-3">
                {allActions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={index}
                      onPress={action.onClick}
                      variant={action.variant || 'tertiary'}
                      size={action.size || 'md'}
                      className={`gap-2 ${action.className || ''}`}
                    >
                      {ActionIcon && <ActionIcon size={16} />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>
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
