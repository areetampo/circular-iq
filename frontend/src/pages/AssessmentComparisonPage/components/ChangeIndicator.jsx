import { TrendingDown, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

function ChangeIndicator({ diff }) {
  if (diff > 0) {
    return (
      <span className="text-xs text-(--color-success) flex items-center gap-0.5">
        <TrendingUp size={10} />+{diff}
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="text-xs text-(--color-danger) flex items-center gap-0.5">
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

export { ChangeIndicator };
export default ChangeIndicator;
