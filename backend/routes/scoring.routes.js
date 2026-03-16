/**
 * Scoring Routes
 * Delegates core logic to scoring.controller.js
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import * as scoringController from '#controllers/scoring.controller.js';
import { createSupabaseClient } from '#database/supabase.client.js';
import { extractIPAddress } from '#utils/anonymousTracking.js';

// Module-scoped OpenAI client to support tests that call `setOpenAIClient()`
let sharedOpenAI = null;

export function setOpenAIClient(client) {
  sharedOpenAI = client;
}

const IS_PROD = BACKEND_CONFIG.isProduction;

function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
  }
}

function errorResponse(error, defaultMessage = 'Internal server error') {
  return {
    error: error.message || defaultMessage,
    timestamp: new Date().toISOString(),
    code: error.code || 'INTERNAL_ERROR',
  };
}

export default function createScoringRouter(openai, supabase) {
  // Support two call styles used across the codebase and tests:
  // - createScoringRouter(openai, supabase)
  // - createScoringRouter(supabase) where OpenAI was previously set via setOpenAIClient()
  const router = express.Router();
  router.use(express.json());
  const serviceSupabase = createSupabaseClient();

  const openaiClient =
    supabase === undefined && openai && typeof openai.rpc === 'function' ? sharedOpenAI : openai;

  const supabaseClient =
    supabase === undefined && openai && typeof openai.rpc === 'function' ? openai : supabase;

  const scoringRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a minute and try again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => extractIPAddress(req),
  });

  // helper endpoint for testing tracking
  router.get('/test-anonymous-limit-tracking', async (req, res) => {
    try {
      const result = await scoringController.enforceAnonymousUsage(req, supabase, serviceSupabase);
      res.json({ allowed: result === null, result });
    } catch (err) {
      res.status(500).json(errorResponse(err));
    }
  });

  router.post('/', scoringRateLimiter, async (req, res) => {
    const start = Date.now();
    try {
      // Enforce anonymous usage limits before heavy processing
      const anonCheck = await scoringController.enforceAnonymousUsage(
        req,
        supabaseClient,
        serviceSupabase,
      );

      if (anonCheck && anonCheck.blocked) {
        const status = anonCheck.status || 403;
        logRequest('POST', '/score', status, Date.now() - start);
        return res.status(status).json(anonCheck.body);
      }

      const response = await scoringController.performScoring(
        req,
        openaiClient || sharedOpenAI,
        supabaseClient,
      );
      logRequest('POST', '/score', 200, Date.now() - start);
      res.json(response);
    } catch (err) {
      const status = err.status || (err.code === 'INPUT_TOO_LONG' ? 400 : 500);
      logRequest('POST', '/score', status, Date.now() - start);
      res.status(status).json(errorResponse(err, 'Failed to generate scoring audit'));
    }
  });

  return router;
}
