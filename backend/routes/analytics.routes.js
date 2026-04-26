/**
 * Analytics Routes
 * Delegates handlers to analytics.controller.js
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import * as analyticsController from '#controllers/analytics.controller.js';
import { logger } from '#utils/logger.js';

const IS_PROD = BACKEND_CONFIG.isProduction;

function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    logger.info(
      { method, path, status, duration, timestamp: new Date().toISOString() },
      'Route request complete',
    );
  }
}

export default function createAnalyticsRouter(supabase, serviceSupabase) {
  const router = express.Router();

  router.get('/', analyticsController.getSummary(supabase));
  router.get('/enhanced', analyticsController.getEnhanced(supabase));
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
