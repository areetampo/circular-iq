import PropTypes from 'prop-types';

function SingleValueChart({ value, label, sublabel }) {
  return (
    <div className="py-8 flex flex-col items-center gap-2">
      <p
        className="text-5xl font-semibold tracking-tight"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          color: '#1a1510',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        className="text-xs uppercase tracking-widest mt-1"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          color: '#9a8f82',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </p>
      {sublabel && (
        <p
          className="text-xs mt-0.5"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            color: '#9a8f82',
          }}
        >
          {sublabel}
        </p>
      )}
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
