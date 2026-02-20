/* eslint-env node */
/* global process */
/**
 * Express API Server for Circular Economy Business Auditor
 *
 * Endpoints:
 * - POST /score - Main scoring and audit endpoint
 * - GET /health - Health check
 * - GET /docs/methodology - Methodology documentation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// This ensures dotenv has finished before these files are read
const { createClient } = await import('@supabase/supabase-js');
const { default: OpenAI } = await import('openai');

const { default: createAnalyticsRouter } = await import('./routes/analytics.js');
const { default: createAssessmentsRouter } = await import('./routes/assessments.js');
const { default: createScoringRouter } = await import('./routes/scoring.js');
const { requireAuth } = await import('../src/middleware/auth.js');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
const OPEN_ENDPOINTS = new Set(['/health', '/api/score', '/api/assessments/market-analysis']);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const getApiAuthEnabled = () => process.env.API_AUTH_ENABLED === 'true';
const getApiKey = () => process.env.API_KEY || '';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function errorResponse(error, defaultMessage = 'Internal server error') {
  return {
    error: error.message || defaultMessage,
    timestamp: new Date().toISOString(),
    code: error.code || 'INTERNAL_ERROR',
  };
}

function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
  }
}

function debugLog(...args) {
  if (!IS_PROD) console.log(...args);
}

function validateConfig() {
  if (getApiAuthEnabled() && !getApiKey()) {
    const message = 'API_AUTH_ENABLED=true but API_KEY is not set';
    if (IS_PROD) {
      throw new Error(message);
    }
    console.warn(message);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or ANON_KEY is missing; database calls will fail.');
  }
}

function apiKeyGuard(req, res, next) {
  const authEnabled = getApiAuthEnabled();
  const apiKey = getApiKey();

  // Debug incoming requests when API auth is enabled to help diagnose 401s
  if (authEnabled) {
    debugLog('[apiKeyGuard] incoming', {
      path: req.path,
      method: req.method,
      hasAuth: !!req.headers.authorization,
      hasXApiKey: !!req.headers['x-api-key'],
      openEndpoint: OPEN_ENDPOINTS.has(req.path),
    });
  }

  if (!authEnabled) return next();
  if (OPEN_ENDPOINTS.has(req.path)) return next();

  if (!apiKey) {
    return res
      .status(500)
      .json(
        errorResponse(
          { message: 'API auth enabled but API_KEY is not configured', code: 'API_KEY_MISSING' },
          'API auth misconfigured',
        ),
      );
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiKeyHeader = (req.headers['x-api-key'] || '').toString().trim();

  // Allow when the correct API key is supplied via X-API-Key or Bearer token
  if (apiKeyHeader === apiKey || bearerToken === apiKey) {
    return next();
  }

  // Only allow requests if the path is explicitly open or the master API key is provided.
  // Do NOT allow arbitrary bearer tokens to bypass the global API guard.
  // Route-level authentication (requireAuth) will not be reachable unless
  // the request passes this global guard.

  // No API key or matching bearer token provided — block access
  return res
    .status(401)
    .json(
      errorResponse(
        { message: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        'Unauthorized',
      ),
    );
}

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS Error: Origin ${origin} not allowed`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  }),
);

app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ limit: '512kb', extended: true }));

app.use(apiKeyGuard);

// Initialize Supabase & OpenAI
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

validateConfig();

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// ANALYTICS DASHBOARD ENDPOINTS
// ============================================

app.use('/api/analytics', createAnalyticsRouter(supabase));

// ============================================
// SCORING ENDPOINTS
// ============================================

app.use('/api/score', createScoringRouter(openai, supabase));

// ============================================
// ASSESSMENT HISTORY ENDPOINTS (Phase 2)
// ============================================

app.use('/api/assessments', createAssessmentsRouter(supabase));

// ============================================
// USER PROFILE ENDPOINT
// ============================================

/**
 * GET /api/profile
 * Get current user's profile including username
 * Requires authentication
 */
app.get('/api/profile', requireAuth(supabase), async (req, res) => {
  try {
    // Fetch profile from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found (shouldn't happen with trigger, but handle gracefully)
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
    console.error('[PROFILE_FETCH_ERROR]', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================
// METHODOLOGY ENDPOINT
// ============================================

/**
 * GET /docs/methodology
 * Returns documentation about the 8-factor scoring framework
 */
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
      name: 'GreenTechGuardians',
      size: 'Dynamic (embedded in Supabase)',
      embedding_model: 'text-embedding-3-small',
      embedding_dimensions: 1536,
      retrieval_method: 'Cosine similarity search',
    },
  });
});

// ============================================
// 404 HANDLER (must be after all routes)
// ============================================

app.use((req, res) => {
  res.status(404).json(
    errorResponse({
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    }),
  );
});

// ============================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ============================================
// This middleware catches all errors from route handlers and returns a clean JSON response
// It MUST be defined after all other middleware and route handlers
// Express recognizes error handlers by their 4-parameter signature: (err, req, res, next)

app.use((err, req, res, next) => {
  const requestId = Math.random().toString(36).slice(2, 9);
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  // Log error details (server errors are important to track)
  if (isServerError) {
    console.error(`[${requestId}] ERROR:`, {
      method: req.method,
      path: req.path,
      status: statusCode,
      message: err.message,
      code: err.code || 'UNKNOWN',
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  } else if (!IS_PROD) {
    // Client errors (4xx) - log in development only
    console.warn(`[${requestId}] WARNING [${statusCode}]:`, err.message);
  }

  // Return clean JSON error response
  res.status(statusCode).json({
    error: isServerError ? 'Internal Server Error' : err.message || 'Request failed',
    message: err.message,
    code: err.code || (isServerError ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    timestamp: new Date().toISOString(),
    requestId, // Helps with debugging
  });
});

// ============================================
// START SERVER (skip when running tests)
// ============================================

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   Circular Economy Business Auditor API                    ║
║   Server running on http://localhost:${PORT}               ║
╚════════════════════════════════════════════════════════════╝

🔧 Modular Architecture:
  This server uses a modular routing structure for better maintainability.

📍 Primary API Endpoints:
  GET  /health                         - Health check
  POST /api/score                      - Score and audit a business idea
  GET  /docs/methodology               - View methodology documentation

🗂️  Assessment Management (Modular):
  POST   /api/assessments              - Save an assessment
  GET    /api/assessments              - List assessments (with filtering, pagination)
  GET    /api/assessments/:id          - Get assessment detail
  DELETE /api/assessments/:id          - Delete assessment
  GET    /api/assessments/market-analysis - Market benchmarking data

📊 Analytics Dashboard (Modular):
  GET  /api/analytics                  - Analytics and insights dashboard

🗄️  Database:
  Supabase: ${typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}

✅ Ready for requests. Press Ctrl+C to stop.
    `);
  });
}

// Error handling for unhandled rejections
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

export default app;
