/**
 * Validation Middleware - Zod-based request validation
 *
 * Provides middleware for validating assessment requests.
 * Ensures data integrity before processing.
 *
 * Location: src/middleware/validation.js
 */

import { z } from 'zod';

// Assessment schema for internal validation - not exported
const assessmentSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters')
      .refine(
        (val) => {
          const trimmed = val.trim();
          return trimmed.length >= 3 && trimmed.length <= 50;
        },
        {
          message:
            'Name must be between 3 and 50 characters after removing leading/trailing whitespace',
        },
      ),
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
      logger.warn(
        {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          errors: formattedErrors,
          receivedFields: Object.keys(req.body),
          bodySize: JSON.stringify(req.body).length,
        },
        'Assessment validation failure',
      );

      return res.status(400).json({
        error: 'Assessment validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle non-Zod errors
    logger.warn(
      { endpoint: req.path, method: req.method, ip: req.ip, errorMessage: error.message },
      'Assessment validation error occurred',
    );

    return res.status(400).json({
      error: 'Assessment validation error',
      code: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
    });
  }
}
