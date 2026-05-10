/**
 * Analytics Routes
 * Delegates handlers to analytics.controller.js
 */

import express from 'express';

import * as analyticsController from '#controllers/analytics.controller.js';

export default function createAnalyticsRouter(supabase, serviceSupabase) {
  const router = express.Router();

  router.post('/embeddings/reindex', analyticsController.postEmbeddingsReindex());
  router.get('/global-stats', analyticsController.getGlobalStats(serviceSupabase));

  // fallback error handler for unexpected errors
  router.use((err, req, res, next) => {
    logger.error({ err }, 'Analytics route error');
    res.status(500).json({
      error: err?.message || 'Internal server error',
      code: err?.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
