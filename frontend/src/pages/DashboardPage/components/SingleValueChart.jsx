import PropTypes from 'prop-types';

function SingleValueChart({ name, value, color = '#10b981' }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 gap-2">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white"
        style={{ backgroundColor: color }}
      >
        {value}
      </div>
      <p className="text-xs font-semibold text-slate-600 text-center">{name}</p>
      <p className="text-[10px] text-slate-400">100% of assessments</p>
    </div>
  );
}

SingleValueChart.propTypes = {
  /** Display name/label shown below the value */
  name: PropTypes.string.isRequired,
  /** Numeric value to display in the circle */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Hex color code for the circular background */
  color: PropTypes.string,
};

export { SingleValueChart };
export default SingleValueChart;
