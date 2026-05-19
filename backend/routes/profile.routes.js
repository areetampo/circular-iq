/**
 * @module profile.routes
 * @description Express router for user profile endpoints.
 * Provides authenticated endpoints for fetching and managing user profile data.
 * All endpoints require valid Supabase authentication.
 *
 * Routes:
 *   GET /                           — Fetch authenticated user's profile data
 */

import express from 'express';

import { requireAuth } from '#middleware/auth.middleware.js';

/**
 * Creates the profile router.
 *
 * @param {Object} serviceSupabase - Service-role Supabase client instance.
 * @returns {express.Router} Configured Express router with profile endpoints.
 */
export default function createProfileRouter(serviceSupabase) {
  const router = express.Router();

  /**
   * GET /
   * Returns the authenticated user's profile (`id`, `username`, `created_at`, `updated_at`).
   * Requires Bearer token via `requireAuth`. 404 when profile row is missing.
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
    } catch (err) {
      logger.error({ err }, 'Failed to fetch profile');
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
