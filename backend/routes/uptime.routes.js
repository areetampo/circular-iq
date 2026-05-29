/**
 * Uptime monitor router mounted at `/api/uptime`; all endpoints are public.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | GET | `/count` | None | Total checks, optionally filtered by `endpointId` |
 * | GET | `/stream` | None | SSE stream for connected, heartbeat, and poll-complete events |
 * | GET | `/history/:endpointId` | None | Raw checks for one endpoint |
 * | GET | `/global-trend` | None | Hourly response-time trend; supports `clockAligned` |
 * | GET | `/daily-stats` | None | Daily uptime percentage aggregation |
 * | GET | `/endpoint-latency` | None | Per-endpoint average latency scalar |
 * | GET | `/heatmap-aggregated` | None | Bucketed global heatmap data |
 * | GET | `/endpoint-buckets/:endpointId` | None | Bucketed data for one endpoint |
 *
 * Aggregation endpoints echo back their effective parameters (`hours`, `days`,
 * `bucketMinutes`, `clockAligned`) so frontend components can derive labels from the
 * response rather than importing constants directly.
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getSupabaseClient } from '#database/client.js';
import { addClient, removeClient } from '#services/uptime.broadcaster.js';
import { toClientError } from '#utils/errors.js';

/**
 * Creates uptime monitoring endpoints backed by Supabase RPCs and the SSE broadcaster.
 * Uses the global `logger` (set in `server/index.js`) for request logging.
 *
 * @returns {import('express').Router} Router mounted under `/api/uptime`.
 */
