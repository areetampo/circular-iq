import { Activity, Minus, TriangleAlert } from 'lucide-react';

import { DetailsBadge } from '@/components/common';
import { cn } from '@/utils/cn';

import {
  EndpointCard,
  EndpointLatencyBarChart,
  ExportMetricsButton,
  GlobalResponseTrendChart,
  HealthDistributionChart,
  SectionLabel,
  StatSummaryCard,
  StatusHeatmap,
  UptimeMonitorSkeleton,
  UptimeOverTimeChart,
} from './components';
import { ENDPOINTS } from './constants';
import { useUptimeMonitor } from './hooks/useUptimeMonitor';
import {
  getGlobalResponseTrend,
  getHealthDistribution,
  getLast24hStatus5min,
  getUptimeOverTime,
} from './utils/uptimeCharts';

export default function UptimeMonitorPage() {
  const { history, loadingInitial, nextUpdateSeconds } = useUptimeMonitor();

  if (loadingInitial) {
    return <UptimeMonitorSkeleton />;
  }

  const totalChecks = Object.values(history).reduce((sum, checks) => sum + checks.length, 0);

  const allChecks = ENDPOINTS.flatMap((e) => history[e.id] ?? []);
  const overallUp = ENDPOINTS.every((e) => {
    const last = (history[e.id] ?? []).slice(-1)[0];
    return !last || last.up;
  });

  const overallUptime = (() => {
    const perEp = ENDPOINTS.map((e) => {
      const c = history[e.id] ?? [];
      return c.length ? c.filter((x) => x.up).length / c.length : null;
    }).filter((v) => v !== null);
    if (!perEp.length) return null;
    return ((perEp.reduce((a, b) => a + b, 0) / perEp.length) * 100).toFixed(2);
  })();

  const hasNoData = !loadingInitial && totalChecks === 0;

  const overallStatusLabel = hasNoData ? 'unreachable' : overallUp ? 'all systems go' : 'degraded';

  const overallStatusClass = hasNoData
    ? 'text-(--color-error)'
    : overallUp
      ? 'text-(--color-success)'
      : 'text-(--color-error)';

  const headerIconClass = hasNoData
    ? 'text-(--color-error)'
    : overallUp
      ? 'text-(--color-success)'
      : 'text-(--color-error)';

  const healthDist = getHealthDistribution(history, ENDPOINTS);
  const globalTrend = getGlobalResponseTrend(history, ENDPOINTS);
  const uptimeOverTime = getUptimeOverTime(history, ENDPOINTS);
  const heatmapData = getLast24hStatus5min(history, ENDPOINTS);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pt-6">
        <div>
          <h1 className="flex items-center gap-3 font-sans text-[2rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
            <Activity size={28} strokeWidth={2.5} className={headerIconClass} />
            Uptime Monitor
          </h1>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-1 text-sm/relaxed text-(--color-text-secondary)">
            <span>
              Server-polling <span className="font-mono">{ENDPOINTS.length}</span> endpoints every{' '}
              <span className="font-mono">30s</span>
            </span>
            {!hasNoData && (
              <>
                <Minus size={16} strokeWidth={2} />
                <span>
                  <span className="font-mono">{totalChecks}</span> total checks stored
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <ExportMetricsButton history={history} endpoints={ENDPOINTS} hasNoData={hasNoData} />
          <p className="mt-2 pr-1 font-mono text-[0.65rem] font-medium text-(--color-text-muted)">
            Next update in {nextUpdateSeconds}s
          </p>
        </div>
      </div>

      {hasNoData && (
        <DetailsBadge
          variant="error"
          message="Unable to fetch server – no monitoring data available."
          icon={TriangleAlert}
          fullWidth
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatSummaryCard
          title="Overall uptime"
          value={overallUptime !== null ? `${overallUptime}%` : '—'}
          subtext="across all endpoints"
        />
        <StatSummaryCard
          title="Status"
          value={
            <span className={cn('tracking-wide', overallStatusClass)}>{overallStatusLabel}</span>
          }
          subtext={`${ENDPOINTS.length} endpoints`}
        />
        <StatSummaryCard title="Endpoints" value={ENDPOINTS.length} subtext="monitored" />
        <StatSummaryCard
          title="Total checks"
          value={hasNoData ? '—' : allChecks.length}
          subtext="in database"
        />
        <StatSummaryCard title="Update interval" value="30s" subtext="backend polling" />
      </div>

      {/* Charts 2x2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HealthDistributionChart
          healthy={healthDist.healthy}
          degraded={healthDist.degraded}
          unhealthy={healthDist.unhealthy}
          noData={healthDist.noData}
        />
        <GlobalResponseTrendChart data={globalTrend} />
        <UptimeOverTimeChart data={uptimeOverTime} />
        <EndpointLatencyBarChart history={history} endpoints={ENDPOINTS} />
      </div>

      {/* Full‑width heatmap */}
      <div className="w-full">
        <StatusHeatmap hours={heatmapData} hasNoData={hasNoData} />
      </div>

      {/* Endpoint Cards */}
      <SectionLabel label="Endpoints" count={ENDPOINTS.length} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ENDPOINTS.map((ep) => (
          <EndpointCard
            key={ep.id}
            endpoint={ep}
            checks={history[ep.id] ?? []}
            checking={false} // no active frontend checking
          />
        ))}
      </div>
    </div>
  );
}
