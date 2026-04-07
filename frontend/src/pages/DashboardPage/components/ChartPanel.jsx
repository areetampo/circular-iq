import PropTypes from 'prop-types';

function ChartPanel({ title, children, isLoading, error, chartHeight }) {
  return (
    <div className="w-full rounded-[14px] border-2 border-[rgba(180,160,130,0.3)] bg-transparent p-4">
      {title && (
        <div className="mb-4 text-[0.9375rem] font-semibold text-(--color-text-secondary)">
          {title}
        </div>
      )}

      {isLoading ? (
        <div className="h-50 w-full animate-pulse rounded-md bg-[rgba(180,160,130,0.1)]" />
      ) : error ? (
        <div className="p-4 text-center">
          <p className="text-(--color-error)">Error loading chart</p>
        </div>
      ) : (
        <div style={{ overflow: 'visible' }}>{children}</div>
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
