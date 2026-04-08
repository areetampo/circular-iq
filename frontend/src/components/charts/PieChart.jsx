import { Skeleton } from '@heroui/react';
import PropTypes from 'prop-types';
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/utils/cn';

// Warm palette fallback — never use MUI-default bright blues/reds
const WARM_FALLBACK_COLORS = [
  '#b8916a', // bronze/tan
  '#4a7c59', // forest green
  '#8b3a3a', // terracotta
  '#5a7a9a', // slate blue
  '#b07d3a', // amber
  '#7a5c7a', // plum
  '#3a6b8b', // ocean blue
  '#8b5e3a', // warm brown
  '#6b8b5a', // sage
  '#9a6b4b', // tan
];

export default function PieChart({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  showLegend = true,
  isLoading = false,
  className,
  colors,
  innerRadius = 0,
  // outerRadius, label, labelLine, paddingAngle, cornerRadius kept for API compat but managed internally
}) {
  if (isLoading) {
    return (
      <div className={className} style={{ height }}>
        <Skeleton className="size-full" />
      </div>
    );
  }

  if (!data.length) {
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

  const palette = colors?.length ? colors : WARM_FALLBACK_COLORS;

  // Config for ChartContainer and tooltip
  const config = Object.fromEntries(
    data.map((item, i) => [
      item[nameKey] || `item-${i}`,
      { label: item[nameKey] || `Item ${i + 1}`, color: palette[i % palette.length] },
    ]),
  );

  // Legend payload for custom renderer
  const legendPayload = data.map((item, i) => ({
    value: item[nameKey] || `Item ${i + 1}`,
    color: palette[i % palette.length],
    type: 'square',
  }));

  return (
    <ChartContainer config={config} className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy={showLegend ? '45%' : '50%'}
            innerRadius={innerRadius}
            outerRadius="62%"
            paddingAngle={data.length > 1 ? 2 : 0}
            strokeWidth={data.length > 1 ? 1 : 0}
            stroke="rgba(245,240,232,0.8)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent hideLabel />} />
          {showLegend && (
            <Legend
              content={<ChartLegendContent payload={legendPayload} />}
              verticalAlign="bottom"
              align="center"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

PieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  dataKey: PropTypes.string,
  nameKey: PropTypes.string,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
  innerRadius: PropTypes.number,
  outerRadius: PropTypes.number,
  paddingAngle: PropTypes.number,
  cornerRadius: PropTypes.number,
  label: PropTypes.bool,
  labelLine: PropTypes.bool,
};
