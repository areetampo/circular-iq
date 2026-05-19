/**
 * @module HealthDistributionChart
 * @description Distribution of health-check outcomes across endpoints.
 */

import { useMemo } from 'react';

import { PieChart } from '@/components/charts';
import { DetailsBadge, Separator, Tilt3D } from '@/components/common';

import { ENDPOINTS } from '../constants';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { getHealthDistribution } from '../utils/uptimeCharts';

/**
 * Distribution of health-check outcomes across endpoints.
 *
 * @param {Object} props
 * @returns {import('react').ReactElement}
 */
export default function HealthDistributionChart({ ...props }) {
  const { latestPollResults, history, loadingInitial } = useUptimeMonitor();

  const dist = useMemo(() => {
    if (latestPollResults) {
      const categories = {
        healthy: { label: 'Healthy', count: 0, endpoints: [] },
        degraded: { label: 'Degraded', count: 0, endpoints: [] },
        unhealthy: { label: 'Unhealthy', count: 0, endpoints: [] },
        noData: { label: 'No Data', count: 0, endpoints: [] },
      };

      for (const ep of ENDPOINTS) {
        const result = latestPollResults.find((r) => r.endpointId === ep.id);
        if (!result) {
          categories.noData.count++;
          categories.noData.endpoints.push({ name: ep.label, ms: null });
          continue;
        }
        if (result.up) {
          if (result.responseTimeMs > 500) {
            categories.degraded.count++;
            categories.degraded.endpoints.push({ name: ep.label, ms: result.responseTimeMs });
          } else {
            categories.healthy.count++;
            categories.healthy.endpoints.push({ name: ep.label, ms: result.responseTimeMs });
          }
        } else {
          categories.unhealthy.count++;
          categories.unhealthy.endpoints.push({
            name: ep.label,
            ms: result.responseTimeMs ?? null,
          });
        }
      }

      return Object.values(categories);
    }

    return getHealthDistribution(history, ENDPOINTS);
  }, [latestPollResults, history]);

  const isLoading = loadingInitial && !latestPollResults;

  const data = useMemo(() => {
    if (!dist) return [];
    return dist
      .filter((d) => d.count > 0)
      .map((d) => ({ name: d.label, value: d.count, endpoints: d.endpoints }));
  }, [dist]);

  const colors = {
    Healthy: 'var(--color-success)',
    Degraded: 'var(--color-warning)',
    Unhealthy: 'var(--color-error)',
    'No Data': 'var(--color-text-muted)',
  };

  const hasAnyData = data.length > 0;

  return (
    <Tilt3D
      {...props}
      rotateRange={{ x: 1, y: 1 }}
      block
      className="h-full rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      <h3 className="mb-2 font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        Health Distribution — most recent check
      </h3>

      {isLoading ? (
        <DetailsBadge variant="info" message="Fetching..." spinner className="h-55" />
      ) : !hasAnyData ? (
        <DetailsBadge variant="error" message="No data available" className="h-55" />
      ) : (
        <PieChart
          data={data}
          dataKey="value"
          nameKey="name"
          height={220}
          showLegend={true}
          colors={data.map((d) => colors[d.name])}
          tooltipContent={({ active, payload }) => {
            if (active && payload && payload.length) {
              const { name, value, payload: dataPoint } = payload[0];
              const segmentColor = colors[name];
              return (
                <div className="max-w-xs rounded-md border border-(--color-border-ui) bg-(--color-app-bg) px-2 py-1.5 shadow-md">
                  <div className="mb-1 flex items-center gap-2 font-medium">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: segmentColor }}
                    />
                    <span className="text-(--color-text-primary)">{name}</span>
                    <span className="ml-auto font-mono text-xs">({value})</span>
                  </div>
                  <Separator wrapperCn="my-1" />
                  {dataPoint.endpoints?.length > 0 && (
                    <ul className="space-y-0.5">
                      {dataPoint.endpoints.map((ep, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-5 truncate text-xs text-(--color-text-secondary)"
                        >
                          <span>{ep.name}</span>
                          {ep?.ms && <span className="font-mono">{ep.ms} ms</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
      )}
    </Tilt3D>
  );
}

HealthDistributionChart.propTypes = {};
