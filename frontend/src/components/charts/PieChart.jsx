import { Card, Skeleton } from '@heroui/react';
import { ChartsContainer } from '@mui/x-charts';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';
import PropTypes from 'prop-types';
import { useMemo } from 'react';

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
  responsive = true,
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
            color: 'var(--muted-foreground)',
            fontSize: '0.875rem',
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
      color: item.color || colors?.[i] || undefined,
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

    const ChartComponent = responsive ? ChartsContainer : MuiPieChart;
    const chartProps = responsive
      ? { series, height }
      : {
          series,
          height,
          slots: { legend: { hidden: !showLegend } },
        };

    return (
      <div style={{ width: '100%', height: '100%' }}>
        {responsive ? (
          <ChartsContainer series={series} height={height}>
            <MuiPieChart slotProps={{ legend: { hidden: !showLegend } }} />
          </ChartsContainer>
        ) : (
          <MuiPieChart
            series={series}
            height={height}
            slotProps={{ legend: { hidden: !showLegend } }}
          />
        )}
      </div>
    );
  }, [
    data,
    dataKey,
    nameKey,
    showLegend,
    responsive,
    colors,
    innerRadius,
    outerRadius,
    paddingAngle,
    cornerRadius,
  ]);

  if (isLoading) {
    return (
      <Card className={className} style={{ height }}>
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  if (responsive) {
    return (
      <Card className={className} style={{ height }}>
        <div style={{ width: '100%', height: '100%' }}>{chartContent}</div>
      </Card>
    );
  }

  return chartContent;
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
  /** Enable responsive design */
  responsive: PropTypes.bool,
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
