import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import PropTypes from 'prop-types';

/**
 * LineChart Component
 * Renders a line chart using MUI X-Charts library
 * Supports multiple data series with customizable axes and legend
 */
export default function LineChart({
  data = [],
  lines = [],
  height = 300,
  xAxisKey = 'label',
  showLegend = true,
  ariaLabel,
}) {
  if (!data.length || !lines.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        No data available
      </div>
    );
  }

  const series = lines.map((line) => ({
    dataKey: line.dataKey || line.id,
    label: line.name || line.dataKey || line.id,
    color: line.stroke || line.color,
    showMark: false,
  }));

  return (
    <div role="img" aria-label={ariaLabel}>
      <MuiLineChart
        dataset={data}
        xAxis={[{ scaleType: 'point', dataKey: xAxisKey }]}
        series={series}
        height={height}
        slots={{ legend: { hidden: !showLegend } }}
      />
    </div>
  );
}

LineChart.propTypes = {
  /** Array of data objects for the chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Array of line configuration objects with dataKey, name, stroke/color properties */
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string,
      id: PropTypes.string,
      name: PropTypes.string,
      stroke: PropTypes.string,
      color: PropTypes.string,
    }),
  ),
  /** Chart height in pixels */
  height: PropTypes.number,
  /** Key in data objects for X-axis labels */
  xAxisKey: PropTypes.string,
  /** Show/hide legend */
  showLegend: PropTypes.bool,
  /** Accessibility label for the chart */
  ariaLabel: PropTypes.string,
};
