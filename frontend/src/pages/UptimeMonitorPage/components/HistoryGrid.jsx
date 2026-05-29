import { Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';

import { formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

import { REFETCH_INTERVAL_MS } from '../constants';

/**
 * Maps bucket/check state to a Tailwind background class.
 *
 * @param {boolean} hasData - Whether the bucket contains at least one check.
 * @param {boolean} anyFailure - Whether any check in the bucket failed.
 * @param {boolean} isWarning - Whether the bucket is healthy but above the latency warning threshold.
 * @param {boolean} isPartial - Whether the bucket is a clock-aligned partial edge bucket.
 * @returns {string} Tailwind background class for the status block.
 */
function getStatusColor(hasData, anyFailure, isWarning, isPartial) {
  if (isPartial) return 'bg-(--color-clock-aligned-block)';
  if (!hasData) return 'bg-(--color-border-ui)';
  if (anyFailure) return 'bg-(--color-error)';
  if (isWarning) return 'bg-(--color-warning)';
  return 'bg-(--color-success)';
}

/**
 * Colour-coded dot grid of recent checks for one endpoint. Two modes:
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
      };

      // endTime from DB buckets is already the full "HH:MM – HH:MM" range string;
      // startTime is just "HH:MM". We display endTime as the full range label.
      const startStr = formatTimestamp(bucket?.startTime, { ...timeOpts, showTimezone: false });
      const endStr = formatTimestamp(bucket?.endTime, timeOpts);
      const timeDisplay = `[${startStr} - ${endStr}]`;

      if (bucket.isPartial) {
        if (!bucket.hasData) return `${timeDisplay}\nPARTIAL BUCKET — collecting…`;

        const avgStr = `Avg — ${bucket.averageMs !== null ? `${bucket.averageMs} ms` : '[no avg yet]'}`;

        if (bucket.anyFailure) {
          const failureTs = (bucket.failureTimestamps || [])
            .map((ts) => {
              return ts ? formatTimestamp(ts, { ...timeOpts, showSeconds: true }) : null;
            })
            .filter(Boolean);

          const count = failureTs.length;
          const failuresJoined = failureTs.join('\n');

          return `${timeDisplay}\nPARTIAL BUCKET\n${avgStr}\nFAILURE(S) - ${count}${failuresJoined ? `\n${failuresJoined}` : ''}`;
        }
        return `${timeDisplay}\nPARTIAL BUCKET\n${avgStr}`;
      }

      if (!bucket.hasData) return `${timeDisplay}\nNO DATA`;

      const avgStr = `Avg — ${bucket.averageMs !== null ? `${bucket.averageMs} ms` : '[no data available]'}`;

      if (bucket.anyFailure) {
        // failureTimestamps may be absent when coming from DB aggregation (not per-check)
        const failureTs = (bucket.failureTimestamps || [])
          .map((ts) => {
            return ts ? formatTimestamp(ts, { ...timeOpts, showSeconds: true }) : null;
          })
          .filter(Boolean);

        const count = failureTs.length;
        const failuresJoined = failureTs.join('\n');

        return `${timeDisplay}\n${avgStr}\nFAILURE(S) - ${count}${failuresJoined ? `\n${failuresJoined}` : ''}`;
      }

      if (bucket.isWarning) return `${timeDisplay}\nHIGH LATENCY\n${avgStr}`;
      return `${timeDisplay}\nALL GOOD\n${avgStr}`;
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
    };

    tooltipFormatter = (check, idx) => {
      const ts = (() => {
        if (check?.ts) return check.ts;
        const firstCheckTs = displayChecks[0]?.ts ?? new Date(Date.now() + REFETCH_INTERVAL_MS);
        const stepsBack = emptyCount - idx;
        return firstCheckTs - stepsBack * REFETCH_INTERVAL_MS;
      })();

      const timeStr = `[${formatTimestamp(ts, timeOpts)}]`;
      const status = check?.status?.toUpperCase() ?? 'NO DATA';
      const duration = check?.ms ? `\n${check.ms} ms` : '';
      return `${timeStr}\n${status}${duration}`;
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
