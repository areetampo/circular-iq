/**
 * @module UptimeMonitorPage
 * @description Operational dashboard for API/database health checks and uptime history.
 */

import { Label, Switch, Tooltip } from '@heroui/react';
import { Activity, Minus, RotateCw, ServerCog, ServerOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, DetailsBadge } from '@/components/common';
import { formatDuration } from '@/lib/formatting';
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
import { ENDPOINTS, REFETCH_INTERVAL_MS } from './constants';
import { useUptimeMonitor } from './hooks/useUptimeMonitor';

/**
 * Composes uptime charts, endpoint cards, and SSE-driven live updates.
 * @returns {import('react').ReactElement}
 */
export default function UptimeMonitorPage() {
  const {
    history,
    loadingInitial,
    nextUpdateSeconds,
    isUsingFallback,
    reconnect,
    isReconnecting,
    dbTotalChecks,
  } = useUptimeMonitor();

  const [fallbackTrigger, setFallbackTrigger] = useState(0);
  useEffect(() => {
    if (isUsingFallback) setFallbackTrigger((prev) => prev + 1);
  }, [isUsingFallback]);

  // Clock-aligned buckets toggle — passed down to all bucketed chart components.
  // false = rolling window (default behaviour, unchanged)
  // true  = bucket edges snap to nearest clock mark (whole hours, whole 15-min slots, etc.)
  const [clockAligned, setClockAligned] = useState(true);

  if (loadingInitial) return <UptimeMonitorSkeleton />;

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
  const overallStatusClass =
    hasNoData || !overallUp ? 'text-(--color-error)' : 'text-(--color-success)';
  const headerIconClass =
    hasNoData || !overallUp ? 'text-(--color-error)' : 'text-(--color-success)';

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 pt-6">
        {/* Left */}
        <div>
          <h1 className="flex items-center gap-3 font-sans text-[2rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
            <Activity size={28} strokeWidth={2.5} className={headerIconClass} />
            Uptime Monitor
          </h1>

          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-1 text-sm/relaxed text-(--color-text-secondary)">
            <span>
              Server-polling {ENDPOINTS.length} endpoints every{' '}
              {formatDuration({ ms: REFETCH_INTERVAL_MS })}
            </span>
            {dbTotalChecks && (
              <>
                <Minus size={16} strokeWidth={2} />
                <span>
                  <span className="font-mono">{dbTotalChecks}</span> total checks
                </span>
              </>
            )}
          </p>

          {/* Clock-aligned toggle */}
          <Switch
            id="toggle-clock-aligned-buckets"
            size="sm"
            isSelected={clockAligned}
            onChange={setClockAligned}
            className="pl-1"
          >
            <Tooltip delay={0}>
              <Tooltip.Trigger tabIndex={0} className="flex items-center gap-2">
                <Switch.Control>
                  <Switch.Thumb>
                    <Switch.Icon />
                  </Switch.Thumb>
                </Switch.Control>
                <Switch.Content>
                  <Label
                    htmlFor="toggle-clock-aligned-buckets"
                    className={cn(
                      'font-sniglet text-[0.7rem] tracking-wider text-mauve-500 uppercase',
                      !clockAligned && 'text-(--color-text-muted)',
                    )}
                  >
                    Clock-aligned buckets
                  </Label>
                </Switch.Content>
              </Tooltip.Trigger>
              <Tooltip.Content placement="bottom">
                <p className="whitespace-pre-wrap">
                  {clockAligned
                    ? 'Bucket edges snap to whole clock marks\n(e.g. 04:00, 04:15…).\nThe newest bucket is partial.'
                    : 'Rolling window — bucket edges shift with each page load.'}
                </p>
              </Tooltip.Content>
            </Tooltip>
          </Switch>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            {/* Reconnect button */}
            {(isUsingFallback || isReconnecting || hasNoData) && (
              <Tooltip delay={0}>
                <Tooltip.Trigger tabIndex={0}>
                  <Button
                    variant="success-soft"
                    isLoading={isReconnecting}
                    icon={RotateCw}
                    loadingIcon={RotateCw}
                    spinLoadingIcon
                    loadingIconInline
                    onPress={reconnect}
                    isDisabled={isReconnecting}
                  >
                    Reconnect
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {isReconnecting ? 'reconnecting...' : 'Reconnect to real-time updates'}
                </Tooltip.Content>
              </Tooltip>
            )}

            {/* Export CSV */}
            {!hasNoData && <ExportMetricsButton hasNoData={hasNoData} />}
          </div>

          <div className="flex gap-2 pr-1">
            {/* Connection status */}
            <Tooltip delay={0}>
              <Tooltip.Trigger tabIndex={0}>
                <div
                  className={cn(
                    'flex cursor-help items-center gap-2',
                    hasNoData && 'flex-row-reverse pr-1',
                  )}
                >
                  <span className="font-mono text-[0.65rem] font-medium text-(--color-text-muted) uppercase">
                    {hasNoData ? 'offline' : isUsingFallback ? 'polling' : 'live'}
                  </span>
                  <span className="relative flex size-2.5">
                    <span
                      className={cn(
                        'absolute inline-flex size-full animate-ping rounded-full opacity-75',
                        hasNoData
                          ? 'bg-(--color-error)'
                          : isUsingFallback
                            ? 'bg-(--color-warning)'
                            : 'bg-(--color-success)',
                      )}
                    />
                    <span
                      className={cn(
                        'relative inline-flex size-2.5 rounded-full',
                        hasNoData
                          ? 'bg-(--color-error)'
                          : isUsingFallback
                            ? 'bg-(--color-warning)'
                            : 'bg-(--color-success)',
                      )}
                    />
                  </span>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {hasNoData
                  ? 'No data – server unreachable.'
                  : isUsingFallback
                    ? `Real‑time connection lost – using polling (every ${formatDuration({ ms: REFETCH_INTERVAL_MS })}).`
                    : 'Real‑time SSE active – updates arrive immediately.'}
              </Tooltip.Content>
            </Tooltip>

            {/* Countdown */}
            {!hasNoData && (
              <p className="font-mono text-[0.65rem] font-medium text-(--color-text-muted)">
                Next update in {formatDuration({ seconds: nextUpdateSeconds })}
              </p>
            )}
          </div>
        </div>
      </div>

      {hasNoData && !isReconnecting && (
        <DetailsBadge
          variant="error"
          message="Unable to fetch server – no monitoring data available."
          icon={ServerOff}
          fullWidth
        />
      )}

      {!hasNoData && isUsingFallback && !isReconnecting && (
        <DetailsBadge
          key={fallbackTrigger}
          variant="warning"
          message="Real‑time updates disconnected – falling back to polling."
          icon={ServerCog}
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
          subtext="fetched in session"
        />
        <StatSummaryCard
          title="Update interval"
          value={formatDuration({ ms: REFETCH_INTERVAL_MS })}
          subtext="server polling"
        />
      </div>

      {/* Charts 2x2 — clockAligned passed to bucketed charts only */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HealthDistributionChart />
        <GlobalResponseTrendChart clockAligned={clockAligned} />
        <UptimeOverTimeChart />
        <EndpointLatencyBarChart />
      </div>

      {/* Heatmap */}
      <StatusHeatmap clockAligned={clockAligned} />

      {/* Endpoint Cards */}
      <SectionLabel label="Endpoints" count={ENDPOINTS.length} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ENDPOINTS.map((ep) => (
          <EndpointCard
            key={ep.id}
            endpoint={ep}
            checks={history[ep.id] ?? []}
            checking={false}
            clockAligned={clockAligned}
          />
        ))}
      </div>
    </div>
  );
}
