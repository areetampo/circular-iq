import { Skeleton } from '@heroui/react';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

import { chartTheme } from '@/utils/chartTheme';

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
  isLoading = false,
  className,
  colors,
  innerRadius = 0,
  outerRadius = null,
  paddingAngle = 0,
  cornerRadius = 0,
}) {
  const chartContent = useMemo(() => {
    if (!data.length) {
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

    const seriesData = data.map((item, i) => ({
      id: i,
      value: typeof item[dataKey] === 'number' ? item[dataKey] : 0,
      label: item[nameKey] || `Item ${i + 1}`,
      color: item.color || colors?.[i] || chartTheme.colors[i % chartTheme.colors.length],
    }));

    const series = [
      {
        data: seriesData,
        innerRadius,
        outerRadius,
        paddingAngle,
        cornerRadius,
      },
    ];

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <MuiPieChart
          series={series}
          height={height}
          colors={chartTheme.colors}
          slotProps={{
            legend: {
              hidden: !showLegend,
              labelStyle: { fill: chartTheme.textColor, fontSize: chartTheme.fontSize },
            },
          }}
        />
      </div>
    );
  }, [
    data,
    dataKey,
    nameKey,
    showLegend,
    colors,
    innerRadius,
    outerRadius,
    paddingAngle,
    cornerRadius,
  ]);

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
    <div className={className} style={{ height }}>
      <div className="w-full h-full rounded-xl bg-[rgba(245,240,232,0.3)] border border-[rgba(180,160,130,0.15)] p-4">
        <div style={{ width: '100%', height: '100%' }}>{chartContent}</div>
      </div>
    </div>
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
  /** Show loading state */
  isLoading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Custom color palette */
  colors: PropTypes.arrayOf(PropTypes.string),
  /** Inner radius for donut chart */
  innerRadius: PropTypes.number,
  /** Outer radius override */
  outerRadius: PropTypes.number,
  /** Angle between slices */
  paddingAngle: PropTypes.number,
  /** Corner radius for slices */
  cornerRadius: PropTypes.number,
};
