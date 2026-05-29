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
 * Renders a responsive line chart, with a sparkline variant that hides axes and legend.
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
  tooltipLabelFormatter,
  hideTooltipIndicator = false,
  ...props
}) {
  const isSparkline = variant === 'sparkline';

  if (isLoading) {
    return (
      <div {...props} className={className} style={{ height }}>
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

  const formatXLabel = (val) => {
    if (typeof val === 'string' && /^\d{4}-W\d+$/.test(val)) {
      return val.replace(/^\d{4}-/, '');
    }
    return val;
  };

  const bottomMargin = xAxisLabel ? 32 : 24;
  const computedMargin = { top: 16, right: 24, bottom: bottomMargin, left: 8, ...margin };

  return (
    <ChartContainer
      {...props}
      config={config}
      className={className}
      style={{ height }}
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={computedMargin}>
          {/* Sparklines stay visually compact by omitting chart scaffolding. */}
          {!isSparkline && (
            <CartesianGrid
              vertical={false}
              stroke="var(--color-chart-grid)"
              strokeDasharray="3 3"
            />
          )}

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

          <YAxis
            yAxisId="left"
            tick={isSparkline ? false : TICK_STYLE}
            tickLine={false}
            axisLine={false}
            hide={isSparkline}
            allowDecimals={false}
            width={36}
          />

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

          <Tooltip
            content={(props) => (
              <ChartTooltipContent
                {...props}
                hideIndicator={hideTooltipIndicator}
                label={
                  tooltipLabelFormatter ? tooltipLabelFormatter(props.label, props) : props.label
                }
              />
            )}
            cursor={{ stroke: 'var(--color-chart-cursor-line)', strokeWidth: 1 }}
          />

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
  yAxisRight: PropTypes.shape({
    label: PropTypes.string,
    tickFormatter: PropTypes.func,
    domain: PropTypes.array,
  }),
  margin: PropTypes.object,
  tooltipLabelFormatter: PropTypes.func,
  hideTooltipIndicator: PropTypes.bool,
};
