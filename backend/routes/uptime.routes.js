/**
 * @module uptime.routes
 * @description Express router for the uptime monitor API.
 * All endpoints are public (no authentication required).
 *
 * Routes:
 *   GET /count                          — total checks stored in DB
 *   GET /history/:endpointId            — raw checks for one endpoint
 *   GET /stream                         — SSE stream (poll-complete events)
 *   GET /daily-stats                    — daily uptime % aggregation
 *   GET /heatmap-aggregated             — bucketed heatmap data (supports clock-aligned)
 *   GET /global-trend                   — hourly avg response time (supports clock-aligned)
 *   GET /endpoint-latency               — per-endpoint avg latency scalar
 *   GET /endpoint-buckets/:endpointId   — bucketed endpoint data (supports clock-aligned)
 *
 * All aggregation endpoints echo back their effective parameters (hours, days,
 * bucketMinutes, clockAligned) so frontend components can derive labels from the
 * response rather than importing constants directly.
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getSupabaseClient } from '#database/client.js';
import { addClient, removeClient } from '#services/uptime.broadcaster.js';

/**
 * Creates the Express router for `/api/uptime` endpoints.
 * Uses the global `logger` (set in `server/index.js`) for request logging.
 *
 * @returns {import('express').Router}
 */
export default function createUptimeRouter() {
  const router = express.Router();
  const supabase = getSupabaseClient();
  const { pollIntervalMs, maxHistoryPerEndpoint, queryWindowDaysLimit } = BACKEND_CONFIG.uptime;

  /**
   * GET /count?endpointId=
   * Returns `{ total }` — row count in `uptime_checks`, optionally filtered by endpoint.
   * When endpointId is provided: exact count via index scan.
   * When unfiltered: fast approximate count via pg_class.reltuples (display stat only).
   */
  router.get('/count', async (req, res) => {
    const startTime = Date.now();

    try {
      let total;

      if (req.query.endpointId) {
        // Filtered — exact count, composite index is used.
        const { count, error } = await supabase
          .from('uptime_checks')
          .select('*', { count: 'exact', head: true })
          .eq('endpoint_id', req.query.endpointId);
        if (error) throw error;
        total = count;
      } else {
        // Unfiltered — use fast catalogue estimate instead of full table scan.
        // Suitable for display stats; accurate to ~1% given tuned autovacuum.
        const { data, error } = await supabase.rpc('get_uptime_check_count_estimate');
        if (error) throw error;
        total = data;
      }

      res.json({ total });
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/count', 500, duration, { err });
      logger.error({ err }, 'Failed to fetch uptime count');

      res.status(500).json({ error: 'Failed to fetch count' });
    }
  });

  /**
   * GET /stream
   * SSE connection: `connected` on open, `: heartbeat` every `pollIntervalMs`, `poll-complete` from broadcaster.
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
    } catch (err) {
      logger.error({ err }, 'Failed to establish SSE stream');
      logger.logOperation('GET', '/api/uptime/stream', 500, Date.now() - startTime, { err });

      res
        .status(500)
        .json({ error: 'Failed to establish SSE stream', timestamp: new Date().toISOString() });
    }
  });

  /**
   * GET /history/:endpointId?limit=
   * Raw checks for one endpoint (newest first in DB, reversed to chronological in response).
   * Caps `limit` at `maxHistoryPerEndpoint`.
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
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', path, 500, duration, { err });
      logger.error({ err, endpointId }, 'Failed to fetch uptime history');

      res.status(500).json({
        error: 'Failed to fetch history',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /global-trend?hours=24&clockAligned=false
   *
   * clockAligned=true  → slots anchored to clean HH:00 boundaries.
   * clockAligned=false → rolling window from NOW() (default).
   * Echoes back hours and clockAligned.
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
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/global-trend', 500, duration, { err });
      logger.error({ err }, 'Failed to fetch global trend');

      res.status(500).json({ error: 'Failed to fetch global trend' });
    }
  });

  /**
   * GET /daily-stats?days=28
   * Daily uptime % per day via `get_daily_uptime_stats` RPC. Echoes clamped `days`.
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
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/daily-stats', 500, duration, { err });
      logger.error({ err }, 'Failed to fetch daily stats');

      res.status(500).json({ error: 'Failed to fetch daily stats' });
    }
  });

  /**
   * GET /endpoint-latency?hours=24
   * No clock-alignment (scalar per endpoint, no bucket edges).
   * Echoes back hours.
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
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/endpoint-latency', 500, duration, { err });
      logger.error({ err }, 'Failed to fetch endpoint latency');

      res.status(500).json({ error: 'Failed to fetch endpoint latency' });
    }
  });

  /**
   * GET /heatmap-aggregated?bucketMinutes=180&days=28&reference=<ms>&clockAligned=false
   *
   * clockAligned=true  → bucket edges snap to nearest bucketMinutes UTC mark.
   * clockAligned=false → rolling window from reference timestamp (default).
   * Echoes back clockAligned so the frontend knows which mode rendered.
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
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/heatmap-aggregated', 500, duration, { err });
      logger.error({ err }, 'Failed to fetch heatmap aggregated data');

      res.status(500).json({ error: 'Failed to fetch heatmap aggregated data' });
    }
  });

  /**
   * GET /endpoint-buckets/:endpointId?bucketMinutes=15&hours=24&clockAligned=false
   *
   * clockAligned=true  → newest bucket boundary snapped to nearest bucketMinutes UTC mark.
   * clockAligned=false → rolling window from NOW() (default).
   * Echoes back hours, bucketMinutes, clockAligned.
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
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', `/api/uptime/endpoint-buckets/${endpointId}`, 500, duration, {
        err,
      });
      logger.error({ err, endpointId }, 'Failed to fetch endpoint buckets');

      res.status(500).json({ error: 'Failed to fetch endpoint buckets' });
    }
  });

  // Fallback error handler
  router.use((err, req, res, _next) => {
    logger.logOperation('ERROR', `/api/uptime${req.path}`, 500, 0, { err });
    logger.error({ err }, 'Uptime route error');

    res.status(500).json({
      error: err?.message || 'Internal server error',
      code: err?.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
