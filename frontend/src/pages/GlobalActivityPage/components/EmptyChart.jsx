/**
 * @module EmptyChart
 * @description Placeholder UI when a dashboard chart has no usable data.
 */

import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Empty chart component for displaying when no data is available
 * @param {Object} props - Component props
 * @param {string} [props.message] - Custom message to display instead of default
 */
export default function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BarChart3 className="mb-3 size-8 text-emerald-800/60" />
      <p className="font-mono text-sm text-(--color-text-muted)">
        {message || 'No data available yet'}
      </p>
    </div>
  );
}

EmptyChart.propTypes = {
  /** Custom message to display */
  message: PropTypes.string,
};
