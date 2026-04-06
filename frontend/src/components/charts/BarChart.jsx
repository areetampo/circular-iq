import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const FONT_FAMILY =
  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace';

const TICK_STYLE = {
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  fontWeight: 500,
  fill: '#5a4f42',
};

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
  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!data.length || !barConfigs.length) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT_FAMILY,
          fontSize: 13,
          color: '#9a8f82',
        }}
      >
        No data available
      </div>
    );
  }

  // Build config for ChartContainer
  const config = Object.fromEntries(
    barConfigs.map((cfg, i) => [
      cfg.dataKey,
      {
        label: cfg.name || cfg.dataKey,
        color: cfg.fill || cfg.color || colors?.[i] || `var(--chart-${(i % 5) + 1})`,
      },
    ]),
  );

  const shouldShowLegend = showLegend && barConfigs.length > 1;

  // Formatter for integer-only y-axis ticks
  const intFormatter = (v) => (Number.isInteger(v) ? v : '');

  return (
    <ChartContainer config={config} className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 16, right: 16, bottom: xAxisLabel ? 40 : 24, left: 8 }}
          barCategoryGap="20%"
        >
          <CartesianGrid vertical={false} stroke="rgba(180,160,130,0.15)" strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'rgba(180,160,130,0.3)' }}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -8, style: TICK_STYLE }
                : undefined
            }
          />
          <YAxis
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
            tickFormatter={intFormatter}
            allowDecimals={false}
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: TICK_STYLE }
                : undefined
            }
            width={36}
          />
          <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(180,160,130,0.08)' }} />
          {shouldShowLegend && (
            <Legend
              wrapperStyle={{
                fontFamily: FONT_FAMILY,
                fontSize: 13,
                fontWeight: 500,
                color: '#5a4f42',
                paddingTop: 8,
              }}
            />
          )}
          {barConfigs.map((cfg, i) => (
            <Bar
              key={cfg.dataKey}
              dataKey={cfg.dataKey}
              name={cfg.name || cfg.dataKey}
              fill={cfg.fill || cfg.color || colors?.[i] || `var(--chart-${(i % 5) + 1})`}
              radius={[3, 3, 0, 0]}
              maxBarSize={80}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

BarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  barConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      name: PropTypes.string,
      fill: PropTypes.string,
      color: PropTypes.string,
      stack: PropTypes.string,
    }),
  ),
  height: PropTypes.number,
  xAxisKey: PropTypes.string,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  showLegend: PropTypes.bool,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
};
