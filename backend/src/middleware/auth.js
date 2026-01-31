/**
 * Authentication Middleware
 *
 * Verifies Supabase user token from Authorization header
 * Attaches user to req.user for downstream handlers
 */

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
export function requireAuth(supabase) {
  return async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
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
      const { data, error } = await supabase.auth.getUser(token);

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

      next();
    } catch (err) {
      console.error('[AUTH_ERROR]', err.message);
      return res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
