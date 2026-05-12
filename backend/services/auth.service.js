/**
 * Authentication Service
 * Centralized authentication logic to eliminate code duplication
 */

/**
 * Extract user ID from authorization header
 * @param {Object} req - Express request object
 * @param {Object} supabase - Supabase client
 * @param {Object} options - Authentication options
 * @returns {Promise<Object>} Authentication result { user, isAuthenticated, token }
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
 * Extract user ID from authorization header (simplified version)
 * @param {Object} req - Express request object
 * @param {Object} supabase - Supabase client
 * @returns {Promise<string|null>} User ID or null if anonymous
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
