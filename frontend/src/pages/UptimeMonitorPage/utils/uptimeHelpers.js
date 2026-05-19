/**
 * @module uptimeHelpers
 * @description API helper functions for uptime monitor data fetching.
 * Provides functions to fetch history, daily stats, heatmap data,
 * global trends, endpoint latency, and endpoint buckets.
 */

import { buildApiUrl } from '@/lib/apiClient';

/**
 * Fetches raw uptime check history for a specific endpoint.
 *
 * @param {string} endpointId                    - Endpoint identifier (e.g. 'health', 'database').
 * @param {number} [maxHistoryPerEndpoint] - Max number of checks to fetch.
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
  } catch (err) {
    logger.warn(`Failed to fetch history for endpoint ${endpointId}:`, err);
    return [];
  }
}

/**
 * Fetches global hourly average response time trend.
 *
 * @param {number}  [hours=24]
 * @param {boolean} [clockAligned=false] - When true, slots anchor to clean HH:00 boundaries.
 * @returns {Promise<{ trend, hours, clockAligned }>}
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
 * @param {number} days - Number of days of history to fetch (max days is adjusted by backend).
 * @returns {Promise<{ stats: Array<{ day: string, uptimePct: number }>, days: number }>}
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
 * @param {number} [hours=24]
 * @returns {Promise<{ latency, hours }>}
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
 * @param {number}      bucketMinutes
 * @param {number}      days
 * @param {number}      [reference=Date.now()]  - ms epoch timestamp used to anchor bucket edges.
 *   Passing a stable value across re-fetches keeps bucket boundaries consistent on the client.
 * @param {boolean}     [clockAligned=false]    - When true, the window end snaps to the nearest
 *   bucketMinutes UTC clock mark and all edges land on clean clock times instead of rolling
 *   from the reference timestamp.
 * @param {AbortSignal} [signal]                - Optional AbortSignal to cancel the request.
 *   Pass the signal from an AbortController so in-flight requests are cancelled when params
 *   change or the component unmounts, preventing stale data from overwriting fresh state.
 * @returns {Promise<{ buckets: Array<Object>, days: number, bucketMinutes: number, clockAligned: boolean }>}
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
 * @param {string}  endpointId
 * @param {number}  [bucketMinutes=15]
 * @param {number}  [hours=24]
 * @param {boolean} [clockAligned=false] - When true, newest bucket edge snaps to nearest
 *   bucketMinutes UTC mark so all bucket boundaries land on clean clock times.
 * @returns {Promise<{ endpointId, buckets, bucketMinutes, hours, clockAligned }>}
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
