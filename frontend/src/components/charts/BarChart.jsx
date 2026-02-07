import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/common/ChartWrapper';
import { cn } from '@/utils/cn';

export default function BarChart({
  data,
  barConfigs,
  height,
  showLegend,
  showGrid,
  yAxisDomain,
  xAxisLabel,
  yAxisLabel,
  isLoading,
}) {
  const chartConfig = useMemo(() => {
    const palette = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];

    return barConfigs.reduce((acc, config, index) => {
      acc[config.dataKey] = {
        label: config.name || config.dataKey,
        color: palette[index % palette.length],
      };
      return acc;
    }, {});
  }, [barConfigs]);

  // Memoize data transformation to prevent expensive re-calculations
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        name: item.name || item.factor || item.subject || 'Unknown',
      })),
    [data],
  );

  return (
    <ChartContainer
      config={chartConfig}
      className={cn('w-full', isLoading && 'opacity-60')}
      style={{ height: height || 400 }}
    >
      <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, bottom: 80, left: 60 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.6} />}
        <XAxis
          dataKey="name"
          label={
            xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined
          }
          tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500, angle: -30, textAnchor: 'end' }}
          height={80}
          interval={0}
          tickLine={false}
        />
        <YAxis
          domain={yAxisDomain}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{
              paddingTop: '15px',
              fontSize: '13px',
              fontWeight: '600',
            }}
            iconSize={14}
            iconType="square"
          />
        )}

        {barConfigs.map((config, index) => (
          <Bar
            key={index}
            dataKey={config.dataKey}
            fill={`var(--color-${config.dataKey})`}
            name={config.name || config.dataKey}
            radius={[4, 4, 0, 0]}
          >
            {config.useCustomColors &&
              chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={`var(--color-${config.dataKey})`} opacity={0.9} />
              ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      factor: PropTypes.string,
      subject: PropTypes.string,
    }),
  ).isRequired,
  barConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      fill: PropTypes.string.isRequired,
      name: PropTypes.string,
      useCustomColors: PropTypes.bool,
    }),
  ).isRequired,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool,
  yAxisDomain: PropTypes.arrayOf(PropTypes.number),
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  isLoading: PropTypes.bool,
};

BarChart.defaultProps = {
  height: 400,
  showLegend: true,
  showGrid: true,
  yAxisDomain: [0, 100],
  xAxisLabel: '',
  yAxisLabel: '',
  isLoading: false,
};
