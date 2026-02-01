import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/utils/cn';

export default function ScatterChart({
  data,
  height,
  xAxisLabel,
  xDomain,
  yDomain,
  showGrid,
  customTooltip,
  isLoading,
}) {
  const chartConfig = useMemo(
    () => ({
      points: {
        label: 'Projects',
        color: 'hsl(var(--chart-1))',
      },
    }),
    [],
  );

  // Memoize data to prevent unnecessary re-renders
  const chartData = useMemo(() => data, [data]);

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('w-full', isLoading && 'opacity-60')}
      style={{ height: height || 400 }}
    >
      <RechartsScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}

        <XAxis
          type="number"
          dataKey="x"
          name="Score"
          domain={xDomain}
          label={
            xAxisLabel
              ? {
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: '#666', fontWeight: '600' },
                }
              : undefined
          }
          tick={{ fill: '#666', fontSize: 12, fontWeight: 500 }}
        />

        <YAxis type="number" dataKey="y" name="Index" hide domain={yDomain} />

        <ChartTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={customTooltip ? customTooltip : <ChartTooltipContent indicator="dot" />}
        />

        <Scatter name="Projects" data={chartData} fill="var(--color-points)" shape="circle" />
      </RechartsScatterChart>
    </ChartContainer>
  );
}

ScatterChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    }),
  ).isRequired,
  height: PropTypes.number,
  xAxisLabel: PropTypes.string,
  xDomain: PropTypes.arrayOf(PropTypes.number),
  yDomain: PropTypes.arrayOf(PropTypes.number),
  showGrid: PropTypes.bool,
  customTooltip: PropTypes.elementType,
  isLoading: PropTypes.bool,
};

ScatterChart.defaultProps = {
  height: 400,
  xAxisLabel: '',
  xDomain: [0, 100],
  yDomain: undefined,
  showGrid: true,
  customTooltip: undefined,
  isLoading: false,
};
