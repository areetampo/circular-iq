/**
 * Client-side fetch helpers for `/api/uptime` (mirrors `backend/routes/uptime.routes.js`).
 * All routes are public. Aggregation responses echo effective `hours`, `days`,
 * `bucketMinutes`, and `clockAligned` for chart labelling.
 *
 * | Method | Path | Used by |
 * |--------|------|---------|
 * | GET | `/api/uptime/history/:endpointId?limit=` | `fetchHistory` — raw checks, oldest-first |
 * | GET | `/api/uptime/global-trend?hours=&clockAligned=` | `fetchGlobalTrend` |
 * | GET | `/api/uptime/daily-stats?days=` | `fetchDailyStats` |
 * | GET | `/api/uptime/endpoint-latency?hours=` | `fetchEndpointLatency` |
 * | GET | `/api/uptime/heatmap-aggregated?bucketMinutes=&days=&reference=&clockAligned=` | `fetchHeatmapAggregated` |
 * | GET | `/api/uptime/endpoint-buckets/:endpointId?bucketMinutes=&hours=&clockAligned=` | `fetchEndpointBuckets` |
 *
 * SSE (`/api/uptime/stream`) is opened in `useUptimeMonitor`, not here.
 */

import { buildApiUrl } from '@/lib/apiClient';

/**
 * Fetches raw uptime check history for a specific endpoint.
 *
 * @param {string} endpointId - Endpoint identifier from `ENDPOINTS` (e.g. 'health', 'database').
 * @param {number} maxHistoryPerEndpoint - Max number of checks to fetch.
 * @returns {Promise<Array<{ ts: number, up: boolean, ms: number|null, status: string, data: Object }>>}
 *   Normalised check objects sorted oldest-first. Returns an empty array on failure
 *   to allow graceful degradation (error is logged, not thrown).
 */
export async function fetchHistory(endpointId, maxHistoryPerEndpoint) {
  try {
    const url = buildApiUrl(`/api/uptime/history/${endpointId}?limit=${maxHistoryPerEndpoint}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.checks.map((c) => ({
      ts: new Date(c.createdAt).getTime(),
      up: c.up,
      ms: c.responseTimeMs,
      status: c.status,
      data: c.payload,
    }));
  } catch (error) {
    logger.warn('[UPTIME:HISTORY_FETCH_FAILED]', { endpointId, error });
    return [];
  }
}

/**
 * Fetches global hourly average response time trend.
 *
 * @param {number}  [hours=24] - Lookback window in hours; backend may clamp to its configured limit.
 * @param {boolean} [clockAligned=false] - When true, slots anchor to clean HH:00 boundaries.
 * @returns {Promise<{ trend: Array<{ hourLabel: string, avgResponseTime: number|null }>, hours: number, clockAligned: boolean }>}
 *   Hourly average response-time rows plus effective query options echoed by the API.
 * @throws {Error} If the API request fails with a non-2xx response.
 */
export async function fetchGlobalTrend(hours = 24, clockAligned = false) {
  const url = buildApiUrl(`/api/uptime/global-trend?hours=${hours}&clockAligned=${clockAligned}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch global trend');
  return res.json(); // { trend, hours, clockAligned }
}

/**
 * Fetches daily uptime statistics for all endpoints combined.
 *
 * @param {number} days - Requested lookback days; backend clamps to its configured query limit.
 * @returns {Promise<{ stats: Array<{ day: string, uptimePct: number }>, days: number }>} Daily uptime rows plus effective lookback window.
 * @throws {Error} If the API request fails (non-2xx response).
 */
export async function fetchDailyStats(days) {
  const url = buildApiUrl(`/api/uptime/daily-stats?days=${days}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch daily stats');
  return await res.json(); // { stats, days }
}

/**
 * Fetches per-endpoint average latency.
 * No clock-alignment (scalar per endpoint, no bucket edges).
 *
 * @param {number} [hours=24] - Lookback window in hours; backend may clamp to its configured limit.
 * @returns {Promise<{ latency: Array<{ endpointId: string, avgMs: number|null }>, hours: number }>}
 *   Per-endpoint average latency rows plus effective lookback window.
 * @throws {Error} If the API request fails with a non-2xx response.
 */
export async function fetchEndpointLatency(hours = 24) {
  const url = buildApiUrl(`/api/uptime/endpoint-latency?hours=${hours}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch endpoint latency');
  return res.json(); // { latency, hours }
}

/**
 * Fetches aggregated heatmap data.
 *
 * @param {number}      bucketMinutes - Bucket width in minutes for heatmap aggregation.
 * @param {number}      days - Lookback window in days; backend may clamp to its configured limit.
 * @param {number}      [reference=Date.now()]  - ms epoch timestamp used to anchor bucket edges.
 *   Passing a stable value across re-fetches keeps bucket boundaries consistent on the client.
 * @param {boolean}     [clockAligned=false]    - When true, the window end snaps to the nearest
 *   bucketMinutes UTC clock mark and all edges land on clean clock times instead of rolling
 *   from the reference timestamp.
 * @param {AbortSignal} [signal]                - Optional AbortSignal to cancel the request.
 *   Pass the signal from an AbortController so in-flight requests are cancelled when params
 *   change or the component unmounts, preventing stale data from overwriting fresh state.
 * @returns {Promise<{ buckets: Array<{ startTime: string|number, endTime: string|number, hasData: boolean, anyFailure: boolean, isWarning: boolean, averageMs: number|null, failureDetails?: Array<Object>, isPartial: boolean }>, days: number, bucketMinutes: number, clockAligned: boolean }>}
 *   Aggregated heatmap buckets plus effective query options.
 * @throws {Error} If the API request fails (non-2xx response).
 */
export async function fetchHeatmapAggregated(
  bucketMinutes,
  days,
  reference = Date.now(),
  clockAligned = false,
  signal,
) {
  const url = buildApiUrl(
    `/api/uptime/heatmap-aggregated?bucketMinutes=${bucketMinutes}&days=${days}&reference=${reference}&clockAligned=${clockAligned}`,
  );
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Failed to fetch heatmap');
  return await res.json();
}

/**
 * Fetches bucketed data for a single endpoint.
 *
 * @param {string}  endpointId - Endpoint identifier from uptime endpoint config.
 * @param {number}  [bucketMinutes=15] - Bucket width in minutes for endpoint aggregation.
 * @param {number}  [hours=24] - Lookback window in hours; backend may clamp to its configured limit.
 * @param {boolean} [clockAligned=false] - When true, newest bucket edge snaps to nearest
 *   bucketMinutes UTC mark so all bucket boundaries land on clean clock times.
 * @returns {Promise<{ endpointId: string, buckets: Array<{ startTime: string|number, endTime: string|number, hasData: boolean, anyFailure: boolean, avgMs: number|null, failureDetails?: Array<Object>, isPartial: boolean }>, bucketMinutes: number, hours: number, clockAligned: boolean }>}
 *   Bucketed endpoint uptime rows plus effective query options.
 * @throws {Error} If the API request fails with a non-2xx response.
 */
export async function fetchEndpointBuckets(
  endpointId,
  bucketMinutes = 15,
  hours = 24,
  clockAligned = false,
) {
  const url = buildApiUrl(
    `/api/uptime/endpoint-buckets/${endpointId}?bucketMinutes=${bucketMinutes}&hours=${hours}&clockAligned=${clockAligned}`,
  );
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch endpoint buckets for ${endpointId}`);
  return res.json(); // { endpointId, buckets, bucketMinutes, hours, clockAligned }
}
