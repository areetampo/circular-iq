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
 * BarChart component for displaying categorical data with customizable bars
 * Uses Recharts library with responsive design and theming support
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.barConfigs - Configuration for each bar series
 * @param {string} props.barConfigs[].dataKey - Key in data object for bar values
 * @param {string} [props.barConfigs[].name] - Display name for the bar (optional)
 * @param {string} [props.barConfigs[].fill] - Color for the bar (optional)
 * @param {string} [props.barConfigs[].color] - Alternative color prop (optional)
 * @param {string} [props.barConfigs[].stack] - Stack ID for grouped bars (optional)
 * @param {number} [props.height=300] - Height of the chart in pixels
 * @param {string} [props.xAxisKey='name'] - Data key for x-axis values
 * @param {string} [props.xAxisLabel] - Label for x-axis (optional)
 * @param {string} [props.yAxisLabel] - Label for y-axis (optional)
 * @param {boolean} [props.showLegend=true] - Whether to show legend
 * @param {boolean} [props.isLoading=false] - Whether to show loading state
 * @param {string} [props.className] - Additional CSS classes (optional)
 * @param {Array} [props.colors] - Array of colors for bars (optional) (applies per series, not per bar)
 * @param {Array} [props.barColors] - Array of colors for each individual bar (same order as data). If provided, overrides fill for each bar. (optional)
 * @param {number} [props.tickAngle=0] - Angle for x-axis tick labels
 * @param {string} [props.tickAnchor='end'] - Anchor for rotated ticks
 * @param {Object} [props.margin] - Additional margin overrides (optional)
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered BarChart
 *
 * @example
 * Basic usage
 * <BarChart data={salesData} barConfigs={[{ dataKey: 'sales', name: 'Sales', fill: '#8884d8' }]} height={400} />
 *
 * @example
 * With multiple series
 * <BarChart data={companyData} barConfigs={[
 *   { dataKey: 'revenue', name: 'Revenue', fill: '#82ca9d' },
 *   { dataKey: 'profit', name: 'Profit', fill: '#8884d8' }
 * ]} showLegend={true} />
 *
 * @example
 * With custom styling
 * <BarChart data={performanceData} colors={['#ff7c7c', '#3b82f6']} tickAngle={45} tickAnchor='middle' />
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

  // Determine if we should use per‑bar colors for the first series (others are ignored for simplicity)
  const useBarColors = barColors && barColors.length === data.length;

  return (
    <ChartContainer config={config} className={className} style={{ height }} {...props}>
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
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
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
                // Get the bar color from the data point (if available)
                const barColor = payload[0]?.payload?.barColor;
                // Override the payload's color with the bar's specific color
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
};
