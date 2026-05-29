/**
 * Optional/required Supabase Bearer auth helpers for routes that do not use `requireAuth`.
 */

/**
 * Authenticate a request using the Authorization header.
 * Supports both required and optional authentication modes.
 *
 * @param {import('express').Request} req - Express request that may include `Authorization: Bearer <token>`.
 * @param {{ auth: { getUser: (token: string) => Promise<{ data?: { user?: { id: string, email?: string, user_metadata?: Record<string, unknown> } } }> } }} supabase - Supabase client used to validate bearer tokens.
 * @param {{ required?: boolean }} [options={}] - Authentication mode for this route.
 * @param {boolean} [options.required=true] - Whether authentication is required. If false, returns
 *                                           { user: null, isAuthenticated: false } on missing/invalid token.
 * @returns {Promise<{
 *   user: { id: string, email?: string, user_metadata: Record<string, unknown> }|null,
 *   isAuthenticated: boolean,
 *   token: string|null
 * }>} Authenticated user/token state, or anonymous state when optional auth fails.
 * @throws {Error} If `required` is true and the bearer token is missing, empty, or Supabase token validation throws.
 */
export async function authenticateRequest(req, supabase, options = {}) {
  const startTime = Date.now();

  const { required = true } = options;
  const authHeader = req.headers.authorization || '';

  // Optional-auth routes treat missing bearer headers as anonymous access.
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
 * @param {import('express').Request} req - Express request that may include `Authorization: Bearer <token>`.
 * @param {{ auth: { getUser: (token: string) => Promise<{ data?: { user?: { id: string, email?: string, user_metadata?: Record<string, unknown> } } }> } }} supabase - Supabase client used to validate bearer tokens.
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
