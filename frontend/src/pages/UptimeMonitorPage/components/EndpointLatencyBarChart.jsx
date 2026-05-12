import PropTypes from 'prop-types';

import { BarChart } from '@/components/charts';
import { Tilt3D } from '@/components/common';

function getLatencyColor(ms) {
  if (ms < 200) return 'var(--color-success)';
  if (ms < 500) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/**
 * EndpointLatencyBarChart - A bar chart showing average latency per endpoint
 * Displays average response times for each endpoint in a bar chart
 *
 * @param {Object} props - Component props
 * @param {Object} props.history - History object mapping endpoint IDs to check arrays
 * @param {Array} props.endpoints - Array of endpoint configuration objects
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element|null} Rendered EndpointLatencyBarChart or null if no data
 *
 * @example
 * Basic usage
 * <EndpointLatencyBarChart history={uptimeHistory} endpoints={endpointList} />
 *
 * @example
 * With empty data
 * <EndpointLatencyBarChart history={{}} endpoints={[]} />
 */
export default function EndpointLatencyBarChart({ history, endpoints, ...props }) {
  const data = endpoints
    .map((ep) => {
      const checks = history[ep.id] || [];
      const upChecks = checks.filter((c) => c.up && c.ms);
      const avg = upChecks.length
        ? upChecks.reduce((sum, c) => sum + c.ms, 0) / upChecks.length
        : 0;
      return { name: ep.label, avgLatency: Math.round(avg), barColor: getLatencyColor(avg) };
    })
    .filter((d) => !isNaN(d.avgLatency) && d.avgLatency > 0)
    .sort((a, b) => b.avgLatency - a.avgLatency);

  const hasData = data.length > 0;
  const barColors = data.map((item) => getLatencyColor(item.avgLatency));

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
      {...props}
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Avg Response Time by Endpoint (ms)
      </h3>
      {!hasData ? (
        <div className="flex h-55 items-center justify-center text-sm text-(--color-text-muted)">
          No data available
        </div>
      ) : (
        <BarChart
          data={data}
          barConfigs={[
            { dataKey: 'avgLatency', name: 'response time (ms)', fill: 'var(--color-accent)' },
          ]}
          xAxisKey="name"
          height={280}
          showLegend={false}
          tickAngle={-30}
          tickAnchor="end"
          barColors={barColors}
        />
      )}
    </Tilt3D>
  );
}

EndpointLatencyBarChart.propTypes = {
  /** History object mapping endpoint IDs to check arrays */
  history: PropTypes.object.isRequired,
  /** Array of endpoint configuration objects */
  endpoints: PropTypes.array.isRequired,
};
