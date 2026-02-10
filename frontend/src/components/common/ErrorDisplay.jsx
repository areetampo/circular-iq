import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '@heroui/react';
import { Button } from '@/components/common';
import { AlertTriangle, XCircle, AlertCircle, Info, RefreshCcw, Home } from 'lucide-react';

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
      cardBorder: 'border-red-700',
      cardBg: 'bg-white',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
      defaultIcon: XCircle,
    },
    warning: {
      containerBg: '',
      cardBorder: 'border-amber-600',
      cardBg: 'bg-white',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      messageColor: 'text-amber-700',
      defaultIcon: AlertTriangle,
    },
    info: {
      containerBg: '',
      cardBorder: 'border-blue-500',
      cardBg: 'bg-white',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
      defaultIcon: Info,
    },
    404: {
      containerBg: '',
      cardBorder: 'border-emerald-600',
      cardBg: 'bg-linear-to-br from-white to-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      titleColor: 'text-slate-900',
      messageColor: 'text-slate-600',
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
          // className: 'text-white bg-emerald-600 hover:bg-emerald-700',
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
      <Card className={`w-full max-w-2xl border-2 ${style.cardBorder} ${style.cardBg}`}>
        {/* Header Section */}
        <div className="p-6 pb-0 text-center">
          <div className={`flex justify-center mb-4`}>
            <div className={`p-3 rounded-full ${style.iconBg}`}>
              <Icon className={`w-12 h-12 ${style.iconColor}`} strokeWidth={2} />
            </div>
          </div>
          <h1 className={`text-3xl font-bold ${style.titleColor}`}>{title}</h1>
          {message && (
            <p className={`text-base ${style.messageColor} mt-3 max-w-lg mx-auto`}>{message}</p>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 pt-3 space-y-6">
          {/* Custom children content */}
          {children && <div className="text-center">{children}</div>}

          {/* Error details (dev only) */}
          {import.meta.env.DEV && errorDetails && (
            <div className="p-4 border-l-4 border-red-600 rounded bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-semibold text-red-900">
                  Error Details (Development Only)
                </p>
              </div>
              <pre className="text-xs text-red-700 whitespace-pre-wrap break-all overflow-x-auto max-h-40">
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
                      {ActionIcon && <ActionIcon className="w-4 h-4" />}
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
