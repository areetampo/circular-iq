import PropTypes from 'prop-types';

function ChartPanel({ title, children, isLoading, error, chartHeight }) {
  return (
    <div
      className="border rounded-xl overflow-hidden card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>
          {title}
        </p>
      </div>

      {/* Body */}
      <div className="p-4">
        {isLoading ? (
          <div className="skeleton rounded-lg" style={{ height: chartHeight || '200px' }} />
        ) : error ? (
          <div className="text-center p-4">
            <p style={{ color: 'var(--danger)' }}>Error loading chart</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

ChartPanel.propTypes = {
  /** Panel title/header text */
  title: PropTypes.string,
  /** Content to render in panel body */
  children: PropTypes.node,
  /** Whether data is currently loading */
  isLoading: PropTypes.bool,
  /** Error message to display */
  error: PropTypes.string,
  /** Height for skeleton placeholder */
  chartHeight: PropTypes.string,
};

export { ChartPanel };
export default ChartPanel;
