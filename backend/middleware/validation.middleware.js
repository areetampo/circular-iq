/**
 * Zod validation for POST `/api/assessments` bodies (strict schema, no unknown keys).
 */

import { z } from 'zod';

// Keep this private so request normalization stays coupled to the middleware below.
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
    parameters: z.record(z.number()).optional(), // Preserve the frontend field name used by saved assessment payloads.
  })
  .strict();

/**
 * Parses `req.body` with `assessmentSchema`; empty `industry` becomes `'Unknown'`.
 * On success sets `req.validatedBody`; on Zod failure responds 400 with `details`.
 *
 * @param {import('express').Request} req - Request carrying the candidate assessment body.
 * @param {import('express').Response} res - Response used for Zod validation failures.
 * @param {import('express').NextFunction} next - Called after `req.validatedBody` is populated.
 * @returns {import('express').Response|undefined} JSON 400 response on validation failure; otherwise undefined after handing off to the next middleware.
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
      const formattedErrors = error.errors.map((error) => ({
        path: error.path.join('.'),
        message: error.message,
        code: error.code,
      }));

      // Include field-level context so malformed assessment payloads can be diagnosed from logs.
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

    // Non-Zod parser failures still map to 400 because the request body could not be trusted.
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
