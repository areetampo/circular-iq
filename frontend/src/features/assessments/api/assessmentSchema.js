import { z } from 'zod';

/**
 * Zod schema for sub_scores validation
 * All parameters must be 0-100 numeric values
 */
export const SubScoresSchema = z.object({
  public_participation: z.number().min(0).max(100).optional(),
  infrastructure: z.number().min(0).max(100).optional(),
  market_price: z.number().min(0).max(100).optional(),
  maintenance: z.number().min(0).max(100).optional(),
  uniqueness: z.number().min(0).max(100).optional(),
  size_efficiency: z.number().min(0).max(100).optional(),
  chemical_safety: z.number().min(0).max(100).optional(),
  tech_readiness: z.number().min(0).max(100).optional(),
});

/**
 * Zod schema for metadata validation
 */
export const MetadataSchema = z
  .object({
    industry: z.string().optional(),
    businessModel: z.string().optional(),
    region: z.string().optional(),
    scalability: z.string().optional(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
  })
  .passthrough(); // Allow additional properties

/**
 * Zod schema for audit information
 */
export const AuditSchema = z
  .object({
    confidence_score: z.number().min(0).max(100).optional(),
    technical_recommendations: z.array(z.string()).optional(),
    integrity_issues: z.array(z.string()).optional(),
  })
  .passthrough();

/**
 * Zod schema for result_json structure
 */
export const ResultJsonSchema = z
  .object({
    overall_score: z.number().min(0).max(100),
    sub_scores: SubScoresSchema.optional(),
    similar_cases: z
      .array(
        z.object({
          case_id: z.string().or(z.number()),
          title: z.string().optional(),
          similarity: z.number().min(0).max(1),
          problem: z.string().optional(),
          solution: z.string().optional(),
        }),
      )
      .optional(),
    metadata: MetadataSchema.optional(),
    audit: AuditSchema.optional(),
  })
  .passthrough(); // Allow additional properties from backend

/**
 * Complete Assessment schema for database records
 */
export const AssessmentSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    result_json: ResultJsonSchema,
    sub_scores: SubScoresSchema.optional(),
    metadata: MetadataSchema.optional(),
    industry: z.string().optional(),
    session_id: z.string().optional(),
    created_at: z.string().or(z.date()).optional(),
    updated_at: z.string().or(z.date()).optional(),
    user_id: z.string().optional(),
    business_problem: z.string().optional(),
    business_solution: z.string().optional(),
  })
  .passthrough(); // Allow additional properties

/**
 * Schema for assessment list response
 */
export const AssessmentsListSchema = z.object({
  assessments: z.array(AssessmentSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
});

/**
 * Schema for single assessment response
 */
export const AssessmentResponseSchema = z
  .object({
    assessment: AssessmentSchema.optional(),
    error: z.string().optional(),
  })
  .passthrough();

/**
 * Schema for market analysis response
 */
export const MarketAnalysisSchema = z.object({
  marketData: z.array(
    z.object({
      industry: z.string(),
      avg_score: z.number(),
      scale: z.string(),
      count: z.number().int(),
    }),
  ),
  stats: z
    .object({
      min_score: z.number(),
      max_score: z.number(),
      avg_score: z.number(),
    })
    .optional(),
  userScore: z.number().optional(),
});

/**
 * Validates and parses assessment data
 * @param {unknown} data - Raw data to validate
 * @returns {Object} Validated assessment data
 * @throws {z.ZodError} If validation fails
 */
export function validateAssessment(data) {
  return AssessmentSchema.parse(data);
}

/**
 * Validates and parses assessment list response
 * @param {unknown} data - Raw data to validate
 * @returns {Object} Validated assessment list
 * @throws {z.ZodError} If validation fails
 */
export function validateAssessmentsList(data) {
  return AssessmentsListSchema.parse(data);
}

/**
 * Validates and parses result_json
 * @param {unknown} data - Raw data to validate
 * @returns {Object} Validated result data
 * @throws {z.ZodError} If validation fails
 */
export function validateResultJson(data) {
  return ResultJsonSchema.parse(data);
}

/**
 * Safe validation that returns null on failure instead of throwing
 * @param {unknown} data - Raw data to validate
 * @returns {Object|null} Validated data or null if validation fails
 */
export function safeValidateAssessment(data) {
  try {
    return validateAssessment(data);
  } catch (error) {
    console.error('[VALIDATION_ERROR]', error.message);
    return null;
  }
}

/**
 * Safe validation for assessment list
 * @param {unknown} data - Raw data to validate
 * @returns {Object|null} Validated data or null if validation fails
 */
export function safeValidateAssessmentsList(data) {
  try {
    return validateAssessmentsList(data);
  } catch (error) {
    console.error('[VALIDATION_ERROR]', error.message);
    return null;
  }
}
