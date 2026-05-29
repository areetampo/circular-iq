/**
 * Compact single-metric fallback for chart panels with only one usable segment.
 */

import PropTypes from 'prop-types';

/**
 * Renders one large value with label and optional explanatory sublabel.
 */
export default function SingleValueChart({ value, label, sublabel }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <p className="font-mono text-5xl leading-none font-semibold tracking-tight text-(--color-text-primary)">
        {value}
      </p>
      <p className="mt-1 font-mono text-xs tracking-widest text-stone-500 uppercase">{label}</p>
      {sublabel && <p className="mt-0.5 font-mono text-xs text-stone-500">{sublabel}</p>}
    </div>
  );
}

SingleValueChart.propTypes = {
  /** Primary value displayed in large type */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Label displayed below the primary value */
  label: PropTypes.string.isRequired,
  /** Optional secondary label displayed below the main label */
  sublabel: PropTypes.string,
};
