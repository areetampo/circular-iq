/**
 * Backend polling service for the uptime monitor.
 * Runs when `BACKEND_CONFIG.uptime.pollingEnabled` is enabled. On each cycle, pings all health endpoints in parallel,
 * batch-inserts results into Supabase, and broadcasts a 'poll-complete' SSE event
 * to all connected frontend clients via uptime.broadcaster.
 *
 * Guards against overlapping polls with an `isPolling` flag; if the previous cycle
 * hasn't finished when the next interval fires, the new cycle is skipped.
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { HEALTH_ENDPOINTS } from '#constants/index.js';
import { getSupabaseClient } from '#database/client.js';
import { broadcastUptimeEvent } from '#services/uptime.broadcaster.js';

let pollingInterval = null;
let isPolling = false;

/**
 * Ping a single health endpoint and normalize the result for DB insert and SSE broadcast.
 *
 * @param {string} endpointId - Key from HEALTH_ENDPOINTS (e.g. 'health', 'database').
 * @param {string} path - Route path appended to BACKEND_CONFIG.app.apiUrl.
 * @returns {Promise<{
 *   endpointId: string,
 *   endpointPath: string,
 *   status: string,
 *   up: boolean,
 *   responseTimeMs: number,
 *   payload: Record<string, unknown>
 * }>} Normalized endpoint probe result persisted to uptime history and broadcast over SSE.
 */
async function pingEndpoint(endpointId, path) {
  const start = Date.now();

  const url = `${BACKEND_CONFIG.app.apiUrl}${path}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const ms = Date.now() - start;

    const body = await res.json().catch(() => ({}));
    const result = {
      endpointId,
      endpointPath: path,
      status: body.status ?? (res.ok ? 'healthy' : 'unhealthy'),
      up: res.ok,
      responseTimeMs: ms,
      payload: body,
    };

    logger.logOperation('pingEndpoint', 'uptime/check', 'success', ms, {
      endpointId,
      endpointPath: path,
      up: result.up,
      responseTime: ms,
    });

    return result;
  } catch (error) {
    const ms = Date.now() - start;

    const result = {
      endpointId,
      endpointPath: path,
      status: 'error',
      up: false,
      responseTimeMs: ms,
      payload: { error },
    };

    logger.logOperation('pingEndpoint', 'uptime/check', 'error', ms, {
      endpointId,
      endpointPath: path,
      error,
    });

    return result;
  }
}

/**
 * Run one poll cycle: ping all HEALTH_ENDPOINTS in parallel, batch-insert into uptime_checks,
 * then broadcast 'poll-complete' to SSE clients. Skipped when a previous cycle is still running.
 *
 */
async function runPoll() {
  if (isPolling) {
    logger.warn('[UptimePoll] Previous poll still running, skipping this cycle.');
    return;
  }
  isPolling = true;

  const startTime = Date.now();

  logger.info('[UptimePoll] Starting new poll cycle');

  try {
    const supabase = getSupabaseClient();
    const results = await Promise.all(HEALTH_ENDPOINTS.map((ep) => pingEndpoint(ep.id, ep.path)));

    // One insert keeps each polling cycle's endpoint snapshots grouped in storage.
    const rows = results.map((result) => ({
      endpoint_id: result.endpointId,
      endpoint_path: result.endpointPath,
      status: result.status,
      up: result.up,
      response_time_ms: result.responseTimeMs,
      payload: result.payload,
    }));

    const { error } = await supabase.from('uptime_checks').insert(rows);
    const duration = Date.now() - startTime;

    if (error) {
      logger.error({ error, timeTookMs: duration }, '[UptimePoll] Insert failed');
    } else {
      logger.info(
        { timeTookMs: duration, endpointsStored: results.length },
        '[UptimePoll] Poll completed',
      );

      // Broadcast only after storage succeeds so clients see persisted snapshots.
      broadcastUptimeEvent('poll-complete', {
        timestamp: new Date().toISOString(),
        results: results.map((r) => ({
          endpointId: r.endpointId,
          endpointPath: r.endpointPath,
          up: r.up,
          responseTimeMs: r.responseTimeMs,
          status: r.status,
        })),
      });
    }
  } catch (error) {
    logger.error({ error }, '[UptimePoll] Poll cycle failed');
  } finally {
    isPolling = false;
  }
}

/**
 * Starts the uptime polling service.
 * Runs one poll immediately on call, then repeats on the configured interval.
 * Safe to call multiple times; subsequent calls are no-ops if already running.
 * Side effects: creates a process interval and writes uptime checks on every cycle.
 */
export function startUptimePolling() {
  if (pollingInterval) {
    logger.warn('[UptimePoll] Polling already running');
    return;
  }
  const interval = BACKEND_CONFIG.uptime.pollIntervalMs;
  logger.info({ intervalMs: interval }, '[UptimePoll] Starting polling');
  // Run once immediately so fresh deployments do not wait a full interval for first data.
  runPoll();
  pollingInterval = setInterval(runPoll, interval);
}

/**
 * Stops the uptime polling service and clears the interval.
 * Called during graceful server shutdown.
 * Safe to call when polling is already stopped.
 */
export function stopUptimePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    logger.info('[UptimePoll] Polling stopped');
  }
}
