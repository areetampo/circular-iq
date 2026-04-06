import PropTypes from 'prop-types';

function ChartPanel({ title, children, isLoading, error, chartHeight }) {
  return (
    <div className="border-2 border-[rgba(180,160,130,0.3)] rounded-[14px] p-4 bg-transparent w-full">
      {title && (
        <div className="text-[0.9375rem] font-semibold text-(--color-text-secondary) mb-4">{title}</div>
      )}

      {isLoading ? (
        <div className="w-full h-50 rounded-md bg-[rgba(180,160,130,0.1)] animate-pulse" />
      ) : error ? (
        <div className="text-center p-4">
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
