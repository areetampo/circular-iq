/**
 * Scoring router mounted at `/api/score`; endpoints are public with optional Bearer auth.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | POST | `/` | Optional Bearer | JSON scoring response, 10 requests/minute per IP |
 * | POST | `/stream` | Optional Bearer | SSE scoring stages, 10 requests/minute per IP |
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

import * as scoringController from '#controllers/scoring.controller.js';
import { createSupabaseClient } from '#database/index.js';
import { extractUserId } from '#services/auth.service.js';
import { setOpenAIClient as setServiceOpenAIClient } from '#services/scoring.service.js';
import { extractIPAddress } from '#utils/anonymousTracking.js';
import { toClientError } from '#utils/errors.js';

// Shared test hook for legacy router initialization that supplies Supabase separately.
let sharedOpenAI = null;

/**
 * Sets the OpenAI client for this router module and the scoring service.
 * Tests use this to inject mock OpenAI instances while preserving legacy router setup.
 *
 * @param {import('openai').OpenAI} client - Client used by scoring routes and services for embeddings and audit generation.
 */
export function setOpenAIClient(client) {
  sharedOpenAI = client;
  setServiceOpenAIClient(client);
}

/**
 * Creates scoring routes for JSON and SSE scoring flows.
 * Supports dual initialization patterns for backward compatibility with tests.
 *
 * @param {import('openai').OpenAI|import('@supabase/supabase-js').SupabaseClient|Record<string, unknown>} openai - OpenAI client, or legacy Supabase client when tests inject OpenAI via `setOpenAIClient`.
 * @param {import('@supabase/supabase-js').SupabaseClient|Record<string, unknown>} [supabase] - Supabase client used for scoring persistence and anonymous usage checks.
 * @returns {express.Router} Router mounted under `/api/score`.
 */
export default function createScoringRouter(openai, supabase) {
  // Tests may pass only Supabase after injecting OpenAI through setOpenAIClient().
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

  /**
   * POST /
   * Accepts no path or query parameters. Body requires `businessProblem`, `businessSolution`, and
   * `evaluationParameters`; `businessContext` is optional. Requests are rate limited per IP, anonymous
   * usage is checked before OpenAI work, input-length failures map to 400, anonymous blocks return
   * their controller status, and unexpected scoring failures map to 500.
   */
  router.post('/', scoringRateLimiter, async (req, res) => {
    const start = Date.now();
    try {
      // Anonymous usage is checked before OpenAI work so blocked requests stay cheap.
      const anonCheck = await scoringController.enforceAnonymousUsage(
        req,
        supabaseClient,
        serviceSupabase,
      );

      if (anonCheck && anonCheck.blocked) {
        const status = anonCheck.status || 403;
        logger.logOperation('POST', '/score', status, Date.now() - start);
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

      logger.logOperation('POST', '/score', 200, Date.now() - start);
      res.json(response);
    } catch (error) {
      const status = error.status || (error.code === 'INPUT_TOO_LONG' ? 400 : 500);
      logger.logOperation('POST', '/score', status, Date.now() - start);
      logger.error({ error }, 'Failed to generate scoring audit');
      res.status(status).json({
        ...toClientError(error, 'Failed to generate scoring audit'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /stream
   * Accepts no path or query parameters and the same body as `POST /`. Streams SSE stage events,
   * proxy-flushed heartbeat comments every 5 seconds, and stops writing after client disconnect.
   * Anonymous usage failures return JSON before SSE headers are sent; later failures are sent as
   * `stage: "error"` events when the stream is still open.
   */
  router.post('/stream', scoringRateLimiter, async (req, res) => {
    const start = Date.now();
    let isClosed = false;

    // Stop heartbeat and stage writes after clients disconnect from the SSE stream.
    req.on('close', () => {
      isClosed = true;
    });

    try {
      // Anonymous usage is checked before SSE setup so blocked requests receive normal JSON.
      const anonCheck = await scoringController.enforceAnonymousUsage(
        req,
        supabaseClient,
        serviceSupabase,
      );

      if (anonCheck && anonCheck.blocked) {
        const status = anonCheck.status || 403;
        logger.logOperation('POST', '/score/stream', status, Date.now() - start);
        return res.status(status).json(anonCheck.body);
      }

      const userId = await extractUserId(req, supabaseClient);

      // Disable proxy buffering so stage events are delivered as they are produced.
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // The scoring service calls this for each stage transition.
      const emit = (stage, message, data = {}) => {
        if (isClosed) return;
        try {
          res.write(`data: ${JSON.stringify({ stage, message, ...data })}\n\n`);
          // Render's nginx proxy needs explicit flushes for timely SSE delivery.
          if (typeof res.flush === 'function') res.flush();
        } catch (error) {
          logger.warn({ error }, 'Failed to write to SSE stream');
          isClosed = true;
        }
      };

      const heartbeat = setInterval(() => {
        if (!isClosed) {
          try {
            res.write(': heartbeat\n\n');
            if (typeof res.flush === 'function') res.flush();
          } catch (error) {
            logger.error({ error }, 'Failed to send heartbeat to SSE stream');
          }
        }
      }, 5000);

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

      logger.logOperation('POST', '/score/stream', 200, Date.now() - start);
    } catch (error) {
      const status = error.status || (error.code === 'INPUT_TOO_LONG' ? 400 : 500);
      logger.logOperation('POST', '/score/stream', status, Date.now() - start);
      logger.error({ error }, 'Failed to generate scoring audit (stream)');

      if (!isClosed) {
        // Once SSE headers are sent, failures must be delivered as stream events.
        try {
          const { error: safeMessage, code: safeCode } = toClientError(
            error,
            'Failed to generate scoring audit',
          );
          res.write(
            `data: ${JSON.stringify({
              stage: 'error',
              message: safeMessage,
              code: safeCode,
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
