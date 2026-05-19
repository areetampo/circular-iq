/**
 * @module auth.service
 * @description Centralized authentication service for request handling.
 * Provides functions to authenticate requests and extract user IDs from
 * authorization headers using Supabase auth. Supports both required and optional
 * authentication modes, allowing flexible endpoint access control.
 */

/**
 * Authenticate a request using the Authorization header.
 * Supports both required and optional authentication modes.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.headers - Request headers object.
 * @param {string} req.headers.authorization - Authorization header with format "Bearer <token>".
 * @param {Object} supabase - Supabase client instance.
 * @param {Object} [options={}] - Configuration options.
 * @param {boolean} [options.required=true] - Whether authentication is required. If false, returns
 *                                           { user: null, isAuthenticated: false } on missing/invalid token.
 * @returns {Promise<Object>} Authentication result.
 * @returns {Object|null} returns.user - Authenticated user object or null.
 * @returns {string} returns.user.id - User's unique identifier.
 * @returns {string} returns.user.email - User's email address.
 * @returns {Object} returns.user.user_metadata - Additional user metadata from Supabase.
 * @returns {boolean} returns.isAuthenticated - Whether authentication succeeded.
 * @returns {string|null} returns.token - The Bearer token or null if not authenticated.
 * @throws {Error} If required=true and authentication fails.
 */
export async function authenticateRequest(req, supabase, options = {}) {
  const startTime = Date.now();

  const { required = true } = options;
  const authHeader = req.headers.authorization || '';

  // If no auth header and not required, return unauthenticated
  if (!authHeader.startsWith('Bearer ')) {
    if (!required) {
      return { user: null, isAuthenticated: false, token: null };
    }
    throw new Error('Authentication required');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    if (!required) {
      return { user: null, isAuthenticated: false, token: null };
    }
    throw new Error('Invalid authentication format');
  }

  try {
    const { data } = await supabase.auth.getUser(token);
    const user = data?.user
      ? {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata || {},
        }
      : null;

    const result = {
      user,
      isAuthenticated: !!user,
      token,
    };

    logger.logOperation('authenticateRequest', 'auth/service', 'success', Date.now() - startTime, {
      isAuthenticated: result.isAuthenticated,
      required,
    });

    return result;
  } catch (error) {
    logger.logOperation('authenticateRequest', 'auth/service', 'error', Date.now() - startTime, {
      error,
      required,
    });
    logger.warn({ error, required }, '[auth.service] authenticateRequest failed');

    if (!required) {
      return { user: null, isAuthenticated: false, token: null };
    }
    throw new Error('Authentication failed');
  }
}

/**
 * Extract user ID from authorization header (simplified version).
 * Returns null if no valid token is present, allowing graceful degradation for optional auth.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.headers - Request headers object.
 * @param {string} req.headers.authorization - Authorization header with format "Bearer <token>".
 * @param {Object} supabase - Supabase client instance.
 * @returns {Promise<string|null>} User ID if authenticated, null if anonymous or authentication fails.
 */
export async function extractUserId(req, supabase) {
  try {
    const { user } = await authenticateRequest(req, supabase, {
      required: false,
    });
    return user?.id || null;
  } catch (error) {
    logger.warn({ error }, '[auth.service] extractUserId failed');
    return null;
  }
}
