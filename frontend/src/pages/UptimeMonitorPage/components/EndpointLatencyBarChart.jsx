/**
 * Bar chart of average latency per monitored endpoint.
 */

import { useEffect, useRef, useState } from 'react';

import { BarChart } from '@/components/charts';
import { DetailsBadge, Tilt3D } from '@/components/common';
import { formatDuration } from '@/lib/formatting';

import { ENDPOINTS, LATENCY_CHART_HOURS } from '../constants';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { fetchEndpointLatency } from '../utils/uptimeHelpers';

/**
 * Maps latency thresholds to the CSS colour variable used for endpoint bars.
 *
 * @param {number} ms - Average endpoint response time in milliseconds.
 * @returns {string} CSS colour variable for success, warning, or error bar fill.
 */
function getLatencyColor(ms) {
  if (ms < 200) return 'var(--color-success)';
  if (ms < 500) return 'var(--color-warning)';
  return 'var(--color-error)';
}

/**
 * Bar chart of mean latency per endpoint over `LATENCY_CHART_HOURS`; colours bars by threshold.
 */
export default function EndpointLatencyBarChart({ ...props }) {
  const { pollCount } = useUptimeMonitor();
  const [data, setData] = useState(null);
  const [hours, setHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchEndpointLatency(LATENCY_CHART_HOURS)
      .then(({ latency, hours: echoedHours }) => {
        if (cancelled) return;
        setHours(echoedHours);
        const chartData = ENDPOINTS.map((ep) => {
          const row = latency.find((r) => r.endpointId === ep.id);
          return row ? { name: ep.label, avgLatency: row.avgMs, endpointId: ep.id } : null;
        })
          .filter(Boolean)
          .filter((d) => d.avgLatency > 0)
          .sort((a, b) => b.avgLatency - a.avgLatency);
        setData(chartData);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled && !firstLoadDone.current) {
          firstLoadDone.current = true;
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pollCount]);

  const barColors = (data || []).map((item) => getLatencyColor(item.avgLatency));
  const hasData = data && data.length > 0;

  // Use echoed-back hours from the server for the heading, same pattern as daily-stats/heatmap
  const windowLabel = hours ? formatDuration({ hours }) : null;

  return (
    <Tilt3D
      {...props}
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Avg Response Time by Endpoint{windowLabel && ` — last ${windowLabel}`}
      </h3>

      {loading ? (
        <DetailsBadge variant="info" message="Fetching latest data..." spinner className="h-55" />
      ) : !hasData ? (
        <DetailsBadge variant="error" message="No data available" className="h-55" />
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

EndpointLatencyBarChart.propTypes = {};
