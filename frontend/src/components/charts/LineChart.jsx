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
        <RechartsLineChart data={data} margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
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
            tick={TICK_STYLE}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
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
              type={line.curve || 'monotone'}
              dataKey={line.dataKey || line.id}
              name={line.name || line.dataKey || line.id}
              stroke={line.stroke || line.color || colors?.[i] || `var(--chart-${(i % 5) + 1})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={line.connectNulls || false}
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
};
