import { Skeleton } from '@heroui/react';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

/**
 * PieChart Component
 * Following MUI X-Charts demo patterns exactly
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
  label = false,
  labelLine = true,
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
            color: '#374151',
            fontSize: '0.875rem',
            fontFamily: FONT_FAMILY,
          }}
        >
          No data available
        </div>
      );
    }

    // Transform data to MUI X Charts format
    const seriesData = data.map((item, i) => ({
      id: i,
      value: typeof item[dataKey] === 'number' ? item[dataKey] : 0,
      label: item[nameKey] || `Item ${i + 1}`,
      color: item.color || colors?.[i],
    }));

    const series = [
      {
        data: seriesData,
        innerRadius,
        outerRadius: outerRadius ?? Math.min(height * 0.36, 110),
        paddingAngle: 2,
        cornerRadius: 2,
        highlightScope: { fade: 'global', highlight: 'item' },
        arcLabel: undefined,
        arcLabelMinAngle: undefined,
      },
    ];

    return (
      <MuiPieChart
        series={series}
        height={height}
        colors={
          colors || [
            '#5a7a9a',
            '#8b3a3a',
            '#4a7c59',
            '#b07d3a',
            '#7a5c7a',
            '#3a6b8b',
            '#8b5e3a',
            '#6b8b5a',
          ]
        }
        margin={{ top: 10, right: 10, bottom: showLegend ? 56 : 10, left: 10 }}
        slotProps={{
          legend: {
            hidden: !showLegend,
            position: { vertical: 'bottom', horizontal: 'middle' },
            direction: 'row',
            padding: { top: 5, bottom: 5 },
            itemMarkWidth: 10,
            itemMarkHeight: 10,
            markGap: 6,
            itemGap: 8,
            labelStyle: {
              fill: '#5a4f42',
              fontSize: 12,
              fontFamily: FONT_FAMILY,
              fontWeight: 500,
            },
          },
        }}
        sx={{
          fontFamily: FONT_FAMILY,
          fontSize: 12,
          '& .MuiChartsLegend-root': {
            fontFamily: FONT_FAMILY,
            fontSize: 12,
          },
          '& .MuiChartsLegend-label': {
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            fontWeight: 500,
          },
        }}
      />
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
    label,
    labelLine,
    height,
  ]);

  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <div className="w-full h-full flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: height, fontFamily: FONT_FAMILY }}>
      {chartContent}
    </div>
  );
}

PieChart.propTypes = {
  /** Array of data objects for the chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Key in data objects containing numeric values */
  dataKey: PropTypes.string,
  /** Key in data objects containing labels */
  nameKey: PropTypes.string,
  /** Height of the chart in pixels */
  height: PropTypes.number,
  /** Whether to show legend */
  showLegend: PropTypes.bool,
  /** Whether to show loading skeleton */
  isLoading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Custom color palette */
  colors: PropTypes.arrayOf(PropTypes.string),
  /** Inner radius of pie chart */
  innerRadius: PropTypes.number,
  /** Outer radius of pie chart */
  outerRadius: PropTypes.number,
  /** Padding angle between slices */
  paddingAngle: PropTypes.number,
  /** Corner radius of slices */
  cornerRadius: PropTypes.number,
  /** Whether to show labels on slices */
  label: PropTypes.bool,
  /** Whether to show label lines */
  labelLine: PropTypes.bool,
};
