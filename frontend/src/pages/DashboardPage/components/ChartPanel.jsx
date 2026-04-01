import PropTypes from 'prop-types';

function ChartPanel({ title, children, isLoading, error, chartHeight }) {
  return (
    <div className="w-full py-4">
      {title && (
        <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-4">{title}</p>
      )}

      {isLoading ? (
        <div className="skeleton rounded-lg" style={{ height: chartHeight || '200px' }} />
      ) : error ? (
        <div className="text-center p-4">
          <p className="text-(--color-error)">Error loading chart</p>
        </div>
      ) : (
        children
      )}
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
