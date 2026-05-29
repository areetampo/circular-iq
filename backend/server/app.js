/**
 * Express app: Helmet, CORS, optional API-key guard, and route mounting.
 *
 * | Prefix | Auth | Notes |
 * |--------|------|-------|
 * | `/` | Public | Root deployment ping |
 * | `/health` | Public | Health and Kubernetes probes |
 * | `/api/uptime` | Public | Uptime monitor API and SSE stream |
 * | `/api/analytics` | Public | Dashboard aggregates and reindex trigger |
 * | `/api/search` | Public | CE case search |
 * | `/api/score` | Optional Bearer | Rate-limited scoring routes |
 * | `/api/assessments` | Mixed Bearer/public | Router enforces auth per route |
 * | `/api/profile` | Bearer | Authenticated profile lookup |
 * | fallback | Optional API key | Reserved for future routes after mounted routers |
 */

import '#server/bootstrap.js';

import { Buffer } from 'buffer';
import crypto from 'crypto';

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { OpenAI } from 'openai';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { createSupabaseAnonClient, createSupabaseClient } from '#database/index.js';
import createAnalyticsRouter from '#routes/analytics.routes.js';
import createAssessmentsRouter from '#routes/assessments.routes.js';
import createHealthRouter from '#routes/health.routes.js';
import createProfileRouter from '#routes/profile.routes.js';
import createScoringRouter from '#routes/scoring.routes.js';
import createSearchRouter from '#routes/search.routes.js';
import createUptimeRouter from '#routes/uptime.routes.js';

const app = express();
app.set('trust proxy', 1);

const IS_PROD = BACKEND_CONFIG.isProduction;
const allowedOrigins = BACKEND_CONFIG.app.allowedOrigins;
const { apiKey, apiAuthEnabled } = BACKEND_CONFIG.app;

// ============================================
// COMMON UTILITIES
// ============================================

/**
 * Compares API-key candidates with `crypto.timingSafeEqual` once lengths match.
 * Length mismatches return early because timing-safe comparison requires equal-sized buffers.
 *
 * @param {string} providedKey - API key from `x-api-key` or bearer auth.
 * @param {string} storedKey - Expected API key from validated backend config.
 * @returns {boolean} `true` only when both non-empty keys are identical.
 */
function safeCompare(providedKey, storedKey) {
  if (!providedKey || !storedKey) return false;

  const providedBuffer = Buffer.from(providedKey);
  const storedBuffer = Buffer.from(storedKey);

  // Ensure both buffers are same length before comparison
  if (providedBuffer.length !== storedBuffer.length) return false;

  return crypto.timingSafeEqual(providedBuffer, storedBuffer);
}

/**
 * Validates auth-related startup configuration and warns about missing Supabase browser config.
 *
 * @throws {Error} If API auth is enabled without an API key in production.
 */
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

/**
 * API key authentication middleware
 * Validates API keys for routes mounted after the public routers when API auth is enabled.
 *
 * Auth flow:
 *  1. If API auth is disabled, pass through.
 *  2. If a Bearer token is present but doesn't match the API key, it is
 *     likely a Supabase JWT, so let requireAuth handle it downstream.
 *  3. If a valid x-api-key or Bearer API key is provided, pass through.
 *  4. Otherwise reject with 401.
 *
 * @param {import('express').Request} req - Incoming request that may carry `x-api-key` or bearer credentials.
 * @param {import('express').Response} res - Response used for API-key failure JSON.
 * @param {import('express').NextFunction} next - Delegates disabled auth, valid API keys, and JWT-like bearer tokens.
 * @returns {void|import('express').Response} Delegates to later middleware or ends the request with JSON.
 */
export function apiKeyGuard(req, res, next) {
  if (!apiAuthEnabled) return next();

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

  // If a Bearer token is present but does not match the API key,
  // it is likely a Supabase JWT, so let requireAuth handle it downstream.
  if (bearerToken && !isValidBearer && !isValidHeader) {
    return next();
  }

  if (isValidHeader || isValidBearer) {
    return next();
  }

  logger.error({ path: req.path }, 'Invalid or missing API key for protected route');
  return res.status(401).json({
    error: 'Failed to fetch data - UNAUTHORIZED',
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
  });
}

// Helmet and parsers run before CORS/routes so every response gets security headers.
app.use(helmet());
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ limit: '512kb', extended: true }));

// Root pings stay public to keep deployment health checks out of CORS error logs.
app.get('/', (req, res) => {
  let message = 'Circular Economy API is Running ~\\(≧▽≦)/~';
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
      // Server-to-server calls, including the Vercel proxy, do not include Origin.
      if (!origin) {
        return callback(null, true);
      }

      // Explicit allow-list entries come from validated backend config.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Vercel preview and branch domains are ephemeral but trusted deployment origins.
      if (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.sh')) {
        return callback(null, true);
      }

      // Unknown browser origins fail closed and are logged for deployment debugging.
      logger.warn({ origin }, 'CORS error: origin not allowed');
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Supabase Auth relies on credentialed cookies/headers.
  }),
);

// Shared clients are created once and passed into routers that need them.
const supabase = createSupabaseAnonClient();
const serviceSupabase = createSupabaseClient();
const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

validateConfig();

// ============================================
// ROUTES (all before API key guard)
// ============================================

// Health endpoints are mounted before the future API-key guard so probes stay public.
app.use('/health', createHealthRouter());

// Route-level auth lives inside each router; these mounts remain before the future API-key guard.
app.use('/api/profile', createProfileRouter(serviceSupabase));
app.use('/api/score', createScoringRouter(openai, supabase));
app.use('/api/assessments', createAssessmentsRouter(serviceSupabase));
app.use('/api/search', createSearchRouter());
app.use('/api/analytics', createAnalyticsRouter(serviceSupabase));
app.use('/api/uptime', createUptimeRouter());

// ============================================
// API KEY GUARD (kept for future admin endpoints)
// ============================================
app.use(apiKeyGuard);

// Unmatched paths return JSON rather than Express' default HTML response.
app.use((req, res) => {
  logger.error({ path: req.path, method: req.method }, 'Endpoint not found');
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// Final error handler sanitizes 5xx responses while preserving client-facing 4xx messages.
app.use((error, req, res, _next) => {
  const requestId = Math.random().toString(36).slice(2, 9);
  const statusCode = error.statusCode || error.status || 500;
  const isServerError = statusCode >= 500;
  if (isServerError) {
    logger.error(
      {
        error,
        requestId,
        method: req.method,
        path: req.path,
        status: statusCode,
        code: error.code || 'UNKNOWN',
      },
      'Request error',
    );
  } else if (!IS_PROD) {
    logger.warn({ requestId, statusCode }, error.message);
  }

  res.status(statusCode).json({
    error: isServerError ? 'Internal Server Error' : error.message || 'Request failed',
    message: error.message,
    code: error.code || (isServerError ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    timestamp: new Date().toISOString(),
    requestId,
  });
});

/**
 * Configured Express application (middleware + routes). Import for tests or `index.js` startup.
 *
 * @type {import('express').Express}
 */
export default app;
