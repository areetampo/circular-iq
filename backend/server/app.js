/**
 * @module app
 * @description Express application factory and middleware configuration.
 * Creates and configures the Express app with all routes, middleware, and error handlers.
 * Separated from server startup logic for testability and modular architecture.
 *
 * Key features:
 * - CORS configuration with origin validation
 * - API key authentication middleware
 * - Route mounting for all API endpoints
 * - Global error handling
 * - Security headers via Helmet
 *
 * Routes mounted:
 * - /health - Health check endpoints (public)
 * - /api/uptime - Uptime monitoring (public)
 * - /api/analytics - Analytics and statistics (public)
 * - /api/search - CE cases search (public)
 * - /api/score - Scoring/assessment (public with rate limiting)
 * - /api/assessments - Assessment CRUD (requires auth)
 * - /api/profile - User profile (requires auth)
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
 * Safely compare API keys using timing-safe comparison to prevent timing attacks
 * @param {string} providedKey - API key provided in request
 * @param {string} storedKey - Expected API key from configuration
 * @returns {boolean} True if keys match
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
 * Validate required configuration for API authentication
 * @throws {Error} If API key is required but not set in production
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
 * Validates API key for non-public routes when API auth is enabled.
 *
 * Auth flow:
 *  1. Public routes always pass through.
 *  2. If API auth is disabled, pass through.
 *  3. If a Bearer token is present but doesn't match the API key, it is
 *     likely a Supabase JWT — let requireAuth handle it downstream.
 *  4. If a valid x-api-key or Bearer API key is provided, pass through.
 *  5. Otherwise reject with 401.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
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

  // If a Bearer token is present but doesn't match the API key,
  // it's likely a Supabase JWT — let requireAuth handle it downstream.
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

// apply middleware
app.use(helmet());
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ limit: '512kb', extended: true }));

// Catch-all for root pings to stop CORS errors in deployment logs
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

// initialize clients
const supabase = createSupabaseAnonClient();
const serviceSupabase = createSupabaseClient();
const openai = new OpenAI({ apiKey: BACKEND_CONFIG.openai.apiKey });

validateConfig();

// ============================================
// ROUTES (all before API key guard)
// ============================================

// Public health routes
app.use('/health', createHealthRouter());

// Public API routes (no authentication required)
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
app.use((err, req, res, _next) => {
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

/**
 * Configured Express application (middleware + routes). Import for tests or `index.js` startup.
 * @type {import('express').Express}
 */
export default app;
