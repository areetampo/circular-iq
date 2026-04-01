import PropTypes from 'prop-types';

function SingleValueChart({ value, label, sublabel }) {
  return (
    <div className="py-6">
      <p className="font-(--font-display) text-5xl text-(--color-text-primary)">{value}</p>
      <p className="text-xs text-(--color-text-muted) uppercase tracking-widest mt-1">{label}</p>
      {sublabel && <p className="text-xs text-(--color-text-muted) mt-0.5">{sublabel}</p>}
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
