import PropTypes from 'prop-types';

import { LineChart } from '@/components/charts';
import { Tilt3D } from '@/components/common';

/**
 * UptimeOverTimeChart - A line chart showing uptime percentage over time
 * Displays daily uptime trends with a line chart visualization
 *
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects with dayLabel and uptimePct properties
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element|null} Rendered UptimeOverTimeChart or null if no data
 *
 * @example
 * Basic usage
 * <UptimeOverTimeChart data={uptimeData} />
 *
 * @example
 * With empty data
 * <UptimeOverTimeChart data={[]} />
 */
export default function UptimeOverTimeChart({ data, ...props }) {
  const hasData = data && data.length > 0;

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
      {...props}
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Uptime % Over Time (daily)
      </h3>
      {!hasData ? (
        <div className="flex h-55 items-center justify-center text-sm text-(--color-text-muted)">
          No data available
        </div>
      ) : (
        <LineChart
          data={data}
          lines={[{ dataKey: 'uptimePct', name: 'Uptime %', color: 'var(--color-success)' }]}
          xAxisKey="dayLabel"
          height={220}
          showLegend={false}
        />
      )}
    </Tilt3D>
  );
}

UptimeOverTimeChart.propTypes = {
  /** Array of data objects with dayLabel and uptimePct properties */
  data: PropTypes.array.isRequired,
};
