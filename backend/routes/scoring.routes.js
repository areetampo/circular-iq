/**
 * Scoring Routes
 * Delegates core logic to scoring.controller.js
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import * as scoringController from '#controllers/scoring.controller.js';
import { createSupabaseClient } from '#database/index.js';
import { extractUserId } from '#services/auth.service.js';
import { setOpenAIClient as setServiceOpenAIClient } from '#services/scoring.service.js';
import { extractIPAddress } from '#utils/anonymousTracking.js';

// Module-scoped OpenAI client to support tests that call `setOpenAIClient()`
let sharedOpenAI = null;

export function setOpenAIClient(client) {
  sharedOpenAI = client;
  setServiceOpenAIClient(client);
}

const IS_PROD = BACKEND_CONFIG.isProduction;

function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    logger.info(
      { method, path, status, duration, timestamp: new Date().toISOString() },
      'Route request complete',
    );
  }
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

      const userId = await extractUserId(req, supabaseClient);

      const response = await scoringController.performScoring(
        req,
        openaiClient || sharedOpenAI,
        supabaseClient,
        serviceSupabase,
        userId,
      );

      logRequest('POST', '/score', 200, Date.now() - start);
      res.json(response);
    } catch (err) {
      const status = err.status || (err.code === 'INPUT_TOO_LONG' ? 400 : 500);
      logRequest('POST', '/score', status, Date.now() - start);
      logger.error({ err }, 'Failed to generate scoring audit');
      res.status(status).json({
        error: err.message || 'Failed to generate scoring audit',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // SSE streaming route for real-time progress updates
  router.post('/stream', scoringRateLimiter, async (req, res) => {
    const start = Date.now();
    let isClosed = false;

    // Handle client disconnect
    req.on('close', () => {
      isClosed = true;
    });

    try {
      // Enforce anonymous usage limits before heavy processing
      const anonCheck = await scoringController.enforceAnonymousUsage(
        req,
        supabaseClient,
        serviceSupabase,
      );

      if (anonCheck && anonCheck.blocked) {
        const status = anonCheck.status || 403;
        logRequest('POST', '/score/stream', status, Date.now() - start);

        return res.status(status).json(anonCheck.body);
      }

      const userId = await extractUserId(req, supabaseClient);

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Define emitter function for streaming progress
      const emit = (stage, message, data = {}) => {
        if (isClosed) return;
        try {
          res.write(`data: ${JSON.stringify({ stage, message, ...data })}\n\n`);
          // Force flush through Render's nginx proxy — critical for SSE in production
          if (typeof res.flush === 'function') res.flush();
        } catch (err) {
          logger.warn({ err }, 'Failed to write to SSE stream');
          isClosed = true;
        }
      };

      const heartbeat = setInterval(() => {
        if (!isClosed) {
          try {
            res.write(': heartbeat\n\n');
            if (typeof res.flush === 'function') res.flush();
          } catch (err) {
            logger.error({ err }, 'Failed to send heartbeat to SSE stream');
          }
        }
      }, 5000);

      // Run the streaming scoring pipeline
      await scoringController.performScoringWithStream(
        req,
        openaiClient || sharedOpenAI,
        supabaseClient,
        serviceSupabase,
        userId,
        emit,
      );

      clearInterval(heartbeat);

      if (!isClosed) res.end();

      logRequest('POST', '/score/stream', 200, Date.now() - start);
    } catch (err) {
      const status = err.status || (err.code === 'INPUT_TOO_LONG' ? 400 : 500);
      logRequest('POST', '/score/stream', status, Date.now() - start);
      logger.error({ err }, 'Failed to generate scoring audit (stream)');

      if (!isClosed) {
        // Send error event
        try {
          res.write(
            `data: ${JSON.stringify({
              stage: 'error',
              message: err.message || 'Failed to generate scoring audit',
              code: err.code || 'INTERNAL_ERROR',
            })}\n\n`,
          );
        } catch (writeErr) {
          logger.warn({ writeErr }, 'Failed to write error to SSE stream');
        }
        res.end();
      }
    }
  });

  return router;
}
