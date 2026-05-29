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
import { resolveCSSVar } from '@/utils/chartHelpers';
import { cn } from '@/utils/cn';

// Resolve palette tokens at render time so theme variables are available.
const getWarmFallbackColors = () => [
  resolveCSSVar('var(--chart-1)', '#b8916a'), // bronze/tan
  resolveCSSVar('var(--chart-2)', '#4a7c59'), // forest green
  resolveCSSVar('var(--chart-4)', '#8b3a3a'), // muted terracotta
  resolveCSSVar('var(--color-material-slate)', '#5a7a9a'), // slate blue
  resolveCSSVar('var(--chart-3)', '#b07d3a'), // muted amber
  resolveCSSVar('var(--color-material-plum)', '#7a5c7a'), // plum
  resolveCSSVar('var(--color-material-ocean)', '#3a6b8b'), // ocean blue
  resolveCSSVar('var(--color-material-warm)', '#b8916a'), // warm brown
  resolveCSSVar('var(--color-material-sage)', '#6b8b5a'), // sage
  resolveCSSVar('var(--chart-6)', '#9a8f82'), // tan
];

/**
 * Renders a responsive pie or donut chart with CSS-variable palette fallbacks and loading/empty states.
 */
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
  tooltipContent,
  margin,
  // Keep Recharts-only props out of the DOM-spread props to avoid React validation warnings.
  outerRadius,
  label,
  labelLine,
  paddingAngle,
  cornerRadius,
  ...props
}) {
  if (isLoading) {
    return (
      <div {...props} className={className} style={{ height }}>
        <Skeleton className="size-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div
        {...props}
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

  const palette = colors?.length ? colors : getWarmFallbackColors();

  // ChartContainer uses this metadata to label tooltip and legend entries.
  const config = Object.fromEntries(
    data.map((item, i) => [
      item[nameKey] || `item-${i}`,
      { label: item[nameKey] || `Item ${i + 1}`, color: palette[i % palette.length] },
    ]),
  );

  // The custom legend expects an explicit payload because colors are assigned per slice.
  const legendPayload = data.map((item, i) => ({
    value: item[nameKey] || `Item ${i + 1}`,
    color: palette[i % palette.length],
    type: 'square',
  }));

  return (
    <ChartContainer {...props} config={config} className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8, ...margin }}>
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
            stroke="var(--color-chart-stroke)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip content={tooltipContent || <ChartTooltipContent hideLabel />} />
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
  margin: PropTypes.object,
  tooltipContent: PropTypes.elementType,
  outerRadius: PropTypes.number,
  paddingAngle: PropTypes.number,
  cornerRadius: PropTypes.number,
  label: PropTypes.bool,
  labelLine: PropTypes.bool,
};
