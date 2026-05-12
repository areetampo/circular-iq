import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
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
 * LineChart component for displaying time-series or continuous data trends
 * Uses Recharts library with responsive design and theming support
 *
 * @param {Object} props - Component props
 * @param {'default'|'sparkline'} [props.variant='default'] - Chart variant (default: 'default')
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.lines - Configuration for each line series
 * @param {string} props.lines[].dataKey - Key in data object for line values
 * @param {string} [props.lines[].name] - Display name for the line (optional)
 * @param {string} [props.lines[].color] - Color for the line (optional)
 * @param {number} [props.height=300] - Height of the chart in pixels
 * @param {string} [props.xAxisKey='label'] - Data key for x-axis values
 * @param {string} [props.xAxisLabel] - Label for x-axis (optional)
 * @param {Array} [props.ticks] - Array of tick values for x-axis (optional)
 * @param {number} [props.tickAngle] - Angle for x-axis tick labels (optional)
 * @param {string} [props.tickAnchor] - Anchor position for x-axis tick labels (optional)
 * @param {boolean} [props.showLegend=true] - Whether to show legend
 * @param {string} [props.ariaLabel] - Accessibility label for the chart (optional)
 * @param {boolean} [props.isLoading=false] - Whether to show loading state
 * @param {string} [props.className] - Additional CSS classes (optional)
 * @param {Array} [props.colors] - Array of colors for lines (optional)
 * @param {Object} [props.yAxisRight] - Configuration for right y-axis (optional)
 * @param {Object} [props.margin] - Additional margin overrides (optional)
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered LineChart
 */
export default function LineChart({
  variant = 'default',
  data,
  lines,
  height = 300,
  xAxisKey = 'label',
  xAxisLabel,
  ticks,
  tickAngle,
  tickAnchor,
  showLegend = true,
  ariaLabel,
  isLoading = false,
  className,
  colors,
  yAxisRight,
  margin,
  ...props
}) {
  const isSparkline = variant === 'sparkline';

  if (isLoading) {
    return (
      <div className={className} style={{ height }} {...props}>
        <Skeleton className="size-full" />
      </div>
    );
  }

  if (!data.length || !lines.length) {
    return (
      <div
        className={cn(
          className,
          'flex items-center justify-center font-mono text-[0.85rem] text-(--color-text-muted)',
        )}
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const config = Object.fromEntries(
    lines.map((line, i) => [
      line.dataKey || line.id,
      {
        label: line.name || line.dataKey || line.id,
        color: line.stroke || line.color || colors?.[i] || `var(--chart-${(i % 5) + 1})`,
      },
    ]),
  );

  // Shorten week labels to avoid crowding
  const formatXLabel = (val) => {
    if (typeof val === 'string' && /^\d{4}-W\d+$/.test(val)) {
      return val.replace(/^\d{4}-/, '');
    }
    return val;
  };

  // Dynamically adjust bottom margin when x‑axis label is provided
  const bottomMargin = xAxisLabel ? 32 : 24;
  const computedMargin = { top: 16, right: 24, bottom: bottomMargin, left: 8, ...margin };

  return (
    <ChartContainer
      config={config}
      className={className}
      style={{ height }}
      aria-label={ariaLabel}
      {...props}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={computedMargin}>
          {/* Hide grid for sparkline */}
          {!isSparkline && (
            <CartesianGrid
              vertical={false}
              stroke="var(--color-chart-grid)"
              strokeDasharray="3 3"
            />
          )}

          {/* X‑Axis: hide for sparkline, otherwise show ticks + optional label */}
          <XAxis
            dataKey={xAxisKey}
            tick={isSparkline ? false : TICK_STYLE}
            tickLine={false}
            axisLine={false}
            hide={isSparkline}
            tickFormatter={formatXLabel}
            domain={['auto', 'auto']}
            ticks={ticks}
            interval={ticks ? 0 : 'preserveStartEnd'}
            angle={tickAngle}
            textAnchor={tickAnchor}
            label={
              !isSparkline && xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'insideBottom',
                    offset: -10,
                    style: TICK_STYLE,
                  }
                : undefined
            }
          />

          {/* Y‑Axis (left) */}
          <YAxis
            yAxisId="left"
            tick={isSparkline ? false : TICK_STYLE}
            tickLine={false}
            axisLine={false}
            hide={isSparkline}
            allowDecimals={false}
            width={36}
          />

          {/* Optional right Y‑Axis (only in default variant) */}
          {yAxisRight && !isSparkline && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={TICK_STYLE}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={40}
              tickFormatter={yAxisRight.tickFormatter}
              domain={yAxisRight.domain || ['auto', 'auto']}
              label={
                yAxisRight.label
                  ? {
                      value: yAxisRight.label,
                      angle: 90,
                      position: 'insideRight',
                      style: TICK_STYLE,
                    }
                  : undefined
              }
            />
          )}

          {/* Tooltip always shown, even for sparkline */}
          <Tooltip
            content={<ChartTooltipContent />}
            cursor={{ stroke: 'var(--color-chart-cursor-line)', strokeWidth: 1 }}
          />

          {/* Legend (only in default with >1 line) */}
          {!isSparkline && showLegend && lines.length > 1 && (
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

          {/* Line series */}
          {lines.map((line, i) => (
            <Line
              key={line.dataKey || line.id}
              yAxisId={line.yAxisId || 'left'}
              type={line.curve || 'monotone'}
              dataKey={line.dataKey || line.id}
              name={line.name || line.dataKey || line.id}
              stroke={line.stroke || line.color || colors?.[i] || `var(--chart-${(i % 5) + 1})`}
              strokeWidth={isSparkline ? 1.5 : 2}
              dot={false}
              activeDot={isSparkline ? false : { r: 4, strokeWidth: 0 }}
              connectNulls={line.connectNulls || false}
              strokeDasharray={line.strokeDasharray}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

LineChart.propTypes = {
  variant: PropTypes.oneOf(['default', 'sparkline']),
  data: PropTypes.arrayOf(PropTypes.object),
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
      yAxisId: PropTypes.string,
    }),
  ),
  height: PropTypes.number,
  xAxisKey: PropTypes.string,
  xAxisLabel: PropTypes.string,
  ticks: PropTypes.arrayOf(PropTypes.string),
  tickAngle: PropTypes.number,
  tickAnchor: PropTypes.string,
  showLegend: PropTypes.bool,
  ariaLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
  showTooltip: PropTypes.bool,
  showGrid: PropTypes.bool,
  yAxisRight: PropTypes.shape({
    label: PropTypes.string,
    tickFormatter: PropTypes.func,
    domain: PropTypes.array,
  }),
  margin: PropTypes.object,
};
