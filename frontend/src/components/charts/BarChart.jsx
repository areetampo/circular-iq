import { Card, Skeleton } from '@heroui/react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

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
  isLoading = false,
  className,
  colors,
}) {
  const chartContent = useMemo(() => {
    if (
      !data ||
      !Array.isArray(data) ||
      data.length === 0 ||
      !barConfigs ||
      !Array.isArray(barConfigs) ||
      barConfigs.length === 0
    ) {
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

    const series = barConfigs.map((cfg, index) => ({
      dataKey: cfg.dataKey,
      label: cfg.name || cfg.dataKey,
      color: cfg.fill || cfg.color || colors?.[index] || 'var(--chart-1)',
    }));

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <MuiBarChart
          dataset={data}
          xAxis={[{ scaleType: 'band', dataKey: xAxisKey, label: xAxisLabel }]}
          yAxis={[{ label: yAxisLabel }]}
          series={series}
          height={height}
          slotProps={{ legend: { hidden: !showLegend } }}
        />
      </div>
    );
  }, [data, barConfigs, height, xAxisKey, xAxisLabel, yAxisLabel, showLegend, colors]);

  if (isLoading) {
    return (
      <Card className={className} style={{ height }}>
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  return (
    <Card className={className} style={{ height }}>
      <div style={{ width: '100%', height: '100%' }}>{chartContent}</div>
    </Card>
  );
}

BarChart.propTypes = {
  /** Array of data objects for chart */
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
  /** Show loading state */
  isLoading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Custom color palette */
  colors: PropTypes.arrayOf(PropTypes.string),
};
