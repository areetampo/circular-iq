import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

const VARIANT_STYLES = {
  info: 'text-(--color-info) bg-(--color-info-soft-ui)',
  success: 'text-(--color-success) bg-(--color-success-soft-ui)',
  warning: 'text-(--color-warning) bg-(--color-warning-soft-ui)',
  error: 'text-(--color-error) bg-(--color-error-soft-ui)',
};

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleX,
};

export default function DetailsBadge({ variant = 'info', message, className }) {
  if (!message.trim()) return null;

  const colors = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = ICONS[variant] || ICONS.info;

  return (
    <div
      className={cn(
        'flex w-fit animate-in items-center justify-center gap-2 rounded-xl',
        'px-3 py-2 text-sm font-medium',
        'duration-200 zoom-in-95 fade-in',
        colors,
        className,
      )}
    >
      <Icon size={16} strokeWidth={2.5} />
      <span>{message}</span>
    </div>
  );
}

DetailsBadge.propTypes = {
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  message: PropTypes.string,
  className: PropTypes.string,
};
