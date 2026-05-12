import { Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';

import { LineChart } from '@/components/charts';
import { Separator, Tilt3D } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { cleanUrl, formatRelativeTime } from '@/lib/formatting';
import { cn } from '@/utils/cn';

import { RECENT_CHECKS_DISPLAY_COUNT } from '../constants';
import HistoryBar from './HistoryBar';

function uptimePct(checks) {
  if (!checks || !checks.length) return null;
  return ((checks.filter((c) => c.up).length / checks.length) * 100).toFixed(2);
}

function avgMs(checks) {
  if (!checks) return null;
  const up = checks.filter((c) => c.up && c.ms);
  if (!up.length) return null;
  return Math.round(up.reduce((s, c) => s + c.ms, 0) / up.length);
}

function uptimeTextClass(pct) {
  if (pct === null) return 'text-(--color-text-muted)';
  const n = Number(pct);
  if (n >= 99) return 'text-(--color-success)';
  if (n >= 95) return 'text-(--color-warning)';
  return 'text-(--color-error)';
}

function dotBgClass(checks) {
  if (!checks || checks.length === 0) return 'bg-(--color-text-muted)';
  const latest = checks[checks.length - 1];
  if (!latest.up) return 'bg-(--color-error)';
  const n = Number(uptimePct(checks));
  if (n >= 99) return 'bg-(--color-success)';
  if (n >= 95) return 'bg-(--color-warning)';
  return 'bg-(--color-error)';
}

function getLatencyColor(avg) {
  if (avg === null || avg === undefined) return 'text-(--color-text-muted)';
  if (avg > 500) return 'text-(--color-danger)';
  if (avg > 200) return 'text-(--color-warning)';
  return 'text-(--color-success)';
}

function statusLabel(checks) {
  if (!checks || !checks.length) return 'pending';
  const latest = checks[checks.length - 1];
  if (!latest.up) return latest.status || 'error';
  const n = Number(uptimePct(checks));
  if (n >= 99) return 'operational';
  if (n >= 95) return 'degraded';
  return 'down';
}

function statusTextClass(checks) {
  if (!checks || !checks.length) return 'text-(--color-text-muted)';
  const latest = checks[checks.length - 1];
  if (!latest.up) return 'text-(--color-error)';
  const n = Number(uptimePct(checks));
  if (n >= 99) return 'text-(--color-success)';
  if (n >= 95) return 'text-(--color-warning)';
  return 'text-(--color-error)';
}

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

export default function EndpointCard({ endpoint, checks, checking, ...props }) {
  const API_URL = FRONTEND_CONFIG.apiUrl;
  const fullEndpointUrl = cleanUrl(`${API_URL}${endpoint.path}`, {
    stripProtocol: true,
    stripWww: true,
  });

  const hasData = checks && checks.length > 0;
  const pct = uptimePct(checks);
  const avg = avgMs(checks);
  const latest = hasData ? checks[checks.length - 1] : null;
  const sparkData = hasData
    ? checks.slice(-RECENT_CHECKS_DISPLAY_COUNT).map((c, i) => ({
        // x-axis is hidden so this label text is perfect for tooltip
        label: `Check ${String(i + 1)} of ${RECENT_CHECKS_DISPLAY_COUNT}`,
        ms: c.up ? c.ms : null,
      }))
    : [];

  // For metric display: show '—' when no data or value is null
  const displayPct = pct !== null && hasData ? `${pct}%` : '—';
  const displayPctClass =
    pct !== null && hasData ? uptimeTextClass(pct) : 'text-(--color-text-muted) pr-1';
  const displayAvg = avg !== null ? `${avg}ms` : '—';
  const displayAvgClass = avg === null ? 'pl-1' : '';
  const displayLastCheck = latest ? formatRelativeTime(latest.ts) : '—';
  const displayLastCheckClass = latest
    ? 'text-(--color-text-secondary)'
    : 'text-(--color-text-muted) pl-1';
  const displayStatus = statusLabel(checks);
  const displayChecksCount = hasData ? checks.length : '—';

  // Determine dot background class (use a neutral color for no data)
  const dotClass = hasData ? dotBgClass(checks) : 'bg-(--color-text-muted)';

  // For giving -mt-[] to metric stats
  const displayLineChart = hasData && checks.length > 2;

  return (
    <Tilt3D
      rotateRange={{ x: 1, y: 0.5 }}
      block
      className="flex h-full flex-col gap-4 rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-5"
      {...props}
    >
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
            <Tooltip delay={100}>
              <Tooltip.Trigger
                tabIndex={0}
                className="pl-0.5 font-mono text-[0.65rem] text-(--color-text-muted)"
              >
                {endpoint.path}
              </Tooltip.Trigger>
              <Tooltip.Content>{fullEndpointUrl}</Tooltip.Content>
            </Tooltip>
          </div>

          <p className="mt-1.75 text-xs text-(--color-text-secondary)">{endpoint.desc}</p>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={cn(
              'font-semantic font-mono text-2xl leading-none tracking-tight',
              displayPctClass,
            )}
          >
            {displayPct}
          </p>
          <p className="mt-1 font-mono text-[0.6rem] tracking-widest text-(--color-text-muted) uppercase">
            uptime
          </p>
        </div>
      </div>

      {/* History bar only if data exists */}
      {hasData && <HistoryBar checks={checks} count={RECENT_CHECKS_DISPLAY_COUNT} />}
      {/* Chart placeholder or "No data available" */}

      {!hasData && (
        <div className="flex h-32 items-center justify-center rounded-lg border border-(--color-border-faint) text-sm text-(--color-text-muted)">
          No monitoring data available
        </div>
      )}

      {displayLineChart && (
        <div>
          <p className="mb-4 font-mono text-[0.6rem] tracking-widest text-(--color-text-secondary) uppercase">
            response time — last {RECENT_CHECKS_DISPLAY_COUNT} checks
          </p>
          <LineChart
            data={sparkData}
            lines={[{ dataKey: 'ms', name: 'response time (ms)', color: 'var(--color-accent)' }]}
            xAxisKey="label"
            height={80}
            showLegend={false}
            variant="sparkline"
            margin={{ top: 2, right: 4, bottom: 8, left: 4 }}
          />
        </div>
      )}

      <Separator wrapperCn={cn(displayLineChart && '-mt-4')} />

      {/* Metrics footer */}
      <div className="flex items-stretch justify-between">
        <MetricCard
          label="Avg latency"
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
          valueClassName={cn('font-mono text-sm font-semibold uppercase', statusTextClass(pct))}
          className="shrink-0"
        />
        <MetricCard
          label="Checks"
          value={displayChecksCount}
          valueClassName="text-right font-mono text-sm text-(--color-text-muted) pr-1"
          className="shrink-0 text-right"
        />
      </div>
    </Tilt3D>
  );
}

EndpointCard.propTypes = {
  /** Endpoint configuration object */
  endpoint: PropTypes.object.isRequired,
  /** Array of check objects for this endpoint */
  checks: PropTypes.array.isRequired,
  /** Whether endpoint is currently being checked */
  checking: PropTypes.bool,
};
