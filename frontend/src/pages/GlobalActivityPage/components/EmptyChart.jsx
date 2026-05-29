/**
 * Placeholder UI when a dashboard chart has no usable data.
 */

import { BarChart3 } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Renders the no-data placeholder used inside dashboard chart panels.
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
  /** Optional replacement for the default no-data message */
  message: PropTypes.string,
};
