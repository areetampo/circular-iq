/**
 * Validation Middleware - Zod-based request validation
 *
 * Provides schema definitions and middleware for validating incoming requests
 * against structured schemas. Ensures data integrity before processing.
 *
 * Location: src/middleware/validation.js
 */

import { z } from 'zod';

/**
 * Assessment schema - Validates assessment data being saved to database
 *
 * Fields:
 * - name: Display name for the assessment (1-255 chars)
 * - industry: Industry classification (min 1 char)
 * - result_json: Full evaluation result object
 * - session_id: Unique user session identifier
 */
export const assessmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must not exceed 255 characters'),
  industry: z.string().min(1, 'Industry is required'),
  result_json: z.record(z.unknown()).or(z.object({}).passthrough()),
  session_id: z.string().min(1, 'Session ID is required'),
});

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

        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formattedErrors,
          timestamp: new Date().toISOString(),
        });
      }

      // Handle non-Zod errors
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
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function validateAssessment(req, res, next) {
  try {
    const validated = assessmentSchema.parse(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return res.status(400).json({
        error: 'Assessment validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle non-Zod errors
    return res.status(400).json({
      error: 'Assessment validation error',
      code: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
    });
  }
}
