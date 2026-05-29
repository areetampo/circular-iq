import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';
import {
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/utils/cn';

const FONT_FAMILY = 'JetBrains Mono, monospace';

const TICK_STYLE = {
  fontFamily: FONT_FAMILY,
  fontSize: 13,
  fontWeight: 500,
  fill: 'var(--color-text-secondary)',
};

/**
 * Renders a responsive bar chart with design-system tooltips, empty-state handling, and a loading skeleton.
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
  barColors,
  tickAngle = 0,
  tickAnchor = 'end',
  margin = {},
  showGrid = true,
  ...props
}) {
  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="size-full" />
      </div>
    );
  }

  if (!data.length || !barConfigs.length) {
    return (
      <div
        className={cn(
          className,
          'flex items-center justify-center font-mono text-[0.85rem] text-(--color-text-muted)',
        )}
        style={{
          height,
        }}
      >
        No data available
      </div>
    );
  }

  // ChartContainer uses this metadata to label tooltip and legend entries.
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

  // Hide fractional ticks because assessment counts and scores are shown as whole values.
  const intFormatter = (v) => (Number.isInteger(v) ? v : '');

  // Per-bar colors only apply when each datum has a matching color entry.
  const useBarColors = barColors && barColors.length === data.length;

  return (
    <ChartContainer {...props} config={config} className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{
            top: 16,
            right: 16,
            bottom: xAxisLabel ? 40 : tickAngle !== 0 ? 70 : 24,
            left: 8,
            ...margin,
          }}
          barCategoryGap="20%"
        >
          {showGrid && (
            <CartesianGrid
              vertical={false}
              stroke="var(--color-chart-grid)"
              strokeDasharray="3 3"
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ ...TICK_STYLE, textAnchor: tickAngle !== 0 ? tickAnchor : 'middle' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-chart-axis)' }}
            angle={tickAngle}
            interval={0}
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
          <Tooltip
            content={(props) => {
              const { active, payload, label } = props;
              if (active && payload && payload.length) {
                const barColor = payload[0]?.payload?.barColor;
                // Tooltip markers should match per-bar colors when a data point provides one.
                const coloredPayload = payload.map((p) => ({
                  ...p,
                  color: barColor || p.color,
                  stroke: barColor || p.stroke,
                }));
                return (
                  <ChartTooltipContent active={active} payload={coloredPayload} label={label} />
                );
              }
              return null;
            }}
            cursor={{ fill: 'var(--color-chart-cursor)' }}
          />
          {shouldShowLegend && (
            <Legend
              wrapperStyle={{
                fontFamily: FONT_FAMILY,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
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
            >
              {useBarColors &&
                i === 0 &&
                data.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={barColors[idx % barColors.length]} />
                ))}
            </Bar>
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
  barColors: PropTypes.arrayOf(PropTypes.string),
  tickAngle: PropTypes.number,
  tickAnchor: PropTypes.string,
  margin: PropTypes.object,
  showGrid: PropTypes.bool,
};
