/** Express app factory. Mounts routes and middleware. */
// Express application instance separated from start logic for testing and layering
import '#server/bootstrap.js';

import { Buffer } from 'buffer';
import crypto from 'crypto';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { OpenAI } from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { createSupabaseAnonClient, createSupabaseClient } from '#database/supabase.client.js';
import { requireAuth } from '#middleware/auth.middleware.js';
import createAnalyticsRouter from '#routes/analytics.routes.js';
import createAssessmentsRouter from '#routes/assessments.routes.js';
import healthRoutes from '#routes/health.routes.js';
import createScoringRouter from '#routes/scoring.routes.js';
import createSearchRouter from '#routes/search.routes.js';
import { getMinimalHealth, getSystemHealth } from '#services/health.service.js';

const app = express();
app.set('trust proxy', 1);

const IS_PROD = BACKEND_CONFIG.isProduction;
const allowedOrigins = BACKEND_CONFIG.app.allowedOrigins;
const authAllowList = BACKEND_CONFIG.app.authAllowList;
const routeMatchers = BACKEND_CONFIG.app.routeMatchers;
const { apiKey, apiAuthEnabled } = BACKEND_CONFIG.app;

// Helper to check for path in authAllowList (used by apiKeyGuard)
function isPublicRoute(path) {
  // logger.log('Checking if path is in authAllowList:', path);
  // logger.log('All public routes:', Array.from(authAllowList));
  // logger.log('Route matchers:', routeMatchers);

  // Check exact match first
  if (authAllowList.has(path)) {
    // logger.log('Path found in authAllowList:', path);
    return true;
  }

  // Then check regex patterns for dynamic routes
  const isMatched = routeMatchers.some((matcher) => {
    const matches = matcher.test(path);
    // logger.log(`Testing matcher ${matcher} against path ${path}: ${matches}`);
    return matches;
  });

  // logger.log('Final isPublicRoute result:', isMatched);
  return isMatched;
}

// ============================================
// COMMON UTILITIES
// ============================================

function safeCompare(providedKey, storedKey) {
  if (!providedKey || !storedKey) return false;

  const providedBuffer = Buffer.from(providedKey);
  const storedBuffer = Buffer.from(storedKey);

  if (providedBuffer.length !== storedBuffer.length) {
    crypto.timingSafeEqual(storedBuffer, storedBuffer);
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, storedBuffer);
}

function validateConfig() {
  if (!apiKey && apiAuthEnabled) {
    const message = 'API_AUTH_ENABLED=true but API_KEY is not set';
    if (IS_PROD) {
      throw new Error(message);
    }
    logger.warn(message);
  }

  if (!BACKEND_CONFIG.supabase.url || !BACKEND_CONFIG.supabase.anonKey) {
    logger.warn('Supabase URL or ANON_KEY is missing; database calls will fail.');
  }
}

export function apiKeyGuard(req, res, next) {
  const isPublic = isPublicRoute(req.path);

  if (!apiAuthEnabled || isPublic) return next();

  if (!apiKey) {
    logger.error('API auth enabled but API_KEY not configured');
    return res.status(500).json({
      error: 'API auth enabled but API_KEY is not configured',
      code: 'API_KEY_MISSING',
      timestamp: new Date().toISOString(),
    });
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiKeyHeader = (req.headers['x-api-key'] || '').toString().trim();

  const isValidHeader = safeCompare(apiKeyHeader, apiKey);
  const isValidBearer = safeCompare(bearerToken, apiKey);

  // if a Bearer token is present but doesn't match the API key,
  // it's likely a Supabase JWT — let requireAuth handle it downstream
  if (bearerToken && !isValidBearer && !isValidHeader) {
    return next();
  }

  if (isValidHeader || isValidBearer) {
    return next();
  }

  logger.error({ path: req.path }, 'Invalid or missing API key for protected route');
  return res.status(401).json({
    error: 'Invalid or missing API key',
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
  });
}

// apply middleware
app.use(helmet());
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ limit: '512kb', extended: true }));

// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { detailed = 'false', checks } = req.query;

    if (detailed === 'true') {
      // Detailed health check with all services
      const healthData = await getSystemHealth({
        checks: checks ? checks.split(',') : ['database', 'openai', 'system', 'config'],
      });
      res.json(healthData);
    } else {
      // Minimal health check for load balancers
      const healthData = await getMinimalHealth();

      // Set appropriate HTTP status based on health
      const statusCode = healthData.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(healthData);
    }
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Catch-all for root pings to stop CORS errors in deployment logs
app.get('/', (req, res) => {
  let message = 'Circular Economy API is Running ₰';
  if (!BACKEND_CONFIG.isProduction) {
    const origins = BACKEND_CONFIG.app.allowedOrigins;
    if (origins.length > 0) {
      message += ` [${origins.join(', ')}] allowed origins configured.`;
    }
  }
  res.send(message);
});

app.use(
  cors({
    origin: function (origin, callback) {
      // 1. Allow internal server-to-server requests (Origin is undefined)
      // This is necessary for your Vercel proxy to work in Production
      if (!origin) {
        return callback(null, true);
      }

      // 2. Direct match from your config
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Wildcard support for Vercel preview/branch domains
      if (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.sh')) {
        return callback(null, true);
      }

      // 4. Fail if none of the above match
      logger.warn({ origin }, 'CORS error: origin not allowed');
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Recommended for Supabase Auth cookies/headers
  }),
);

app.use(apiKeyGuard);

// initialize clients
const supabase = createSupabaseAnonClient();
const serviceSupabase = createSupabaseClient();
const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

validateConfig();

// mount routers
app.use('/health', healthRoutes);
app.use('/api/analytics', createAnalyticsRouter(supabase, serviceSupabase));
app.use('/api/score', createScoringRouter(openai, supabase));
app.use('/api/assessments', createAssessmentsRouter(serviceSupabase));
app.use('/api/search', createSearchRouter(supabase));

app.get('/api/profile', requireAuth(serviceSupabase), async (req, res) => {
  try {
    const { data, error } = await serviceSupabase
      .from('profiles')
      .select('id, username, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND',
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }

    res.json({
      id: data.id,
      username: data.username,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch profile');
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler
app.use((req, res) => {
  logger.error({ path: req.path, method: req.method }, 'Endpoint not found');
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// global error handler
app.use((err, req, res, next) => {
  const requestId = Math.random().toString(36).slice(2, 9);
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;
  if (isServerError) {
    logger.error(
      {
        err,
        requestId,
        method: req.method,
        path: req.path,
        status: statusCode,
        code: err.code || 'UNKNOWN',
      },
      'Request error',
    );
  } else if (!IS_PROD) {
    logger.warn({ requestId, statusCode }, err.message);
  }

  res.status(statusCode).json({
    error: isServerError ? 'Internal Server Error' : err.message || 'Request failed',
    message: err.message,
    code: err.code || (isServerError ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    timestamp: new Date().toISOString(),
    requestId,
  });
});

export default app;
export { app };
