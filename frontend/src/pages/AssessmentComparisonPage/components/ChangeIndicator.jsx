/**
 * @module ChangeIndicator
 * @description Signed delta badge highlighting metric changes between two assessments.
 */

import { TrendingDown, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Signed delta badge highlighting metric changes between two assessments.
 *
 * @param {Object} props
 * @param {number} props.diff - Numeric difference value (can be positive, negative, or zero)
 * @returns {import('react').ReactElement}
 */
export default function ChangeIndicator({ diff }) {
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-(--color-success)">
        <TrendingUp size={10} />+{diff}
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-(--color-danger)">
        <TrendingDown size={10} />
        {diff}
      </span>
    );
  }
  return <span className="text-xs text-(--color-text-muted)">—</span>;
}

ChangeIndicator.propTypes = {
  /** Numeric difference value (can be positive, negative, or zero) */
  diff: PropTypes.number.isRequired,
};
