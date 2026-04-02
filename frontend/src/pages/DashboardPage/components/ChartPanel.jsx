import PropTypes from 'prop-types';

function ChartPanel({ title, children, isLoading, error, chartHeight }) {
  return (
    <div className="border border-[rgba(180,160,130,0.25)] rounded-[12px] p-6 bg-transparent min-h-[300px] w-full">
      {title && (
        <p className="text-[13px] font-semibold text-(--color-text-secondary) mb-4">{title}</p>
      )}

      {isLoading ? (
        <div className="w-full h-[200px] rounded-md bg-[rgba(180,160,130,0.1)] animate-pulse" />
      ) : error ? (
        <div className="text-center p-4">
          <p className="text-(--color-error)">Error loading chart</p>
        </div>
      ) : (
        <div className="min-h-[260px]">{children}</div>
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
