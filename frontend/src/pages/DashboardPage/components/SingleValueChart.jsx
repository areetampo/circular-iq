import PropTypes from 'prop-types';

function SingleValueChart({ value, label, sublabel }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <p className="font-mono text-5xl leading-none font-semibold tracking-tight text-[#1a1510]">
        {value}
      </p>
      <p className="mt-1 font-mono text-xs tracking-widest text-[#9a8f82] uppercase">{label}</p>
      {sublabel && <p className="mt-0.5 font-mono text-xs text-[#9a8f82]">{sublabel}</p>}
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
