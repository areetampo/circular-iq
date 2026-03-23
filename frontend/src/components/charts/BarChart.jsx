import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import PropTypes from 'prop-types';

/**
 * BarChart Component
 * Renders a bar chart using MUI X-Charts library
 * Supports multiple data series with customizable axes and legend
 */
export default function BarChart({
  data = [],
  barConfigs = [],
  height = 300,
  xAxisKey = 'name',
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
}) {
  if (!data.length || !barConfigs.length) {
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

  const series = barConfigs.map((cfg) => ({
    dataKey: cfg.dataKey,
    label: cfg.name || cfg.dataKey,
    color: cfg.fill || cfg.color,
  }));

  return (
    <MuiBarChart
      dataset={data}
      xAxis={[{ scaleType: 'band', dataKey: xAxisKey, label: xAxisLabel }]}
      yAxis={[{ label: yAxisLabel }]}
      series={series}
      height={height}
      slotProps={{ legend: { hidden: !showLegend } }}
    />
  );
}

BarChart.propTypes = {
  /** Array of data objects for the chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Array of bar configuration objects with dataKey, name, fill/color properties */
  barConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      name: PropTypes.string,
      fill: PropTypes.string,
      color: PropTypes.string,
    }),
  ),
  /** Chart height in pixels */
  height: PropTypes.number,
  /** Key in data objects for X-axis labels */
  xAxisKey: PropTypes.string,
  /** Label for X-axis */
  xAxisLabel: PropTypes.string,
  /** Label for Y-axis */
  yAxisLabel: PropTypes.string,
  /** Show/hide legend */
  showLegend: PropTypes.bool,
};
