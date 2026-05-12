/**
 * Uptime Polling Service
 * Periodically checks health endpoints and stores results in Supabase.
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { UPTIME_ENDPOINTS } from '#constants/index.js';
import { getSupabaseClient } from '#database/client.js';
import { broadcastUptimeEvent } from '#services/uptime.broadcaster.js';

let pollingInterval = null;
let isPolling = false;

/**
 * Ping a single endpoint and return the result.
 * @param {string} endpointId
 * @param {string} path
 * @returns {Promise<Object>}
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
      status: body.status ?? (res.ok ? 'healthy' : 'unhealthy'),
      up: res.ok,
      responseTimeMs: ms,
      payload: body,
    };
    logger.logOperation('pingEndpoint', 'uptime/check', 'success', ms, {
      endpointId,
      up: result.up,
      responseTime: ms,
    });
    return result;
  } catch (error) {
    const ms = Date.now() - start;
    const result = {
      endpointId,
      status: 'error',
      up: false,
      responseTimeMs: ms,
      payload: { error: error.message },
    };
    logger.logOperation('pingEndpoint', 'uptime/check', 'error', ms, {
      endpointId,
      error,
    });
    return result;
  }
}

/**
 * Run a full poll of all endpoints, store results in Supabase and broadcast
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
    const results = await Promise.all(UPTIME_ENDPOINTS.map((ep) => pingEndpoint(ep.id, ep.path)));

    // single batch insert
    const rows = results.map((result) => ({
      endpoint_id: result.endpointId,
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

      // Broadcast to all SSE clients
      broadcastUptimeEvent('poll-complete', {
        timestamp: new Date().toISOString(),
        results: results.map((r) => ({
          endpointId: r.endpointId,
          up: r.up,
          responseTimeMs: r.responseTimeMs,
          status: r.status,
        })),
      });
    }
  } catch (err) {
    logger.error({ err }, '[UptimePoll] Poll cycle failed');
  } finally {
    isPolling = false;
  }
}

/**
 * Start the polling service (call once on server start).
 */
export function startUptimePolling() {
  if (pollingInterval) {
    logger.warn('[UptimePoll] Polling already running');
    return;
  }
  const interval = BACKEND_CONFIG.uptime.pollIntervalMs;
  logger.info({ intervalMs: interval }, '[UptimePoll] Starting polling');
  // Run once immediately, then on interval
  runPoll();
  pollingInterval = setInterval(runPoll, interval);
}

/**
 * Stop the polling service (graceful shutdown).
 */
export function stopUptimePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    logger.info('[UptimePoll] Polling stopped');
  }
}
