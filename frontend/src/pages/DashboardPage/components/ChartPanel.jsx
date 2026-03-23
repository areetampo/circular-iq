import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

function ChartPanel({
  title,
  icon: Icon,
  iconColor = 'text-slate-400',
  loading,
  skeleton = 'h-48',
  children,
  className,
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white overflow-hidden', className)}>
      {title && (
        <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
          {Icon && <Icon size={13} className={iconColor} strokeWidth={2.5} />}
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide leading-none">
            {title}
          </span>
        </div>
      )}
      <div className="p-3">
        {loading ? <Skeleton className={cn('w-full rounded-lg', skeleton)} /> : children}
      </div>
    </div>
  );
}

ChartPanel.propTypes = {
  /** Panel title/header text */
  title: PropTypes.string,
  /** Icon component to display in header */
  icon: PropTypes.elementType,
  /** CSS class for icon color styling */
  iconColor: PropTypes.string,
  /** Whether data is currently loading */
  loading: PropTypes.bool,
  /** Tailwind skeleton class for loading state */
  skeleton: PropTypes.string,
  /** Content to render in panel body */
  children: PropTypes.node,
  /** Additional CSS classes for panel container */
  className: PropTypes.string,
};

export { ChartPanel };
export default ChartPanel;