export default function createUptimeRouter() {
  const router = express.Router();
  const supabase = getSupabaseClient();
  const { pollIntervalMs, maxHistoryPerEndpoint, queryWindowDaysLimit } = BACKEND_CONFIG.uptime;

  /**
   * GET /count?endpointId=
   * Accepts no path parameters. Optional query arg `endpointId` switches to an exact per-endpoint
   * count; unfiltered counts use a fast catalog estimate. Supabase errors map to 500.
   */
  router.get('/count', async (req, res) => {
    const startTime = Date.now();

    try {
      let total;

      if (req.query.endpointId) {
        // Filtered counts stay exact because the composite index keeps this path cheap.
        const { count, error } = await supabase
          .from('uptime_checks')
          .select('*', { count: 'exact', head: true })
          .eq('endpoint_id', req.query.endpointId);
        if (error) throw error;
        total = count;
      } else {
        // Use the catalog estimate for display stats instead of scanning the full table.
        const { data, error } = await supabase.rpc('get_uptime_check_count_estimate');
        if (error) throw error;
        total = data;
      }

      res.json({ total });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/count', 500, duration, { error });
      logger.error({ error }, 'Failed to fetch uptime count');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch count'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /stream
   * Accepts no path or query parameters. Opens an SSE connection with a `connected` event,
   * `: heartbeat` comments every `pollIntervalMs`, and broadcaster `poll-complete` events.
   * Disconnect cleanup removes the response from the broadcaster and clears the heartbeat.
   */
  router.get('/stream', (req, res) => {
    const startTime = Date.now();
    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.flushHeaders();
      const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), pollIntervalMs);
      addClient(res);
      res.write(
        `event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`,
      );

      logger.logOperation('GET', '/api/uptime/stream', 200, Date.now() - startTime);
      req.on('close', () => {
        removeClient(res);
        clearInterval(heartbeat);
      });
    } catch (error) {
      logger.error({ error }, 'Failed to establish SSE stream');
      logger.logOperation('GET', '/api/uptime/stream', 500, Date.now() - startTime, { error });

      res.status(500).json({
        ...toClientError(error, 'Failed to establish SSE stream'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /history/:endpointId?limit=
   * Path param `endpointId` selects one monitored endpoint. Query arg `limit` defaults to
   * `maxHistoryPerEndpoint` and is clamped to `1..maxHistoryPerEndpoint`. Rows are fetched newest
   * first for index use, then returned chronologically; Supabase errors map to 500.
   */
  router.get('/history/:endpointId', async (req, res) => {
    const startTime = Date.now();

    const { endpointId } = req.params;
    const path = `/api/uptime/history/${endpointId}`;
    let limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || maxHistoryPerEndpoint, 1),
      maxHistoryPerEndpoint,
    );

    try {
      const { data, error } = await supabase
        .from('uptime_checks')
        .select('id, status, up, response_time_ms, payload, created_at')
        .eq('endpoint_id', endpointId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const checks = (data || []).reverse().map((row) => ({
        id: row.id,
        status: row.status,
        up: row.up,
        responseTimeMs: row.response_time_ms,
        payload: row.payload,
        createdAt: row.created_at,
      }));
      res.json({ endpointId, checks });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', path, 500, duration, { error });
      logger.error({ error, endpointId }, 'Failed to fetch uptime history');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch history'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /global-trend?hours=24&clockAligned=false
   * Accepts no path parameters. Query arg `hours` defaults to 24 and is clamped to the configured
   * day limit; `clockAligned=true` anchors slots to clean hour boundaries, while the default rolling
   * window starts from NOW(). Effective values are echoed; RPC failures map to 500.
   */
  router.get('/global-trend', async (req, res) => {
    const startTime = Date.now();

    const hours = Math.min(
      Math.max(parseInt(req.query.hours, 10) || 24, 1),
      24 * queryWindowDaysLimit,
    );
    const clockAligned = req.query.clockAligned === 'true';

    try {
      const { data, error } = await supabase.rpc('get_global_response_trend', {
        p_hours: hours,
        p_clock_aligned: clockAligned,
      });

      if (error) throw error;

      const trend = (data || []).map((row) => ({
        hourLabel: row.hour_label,
        avgResponseTime: row.avg_response_time !== null ? Number(row.avg_response_time) : null,
      }));
      res.json({ trend, hours, clockAligned });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/global-trend', 500, duration, { error });
      logger.error({ error }, 'Failed to fetch global trend');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch global trend'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /daily-stats?days=28
   * Accepts no path parameters. Query arg `days` defaults to `queryWindowDaysLimit` and is clamped
   * to `1..queryWindowDaysLimit`. Daily uptime percentages come from `get_daily_uptime_stats`; RPC
   * failures map to 500.
   */
  router.get('/daily-stats', async (req, res) => {
    const startTime = Date.now();

    const days = Math.min(
      Math.max(parseInt(req.query.days, 10) || queryWindowDaysLimit, 1),
      queryWindowDaysLimit,
    );
    try {
      const { data, error } = await supabase.rpc('get_daily_uptime_stats', { days });

      if (error) throw error;

      const result = (data || []).map((row) => ({ day: row.day, uptimePct: row.uptime_pct }));

      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/daily-stats', 200, duration);

      res.json({ stats: result, days });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/daily-stats', 500, duration, { error });
      logger.error({ error }, 'Failed to fetch daily stats');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch daily stats'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /endpoint-latency?hours=24
   * Accepts no path parameters. Query arg `hours` defaults to 24 and is clamped to the configured
   * day limit. This scalar aggregation has no clock alignment or bucket edges; RPC failures map
   * to 500.
   */
  router.get('/endpoint-latency', async (req, res) => {
    const startTime = Date.now();

    const hours = Math.min(
      Math.max(parseInt(req.query.hours, 10) || 24, 1),
      24 * queryWindowDaysLimit,
    );

    try {
      const { data, error } = await supabase.rpc('get_endpoint_avg_latency', { p_hours: hours });

      if (error) throw error;

      const latency = (data || []).map((row) => ({
        endpointId: row.endpoint_id,
        avgMs: row.avg_ms !== null ? Number(row.avg_ms) : null,
      }));
      res.json({ latency, hours });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/endpoint-latency', 500, duration, { error });
      logger.error({ error }, 'Failed to fetch endpoint latency');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch endpoint latency'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /heatmap-aggregated?bucketMinutes=180&days=28&reference=<ms>&clockAligned=false
   * Accepts no path parameters. Query arg `days` is clamped to the configured day limit,
   * `bucketMinutes` defaults to 180 and is capped at the selected window length, `reference`
   * defaults to `Date.now()`, and `clockAligned=true` snaps bucket edges to UTC marks.
   * Effective values are echoed; RPC failures map to 500.
   */
  router.get('/heatmap-aggregated', async (req, res) => {
    const startTime = Date.now();

    const days = Math.min(
      Math.max(parseInt(req.query.days, 10) || queryWindowDaysLimit, 1),
      queryWindowDaysLimit,
    );
    const bucketMinutes = Math.min(
      Math.max(parseInt(req.query.bucketMinutes, 10) || 180, 1),
      60 * 24 * days,
    );
    const reference = parseInt(req.query.reference, 10) || Date.now();
    const clockAligned = req.query.clockAligned === 'true';

    try {
      const { data, error } = await supabase.rpc('get_heatmap_buckets', {
        bucket_minutes: bucketMinutes,
        days,
        p_reference_ts: reference,
        p_clock_aligned: clockAligned,
      });

      if (error) throw error;

      const buckets = (data || []).map((b) => ({
        startTime: b.start_time,
        endTime: b.end_time,
        anyFailure: b.any_failure,
        hasData: b.has_data,
        averageMs: b.average_ms,
        isWarning: b.is_warning,
        failureDetails: Array.isArray(b.failure_details) ? b.failure_details : [],
        isPartial: b.is_partial,
      }));

      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/heatmap-aggregated', 200, duration);

      res.json({ buckets, days, bucketMinutes, clockAligned });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/heatmap-aggregated', 500, duration, { error });
      logger.error({ error }, 'Failed to fetch heatmap aggregated data');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch heatmap aggregated data'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /endpoint-buckets/:endpointId?bucketMinutes=15&hours=24&clockAligned=false
   * Path param `endpointId` selects one monitored endpoint. Query arg `hours` defaults to 24 and is
   * clamped to the configured day limit; `bucketMinutes` defaults to 15 and is capped at the selected
   * hour window. `clockAligned=true` snaps the newest bucket boundary to a UTC mark; RPC failures
   * map to 500.
   */
  router.get('/endpoint-buckets/:endpointId', async (req, res) => {
    const startTime = Date.now();

    const { endpointId } = req.params;
    const hours = Math.min(
      Math.max(parseInt(req.query.hours, 10) || 24, 1),
      24 * queryWindowDaysLimit,
    );
    const bucketMinutes = Math.min(
      Math.max(parseInt(req.query.bucketMinutes, 10) || 15, 1),
      60 * hours,
    );
    const clockAligned = req.query.clockAligned === 'true';

    try {
      const { data, error } = await supabase.rpc('get_endpoint_buckets', {
        p_endpoint_id: endpointId,
        p_bucket_minutes: bucketMinutes,
        p_hours: hours,
        p_clock_aligned: clockAligned,
      });

      if (error) throw error;

      const buckets = (data || []).map((row) => ({
        startTime: row.start_time,
        endTime: row.end_time,
        avgMs: row.avg_ms !== null ? Number(row.avg_ms) : null,
        hasData: row.has_data,
        anyFailure: row.any_failure,
        failureDetails: Array.isArray(row.failure_details) ? row.failure_details : [],
        isPartial: row.is_partial,
      }));
      res.json({ endpointId, buckets, bucketMinutes, hours, clockAligned });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', `/api/uptime/endpoint-buckets/${endpointId}`, 500, duration, {
        error,
      });
      logger.error({ error, endpointId }, 'Failed to fetch endpoint buckets');

      res.status(500).json({
        ...toClientError(error, 'Failed to fetch endpoint buckets'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Keep delegated RPC/controller failures client-safe even when they bypass route handlers.
  router.use((error, req, res, _next) => {
    logger.logOperation('ERROR', `/api/uptime${req.path}`, 500, 0, { error });
    logger.error({ error }, 'Uptime route error');

    res.status(500).json({
      ...toClientError(error, 'Internal server error'),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
