/**
 * Search Routes
 * Delegates to search.controller.js
 *
 * Mounted at: /api/search
 *
 * Endpoints:
 *   GET /api/search/ce-cases?q=...&mode=keyword|hybrid&limit=20&vector_weight=0.7
 */

import express from 'express';

import { searchCeCases } from '#controllers/search.controller.js';
import { logger } from '#utils/logger.js';

/**
 * Create search router
 * @param {Object} supabase - Supabase client (anon key — read-only RLS policy covers ce_cases)
 * @returns {express.Router}
 */
export default function createSearchRouter(supabase) {
  const router = express.Router();

  /**
   * GET /ce-cases
   * Search the circular economy cases knowledge base.
   *
   * Query params:
   *   q             {string}   Required. Search query.
   *   mode          {string}   "keyword" | "hybrid". Default: "keyword".
   *   limit         {number}   Max results (1–50). Default: 20.
   *   vector_weight {number}   Hybrid mode only. 0.0–1.0. Default: 0.7.
   *
   * No auth required — ce_cases is public read-only reference data.
   */
  router.get('/ce-cases', searchCeCases(supabase));

  // Fallback error handler
  router.use((err, req, res, next) => {
    logger.error({ err }, 'Search route error');
    res.status(500).json({
      error: err?.message || 'Internal server error',
      code: err?.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
