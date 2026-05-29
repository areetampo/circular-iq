/**
 * Reusable chart panel with title, loading state, and empty fallback for the activity dashboard.
 */

import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';
import { cn } from '@/utils/cn';

/**
 * Wraps chart content with the dashboard panel frame, optional title, loading state, and error state.
 */
export default function ChartPanel({ title, children, isLoading, error, className }) {
  return (
    <Tilt3D
      rotateRange={{ x: 2, y: 1.5 }}
      block
      className={cn(
        'w-full rounded-[14px] border-2 border-(--color-border-ui) bg-transparent p-4',
        className,
      )}
    >
      {title && (
        <div className="mb-4 text-[0.9375rem] font-semibold text-(--color-text-secondary)">
          {title}
        </div>
      )}

      {isLoading ? (
        <div className="h-50 w-full animate-pulse rounded-md bg-(--color-skeleton-pulse-sm)" />
      ) : error ? (
        <div className="p-4 text-center">
          <p className="text-(--color-error)">Error loading chart</p>
        </div>
      ) : (
        <div className="overflow-visible">{children}</div>
      )}
    </Tilt3D>
  );
}

ChartPanel.propTypes = {
  /** Optional panel title displayed above chart content */
  title: PropTypes.string,
  /** Chart, placeholder, or table content rendered when not loading or errored */
  children: PropTypes.node,
  /** Whether to show the loading placeholder instead of children */
  isLoading: PropTypes.bool,
  /** Truthy error value that switches the panel to its generic chart error message */
  error: PropTypes.string,
  /** Extra classes merged onto the panel wrapper */
  className: PropTypes.string,
};
