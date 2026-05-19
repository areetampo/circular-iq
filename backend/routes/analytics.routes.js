/**
 * @module analytics.routes
 * @description Express router for analytics endpoints.
 * Provides routes for dashboard statistics, global analytics, and background tasks.
 * All endpoints are public (no authentication required).
 *
 * Routes:
 *   POST /embeddings/reindex         — Starts background embedding pipeline reindex
 *   GET /global-stats                — Aggregated dashboard statistics from all sources
 */

import express from 'express';

import * as analyticsController from '#controllers/analytics.controller.js';

/**
 * Creates the analytics router.
 *
 * @param {Object} supabase - Supabase client instance (unused, kept for compatibility).
 * @param {Object} serviceSupabase - Service-role Supabase client for unrestricted queries.
 * @returns {express.Router} Configured Express router with analytics endpoints.
 */
export default function createAnalyticsRouter(supabase, serviceSupabase) {
  const router = express.Router();

  /**
   * POST /embeddings/reindex
   * Spawns `pipeline/rag/generate_embeddings.js` as a detached background process.
   * Returns `{ started: true, pid }` immediately.
   */
  router.post('/embeddings/reindex', analyticsController.postEmbeddingsReindex());

  /**
   * GET /global-stats
   * Aggregates dashboard statistics from scoring logs, market RPC, and assessment RPC.
   * No authentication required.
   */
  router.get('/global-stats', analyticsController.getGlobalStats(serviceSupabase));

  // fallback error handler for unexpected errors
  router.use((err, req, res, next) => {
    logger.logOperation('ERROR', `/api/analytics${req.path}`, 500, 0, { err });
    logger.error({ err }, 'Analytics route error');

    res.status(500).json({
      error: err?.message || 'Internal server error',
      code: err?.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
