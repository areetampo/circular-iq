/**
 * Profile router mounted at `/api/profile`.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | GET | `/` | Bearer (required) | Reads the authenticated user's profile row |
 */

import express from 'express';

import { requireAuth } from '#middleware/auth.middleware.js';

/**
 * Creates the authenticated profile lookup endpoint.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient|Record<string, unknown>} serviceSupabase - Service-role Supabase client used to read the authenticated profile row.
 * @returns {express.Router} Router mounted under `/api/profile`.
 */
export default function createProfileRouter(serviceSupabase) {
  const router = express.Router();

  /**
   * GET /
   * Requires Bearer auth and accepts no path or query parameters. Returns the authenticated user's
   * `id`, `username`, `created_at`, and `updated_at`; a missing profile row maps to 404.
   */
  router.get('/', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const { data, error } = await serviceSupabase
        .from('profiles')
        .select('id, username, created_at, updated_at')
        .eq('id', req.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.logOperation('GET', '/profile', 404, Date.now() - startTime);
          return res.status(404).json({
            error: 'Profile not found',
            code: 'PROFILE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          });
        }
        throw error;
      }

      logger.logOperation('GET', '/profile', 200, Date.now() - startTime);
      res.json({
        id: data.id,
        username: data.username,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch profile');
      logger.logOperation('GET', '/profile', 500, Date.now() - startTime);
      res.status(500).json({
        error: 'Failed to fetch profile',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
