import PropTypes from 'prop-types';

import { LineChart } from '@/components/charts';
import { Tilt3D } from '@/components/common';

/**
 * GlobalResponseTrendChart - A line chart showing global response time trends
 * Displays average response time over the last 24 hours
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects with hourLabel and avgResponseTime properties
 * @param {boolean} [props.hasNoData=false] - Whether to show no data state
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered GlobalResponseTrendChart
 *
 * @example
 * Basic usage
 * <GlobalResponseTrendChart data={responseTimeData} />
 *
 * @example
 * With empty data
 * <GlobalResponseTrendChart data={[]} />
 */
export default function GlobalResponseTrendChart({ data, hasNoData = false, ...props }) {
  // Check if there are at least 2 valid data points to draw a line
  const validPoints = data?.filter((point) => point.avgResponseTime !== null).length || 0;
  const hasValidData = validPoints >= 2;

  // Generate all 24 hour labels
  const allHourLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
      {...props}
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Global Avg Response Time (last 24h)
      </h3>

      {hasNoData ? (
        <div className="flex h-55 items-center justify-center text-sm text-(--color-text-muted)">
          No data available
        </div>
      ) : !hasValidData ? (
        <div className="flex h-55 items-center justify-center text-sm text-(--color-text-muted)">
          Insufficient data to display trend
        </div>
      ) : (
        <LineChart
          data={data}
          lines={[
            {
              dataKey: 'avgResponseTime',
              name: 'Response Time (ms)',
              color: 'var(--color-accent)',
            },
          ]}
          xAxisKey="hourLabel"
          height={220}
          showLegend={false}
          ticks={allHourLabels}
          tickAngle={-45}
          tickAnchor="end"
        />
      )}
    </Tilt3D>
  );
}

GlobalResponseTrendChart.propTypes = {
  /** Array of data objects with hourLabel and avgResponseTime properties */
  data: PropTypes.array.isRequired,
  /** Whether to show no data state */
  hasNoData: PropTypes.bool,
};
