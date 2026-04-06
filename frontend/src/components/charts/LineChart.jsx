import { Skeleton } from '@heroui/react';
import { LineChart as MuiLineChart } from '@mui/x-charts/LineChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

/**
 * LineChart Component
 * Following MUI X-Charts demo patterns exactly
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
            color: '#374151',
            fontSize: '0.875rem',
            fontFamily: FONT_FAMILY,
          }}
        >
          No data available
        </div>
      );
    }

    // Transform lines to MUI X Charts series format
    const series = lines.map((line, index) => ({
      data: data.map((item) => item[line.dataKey || line.id] || 0),
      label: line.name || line.dataKey || line.id,
      id: line.dataKey || line.id || `line-${index}`,
      color: line.stroke || line.color || colors?.[index],
      showMark: line.showMark !== undefined ? line.showMark : false,
      curve: line.curve || 'monotone',
      connectNulls: line.connectNulls || false,
    }));

    // Extract x-axis labels from data
    const xLabels = data.map((item) => item[xAxisKey] || '');

    return (
      <MuiLineChart
        series={series}
        xAxis={[
          {
            data: xLabels,
            scaleType: 'point',
            height: 44,
            valueFormatter: (value) => value?.replace('2026-', '') ?? value,
            tickLabelStyle: {
              fill: '#374151',
              fontSize: 12,
              fontFamily: FONT_FAMILY,
              textAnchor: 'end',
              dominantBaseline: 'auto',
            },
            labelStyle: {
              fill: '#374151',
              fontSize: 13,
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              textTransform: 'capitalize',
            },
          },
        ]}
        yAxis={[
          {
            width: 50,
            tickMinStep: 1,
            tickLabelStyle: {
              fill: '#374151',
              fontSize: 12,
              fontFamily: FONT_FAMILY,
            },
            labelStyle: {
              fill: '#374151',
              fontSize: 13,
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              textTransform: 'capitalize',
            },
          },
        ]}
        height={height}
        colors={colors || ['#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed']}
        margin={{ top: 16, right: 32, bottom: 48, left: 48 }}
        slotProps={{
          legend: {
            hidden: !showLegend,
            labelStyle: {
              fill: '#374151',
              fontSize: 12,
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
            },
          },
        }}
        sx={{
          fontFamily: FONT_FAMILY,
          fontSize: 12,
          '& .MuiLineElement-root': {
            strokeWidth: 2.5,
          },
          '& .MuiMarkElement-root': {
            strokeWidth: 2,
          },
          '& .MuiChartsAxis-label': {
            fontFamily: FONT_FAMILY,
            fontSize: 13,
            fontWeight: 600,
          },
          '& .MuiChartsLegend-root': {
            fontFamily: FONT_FAMILY,
            fontSize: 12,
          },
          '& .MuiChartsLegend-label': {
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            fontWeight: 600,
          },
        }}
      />
    );
  }, [data, lines, height, xAxisKey, showLegend, colors, showTooltip, showGrid]);

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

LineChart.propTypes = {
  /** Array of data objects for chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Array of line configuration objects */
  lines: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string,
      id: PropTypes.string,
      name: PropTypes.string,
      stroke: PropTypes.string,
      color: PropTypes.string,
      showMark: PropTypes.bool,
      curve: PropTypes.string,
      connectNulls: PropTypes.bool,
    }),
  ),
  /** Height of the chart in pixels */
  height: PropTypes.number,
  /** Key in data objects for x-axis values */
  xAxisKey: PropTypes.string,
  /** Whether to show legend */
  showLegend: PropTypes.bool,
  /** Accessibility label */
  ariaLabel: PropTypes.string,
  /** Whether to show loading skeleton */
  isLoading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Custom color palette */
  colors: PropTypes.arrayOf(PropTypes.string),
  /** Whether to show tooltip */
  showTooltip: PropTypes.bool,
  /** Whether to show grid */
  showGrid: PropTypes.bool,
};
