/**
 * @module SingleValueChart
 * @description Compact single-metric chart tile (e.g. average score) for the activity dashboard.
 */

import PropTypes from 'prop-types';

/**
 * Single value chart component for displaying a single metric
 * @param {Object} props - Component props
 * @param {string|number} [props.value] - Main numeric or text value to display (0-100)
 * @param {string} [props.label] - Label text displayed below the chart
 * @param {string} [props.sublabel] - Optional sublabel text displayed below label
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
  /** Numeric value to display (0-100) */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Label text displayed below the chart */
  label: PropTypes.string.isRequired,
  /** Optional sublabel text displayed below label */
  sublabel: PropTypes.string,
};
