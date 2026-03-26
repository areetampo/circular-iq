import { Card, Skeleton } from '@heroui/react';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

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
  isLoading = false,
  className,
  colors,
  showTooltip = true,
  showGrid = true,
}) {
  const chartContent = useMemo(() => {
    if (!data.length || !lines.length) {
      return (
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-foreground)',
            fontSize: '0.875rem',
          }}
        >
          No data available
        </div>
      );
    }

    const series = lines.map((line, index) => ({
      dataKey: line.dataKey || line.id,
      label: line.name || line.dataKey || line.id,
      color: line.stroke || line.color || colors?.[index] || 'var(--chart-1)',
      showMark: line.showMark !== undefined ? line.showMark : false,
      curve: line.curve || 'linear',
      strokeWidth: line.strokeWidth || 2,
    }));

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <MuiLineChart
          dataset={data}
          xAxis={[{ scaleType: 'point', dataKey: xAxisKey }]}
          series={series}
          height={height}
          slotProps={{ legend: { hidden: !showLegend } }}
        />
      </div>
    );
  }, [data, lines, height, xAxisKey, showLegend, colors, showTooltip, showGrid]);

  if (isLoading) {
    return (
      <Card className={className} style={{ height }}>
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  return (
    <Card className={className} style={{ height }}>
      <div role="img" aria-label={ariaLabel}>
        {chartContent}
      </div>
    </Card>
  );
}

LineChart.propTypes = {
  /** Array of data objects for chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Array of line configuration objects with dataKey, name, stroke/color properties */
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string,
      id: PropTypes.string,
      name: PropTypes.string,
      stroke: PropTypes.string,
      color: PropTypes.string,
      showMark: PropTypes.bool,
      curve: PropTypes.string,
      strokeWidth: PropTypes.number,
    }),
  ),
  /** Chart height in pixels */
  height: PropTypes.number,
  /** Key in data objects for X-axis labels */
  xAxisKey: PropTypes.string,
  /** Show/hide legend */
  showLegend: PropTypes.bool,
  /** Accessibility label for chart */
  ariaLabel: PropTypes.string,
  /** Show loading state */
  isLoading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Custom color palette */
  colors: PropTypes.arrayOf(PropTypes.string),
  /** Show tooltip on hover */
  showTooltip: PropTypes.bool,
  /** Show grid lines */
  showGrid: PropTypes.bool,
};
