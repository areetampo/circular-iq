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
 * @param {Array} props.data - Array of data objects to display
 * @param {Array} props.lines - Configuration for each line series
 * @param {string} props.lines[].dataKey - Key in data object for line values
 * @param {string} props.lines[].name - Display name for the line (optional)
 * @param {string} props.lines[].color - Color for the line (optional)
 * @param {number} props.height - Height of the chart in pixels (default: 300)
 * @param {string} props.xAxisKey - Data key for x-axis values (default: 'label')
 * @param {boolean} props.showLegend - Whether to show legend (default: true)
 * @param {string} props.ariaLabel - Accessibility label for the chart (optional)
 * @param {boolean} props.isLoading - Whether to show loading state (default: false)
 * @param {string} props.className - Additional CSS classes (optional)
 * @param {Array} props.colors - Array of colors for lines (optional)
 * @param {Object} props.yAxisRight - Configuration for right y-axis (optional)
 * @param {Object} props.margin - Additional margin overrides (optional)
 *
 * @example
 * <LineChart
 *   data={[{ label: 'Jan', sales: 100 }, { label: 'Feb', sales: 150 }]}
 *   lines={[{ dataKey: 'sales', name: 'Sales', color: '#8884d8' }]}
 *   height={400}
 * />
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
  yAxisRight = null,
  margin = {},
}) {
  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="size-full" />
      </div>
    );
  }

  if (!data.length || !lines.length) {
    return (
      <div
        className={cn(
          className,
          'flex items-center justify-center font-mono text-[13px] text-stone-500',
        )}
        style={{
          height,
        }}
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

  // Shorten "2026-W03" → "W03" for x-axis labels to prevent crowding
  const formatXLabel = (val) => {
    if (typeof val === 'string' && /^\d{4}-W\d+$/.test(val)) {
      return val.replace(/^\d{4}-/, '');
    }
    return val;
  };

  return (
    <ChartContainer config={config} className={className} style={{ height }} aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 16, right: 24, bottom: 24, left: 8, ...margin }}
        >
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-chart-axis)' }}
            tickFormatter={formatXLabel}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          {yAxisRight && (
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
            content={<ChartTooltipContent />}
            cursor={{ stroke: 'var(--color-chart-cursor-line)', strokeWidth: 1 }}
          />
          {showLegend && lines.length > 1 && (
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
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
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
