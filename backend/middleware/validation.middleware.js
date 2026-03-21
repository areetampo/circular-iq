/**
 * Validation Middleware - Zod-based request validation
 *
 * Provides schema definitions and middleware for validating incoming requests
 * against structured schemas. Ensures data integrity before processing.
 *
 * Location: src/middleware/validation.js
 */

import { z } from 'zod';

// Filters for document search (industry/category/source) must be simple strings or null
export const filterSchema = z
  .object({
    industry: z.string().min(1).nullable(),
    category: z.string().min(1).nullable(),
    source: z.string().min(1).nullable(),
  })
  .strict();

/**
 * Assessment schema - Validates assessment data being saved to database
 *
 * Fields:
 * - name: Display name for the assessment (1-255 chars)
 * - industry: Industry classification (min 1 char)
 * - result_json: Full evaluation result object (non-empty)
 *
 * Strict mode: Rejects any unknown/extra fields in the request
 */
export const assessmentSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
    industry: z.string().min(1, 'Industry is required'),
    result_json: z.record(z.unknown()).refine((val) => Object.keys(val).length > 0, {
      message: 'result_json must not be empty',
    }),
    result: z.record(z.unknown()).optional(),
    is_public: z.boolean().optional(),
    contribute_to_global_benchmarks: z.boolean().optional(),
    businessProblem: z.string().optional(),
    businessSolution: z.string().optional(),
    parameters: z.record(z.number()).optional(), // Frontend sends 'parameters', not 'evaluation_parameters'
  })
  .strict();

/**
 * Middleware factory: Validates request body against provided Zod schema
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 *
 * @example
 * app.post('/assessments', validateRequest(assessmentSchema), handler);
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        // Log validation failures for debugging "bad actors"
        console.warn('[VALIDATION_FAILURE]', {
          timestamp: new Date().toISOString(),
          endpoint: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
          errors: formattedErrors,
          receivedFields: Object.keys(req.body),
        });

        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle non-Zod errors
      console.warn('[VALIDATION_ERROR]', {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        errorMessage: error.message,
      });

      return res.status(400).json({
        error: 'Request validation error',
        code: 'BAD_REQUEST',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Middleware: Validates assessment-specific request body
 *
 * Applied to POST /api/assessments route to ensure valid assessment data
 * Enforces strict schema with no unknown fields allowed
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validateAssessment(req, res, next) {
  try {
    // Allow missing/empty industry values to pass validation by defaulting to a placeholder.
    // This prevents client-side empty strings from causing repeated 400 when API still has this data.
    const body = {
      ...req.body,
      industry:
        (typeof req.body?.industry === 'string' && req.body.industry.trim()) ||
        req.body?.industry ||
        'Unknown',
    };

    const validated = assessmentSchema.parse(body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      // Log validation failures for debugging "bad actors"
      console.warn('[ASSESSMENT_VALIDATION_FAILURE]', {
        timestamp: new Date().toISOString(),
        endpoint: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        errors: formattedErrors,
        receivedFields: Object.keys(req.body),
        bodySize: JSON.stringify(req.body).length,
      });

      return res.status(400).json({
        error: 'Assessment validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle non-Zod errors
    console.warn('[ASSESSMENT_VALIDATION_ERROR]', {
      timestamp: new Date().toISOString(),
      endpoint: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      errorMessage: error.message,
    });

    return res.status(400).json({
      error: 'Assessment validation error',
      code: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
    });
  }
}
