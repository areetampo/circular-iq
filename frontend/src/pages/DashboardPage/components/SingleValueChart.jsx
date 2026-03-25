import PropTypes from 'prop-types';

function SingleValueChart({ value, label }) {
  return (
    <div className="flex flex-col items-center p-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="6" />
        {/* Value arc */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 50}`}
          strokeDashoffset={`${2 * Math.PI * 50 * (1 - value / 100)}`}
          transform="rotate(-90 60 60)"
          className="transition-all duration-700"
        />
        {/* Center text */}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="22"
          fontWeight="500"
          fill="var(--foreground)"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {value ?? '—'}
        </text>
      </svg>
      <p className="label-overline mt-2">{label}</p>
    </div>
  );
}

SingleValueChart.propTypes = {
  /** Numeric value to display (0-100) */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Label text displayed below the chart */
  label: PropTypes.string.isRequired,
};

export { SingleValueChart };
export default SingleValueChart;
