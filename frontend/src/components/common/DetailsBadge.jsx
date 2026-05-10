import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

const VARIANT_STYLES = {
  neutral: 'text-(--color-accent) bg-(--color-accent-soft-ui)',
  info: 'text-(--color-info) bg-(--color-info-soft-ui)',
  success: 'text-(--color-success) bg-(--color-success-soft-ui)',
  warning: 'text-(--color-warning) bg-(--color-warning-soft-ui)',
  error: 'text-(--color-error) bg-(--color-error-soft-ui)',
};

const ICONS = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

/**
 * DetailsBadge component for displaying status messages with icons and color-coded styling.
 *
 * Features:
 * - Auto-dismisses when message is empty or whitespace-only
 * - Animated entrance with zoom and fade effects
 * - Multiple visual variants with appropriate icons
 * - Custom icon support
 * - Full-width layout option
 *
 * @example
 * Basic usage :
 * <DetailsBadge message="Operation completed successfully" variant="success" />
 *
 * @example
 * With custom icon and full width :
 * <DetailsBadge
 *   message="Custom notification"
 *   variant="info"
 *   icon={CustomIcon}
 *   fullWidth
 * />
 *
 * @example
 * Error state :
 * <DetailsBadge
 *   message="Failed to load data"
 *   variant="error"
 *   className="mt-4"
 * />
 *
 * @param {Object} props - Component props
 * @param {'neutral'|'info'|'success'|'warning'|'error'} [props.variant='info'] - Visual style variant that determines color scheme and default icon
 * @param {string} props.message - Message text to display. Component renders null if empty or whitespace-only
 * @param {string} [props.className] - Additional CSS classes to apply to the inner badge container
 * @param {React.ComponentType} [props.icon] - Custom icon component to override the default variant icon. Should accept size, strokeWidth, and color props
 * @param {boolean} [props.fullWidth=false] - Whether the badge should take full width of its container
 *
 * @returns {React.ReactElement|null} Rendered badge component or null if message is empty
 */
export default function DetailsBadge({
  variant = 'info',
  message,
  className,
  icon: CustomIcon,
  fullWidth = false,
}) {
  if (!message.trim()) return null;

  const colors = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = CustomIcon || ICONS[variant] || ICONS.info;

  return (
    <div className={cn('flex h-full w-full items-center justify-center', className)}>
      <div
        className={cn(
          'flex w-fit animate-in items-center justify-center gap-2 rounded-xl',
          'px-3 py-2 text-sm font-medium',
          'duration-200 zoom-in-95 fade-in',
          colors,
          fullWidth ? 'w-full' : 'w-fit',
        )}
      >
        {/* passing components/common/spinner works - it will accept size and color correctly but not strokeWidth */}
        <Icon size={16} strokeWidth={2.5} color="currentColor" />
        <span>{message}</span>
      </div>
    </div>
  );
}

DetailsBadge.propTypes = {
  variant: PropTypes.oneOf(['neutral', 'info', 'success', 'warning', 'error']),
  message: PropTypes.string,
  className: PropTypes.string,
  icon: PropTypes.elementType,
  fullWidth: PropTypes.bool,
};
