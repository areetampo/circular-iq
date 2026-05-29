/**
 * Supabase bearer-token auth middleware factory.
 * In `NODE_ENV=test`, missing Bearer tokens receive a fixed mock user instead of 401.
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';

/**
 * Creates Express middleware that verifies Supabase bearer tokens and attaches a compact user.
 * Test mode intentionally permits missing tokens by assigning a deterministic mock user, which
 * keeps route tests focused on controller behavior instead of auth setup.
 *
 * @param {{ auth: { getUser: (token: string) => Promise<{ data: { user?: { id: string, email?: string, user_metadata?: Record<string, unknown> } }, error?: unknown }> } }} serviceSupabase - Supabase service client used to validate bearer tokens.
 * @returns {import('express').RequestHandler} Middleware that sets `req.user` on success or sends auth error JSON.
 */
export function requireAuth(serviceSupabase) {
  return async (req, res, next) => {
    const startTime = Date.now();

    try {
      const IS_TEST = BACKEND_CONFIG.nodeEnv === 'test';

      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        // Route tests run without Supabase tokens, so test mode receives a deterministic user.
        if (IS_TEST) {
          req.user = {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'test@example.com',
            user_metadata: {},
          };
          return next();
        }

        return res.status(401).json({
          error: 'Missing or invalid Authorization header',
          code: 'MISSING_TOKEN',
          timestamp: new Date().toISOString(),
        });
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        return res.status(401).json({
          error: 'Empty bearer token',
          code: 'INVALID_TOKEN_FORMAT',
          timestamp: new Date().toISOString(),
        });
      }

      const { data, error } = await serviceSupabase.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
      }

      req.user = {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata || {},
      };

      logger.logOperation('requireAuth', 'auth/middleware', 'success', Date.now() - startTime, {
        userId: req.user.id,
        path: req.path,
      });
      next();
    } catch (error) {
      logger.logOperation('requireAuth', 'auth/middleware', 'error', Date.now() - startTime, {
        error,
        path: req.path,
      });
      logger.error({ error }, 'Authentication failed');
      return res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
