/**
 * @module validation.middleware
 * @description Request body validation middleware using Zod schema validation.
 * Provides middleware for validating assessment POST requests with structured
 * error reporting. Ensures data integrity and proper error handling for invalid input.
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
 * Middleware: Validate assessment request body against schema.
 * Applied to POST /api/assessments route to ensure valid assessment data.
 * Enforces strict schema (no unknown fields) and provides detailed validation errors.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body to validate.
 * @param {string} req.body.name - Assessment name (3-50 characters).
 * @param {string} req.body.industry - Industry classification.
 * @param {Object} req.body.result_json - Assessment scores and results (must not be empty).
 * @param {boolean} [req.body.is_public] - Whether assessment is publicly shareable.
 * @param {boolean} [req.body.contribute_to_global_benchmarks] - Opt-in for benchmark data.
 * @param {string} [req.body.businessProblem] - Business problem description.
 * @param {string} [req.body.businessSolution] - Business solution description.
 * @param {Object} [req.body.parameters] - Additional parameters mapping.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {Object} res.status(400).json() - If validation fails.
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
      { endpoint: req.path, method: req.method, ip: req.ip, error },
      'Assessment validation error occurred',
    );

    return res.status(400).json({
      error: 'Assessment validation error',
      code: 'BAD_REQUEST',
      timestamp: new Date().toISOString(),
    });
  }
}
