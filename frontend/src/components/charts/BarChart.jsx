import { Skeleton } from '@heroui/react';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

const FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

/**
 * BarChart Component
 * Following MUI X-Charts demo patterns exactly
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
            color: '#374151',
            fontSize: '0.875rem',
            fontFamily: FONT_FAMILY,
          }}
        >
          No data available
        </div>
      );
    }

    // Transform barConfigs to MUI X Charts series format
    const series = barConfigs.map((cfg, index) => ({
      data: data.map((item) => item[cfg.dataKey] || 0),
      label: cfg.name || cfg.dataKey,
      id: cfg.dataKey,
      stack: cfg.stack,
      color: cfg.fill || cfg.color || colors?.[index],
    }));

    // Auto-hide legend for single-series charts:
    const shouldShowLegend = showLegend && series.length > 1;

    // Extract x-axis labels from data
    const xLabels = data.map((item) => item[xAxisKey] || '');

    return (
      <MuiBarChart
        series={series}
        xAxis={[
          {
            data: xLabels,
            scaleType: 'band',
            label: xAxisLabel,
            height: 44,
            tickLabelStyle: {
              fill: '#5a4f42',
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
            // Reduce gap to make bars thicker
            barCategoryGap: '10%',
          },
        ]}
        yAxis={[
          {
            label: yAxisLabel,
            tickMinStep: 1,
            width: 50,
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
        margin={{ top: 20, right: 15, bottom: 48, left: 45 }}
        slotProps={{
          legend: {
            hidden: !shouldShowLegend,
            labelStyle: {
              fill: '#5a4f42',
              fontSize: 12,
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
            },
          },
        }}
        sx={{
          fontFamily: FONT_FAMILY,
          fontSize: 12,
          '& .MuiBarElement-root': {
            rx: 4,
            strokeWidth: 0,
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
  }, [data, barConfigs, height, xAxisKey, xAxisLabel, yAxisLabel, showLegend, colors]);

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

BarChart.propTypes = {
  /** Array of data objects for chart */
  data: PropTypes.arrayOf(PropTypes.object),
  /** Array of bar configuration objects */
  barConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      name: PropTypes.string,
      fill: PropTypes.string,
      color: PropTypes.string,
      stack: PropTypes.string,
    }),
  ),
  /** Height of the chart in pixels */
  height: PropTypes.number,
  /** Key in data objects for x-axis values */
  xAxisKey: PropTypes.string,
  /** Label for x-axis */
  xAxisLabel: PropTypes.string,
  /** Label for y-axis */
  yAxisLabel: PropTypes.string,
  /** Whether to show legend */
  showLegend: PropTypes.bool,
  /** Whether to show loading skeleton */
  isLoading: PropTypes.bool,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Custom color palette */
  colors: PropTypes.arrayOf(PropTypes.string),
};
