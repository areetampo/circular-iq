/**
 * @module GlobalResponseTrendChart
 * @description Hourly global average response-time trend chart (clock-aligned buckets).
 */

import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { LineChart } from '@/components/charts';
import { DetailsBadge, Tilt3D } from '@/components/common';
import { formatDuration, formatTimestamp, getTimezoneLabel } from '@/lib/formatting';

import { TREND_CHART_HOURS } from '../constants';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { fetchGlobalTrend } from '../utils/uptimeHelpers';

/**
 * Hourly global average response-time trend chart (clock-aligned buckets).
 *
 * @param {Object} props
 * @param {boolean} props.clockAligned
 * @returns {import('react').ReactElement}
 */
export default function GlobalResponseTrendChart({ clockAligned = false, ...props }) {
  const { pollCount } = useUptimeMonitor();
  const [trend, setTrend] = useState(null);
  const [hours, setHours] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchGlobalTrend(TREND_CHART_HOURS, clockAligned)
      .then((data) => {
        if (!cancelled) {
          setHours(data.hours);
          setTrend(
            data.trend.map((p) => ({
              ...p,
              hourLabel: formatTimestamp(p.hourLabel, {
                showYear: false,
                showMonth: false,
                showDay: false,
                use24Hour: true,
                showTimezone: false,
              }),
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setTrend([]);
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
  }, [pollCount, clockAligned]); // re-fetch when toggle changes

  useEffect(() => {
    firstLoadDone.current = false;
    setLoading(true);
  }, [clockAligned]);

  const validPoints = (trend || []).filter((p) => p.avgResponseTime !== null).length;
  const hasData = (trend || []).length > 0;
  const hasValidData = validPoints >= 2;
  const windowLabel = hours ? formatDuration({ hours }) : null;

  return (
    <Tilt3D
      {...props}
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="-mt-2 mb-2 *:font-mono *:text-[0.65rem] *:font-semibold *:tracking-widest *:text-(--color-text-muted) *:uppercase">
        <span>Global Avg Response Time</span>
        {windowLabel && (
          <span>
            {' '}
            — last {windowLabel} ({getTimezoneLabel({ style: 'minimal' })})
          </span>
        )}
        {clockAligned && (
          <span className="text-(--color-clock-aligned-text)!"> — clock-aligned</span>
        )}
      </h3>

      {loading ? (
        <DetailsBadge variant="info" message="Fetching latest data..." spinner className="h-55" />
      ) : !hasData ? (
        <DetailsBadge variant="error" message="No data available" className="h-55" />
      ) : !hasValidData ? (
        <DetailsBadge
          variant="warning"
          message="Insufficient data to display trend"
          className="h-55"
        />
      ) : (
        <LineChart
          data={trend}
          lines={[
            {
              dataKey: 'avgResponseTime',
              name: 'response time (ms)',
              color: 'var(--color-accent)',
            },
          ]}
          xAxisKey="hourLabel"
          height={220}
          showLegend={false}
          tickAngle={-45}
          tickAnchor="end"
        />
      )}
    </Tilt3D>
  );
}

GlobalResponseTrendChart.propTypes = {
  clockAligned: PropTypes.bool,
};
