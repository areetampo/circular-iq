/**
 * Authentication Middleware
 *
 * Verifies Supabase user token from Authorization header
 * Attaches user to req.user for downstream handlers
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { logger } from '#utils/logger.js';

/**
 * requireAuth middleware
 * Verifies bearer token from Authorization header using Supabase
 *
 * @param {Object} supabase - Supabase client instance
 * @returns {Function} Express middleware
 *
 * @example
 * app.use(requireAuth(supabaseClient));
 */
export function requireAuth(serviceSupabase) {
  return async (req, res, next) => {
    const startTime = Date.now();

    try {
      const IS_TEST = BACKEND_CONFIG.nodeEnv === 'test';

      // Debug: Log when requireAuth is called
      // logger.info({ reqPath: req.path, originalUrl: req.originalUrl }, '🔐 requireAuth called');
      // logger.info({ reqHeaders: Object.keys(req.headers) }, '🔐 Headers');

      // Extract token from Authorization header
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        // In test mode, allow unauthenticated access with mock user
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

      // Verify token with Supabase
      const { data, error } = await serviceSupabase.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        });
      }

      // Attach user to request for downstream handlers
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
