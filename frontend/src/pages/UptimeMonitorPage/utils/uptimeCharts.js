/**
 * @module uptimeCharts
 * @description Pure chart data transformers for the Uptime Monitor page.
 * Derives pie-chart categories and recent line-chart points from in-memory
 * check history (no API calls).
 */

import { formatTimestamp } from '@/lib/formatting';

/**
 * Classifies each endpoint's latest check into health distribution buckets
 * for the pie chart.
 *
 * Thresholds:
 * - healthy   — up and response ≤ 500 ms
 * - degraded  — up but response > 500 ms
 * - unhealthy — latest check is down
 * - no data   — no checks in history
 *
 * @param {Record<string, Array<{ up: boolean, ms: number|null }>>} history
 *   Endpoint id → normalised checks (oldest-first).
 * @param {Array<{ id: string, label: string }>} endpoints - Monitored endpoint definitions.
 * @returns {Array<{ label: string, count: number, endpoints: Array<{ name: string, ms: number|null }> }>}
 */
export function getHealthDistribution(history, endpoints) {
  const categories = {
    healthy: { label: 'Healthy', count: 0, endpoints: [] },
    degraded: { label: 'Degraded', count: 0, endpoints: [] },
    unhealthy: { label: 'Unhealthy', count: 0, endpoints: [] },
    noData: { label: 'No Data', count: 0, endpoints: [] },
  };

  for (const ep of endpoints) {
    const checks = history[ep.id] || [];
    if (!checks.length) {
      categories.noData.count++;
      categories.noData.endpoints.push({ name: ep.label, ms: null });
      continue;
    }
    const latest = checks[checks.length - 1];
    if (latest.up) {
      if (latest.ms !== null && latest.ms > 500) {
        categories.degraded.count++;
        categories.degraded.endpoints.push({ name: ep.label, ms: latest.ms });
      } else {
        categories.healthy.count++;
        categories.healthy.endpoints.push({ name: ep.label, ms: latest.ms });
      }
    } else {
      categories.unhealthy.count++;
      categories.unhealthy.endpoints.push({ name: ep.label, ms: latest.ms });
    }
  }

  return Object.values(categories);
}

/**
 * Filters checks to the last N minutes and maps them to chart-friendly points.
 * Down checks render with `ms: null` so the line breaks visually.
 *
 * @param {Array<{ ts: number, up: boolean, ms: number|null }>} checks - Endpoint checks.
 * @param {number} minutes - Lookback window in minutes.
 * @returns {Array<{ label: string, ms: number|null }>}
 */
export function getRecentRawChecks(checks, minutes) {
  if (!checks || !checks.length) return [];
  const now = Date.now();
  const cutoff = now - minutes * 60 * 1000;
  return checks
    .filter((c) => c.ts >= cutoff)
    .map((c) => ({
      label: formatTimestamp(c.ts, {
        showYear: false,
        showMonth: false,
        showDay: false,
        showSeconds: true,
        use24Hour: true,
      }),
      ms: c.up ? c.ms : null,
    }));
}
