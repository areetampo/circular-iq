import PropTypes from 'prop-types';

import { Tilt3D } from '@/components/common';

/**
 * Chart panel component for wrapping charts with title and loading states
 * @param {Object} props - Component props
 * @param {string} [props.title] - Optional title for the chart panel
 * @param {ReactNode} [props.children] - Content to render in the panel body
 * @param {boolean} [props.isLoading] - Whether data is currently loading
 * @param {string} [props.error] - Error message to display
 */
export default function ChartPanel({ title, children, isLoading, error }) {
  return (
    <Tilt3D
      rotateRange={{ x: 2, y: 1.5 }}
      block
      className="w-full rounded-[14px] border-2 border-(--color-border-ui) bg-transparent p-4"
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
  /** Panel title/header text */
  title: PropTypes.string,
  /** Content to render in panel body */
  children: PropTypes.node,
  /** Whether data is currently loading */
  isLoading: PropTypes.bool,
  /** Error message to display */
  error: PropTypes.string,
};
