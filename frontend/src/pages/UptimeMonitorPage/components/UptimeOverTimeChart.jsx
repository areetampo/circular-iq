/**
 * @module UptimeOverTimeChart
 * @description Line chart of uptime percentage over time for one endpoint.
 */

import { useEffect, useRef, useState } from 'react';

import { LineChart } from '@/components/charts';
import { DetailsBadge, Tilt3D } from '@/components/common';

import { UPTIME_CHART_DAYS } from '../constants';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { fetchDailyStats } from '../utils/uptimeHelpers';

/**
 * Line chart of uptime percentage over time for one endpoint.
 *
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function UptimeOverTimeChart({ ...props }) {
  const { pollCount } = useUptimeMonitor();
  const firstLoadDone = useRef(false);

  const [data, setData] = useState({ stats: [], days: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDailyStats(UPTIME_CHART_DAYS)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err) => logger.warn('Failed to fetch daily stats', err))
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

  const { stats = [], days } = data;
  const chartData = stats.map((stat) => ({
    dayLabel: stat.day,
    uptimePct: stat.uptimePct,
  }));
  const hasChartData = chartData.length > 0;
  const daysLabel = days ? `— last ${days} day${days > 1 && 's'}` : '';

  return (
    <Tilt3D
      {...props}
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Uptime % Over Time (daily) {daysLabel}
      </h3>
      {loading ? (
        <DetailsBadge variant="info" message="Fetching..." spinner className="h-65" />
      ) : !hasChartData ? (
        <DetailsBadge variant="error" message="No data available" className="h-65" />
      ) : (
        <LineChart
          data={chartData}
          lines={[{ dataKey: 'uptimePct', name: 'Uptime %', color: 'var(--color-success)' }]}
          xAxisKey="dayLabel"
          height={240}
          showLegend={false}
          tickAngle={-60}
          tickAnchor="end"
          margin={{ bottom: 60 }}
        />
      )}
    </Tilt3D>
  );
}

UptimeOverTimeChart.propTypes = {};
