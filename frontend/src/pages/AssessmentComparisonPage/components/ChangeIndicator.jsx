import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

function ChangeIndicator({ diff }) {
  if (diff > 0) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200"
        style={{
          background: 'var(--success-soft)',
          color: 'var(--success)',
          border: '1px solid var(--success)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <TrendingUp size={11} />+{diff}
      </div>
    );
  } else if (diff < 0) {
    return (
      <div
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200"
        style={{
          background: 'var(--danger-soft)',
          color: 'var(--danger)',
          border: '1px solid var(--danger)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        <TrendingDown size={11} />
        {diff}
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-all duration-200"
      style={{
        background: 'var(--surface-raised)',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <Minus size={11} />0
    </div>
  );
}

ChangeIndicator.propTypes = {
  /** Numeric difference value (can be positive, negative, or zero) */
  diff: PropTypes.number.isRequired,
};

export { ChangeIndicator };
export default ChangeIndicator;
