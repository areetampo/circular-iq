/**
 * Assessments Routes
 * Defines endpoint structure and delegates to assessments controller
 * - Routes only handle Express middleware, validation, error formatting
 * - All business logic delegated to assessments.controller
 */

import express from 'express';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import * as assessmentsController from '#controllers/assessments.controller.js';
import { requireAuth } from '#middleware/auth.middleware.js';
import { validateAssessment } from '#middleware/validation.middleware.js';

const IS_PROD = BACKEND_CONFIG.isProduction;

/**
 * Log API request/response
 * @private
 */
function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
  }
}

/**
 * Error response formatter
 * @private
 */
function errorResponse(error, defaultMessage = 'Internal server error') {
  return {
    error: error.message || defaultMessage,
    timestamp: new Date().toISOString(),
    code: error.code || 'INTERNAL_ERROR',
  };
}

/**
 * Create assessments router
 * @param {Object} supabase - Supabase client instance
 * @returns {express.Router} Express router with assessment endpoints
 */
export default function createAssessmentsRouter(supabase) {
  const router = express.Router();

  /**
   * POST /
   * Save a completed assessment result
   */
  router.post('/', requireAuth(supabase), validateAssessment, async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const result = await assessmentsController.saveAssessment(
        supabase,
        req.user,
        req.validatedBody,
        req.body,
        token,
      );
      logRequest('POST', '/assessments', 201, Date.now() - startTime);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error saving assessment:', error);
      logRequest('POST', '/assessments', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to save assessment'));
    }
  });

  /**
   * GET /
   * Retrieve list of user's assessments with filtering and pagination
   */
  router.get('/', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const result = await assessmentsController.fetchUserAssessments(
        supabase,
        req.user,
        token,
        req.query,
      );
      logRequest('GET', '/assessments', 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      logRequest('GET', '/assessments', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch assessments'));
    }
  });

  /**
   * GET /stats
   * Retrieve aggregate statistics for user's assessments
   */
  router.get('/stats', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const stats = await assessmentsController.getAssessmentStats(supabase, req.user, token);
      logRequest('GET', '/assessments/stats', 200, Date.now() - startTime);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching assessment stats:', error);
      logRequest('GET', '/assessments/stats', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch assessment statistics'));
    }
  });

  /**
   * GET /public/:publicId
   * Retrieve a publicly shared assessment (no auth required)
   */
  router.get('/public/:publicId', async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.getPublicAssessment(supabase, req.params.publicId);
      logRequest('GET', `/assessments/public/${req.params.publicId}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logRequest(
        'GET',
        `/assessments/public/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json(errorResponse(error, 'Failed to fetch assessment'));
    }
  });

  /**
   * GET /validate/:publicId
   * Validate a public assessment ID exists and is shareable
   */
  router.get('/validate/:publicId', async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.validatePublicId(supabase, req.params.publicId);
      logRequest(
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
      logRequest(
        'GET',
        `/assessments/validate/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json({ error: error.message });
    }
  });

  /**
   * GET /market-analysis
   * Retrieve global market analysis data (aggregate stats by industry/scale)
   */
  router.get('/market-analysis', async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.getMarketAnalysis(supabase);
      logRequest('GET', '/assessments/market-analysis', 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      console.error('Error fetching market data:', error);
      logRequest('GET', '/assessments/market-analysis', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch market data'));
    }
  });

  /**
   * GET /:publicId
   * Retrieve a single assessment by publicId (auth required, user-specific)
   * Note: Uses public_id instead of primary key for security
   */
  router.get('/:publicId', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const result = await assessmentsController.getAssessmentById(
        supabase,
        req.user,
        token,
        req.params.publicId,
      );
      logRequest('GET', `/assessments/${req.params.publicId}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logRequest('GET', `/assessments/${req.params.publicId}`, statusCode, Date.now() - startTime);
      res.status(statusCode).json(errorResponse(error, 'Failed to fetch assessment'));
    }
  });

  /**
   * PATCH /:id
   * Update assessment fields (e.g., is_public)
   */
  router.patch('/:id', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const result = await assessmentsController.updateAssessment(
        supabase,
        req.user,
        token,
        req.params.id,
        req.body,
      );
      logRequest('PATCH', `/assessments/${req.params.id}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logRequest('PATCH', `/assessments/${req.params.id}`, statusCode, Date.now() - startTime);
      res.status(statusCode).json(errorResponse(error, 'Failed to update assessment'));
    }
  });

  /**
   * DELETE /:id
   * Delete a saved assessment
   */
  router.delete('/:id', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const result = await assessmentsController.deleteAssessment(
        supabase,
        req.user,
        token,
        req.params.id,
      );
      logRequest('DELETE', `/assessments/${req.params.id}`, 200, Date.now() - startTime);
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logRequest('DELETE', `/assessments/${req.params.id}`, statusCode, Date.now() - startTime);
      res.status(statusCode).json(errorResponse(error, 'Failed to delete assessment'));
    }
  });

  /**
   * GET /market-analysis/:publicId
   * Retrieve per-assessment market analysis with user-specific benchmarks
   */
  router.get('/market-analysis/:publicId', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.getPerAssessmentMarketAnalysis(
        supabase,
        req.user,
        req.params.publicId,
      );
      logRequest(
        'GET',
        `/assessments/market-analysis/${req.params.publicId}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
      logRequest(
        'GET',
        `/assessments/market-analysis/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res
        .status(statusCode)
        .json(errorResponse(error, 'Failed to fetch per-assessment market data'));
    }
  });

  /**
   * GET /market-analysis/public/:publicId
   * Retrieve per-assessment market analysis for public assessments
   */
  router.get('/market-analysis/public/:publicId', async (req, res) => {
    const startTime = Date.now();
    try {
      const result = await assessmentsController.getPublicPerAssessmentMarketAnalysis(
        supabase,
        req.params.publicId,
      );
      logRequest(
        'GET',
        `/assessments/market-analysis/public/${req.params.publicId}`,
        200,
        Date.now() - startTime,
      );
      res.json(result);
    } catch (error) {
      const statusCode = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 500;
      logRequest(
        'GET',
        `/assessments/market-analysis/public/${req.params.publicId}`,
        statusCode,
        Date.now() - startTime,
      );
      res
        .status(statusCode)
        .json(errorResponse(error, 'Failed to fetch per-assessment market data'));
    }
  });

  /**
   * GET /compare/:publicId1/:publicId2
   * Compare two assessments by publicId with visibility rules
   * Supports cross-user comparison with privacy enforcement
   */
  router.get('/compare/:publicId1/:publicId2', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    try {
      const token = req.headers.authorization?.slice(7).trim();
      const result = await assessmentsController.compareAssessments(
        supabase,
        req.user,
        token,
        req.params.publicId1,
        req.params.publicId2,
      );
      logRequest(
        'GET',
        `/assessments/compare/${req.params.publicId1}/${req.params.publicId2}`,
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
      logRequest(
        'GET',
        `/assessments/compare/${req.params.publicId1}/${req.params.publicId2}`,
        statusCode,
        Date.now() - startTime,
      );
      res.status(statusCode).json(errorResponse(error, 'Failed to compare assessments'));
    }
  });

  return router;
}
