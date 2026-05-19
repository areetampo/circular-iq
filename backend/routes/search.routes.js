/**
 * @module search.routes
 * @description Express router for knowledge base search endpoints.
 * Delegates to search.controller.js for keyword and hybrid search operations.
 * All endpoints are public (no authentication required — ce_cases is read-only reference data).
 *
 * Routes:
 *   GET /ce-cases?q=...&mode=keyword|hybrid&limit=20&vector_weight=0.7  — Search circular economy cases
 */

import express from 'express';

import { searchCeCases } from '#controllers/search.controller.js';

/**
 * Creates the search router for knowledge base queries.
 *
 * @param {Object} supabase - Supabase client instance (anon key with RLS policies enforced).
 *                           Read-only access to ce_cases table.
 * @returns {express.Router} Configured Express router with search endpoints.
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
    logger.logOperation('ERROR', `/api/search${req.path}`, 500, 0, { err });
    logger.error({ err }, 'Search route error');

    res.status(500).json({
      error: err?.message || 'Internal server error',
      code: err?.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
