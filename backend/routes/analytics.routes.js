/**
 * Analytics Routes
 * Delegates handlers to analytics.controller.js
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import * as analyticsController from '#controllers/analytics.controller.js';

const IS_PROD = BACKEND_CONFIG.isProduction;

function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
  }
}

function errorResponse(error, defaultMessage = 'Internal server error') {
  return {
    error: error?.message || defaultMessage,
    timestamp: new Date().toISOString(),
    code: error?.code || 'INTERNAL_ERROR',
  };
}

export function setOpenAIClient(client) {
  analyticsController.setOpenAIClient(client);
}

export default function createAnalyticsRouter(supabase) {
  const router = express.Router();

  router.get('/', analyticsController.getSummary(supabase));
  router.get('/enhanced', analyticsController.getEnhanced(supabase));
  router.get('/featured-solutions', analyticsController.getFeaturedSolutions(supabase));
  router.post('/embeddings/reindex', analyticsController.postEmbeddingsReindex());
  router.get('/documents/summary', analyticsController.getDocumentsSummary());
  router.get('/documents/stats', analyticsController.getDocumentsStats(supabase));

  // fallback error handler for unexpected errors
  router.use((err, req, res, next) => {
    console.error('Analytics route error:', err);
    res.status(500).json(errorResponse(err));
  });

  return router;
}
