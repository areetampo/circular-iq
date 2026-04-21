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
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from '#config/embedding.js';
import { createSupabaseAnonClient, createSupabaseClient } from '#database/supabase.client.js';
import { requireAuth } from '#middleware/auth.middleware.js';
import createAnalyticsRouter from '#routes/analytics.routes.js';
import createAssessmentsRouter from '#routes/assessments.routes.js';
import healthRoutes from '#routes/health.routes.js';
import createScoringRouter from '#routes/scoring.routes.js';
import { getMinimalHealth, getSystemHealth } from '#services/health.service.js';

const app = express();
app.set('trust proxy', 1);

const IS_PROD = BACKEND_CONFIG.isProduction;
const publicRoutes = BACKEND_CONFIG.app.publicRoutes;
const routeMatchers = BACKEND_CONFIG.app.routeMatchers;
const allowedOrigins = BACKEND_CONFIG.app.allowedOrigins;
const { apiKey, apiAuthEnabled } = BACKEND_CONFIG.app;

// Helper to check for public routes (used by apiKeyGuard)
function isPublicRoute(path) {
  // logger.log('Checking if path is public:', path);
  // logger.log('Public routes:', Array.from(publicRoutes));
  // logger.log('Route matchers:', routeMatchers);

  // Check exact match first
  if (publicRoutes.has(path)) {
    // logger.log('Path found in publicRoutes:', path);
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

  if (apiAuthEnabled) {
    logger.info(
      {
        path: req.path,
        method: req.method,
        isPublicRoute: isPublic,
        hasAuthorizationHeader: !!req.headers.authorization,
        hasXApiKey: !!req.headers['x-api-key'],
      },
      'API key guard incoming request',
    );
  }

  if (!apiAuthEnabled) return next();
  if (isPublic) {
    logger.info({ path: req.path }, 'Public route allowed');
    return next();
  }

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
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Catch-all for root pings to stop CORS errors in deployment logs
app.get('/', (req, res) => {
  res.send(
    `Circular Economy API is Running ₰ ${BACKEND_CONFIG.app.allowedOrigins.length} allowed origins configured.`,
  );
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
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch profile');
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/docs/methodology', (req, res) => {
  res.json({
    title: 'Circular Economy Business Auditor - Methodology',
    version: '1.0.0',
    framework: {
      name: '8-Factor Circular Economy Evaluation Framework',
      description: 'Deterministic scoring system for assessing circular economy business viability',
      factors: {
        'Access Value (Social & Participation)': {
          public_participation: {
            weight: 0.15,
            range: '0-100',
            description: 'How easily can stakeholders engage with your system?',
            low: 'Limited to specific groups',
            high: 'Universal accessibility',
          },
          infrastructure: {
            weight: 0.15,
            range: '0-100',
            description: 'Existing infrastructure availability and geographic reach',
            low: 'Limited infrastructure - significant investment needed',
            high: 'Strong existing infrastructure supports this',
          },
        },
        'Embedded Value (Economic & Material)': {
          market_price: {
            weight: 0.2,
            range: '0-100',
            description: 'Economic value of recovered materials and market demand',
            low: 'Requires subsidies or policy support',
            high: 'Strong market demand and recovery value',
          },
          maintenance: {
            weight: 0.1,
            range: '0-100',
            description: 'Ease and cost of upkeep, system durability',
            low: 'High maintenance demands',
            high: 'Very easy to maintain, low cost',
          },
          uniqueness: {
            weight: 0.1,
            range: '0-100',
            description: 'Innovation level and competitive advantage',
            low: 'Conventional approach',
            high: 'Highly innovative',
          },
        },
        'Processing Value (Technical & Operational)': {
          size_efficiency: {
            weight: 0.1,
            range: '0-100',
            description: 'Physical footprint and transportation efficiency',
            low: 'Significant space and resources needed',
            high: 'Highly space-efficient, minimal footprint',
          },
          chemical_safety: {
            weight: 0.1,
            range: '0-100',
            description: 'Environmental hazards and health risks (inverse scale)',
            low: 'Significant hazards - strict protocols required',
            high: 'Minimal environmental and health risks',
          },
          tech_readiness: {
            weight: 0.1,
            range: '0-100',
            description: 'Technology maturity and implementation complexity',
            low: 'Emerging technology, significant R&D needed',
            high: 'Proven technology, ready for deployment',
          },
        },
      },
    },
    scoring_formula: 'overall_score = Σ(sub_score * weight) for all 8 factors',
    total_weight: 1.0,
    database: {
      name: '...many...',
      size: 'Dynamic (embedded in Supabase)',
      embedding_model: EMBEDDING_MODEL,
      embedding_dimensions: EMBEDDING_DIMENSION,
      retrieval_method: 'Cosine similarity search',
    },
  });
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
