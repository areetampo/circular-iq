/**
 * Assessments Routes
 * Defines endpoint structure and delegates to assessments controller
 * - Routes only handle Express middleware, validation, error formatting
 * - All business logic delegated to assessments.controller
 */

import express from 'express';

import * as assessmentsController from '#controllers/assessments.controller.js';
import { requireAuth } from '#middleware/auth.middleware.js';
import { validateAssessment } from '#middleware/validation.middleware.js';
import { authenticateRequest } from '#services/auth.service.js';
import { logOperation } from '#utils/controller-helpers.js';

/**
 * Create assessments router
 * @param {Object} supabase - Supabase client instance
 * @returns {express.Router} Express router with assessment endpoints
 */
export default function createAssessmentsRouter(serviceSupabase) {
  const router = express.Router();

  /**
   * POST /
   * Save a completed assessment result
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
      logOperation('POST', '/assessments', 201, Date.now() - startTime);
      res.status(201).json(result);
    } catch (err) {
      logger.error({ err }, 'Error saving assessment');
      const statusCode = err.code === 'TITLE_LENGTH_INVALID' ? 400 : 500;
      logOperation('POST', '/assessments', statusCode, Date.now() - startTime);
      res.status(statusCode).json({
        error: err.message || 'Failed to save assessment',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /
   * Retrieve list of user's assessments with filtering and pagination
   */
  router.get('/', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.fetchUserAssessments(
        serviceSupabase,
        req.user,
        req.query,
      );
      logOperation('GET', '/assessments', 200, Date.now() - startTime);
      res.json(result);
    } catch (err) {
      logger.error({ err }, 'Error fetching assessments');
      logOperation('GET', '/assessments', 500, Date.now() - startTime);
      res.status(500).json({
        error: err.message || 'Failed to fetch assessments',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /stats
   * Retrieve aggregate statistics for user's assessments
   */
  router.get('/stats', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const stats = await assessmentsController.getAssessmentStats(serviceSupabase, req.user);
      logOperation('GET', '/assessments/stats', 200, Date.now() - startTime);
      res.json(stats);
    } catch (err) {
      logger.error({ err }, 'Error fetching assessment stats');
      logOperation('GET', '/assessments/stats', 500, Date.now() - startTime);
      res.status(500).json({
        error: err.message || 'Failed to fetch assessment statistics',
        code: err.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /public/:publicId
   * Retrieve a publicly shared assessment (optional auth for ownership check)
   */
  router.get('/public/:publicId', async (req, res) => {
    const startTime = Date.now();
    try {
      // Handle optional authentication using centralized auth service
      const { user } = await authenticateRequest(req, serviceSupabase, {
        required: false,
      });

      const result = await assessmentsController.getPublicAssessment(
        serviceSupabase,
        user,
        req.params.publicId,
      );
      logOperation(
        'GET',
        `/assessments/public/${req.params.publicId}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logOperation(
        'GET',
        `/assessments/public/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        error: error.message || 'Failed to fetch assessment',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /validate/:publicId
   * Validate a public assessment ID exists and is shareable
   */
  router.get('/validate/:publicId', async (req, res) => {
    const startTime = Date.now();
    try {
      // Handle optional authentication using centralized auth service
      const { user } = await authenticateRequest(req, serviceSupabase, {
        required: false,
      });

      const result = await assessmentsController.validatePublicId(
        serviceSupabase,
        req.params.publicId,
        user,
      );
      logOperation(
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
      logOperation(
        'GET',
        `/assessments/validate/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({ error: error.message });
    }
  });

  /**
   * GET /compare
   * Compare two assessments by publicId with visibility rules
   * Query params: id1, id2 (both required)
   * Supports cross-user comparison with privacy enforcement
   * Allows both authenticated and unauthenticated access
   *
   * NOTE: This route must appear before `GET /:publicId` to avoid the dynamic
   * param route capturing the literal path segment `compare`.
   */
  router.get('/compare', async (req, res) => {
    const startTime = Date.now();
    const { id1, id2 } = req.query;

    // logger.info(
    //   {
    //     query: req.query,
    //     id1,
    //     id2,
    //     types: { id1: typeof id1, id2: typeof id2 },
    //     falsy: { id1: !id1, id2: !id2 },
    //     details: {
    //       id1_length: id1 ? id1.length : 'null',
    //       id2_length: id2 ? id2.length : 'null',
    //       id1_trimmed: id1 ? id1.trim() : 'null',
    //       id2_trimmed: id2 ? id2.trim() : 'null',
    //       id1_empty_after_trim: id1 ? id1.trim() === '' : 'null',
    //       id2_empty_after_trim: id2 ? id2.trim() === '' : 'null',
    //       id1_constructor: id1 ? id1.constructor.name : 'null',
    //       id2_constructor: id2 ? id2.constructor.name : 'null',
    //     },
    //   },
    //   '[COMPARE_ROUTE_DEBUG] Query params received',
    // );

    try {
      // More robust validation - check for null, undefined, empty string, or whitespace-only
      if (!id1 || !id2 || id1.trim() === '' || id2.trim() === '') {
        throw {
          code: 'INVALID_IDS',
          message: 'Query parameters id1 and id2 are required',
        };
      }

      // Handle optional authentication using centralized auth service
      const { user } = await authenticateRequest(req, serviceSupabase, {
        required: false,
      });

      // logger.info('[COMPARE_DEBUG] Authentication result:', {
      //   user: user ? { id: user.id, email: user.email } : null,
      // });

      // logger.info({ id1, id2 }, '[COMPARE_ROUTE_DEBUG] Calling controller with params');

      const result = await assessmentsController.compareAssessments(
        serviceSupabase,
        user,
        id1,
        id2,
      );
      logOperation(
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
      logOperation(
        'GET',
        `/assessments/compare?id1=${id1}&id2=${id2}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        error: error.message || 'Failed to compare assessments',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /:publicId
   * Retrieve a single assessment by publicId (auth required, user-specific)
   * Note: Uses public_id instead of primary key for security
   */
  router.get('/:publicId', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.getAssessmentById(
        serviceSupabase,
        req.user,
        req.params.publicId,
      );
      logOperation('GET', `/assessments/${req.params.publicId}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logOperation(
        'GET',
        `/assessments/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({
        error: error.message || 'Failed to fetch assessment',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * PATCH /:id
   * Update assessment fields (e.g., is_public)
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
      logOperation('PATCH', `/assessments/${req.params.id}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.code === 'NOT_FOUND') {
        statusCode = 404;
      } else if (error.code === 'TITLE_LENGTH_INVALID') {
        statusCode = 400;
      }
      logOperation('PATCH', `/assessments/${req.params.id}`, statusCode, Date.now() - startTime);
      res.status(statusCode).json({
        error: error.message || 'Failed to update assessment',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * DELETE /:id
   * Delete a saved assessment
   */
  router.delete('/:id', requireAuth(serviceSupabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.deleteAssessment(
        serviceSupabase,
        req.user,
        req.params.id,
      );
      logOperation('DELETE', `/assessments/${req.params.id}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logOperation('DELETE', `/assessments/${req.params.id}`, statusCode, Date.now() - startTime);
      res.status(statusCode).json({
        error: error.message || 'Failed to delete assessment',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
