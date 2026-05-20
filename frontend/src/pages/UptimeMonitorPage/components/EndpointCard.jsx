/**
 * @module EndpointCard
 * @description Per-endpoint uptime card: status, sparkline, latency, and recent check grid.
 */

import { Tooltip } from '@heroui/react';
import { ServerOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import { LineChart } from '@/components/charts';
import { DetailsBadge, Separator, Tilt3D } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { cleanUrl, formatDuration, formatRelativeTime, formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

import {
  ENDPOINT_CARD_HISTORY_BUCKET_MINUTES,
  ENDPOINT_CARD_HISTORY_WINDOW_HOURS,
  ENDPOINT_CARD_RECENT_WINDOW_MINUTES,
} from '../constants';
import HistoryGrid from './HistoryGrid';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { getRecentRawChecks } from '../utils/uptimeCharts';
import { fetchEndpointBuckets } from '../utils/uptimeHelpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** @param {Array<{ up: boolean }>} checks @returns {string|null} Uptime percentage fixed to 2 decimals. */
function uptimePct(checks) {
  if (!checks || !checks.length) return null;
  return ((checks.filter((c) => c.up).length / checks.length) * 100).toFixed(2);
}

/** @param {Array<{ up: boolean, ts: number }>} checks @returns {string} Tailwind background class for the status dot. */
function dotBgClass(checks) {
  if (!checks || checks.length === 0) return 'bg-(--color-text-muted)';
  const latest = checks[checks.length - 1];
  if (!latest.up) return 'bg-(--color-error)';
  const n = Number(uptimePct(checks));
  if (n >= 99) return 'bg-(--color-success)';
  if (n >= 95) return 'bg-(--color-warning)';
  return 'bg-(--color-error)';
}

/** @param {string|null} pct @returns {string} Tailwind text colour class for uptime percentage. */
function uptimeTextClass(pct) {
  if (pct === null) return 'text-(--color-text-muted)';
  const n = Number(pct);
  if (n >= 99) return 'text-(--color-success)';
  if (n >= 95) return 'text-(--color-warning)';
  return 'text-(--color-error)';
}

/** @param {Array<{ up: boolean, ms: number|null }>} checks @returns {number|null} Mean response time of successful checks. */
function avgMs(checks) {
  if (!checks) return null;
  const up = checks.filter((c) => c.up && c.ms);
  if (!up.length) return null;
  return Math.round(up.reduce((s, c) => s + c.ms, 0) / up.length);
}

/** @param {number|null|undefined} avg @returns {string} Tailwind text colour class for latency value. */
function getLatencyColor(avg) {
  if (avg === null || avg === undefined) return 'text-(--color-text-muted)';
  if (avg > 500) return 'text-(--color-danger)';
  if (avg > 200) return 'text-(--color-warning)';
  return 'text-(--color-success)';
}

/** @param {Array<{ up: boolean, status?: string }>} checks @returns {string} Human-readable status label. */
function statusLabel(checks) {
  if (!checks || !checks.length) return 'pending';
  const latest = checks[checks.length - 1];
  if (!latest.up) return latest.status || 'error';
  const n = Number(uptimePct(checks));
  if (n >= 99) return 'operational';
  if (n >= 95) return 'degraded';
  return 'down';
}

/** @param {Array<{ up: boolean }>} checks @returns {string} Tailwind text colour class for status label. */
function statusTextClass(checks) {
  if (!checks || !checks.length) return 'text-(--color-text-muted)';
  const latest = checks[checks.length - 1];
  if (!latest.up) return 'text-(--color-error)';
  const n = Number(uptimePct(checks));
  if (n >= 99) return 'text-(--color-success)';
  if (n >= 95) return 'text-(--color-warning)';
  return 'text-(--color-error)';
}

/**
 * Small labelled metric cell used in the endpoint card grid.
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.labelClassName]
 * @param {import('react').ReactNode} props.value
 * @param {string} [props.valueClassName]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
function MetricCard({
  label,
  labelClassName,
  value,
  valueClassName = 'text-(--color-text-secondary)',
  className,
}) {
  return (
    <div className={cn('flex flex-col justify-between', className)}>
      <p
        className={cn(
          'font-mono text-[0.6rem] tracking-widest text-(--color-text-muted) uppercase',
          labelClassName,
        )}
      >
        {label}
      </p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  labelClassName: PropTypes.string,
  value: PropTypes.node.isRequired,
  valueClassName: PropTypes.string,
  className: PropTypes.string,
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Per-endpoint uptime card: status, sparkline, latency, and recent check grid.
 *
 * @param {Object} props
 * @param {{ id: string, label: string, path?: string }} props.endpoint
 * @param {Array<{ ts: number, up: boolean, ms: number|null, status: string, data?: Object }>} props.checks
 * @param {boolean} props.checking
 * @param {boolean} props.clockAligned
 * @returns {import('react').ReactElement}
 */
export default function EndpointCard({
  endpoint,
  checks,
  checking,
  clockAligned = false,
  ...props
}) {
  const { pollCount } = useUptimeMonitor();
  const [buckets, setBuckets] = useState(null);
  const [bucketMeta, setBucketMeta] = useState({ bucketMinutes: null, hours: null });
  const [loadingBuckets, setLoadingBuckets] = useState(true);

  // Re-fetch on mount, every poll cycle, and whenever clockAligned changes
  useEffect(() => {
    let cancelled = false;
    setLoadingBuckets(true);
    fetchEndpointBuckets(
      endpoint.id,
      ENDPOINT_CARD_HISTORY_BUCKET_MINUTES,
      ENDPOINT_CARD_HISTORY_WINDOW_HOURS,
      clockAligned,
    )
      .then(({ buckets: fetchedBuckets, bucketMinutes, hours }) => {
        if (!cancelled) {
          setBuckets(fetchedBuckets);
          setBucketMeta({ bucketMinutes, hours });
        }
      })
      .catch(() => {
        if (!cancelled) setBuckets([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBuckets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint.id, pollCount, clockAligned]); // clockAligned in deps triggers immediate refetch

  // Derive display-ready chart label from bucket start/end timestamps
  const bucketsWithLabels = useMemo(() => {
    if (!buckets) return null;
    return buckets.map((b) => {
      const timeOpts = {
        showYear: false,
        showMonth: false,
        showDay: false,
        showSeconds: true,
        use24Hour: true,
      };
      return {
        ...b,
        chartLabel:
          b.startTime && b.endTime
            ? `${formatTimestamp(b.startTime, { ...timeOpts, showTimezone: false })} – ${formatTimestamp(b.endTime, timeOpts)}`
            : '',
      };
    });
  }, [buckets]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const hasData = checks && checks.length > 0;
  const latest = hasData ? checks[checks.length - 1] : null;

  const recentChecksData = useMemo(
    () => getRecentRawChecks(checks, ENDPOINT_CARD_RECENT_WINDOW_MINUTES),
    [checks],
  );

  const recentChecksCount = useMemo(() => {
    if (!hasData) return 0;
    const cutoff = Date.now() - ENDPOINT_CARD_RECENT_WINDOW_MINUTES * 60 * 1000;
    return checks.filter((c) => c.ts >= cutoff).length;
  }, [checks, hasData]);

  // Checks scoped to ENDPOINT_CARD_HISTORY_WINDOW_HOURS — used for footer metrics.
  // Keeps the headline numbers meaningful (24h) without being affected by session length.
  const windowChecks = useMemo(() => {
    if (!hasData) return [];
    const cutoff = Date.now() - ENDPOINT_CARD_HISTORY_WINDOW_HOURS * 60 * 60 * 1000;
    return checks.filter((c) => c.ts >= cutoff);
  }, [checks, hasData]);

  const pct = uptimePct(windowChecks);
  const avg = avgMs(windowChecks);

  // ── Display conditions ───────────────────────────────────────────────────────

  const displayNoDataPlaceholder = !hasData;
  const displayRecent =
    hasData && recentChecksData.length > 0 && recentChecksData.some((p) => p.ms !== null);
  const displayAggregatedHistoryGrid = buckets && buckets.length > 0;
  const displayBuckets = buckets && buckets.some((b) => b.avgMs !== null);

  // ── Labels (from server-echoed meta) ────────────────────────────────────────

  const recentLabel = formatDuration({ minutes: ENDPOINT_CARD_RECENT_WINDOW_MINUTES });
  const bucketWindowLabel = bucketMeta.hours ? formatDuration({ hours: bucketMeta.hours }) : null;
  const bucketSizeLabel = bucketMeta.bucketMinutes
    ? formatDuration({ minutes: bucketMeta.bucketMinutes })
    : null;

  // ── Display strings / classes ────────────────────────────────────────────────

  const displayPct = pct !== null && hasData ? `${pct}%` : '—';
  const displayPctClass =
    pct !== null && hasData ? uptimeTextClass(pct) : 'text-(--color-text-muted) pr-1';
  const displayAvg = avg !== null ? `${avg}ms` : '—';
  const displayAvgClass = avg === null ? 'pl-1' : '';
  const displayLastCheck = latest ? formatRelativeTime(latest.ts) : '—';
  const displayLastCheckClass = latest
    ? 'text-(--color-text-secondary)'
    : 'text-(--color-text-muted) pl-1';
  const displayStatus = statusLabel(windowChecks);
  const displayChecksCount = hasData ? windowChecks.length : '—';
  const dotClass = hasData ? dotBgClass(windowChecks) : 'bg-(--color-text-muted)';

  return (
    <Tilt3D
      {...props}
      rotateRange={{ x: 1, y: 0.5 }}
      block
      className="flex h-full flex-col gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-5"
    >
      {/* Header: dot · label · path · desc · uptime % */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('size-2 shrink-0 rounded-full', dotClass)} />
            <span className="truncate font-sniglet text-[0.9375rem] font-medium tracking-wider text-(--color-text-primary) uppercase">
              {endpoint.label}
            </span>
            {checking && (
              <span className="font-mono text-[0.6rem] font-medium tracking-widest text-(--color-warning) uppercase">
                checking…
              </span>
            )}
          </div>
          <div className="-mt-1.25">
            <Tooltip delay={0}>
              <Tooltip.Trigger tabIndex={0}>
                <p className="pl-0.5 font-mono text-[0.65rem] text-(--color-text-muted)">
                  {endpoint.path}
                </p>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {cleanUrl(`${FRONTEND_CONFIG.app.apiUrl}${endpoint.path}`, {
                  stripProtocol: true,
                  stripWww: true,
                })}
              </Tooltip.Content>
            </Tooltip>
          </div>
          <p className="mt-1.75 text-xs text-(--color-text-secondary)">{endpoint.desc}</p>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={cn(
              'font-mono text-2xl leading-none font-medium tracking-tight',
              displayPctClass,
            )}
          >
            {displayPct}
          </p>
          <p className="mt-1 font-mono text-[0.6rem] tracking-widest text-(--color-text-muted) uppercase">
            uptime ({formatDuration({ hours: ENDPOINT_CARD_HISTORY_WINDOW_HOURS })})
          </p>
        </div>
      </div>

      {/* No data */}
      {displayNoDataPlaceholder && (
        <DetailsBadge
          variant="error"
          icon={ServerOff}
          message="No monitoring data available"
          className="my-4"
        />
      )}

      {/* Recent section */}
      {displayRecent && (
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[0.6rem] tracking-widest text-(--color-text-secondary) uppercase">
            response time — last {recentLabel}
          </p>
          <HistoryGrid checks={checks} count={recentChecksCount} />
          <LineChart
            data={recentChecksData}
            lines={[{ dataKey: 'ms', name: 'response time (ms)', color: 'var(--color-accent)' }]}
            xAxisKey="label"
            height={80}
            showLegend={false}
            hideTooltipIndicator={true}
            variant="sparkline"
            margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          />
        </div>
      )}

      {/* Aggregated section */}
      {displayBuckets && (
        <div className="flex flex-col gap-4">
          <p className="*:font-mono *:text-[0.6rem] *:tracking-widest *:text-(--color-text-secondary) *:uppercase">
            <span>response time</span>
            {bucketWindowLabel && <span> — last {bucketWindowLabel}</span>}
            {bucketSizeLabel && <span> ({bucketSizeLabel} avg)</span>}
            {clockAligned && (
              <span className="text-(--color-clock-aligned-text)!"> — clock aligned</span>
            )}
          </p>
          {displayAggregatedHistoryGrid && (
            <HistoryGrid
              buckets={buckets.map((b) => ({
                hasData: b.hasData,
                anyFailure: b.anyFailure,
                isWarning: b.hasData && !b.anyFailure && b.avgMs !== null && b.avgMs > 500,
                isPartial: b.isPartial,
                averageMs: b.avgMs,
                startTime: b.startTime,
                endTime: b.endTime,
                failureTimestamps: (b.failureDetails || []).map((f) => f.ts),
              }))}
            />
          )}
          <LineChart
            data={bucketsWithLabels}
            lines={[
              { dataKey: 'avgMs', name: 'avg response time (ms)', color: 'var(--color-accent)' },
            ]}
            xAxisKey="chartLabel"
            height={60}
            showLegend={false}
            hideTooltipIndicator={true}
            variant="sparkline"
            margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          />
        </div>
      )}

      {/* Loading state for buckets when checks exist but buckets haven't arrived yet */}
      {hasData && loadingBuckets && !buckets && (
        <DetailsBadge variant="info" message="Fetching..." spinner className="mb-4" />
      )}

      {(displayRecent || displayBuckets) && <Separator wrapperCn="-mt-4" />}

      {/* Metrics footer */}
      <div className="flex items-stretch justify-between">
        <MetricCard
          label={`Avg latency (${formatDuration({ hours: ENDPOINT_CARD_HISTORY_WINDOW_HOURS })})`}
          value={displayAvg}
          valueClassName={cn(
            'font-mono text-base font-medium',
            getLatencyColor(avg),
            displayAvgClass,
          )}
          className="shrink-0"
        />
        <MetricCard
          label="Last check"
          value={displayLastCheck}
          valueClassName={cn('font-mono text-sm whitespace-nowrap', displayLastCheckClass)}
          className="px-5"
        />
        <MetricCard
          label="Status"
          value={displayStatus}
          valueClassName={cn(
            'font-mono text-sm font-semibold uppercase',
            statusTextClass(windowChecks),
          )}
          className="shrink-0"
        />
        <MetricCard
          label={`Checks (${formatDuration({ hours: ENDPOINT_CARD_HISTORY_WINDOW_HOURS })})`}
          value={displayChecksCount}
          valueClassName="text-right font-mono text-sm text-(--color-text-muted) pr-1"
          className="shrink-0 text-right"
        />
      </div>
    </Tilt3D>
  );
}

EndpointCard.propTypes = {
  endpoint: PropTypes.object.isRequired,
  checks: PropTypes.array.isRequired,
  checking: PropTypes.bool,
  clockAligned: PropTypes.bool,
};
