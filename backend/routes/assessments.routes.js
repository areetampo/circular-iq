/**
 * Assessment CRUD router mounted at `/api/assessments`.
 *
 * | Method | Path | Auth | Notes |
 * |--------|------|------|-------|
 * | POST | `/` | Bearer (required) | Validated assessment create |
 * | GET | `/` | Bearer (required) | Owner-scoped list with filters |
 * | GET | `/stats` | Bearer (required) | Owner-scoped aggregate stats |
 * | GET | `/public/:publicId` | Optional Bearer | Public share lookup with owner context |
 * | GET | `/validate/:publicId` | Optional Bearer | Visibility and UUID validation |
 * | GET | `/compare?id1=&id2=` | Optional Bearer | Public or owner-visible comparison |
 * | GET | `/:publicId` | Bearer (required) | Owner-scoped lookup by public id |
 * | PATCH | `/:id` | Bearer (required) | Owner-scoped update by internal id |
 * | DELETE | `/:id` | Bearer (required) | Owner-scoped delete by internal id |
 */

import express from 'express';

import * as assessmentsController from '#controllers/assessments.controller.js';
import { requireAuth } from '#middleware/auth.middleware.js';
import { validateAssessment } from '#middleware/validation.middleware.js';
import { authenticateRequest } from '#services/auth.service.js';
import { toClientError } from '#utils/errors.js';

/**
 * Creates assessment routes for authenticated CRUD plus public sharing helpers.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient|Record<string, unknown>} serviceSupabase - Service-role Supabase client used by auth middleware and assessment controllers.
 * @returns {express.Router} Router mounted under `/api/assessments`.
 */
