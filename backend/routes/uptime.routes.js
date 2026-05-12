/**
 * Uptime Monitor Routes
 * Public endpoints for storing and retrieving health check history
 */

import express from 'express';

import { getSupabaseClient } from '#database/client.js';
import { addClient, removeClient } from '#services/uptime.broadcaster.js';

export default function createUptimeRouter() {
  const router = express.Router();

  /**
   * GET /count
   * Returns total number of stored checks (optionally per endpoint)
   */
  router.get('/count', async (req, res) => {
    const startTime = Date.now();

    try {
      const supabase = getSupabaseClient();
      let query = supabase.from('uptime_checks').select('*', { count: 'exact', head: true });
      if (req.query.endpointId) {
        query = query.eq('endpoint_id', req.query.endpointId);
      }
      const { count, error } = await query;
      if (error) throw error;
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/count', 200, duration);
      res.json({ total: count });
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', '/api/uptime/count', 500, duration);
      logger.error({ err }, 'Failed to fetch uptime count');
      res.status(500).json({ error: 'Failed to fetch count' });
    }
  });

  /**
   * GET /history/:endpointId
   * Retrieve recent checks for a specific endpoint
   */
  router.get('/history/:endpointId', async (req, res) => {
    const startTime = Date.now();

    const { endpointId } = req.params;
    const path = `/api/uptime/history/${endpointId}`;
    let limit = parseInt(req.query.limit, 10) || 10000;
    limit = Math.min(limit, 10000);

    try {
      const supabase = getSupabaseClient();

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

      const duration = Date.now() - startTime;
      logger.logOperation('GET', path, 200, duration);
      res.json({ endpointId, checks });
    } catch (err) {
      const duration = Date.now() - startTime;
      logger.logOperation('GET', path, 500, duration);
      logger.error({ err, endpointId }, 'Failed to fetch uptime history');
      res.status(500).json({
        error: 'Failed to fetch history',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /stream
   * Server‑Sent Events endpoint – keeps connection open and pushes 'poll-complete' events.
   */
  router.get('/stream', (req, res) => {
    const startTime = Date.now();

    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx/proxy buffering
      });
      res.flushHeaders();

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 30000);

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
      logger.logOperation('GET', '/api/uptime/stream', 500, Date.now() - startTime);
      res.status(500).json({
        error: 'Failed to establish SSE stream',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
