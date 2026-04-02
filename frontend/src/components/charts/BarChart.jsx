import { Skeleton } from '@heroui/react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { chartTheme } from '@/utils/chartTheme';

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
            color: chartTheme.textColor,
            fontSize: '0.875rem',
            fontFamily: chartTheme.fontFamily,
          }}
        >
          No data available
        </div>
      );
    }

    const series = barConfigs.map((cfg, index) => ({
      dataKey: cfg.dataKey,
      label: cfg.name || cfg.dataKey,
      color:
        cfg.fill ||
        cfg.color ||
        colors?.[index] ||
        chartTheme.colors[index % chartTheme.colors.length],
    }));

    return (
      <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
        <MuiBarChart
          dataset={data}
          xAxis={[
            {
              scaleType: 'band',
              dataKey: xAxisKey,
              label: xAxisLabel,
              tickLabelStyle: { fill: chartTheme.textColor, fontSize: chartTheme.fontSize },
              labelStyle: { fill: chartTheme.textColor, fontSize: chartTheme.fontSize + 1 },
            },
          ]}
          yAxis={[
            {
              label: yAxisLabel,
              tickLabelStyle: { fill: chartTheme.textColor, fontSize: chartTheme.fontSize },
              labelStyle: { fill: chartTheme.textColor, fontSize: chartTheme.fontSize + 1 },
            },
          ]}
          series={series}
          height={height}
          colors={chartTheme.colors}
          slotProps={{
            legend: {
              hidden: !showLegend,
              labelStyle: { fill: chartTheme.textColor, fontSize: chartTheme.fontSize },
            },
          }}
          grid={{
            vertical: { stroke: chartTheme.gridColor },
            horizontal: { stroke: chartTheme.gridColor },
          }}
        />
      </div>
    );
  }, [data, barConfigs, height, xAxisKey, xAxisLabel, yAxisLabel, showLegend, colors]);

  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <div className="w-full h-full rounded-xl bg-[rgba(245,240,232,0.3)] border border-[rgba(180,160,130,0.15)] p-4">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height, background: 'transparent' }}>
      <div className="w-full h-full rounded-xl bg-[rgba(245,240,232,0.3)] border border-[rgba(180,160,130,0.15)] p-4">
        <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
          {chartContent}
        </div>
      </div>
    </div>
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