export default function createAssessmentsRouter(serviceSupabase) {
  const router = express.Router();

  /**
   * POST /
   * Requires Bearer auth and no path or query parameters. Saves a validated assessment body plus
   * the raw scoring result. Validation middleware handles request shape; title errors map to 400,
   * while unexpected persistence failures map to 500.
   */
  router.post('/', requireAuth(serviceSupabase), validateAssessment, async (req, res) => {
    const startTime = Date.now();

    try {
      const result = await assessmentsController.saveAssessment(
        serviceSupabase,
        req.user,
        req.validatedBody,
        req.body,
      );
      logger.logOperation('POST', '/assessments', 201, Date.now() - startTime);
      res.status(201).json(result);
    } catch (error) {
      logger.error({ error }, 'Error saving assessment');
      const statusCode = error.code === 'TITLE_LENGTH_INVALID' ? 400 : 500;
      logger.logOperation('POST', '/assessments', statusCode, Date.now() - startTime);
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to save assessment'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /
   * Requires Bearer auth and no path parameters. Query args: `industry`, `sortBy`, `order`, `page`,
   * `pageSize`, `search`, `createdFrom`, `createdTo`, `minScore`, `maxScore`. The controller clamps
   * `pageSize` to 100, defaults unsafe sort values, and returns owner-scoped rows with pagination
   * fields; query failures map to 500.
   */
  router.get('/', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const result = await assessmentsController.fetchUserAssessments(
        serviceSupabase,
        req.user,
        req.query,
      );
      logger.logOperation('GET', '/assessments', 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      logger.error({ error }, 'Error fetching assessments');
      logger.logOperation('GET', '/assessments', 500, Date.now() - startTime);
      res.status(500).json({
        ...toClientError(error, 'Failed to fetch assessments'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /stats
   * Requires Bearer auth and no path or query parameters. Returns aggregate counts and score
   * summaries for the authenticated user's saved assessments. RPC failures map to 500.
   */
  router.get('/stats', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const stats = await assessmentsController.getAssessmentStats(serviceSupabase, req.user);
      logger.logOperation('GET', '/assessments/stats', 200, Date.now() - startTime);
      res.json(stats);
    } catch (error) {
      logger.error({ error }, 'Error fetching assessment stats');
      logger.logOperation('GET', '/assessments/stats', 500, Date.now() - startTime);
      res.status(500).json({
        ...toClientError(error, 'Failed to fetch assessment statistics'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /public/:publicId
   * Path param `publicId` is the assessment public UUID; no query parameters are read. Optional
   * Bearer auth lets owners access private shares. Missing rows map to 404; other controller
   * failures, including private non-owner access, currently map to 500 in this route.
   */
  router.get('/public/:publicId', async (req, res) => {
    const startTime = Date.now();

    try {
      // Optional auth lets owners access private share URLs without blocking public reads.
      const { user } = await authenticateRequest(req, serviceSupabase, {
        required: false,
      });

      const result = await assessmentsController.getPublicAssessment(
        serviceSupabase,
        user,
        req.params.publicId,
      );
      logger.logOperation(
        'GET',
        `/assessments/public/${req.params.publicId}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logger.logOperation(
        'GET',
        `/assessments/public/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to fetch assessment'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /validate/:publicId
   * Path param `publicId` is the assessment public UUID; no query parameters are read. Optional
   * Bearer auth allows private-owner validation. Invalid UUIDs map to 400, hidden private rows to
   * 403, missing rows to 404, and unexpected failures to 500.
   */
  router.get('/validate/:publicId', async (req, res) => {
    const startTime = Date.now();

    try {
      // Optional auth lets owners validate private IDs that would be hidden from anonymous users.
      const { user } = await authenticateRequest(req, serviceSupabase, {
        required: false,
      });

      const result = await assessmentsController.validatePublicId(
        serviceSupabase,
        req.params.publicId,
        user,
      );
      logger.logOperation(
        'GET',
        `/assessments/validate/${req.params.publicId}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode =
        error.code === 'INVALID_FORMAT'
          ? 400
          : error.code === 'NOT_FOUND'
            ? 404
            : error.code === 'FORBIDDEN'
              ? 403
              : 500;
      logger.logOperation(
        'GET',
        `/assessments/validate/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to validate assessment'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /compare?id1=&id2=
   * Query args `id1` and `id2` are required public UUIDs; there are no path params. Optional
   * Bearer auth enables owner access to private rows. Whitespace-only IDs are rejected as 400,
   * private non-owner access maps to 403, and this route must stay before `GET /:publicId`.
   */
  router.get('/compare', async (req, res) => {
    const startTime = Date.now();

    const { id1, id2 } = req.query;

    try {
      // Reject whitespace-only IDs before optional auth so bad requests stay cheap.
      if (!id1 || !id2 || id1.trim() === '' || id2.trim() === '') {
        throw {
          code: 'INVALID_IDS',
          message: 'Query parameters id1 and id2 are required',
        };
      }

      // Optional auth lets owners compare private assessments they can access.
      const { user } = await authenticateRequest(req, serviceSupabase, {
        required: false,
      });

      const result = await assessmentsController.compareAssessments(
        serviceSupabase,
        user,
        id1,
        id2,
      );
      logger.logOperation(
        'GET',
        `/assessments/compare?id1=${id1}&id2=${id2}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode =
        error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'FORBIDDEN'
            ? 403
            : error.code === 'INVALID_IDS'
              ? 400
              : error.code === 'NOT_PUBLIC'
                ? 403
                : 500;
      logger.logOperation(
        'GET',
        `/assessments/compare?id1=${id1}&id2=${id2}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to compare assessments'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /:publicId
   * Requires Bearer auth. Path param `publicId` is the public UUID, not the database primary key;
   * no query parameters are read. Missing or unauthorized owner-scoped rows respond as 404.
   */
  router.get('/:publicId', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const result = await assessmentsController.getAssessmentById(
        serviceSupabase,
        req.user,
        req.params.publicId,
      );
      logger.logOperation(
        'GET',
        `/assessments/${req.params.publicId}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logger.logOperation(
        'GET',
        `/assessments/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to fetch assessment'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PATCH /:id
   * Requires Bearer auth. Path param `id` is the internal assessment UUID; no query parameters are
   * read. Updates owner-scoped JSON body fields such as title or visibility. Title validation maps
   * to 400, missing rows to 404, and other failures to 500.
   */
  router.patch('/:id', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const result = await assessmentsController.updateAssessment(
        serviceSupabase,
        req.user,
        req.params.id,
        req.body,
      );
      logger.logOperation('PATCH', `/assessments/${req.params.id}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.code === 'NOT_FOUND') {
        statusCode = 404;
      } else if (error.code === 'TITLE_LENGTH_INVALID') {
        statusCode = 400;
      }
      logger.logOperation(
        'PATCH',
        `/assessments/${req.params.id}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to update assessment'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * DELETE /:id
   * Requires Bearer auth. Path param `id` is the internal assessment UUID; no query parameters are
   * read. Deletes only owner-scoped rows. Missing rows map to 404; other failures map to 500.
   */
  router.delete('/:id', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const result = await assessmentsController.deleteAssessment(
        serviceSupabase,
        req.user,
        req.params.id,
      );
      logger.logOperation('DELETE', `/assessments/${req.params.id}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logger.logOperation(
        'DELETE',
        `/assessments/${req.params.id}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        ...toClientError(error, 'Failed to delete assessment'),
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
