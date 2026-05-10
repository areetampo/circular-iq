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

// Warm palette fallback — factory function to resolve at render time
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

// Note: Use getter function directly instead of Proxy export
// Example: getWarmFallbackColors() instead of WARM_FALLBACK_COLORS

/**
 * PieChart component for displaying proportional data in a circular format
 * Uses Recharts library with responsive design and theming support
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects to display
 * @param {string} props.dataKey - Key in data object for segment values (default: 'value')
 * @param {string} props.nameKey - Key in data object for segment names (default: 'name')
 * @param {number} props.height - Height of the chart in pixels (default: 300)
 * @param {boolean} props.showLegend - Whether to show legend (default: true)
 * @param {boolean} props.isLoading - Whether to show loading state (default: false)
 * @param {string} props.className - Additional CSS classes (optional)
 * @param {Array} props.colors - Array of colors for segments (optional)
 * @param {number} props.innerRadius - Inner radius for donut chart (default: 0)
 * @param {Object} props.margin - Additional margin overrides (optional)
 *
 * @example
 * <PieChart
 *   data={[{ name: 'Category A', value: 30 }, { name: 'Category B', value: 70 }]}
 *   height={400}
 *   showLegend={true}
 * />
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
  margin = {},
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

  const palette = colors?.length ? colors : getWarmFallbackColors();

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
  margin: PropTypes.object,
};
