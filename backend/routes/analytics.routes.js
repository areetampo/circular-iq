/**
 * Analytics router mounted at `/api/analytics`; all endpoints are public.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | POST | `/embeddings/reindex` | None | Spawns the embedding pipeline in the background |
 * | GET | `/global-stats` | None | Aggregates scoring logs and benchmark RPCs |
 */

import express from 'express';

import * as analyticsController from '#controllers/analytics.controller.js';
import { toClientError } from '#utils/errors.js';

/**
 * Creates public analytics endpoints that delegate aggregation and reindex work to controllers.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient|Record<string, unknown>} serviceSupabase - Service-role Supabase client passed to analytics controllers for aggregate queries.
 * @returns {express.Router} Router mounted under `/api/analytics`.
 */
export default function createAnalyticsRouter(serviceSupabase) {
  const router = express.Router();

  /**
   * POST /embeddings/reindex
   * Accepts no path or query parameters. Starts the embedding reindex pipeline in a detached
   * background process and responds immediately with `{ started: true, pid }`; startup failures
   * are converted by the controller into a 500 response.
   */
  router.post('/embeddings/reindex', analyticsController.postEmbeddingsReindex());

  /**
   * GET /global-stats
   * Accepts no path or query parameters. Returns public dashboard aggregates from scoring logs,
   * market RPCs, and assessment RPCs. Missing service-client setup returns 503; individual RPC
   * failures degrade their section to empty data instead of failing the whole response.
   */
  router.get('/global-stats', analyticsController.getGlobalStats(serviceSupabase));

  // Keep delegated controller failures client-safe even when they bypass route handlers.
  router.use((error, req, res, _next) => {
    logger.logOperation('ERROR', `/api/analytics${req.path}`, 500, 0, { error });
    logger.error({ error }, 'Analytics route error');

    res.status(500).json({
      ...toClientError(error, 'Internal server error'),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
