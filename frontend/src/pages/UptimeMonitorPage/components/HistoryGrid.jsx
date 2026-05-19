/**
 * @module HistoryGrid
 * @description Chronological dot grid of recent uptime checks for one endpoint.
 */

import { Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

import { REFETCH_INTERVAL_MS } from '../constants';

/**
 * Maps bucket/check state to a Tailwind background class.
 * @param {boolean} hasData
 * @param {boolean} anyFailure
 * @param {boolean} isWarning
 * @param {boolean} isPartial
 * @returns {string}
 */
function getStatusColor(hasData, anyFailure, isWarning, isPartial) {
  if (isPartial) return 'bg-(--color-clock-aligned-block)';
  if (!hasData) return 'bg-(--color-border-ui)';
  if (anyFailure) return 'bg-(--color-error)';
  if (isWarning) return 'bg-(--color-warning)';
  return 'bg-(--color-success)';
}

/**
 * HistoryGrid — colour-coded history bar.
 *
 * Two modes:
 *
 *  RAW mode  — pass `checks` + `count`
 *    Used by EndpointCard recent section.
 *    Each item is a raw check: { ts, up, ms, status }
 *    The rightmost bar turns purple when its check is overdue (> REFETCH_INTERVAL_MS old).
 *
 *  AGGREGATED mode  — pass `buckets`
 *    Used by EndpointCard 24h section (DB-backed) and StatusHeatmap.
 *    Each item: { hasData, anyFailure, isWarning, isPartial, averageMs,
 *                 startTime, endTime, failureTimestamps? }
 *    startTime / endTime may be real timestamps, Date objects, or pre-formatted strings.
 *    The last bucket has isPartial=true (set by the DB function) → rendered purple.
 */
export default function HistoryGrid({ checks, count, buckets, ...props }) {
  let items = [];
  let tooltipFormatter;

  if (buckets) {
    // ── Aggregated mode ──────────────────────────────────────────────────────
    items = buckets;
    // count=recentChecksCount for recent checks correctly represents total number of recent checks in ENDPOINT_CARD_RECENT_WINDOW_MINUTES
    // for ENDPOINT_CARD_HISTORY, chount is total buckets present which is also equal to (ENDPOINT_CARD_HISTORY_WINDOW_HOURS * 60) / ENDPOINT_CARD_HISTORY_BUCKET_MINUTES
    count = items.length;

    tooltipFormatter = (bucket) => {
      const timeOpts = {
        showYear: false,
        showMonth: false,
        showDay: false,
        showSeconds: true,
        use24Hour: true,
      };

      // endTime from DB buckets is already the full "HH:MM – HH:MM" range string;
      // startTime is just "HH:MM". We display endTime as the full range label.
      const startStr = formatTimestamp(bucket?.startTime, { ...timeOpts, showTimezone: false });
      const endStr = formatTimestamp(bucket?.endTime, timeOpts);
      const timeDisplay = `[${startStr} - ${endStr}]`;

      if (bucket.isPartial) {
        if (!bucket.hasData) return `${timeDisplay}\nPARTIAL BUCKET — collecting…`;
        const avgStr = bucket.averageMs != null ? `Avg: ${bucket.averageMs} ms` : 'no avg yet';
        if (bucket.anyFailure) {
          const tsLines = (bucket.failureTimestamps || [])
            .map((ts) => formatTimestamp(ts, { ...timeOpts, showSeconds: true }))
            .join(', ');
          return `${timeDisplay}\nPARTIAL BUCKET — ${avgStr}\nFAILURE(S)${tsLines ? `\n${tsLines}` : ''}`;
        }
        return `${timeDisplay}\nPARTIAL BUCKET — ${avgStr}`;
      }

      if (!bucket.hasData) return `${timeDisplay}\nNO DATA`;

      const avgStr = bucket.averageMs != null ? `${bucket.averageMs} ms` : '—';

      if (bucket.anyFailure) {
        // failureTimestamps may be absent when coming from DB aggregation (not per-check)
        const tsLines = (bucket.failureTimestamps || [])
          .map((ts) => formatTimestamp(ts, timeOpts))
          .join(', ');
        return `${timeDisplay}\nAvg: ${avgStr}\nFAILURE(S)${tsLines ? `\n${tsLines}` : ''}`;
      }

      if (bucket.isWarning) return `${timeDisplay}\nHIGH LATENCY\nAvg: ${avgStr}`;
      return `${timeDisplay}\nALL GOOD\nAvg: ${avgStr}`;
    };
  } else {
    // ── Raw checks mode ──────────────────────────────────────────────────────
    const displayChecks = checks.slice(-count);
    const emptyCount = Math.max(0, count - displayChecks.length);
    items = [...Array(emptyCount).fill(null), ...displayChecks];

    const timeOpts = {
      showYear: false,
      showMonth: false,
      showDay: false,
      showSeconds: true,
      use24Hour: true,
    };

    tooltipFormatter = (check, idx) => {
      const ts = (() => {
        if (check?.ts) return check.ts;
        const firstCheck = displayChecks[0];
        if (!firstCheck) return null;
        const stepsBack = emptyCount - idx;
        return firstCheck.ts - stepsBack * REFETCH_INTERVAL_MS;
      })();

      const timeStr = `[${formatTimestamp(ts, timeOpts)}]\n`;
      const status = check?.status?.toUpperCase() ?? 'NO DATA';
      const duration = check?.ms ? `\n${check.ms}ms` : '';
      return `${timeStr}${status}${duration}`;
    };
  }

  return (
    <div {...props} className="flex flex-wrap justify-center gap-0.5">
      {items.map((item, idx) => {
        const sizeClass = 'size-3';
        const opacity = item ? 0.45 + (idx / count) * 0.55 : 1;

        const colorClass = item
          ? buckets
            ? getStatusColor(item.hasData, item.anyFailure, item.isWarning, item.isPartial)
            : (() => {
                if (!item.up) return 'bg-(--color-error)';
                const s = item.status?.toLowerCase();
                if (s === 'degraded' || s === 'warning') return 'bg-(--color-warning)';
                return 'bg-(--color-success)';
              })()
          : 'bg-(--color-accent)/10';

        const tooltipContent = tooltipFormatter(item, idx);

        return (
          <Tooltip key={idx} delay={0}>
            <Tooltip.Trigger
              tabIndex={0}
              style={{ opacity }}
              className={cn(
                'z-0 rounded-full',
                sizeClass,
                colorClass,
                'transition-transform duration-200 ease-in-out-cubic',
                'hover:z-10 hover:-translate-y-3 hover:scale-y-300',
              )}
            />
            <Tooltip.Content>
              <p className="max-h-64 max-w-xs overflow-y-auto whitespace-pre-wrap">
                {tooltipContent}
              </p>
            </Tooltip.Content>
          </Tooltip>
        );
      })}
    </div>
  );
}

HistoryGrid.propTypes = {
  checks: PropTypes.array,
  count: PropTypes.number,
  buckets: PropTypes.array,
};
