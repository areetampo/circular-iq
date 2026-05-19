/**
 * @module StatusHeatmap
 * @description Bucketed multi-endpoint uptime heatmap over the selected window.
 */

import { Label, ListBox, Select, Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { DetailsBadge, Tilt3D } from '@/components/common';
import { formatDuration, formatTimestamp } from '@/lib/formatting';
import { cn } from '@/utils/cn';

import {
  HEATMAP_BUCKET_PRESETS_MINUTES,
  HEATMAP_DEFAULT_BUCKET_MINUTES,
  HEATMAP_DEFAULT_WINDOW_MINUTES,
  HEATMAP_MAX_BARS,
  HEATMAP_WINDOW_PRESETS_MINUTES,
} from '../constants';
import { useUptimeMonitor } from '../hooks/useUptimeMonitor';
import { fetchHeatmapAggregated } from '../utils/uptimeHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the largest bucket preset that:
 *   (a) is strictly less than windowMinutes, and
 *   (b) keeps bar count within HEATMAP_MAX_BARS.
 *
 * Used when either constraint would be violated by the current bucket — e.g.
 * the user picks a window smaller than the active bucket, or the bar count
 * would exceed the limit. Falls back to the smallest preset as a last resort.
 */
function bestBucketForWindow(windowMinutes, currentBucketMinutes) {
  const valid = HEATMAP_BUCKET_PRESETS_MINUTES.filter(
    (b) => b < windowMinutes && windowMinutes / b <= HEATMAP_MAX_BARS,
  );
  if (valid.length === 0) return HEATMAP_BUCKET_PRESETS_MINUTES[0];

  // Prefer keeping the current bucket if it's still valid.
  if (valid.includes(currentBucketMinutes)) return currentBucketMinutes;

  // Otherwise pick the largest valid bucket (closest to current without exceeding limits).
  return valid[valid.length - 1];
}

function getStatusColor(hasData, anyFailure, isWarning, isPartial) {
  if (isPartial) return 'bg-(--color-clock-aligned-block)';
  if (!hasData) return 'bg-(--color-border-ui)';
  if (anyFailure) return 'bg-(--color-error)';
  if (isWarning) return 'bg-(--color-warning)';
  return 'bg-(--color-success)';
}

function getTooltipText(
  startTime,
  endTime,
  hasData,
  anyFailure,
  isWarning,
  averageMs,
  failureDetails,
  isPartial,
) {
  const startFormatted = formatTimestamp(startTime, { use24Hour: true, showTimezone: false });
  const endFormatted = formatTimestamp(endTime, { use24Hour: true });
  const timeRange = `${startFormatted} - ${endFormatted}`;

  if (isPartial) {
    if (!hasData) return `[${timeRange}]\nPARTIAL BUCKET — no data yet, collecting...`;
    const avgStr = averageMs != null ? `Avg: ${averageMs.toFixed(0)} ms` : 'no avg yet';
    if (anyFailure) {
      const failures = failureDetails
        .map(
          (f) =>
            `${f?.endpoint_id?.toUpperCase()} - ${formatTimestamp(f?.ts, { showSeconds: true, use24Hour: true })}`,
        )
        .join('\n');
      return `[${timeRange}]\nPARTIAL BUCKET — ${avgStr}\nFAILURE(S)${failures ? `\n${failures}` : ''}`;
    }
    return `[${timeRange}]\nPARTIAL BUCKET — ${avgStr}`;
  }

  if (!hasData) return `[${timeRange}]\nNO DATA`;

  const avgStr = averageMs?.toFixed(0);
  if (anyFailure) {
    const failures = failureDetails
      .map(
        (f) =>
          `${f?.endpoint_id?.toUpperCase()} - ${formatTimestamp(f?.ts, { showSeconds: true, use24Hour: true })}`,
      )
      .join('\n');
    return `[${timeRange}]\nAvg: ${avgStr} ms\nFAILURE(S)\n${failures}`;
  }
  if (isWarning) return `[${timeRange}]\nHIGH LATENCY\nAvg: ${avgStr} ms`;
  return `[${timeRange}]\nALL GOOD\nAvg: ${avgStr} ms`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A compact HeroUI Select for choosing a preset duration value.
 *
 * @param {Object}   props
 * @param {string}   props.label            - Accessible label (shown above trigger).
 * @param {number[]} props.presets           - Array of preset values in minutes.
 * @param {number}   props.value             - Currently selected value (minutes).
 * @param {Function} props.onChange          - Called with the new value (number).
 * @param {number[]} [props.disabledPresets] - Preset values that should be disabled.
 */
function PresetSelect({ label, presets, value, onChange, disabledPresets = [] }) {
  return (
    <Select
      aria-label={label}
      variant="secondary"
      className="flex flex-row items-center gap-2"
      disabledKeys={disabledPresets.map(String)}
      value={String(value)}
      onChange={(key) => onChange(Number(key))}
    >
      <Label className="font-mono text-xs font-semibold tracking-widest text-(--color-text-muted) uppercase">
        {label}
      </Label>
      <Select.Trigger className="w-30">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {presets
            .filter((preset) => !disabledPresets.includes(preset))
            .map((preset) => (
              <ListBox.Item
                key={preset}
                id={String(preset)}
                textValue={formatDuration({ minutes: preset })}
              >
                {formatDuration({ minutes: preset })}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

PresetSelect.propTypes = {
  label: PropTypes.string.isRequired,
  presets: PropTypes.arrayOf(PropTypes.number).isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabledPresets: PropTypes.arrayOf(PropTypes.number),
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Bucketed multi-endpoint uptime heatmap over the selected window.
 *
 * @param {Object}  props
 * @param {boolean} props.clockAligned
 */
export default function StatusHeatmap({ clockAligned = false, ...props }) {
  const { pollCount } = useUptimeMonitor();

  const [windowMinutes, setWindowMinutes] = useState(HEATMAP_DEFAULT_WINDOW_MINUTES);
  const [bucketMinutes, setBucketMinutes] = useState(
    bestBucketForWindow(HEATMAP_DEFAULT_WINDOW_MINUTES, HEATMAP_DEFAULT_BUCKET_MINUTES),
  );
  const [clampWarning, setClampWarning] = useState(false);

  const [data, setData] = useState({ buckets: [], days: null, bucketMinutes: null });
  const [loading, setLoading] = useState(true);
  const firstLoadDone = useRef(false);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleWindowChange(newWindowMinutes) {
    const best = bestBucketForWindow(newWindowMinutes, bucketMinutes);
    setWindowMinutes(newWindowMinutes);
    if (best !== bucketMinutes) {
      setBucketMinutes(best);
      setClampWarning(true);
    } else {
      setClampWarning(false);
    }
  }

  function handleBucketChange(newBucketMinutes) {
    setBucketMinutes(newBucketMinutes);
    setClampWarning(false);
  }

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const reference = Date.now();
    const days = windowMinutes / (24 * 60);

    fetchHeatmapAggregated(bucketMinutes, days, reference, clockAligned, controller.signal)
      .then((response) => {
        setData(response);
        if (!firstLoadDone.current) firstLoadDone.current = true;
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        logger.warn('Failed to fetch heatmap', err);
        if (!firstLoadDone.current) firstLoadDone.current = true;
        setLoading(false);
      });

    return () => controller.abort();
  }, [windowMinutes, bucketMinutes, clockAligned, pollCount]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const { buckets = [] } = data;
  const hasHeatmapData = buckets.length > 0;

  // Bucket presets that are >= the current window are nonsensical;
  // those exceeding MAX_BARS are also disabled. Window presets are never disabled.
  const disabledBucketPresets = HEATMAP_BUCKET_PRESETS_MINUTES.filter(
    (b) => b >= windowMinutes || windowMinutes / b > HEATMAP_MAX_BARS,
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Tilt3D
      {...props}
      rotateRange={{ x: 2, y: 0.5 }}
      block
      className="w-full overflow-x-auto rounded-2xl border-2 border-(--color-border-ui) bg-transparent p-4"
    >
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <h3 className="-mt-0.75 *:font-mono *:text-xs *:font-semibold *:tracking-widest *:text-(--color-text-muted) *:uppercase">
          <span>Status Heatmap</span>
          {clockAligned && (
            <span className="text-(--color-clock-aligned-text)!"> — clock-aligned</span>
          )}
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <PresetSelect
            label="Window"
            presets={HEATMAP_WINDOW_PRESETS_MINUTES}
            value={windowMinutes}
            onChange={handleWindowChange}
          />
          <PresetSelect
            label="Bucket"
            presets={HEATMAP_BUCKET_PRESETS_MINUTES}
            value={bucketMinutes}
            disabledPresets={disabledBucketPresets}
            onChange={handleBucketChange}
          />
        </div>
      </div>

      {/* ── Clamp warning ──────────────────────────────────────────────────── */}
      {clampWarning && (
        // <p className="mb-3 text-center font-mono text-[10px] font-semibold tracking-widest text-(--color-warning) uppercase">
        //   Bucket auto-adjusted to keep bar count under {HEATMAP_MAX_BARS}.
        // </p>
        <></>
      )}

      {/* ── Heatmap body ───────────────────────────────────────────────────── */}
      {loading ? (
        <DetailsBadge variant="info" message="Fetching..." spinner className="h-30" />
      ) : !hasHeatmapData ? (
        <DetailsBadge variant="error" message="No data available" className="h-30" />
      ) : (
        <div className="flex flex-wrap justify-center gap-0.5">
          {buckets.map((b, idx) => (
            <Tooltip key={idx} delay={0}>
              <Tooltip.Trigger tabIndex={0}>
                <div
                  className={cn(
                    'h-5 w-2.5 origin-bottom rounded-md',
                    getStatusColor(b.hasData, b.anyFailure, b.isWarning, b.isPartial),
                    'transition-transform duration-200 ease-out',
                    'hover:z-10 hover:scale-y-150',
                  )}
                />
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p className="max-h-64 max-w-xs overflow-y-auto whitespace-pre-wrap">
                  {getTooltipText(
                    b.startTime,
                    b.endTime,
                    b.hasData,
                    b.anyFailure,
                    b.isWarning,
                    b.averageMs,
                    b.failureDetails || [],
                    b.isPartial,
                  )}
                </p>
              </Tooltip.Content>
            </Tooltip>
          ))}
        </div>
      )}
    </Tilt3D>
  );
}

StatusHeatmap.propTypes = {
  clockAligned: PropTypes.bool,
};
