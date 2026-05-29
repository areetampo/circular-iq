/**
 * Search router mounted at `/api/search`; all endpoints are public.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | GET | `/ce-cases?q=&mode=&limit=&vector_weight=` | None | Keyword or hybrid CE case search |
 */

import express from 'express';

import { searchCeCases } from '#controllers/search.controller.js';
import { toClientError } from '#utils/errors.js';

/**
 * Creates public knowledge-base search endpoints.
 * The router resolves its own database client internally via the repository layer.
 *
 * @returns {express.Router} Router mounted under `/api/search`.
 */
export default function createSearchRouter() {
  const router = express.Router();

  /**
   * GET /ce-cases?q=&mode=&limit=&vector_weight=
   * Accepts no path parameters. Query arg `q` is required and capped at 500 characters, `mode`
   * defaults to `keyword` and may be `hybrid`, `limit` defaults to 20 and is capped at 50, and
   * `vector_weight` is validated between 0 and 1 for hybrid ranking. Invalid query values map to
   * 400, embedding failures map to 503, and unexpected search failures map to 500.
   */
  router.get('/ce-cases', searchCeCases());

  // Keep delegated controller failures client-safe even when they bypass route handlers.
  router.use((error, req, res, _next) => {
    logger.logOperation('ERROR', `/api/search${req.path}`, 500, 0, { error });
    logger.error({ error }, 'Search route error');

    res.status(500).json({
      ...toClientError(error, 'Internal server error'),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
