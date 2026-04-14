import PropTypes from 'prop-types';

function SingleValueChart({ value, label, sublabel }) {
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
};

export { SingleValueChart };
export default SingleValueChart;
