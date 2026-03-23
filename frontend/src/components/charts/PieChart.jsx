import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';
import PropTypes from 'prop-types';

/**
 * PieChart Component
 * Renders a pie chart using MUI X-Charts library
 * Extracts values and labels from data objects
 */
export default function PieChart({
  data = [],
  dataKey = 'value',
  nameKey = 'value',
  height = 300,
  showLegend = true,
}) {
  if (!data.length) {
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

  const seriesData = data.map((item, i) => ({
    id: i,
    value: typeof item[dataKey] === 'number' ? item[dataKey] : 0,
    label: item[nameKey] || `Item ${i + 1}`,
  }));

  return (
    <MuiPieChart
      series={[{ data: seriesData }]}
      height={height}
      slots={{ legend: { hidden: !showLegend } }}
    />
  );
}

PieChart.propTypes = {
  /** Array of data objects for the chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Key in data objects containing numeric values */
  dataKey: PropTypes.string,
  /** Key in data objects containing label/name values */
  nameKey: PropTypes.string,
  /** Chart height in pixels */
  height: PropTypes.number,
  /** Show/hide legend */
  showLegend: PropTypes.bool,
};
