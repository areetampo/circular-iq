import { z } from 'zod';

/**
 * Zod schema for sub_scores validation
 * All parameters must be 0-100 numeric values
 */
const SubScoresSchema = z.object({
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
const MetadataSchema = z
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
const AuditSchema = z
  .object({
    confidence_score: z.number().min(0).max(100).optional(),
    technical_recommendations: z.array(z.string()).optional(),
    integrity_issues: z.array(z.string()).optional(),
    integrity_gaps: z.array(z.any()).optional(), // Be lenient with integrity_gaps structure
    similar_cases_summaries: z.array(z.any()).optional(), // Be lenient with similar_cases_summaries structure
    improvement_roadmap: z.array(z.any()).optional(),
    sdg_alignment: z.array(z.any()).optional(),
    market_opportunity_summary: z.string().optional(),
  })
  .passthrough();

/**
 * Zod schema for result_json structure
 */
const ResultJsonSchema = z
  .object({
    overall_score: z.number().min(0).max(100),
    confidence_level: z.number().min(0).max(100).optional(),
    sub_scores: SubScoresSchema.optional(),
    derived_metrics: z.record(z.any()).optional(),
    score_breakdown: z.record(z.any()).optional(),
    audit: AuditSchema.optional(),
    gap_analysis: z.record(z.any()).optional(),
    similar_cases: z
      .array(
        z
          .object({
            case_id: z.string().or(z.number()).optional(), // Make case_id optional
            title: z.string().optional(),
            similarity: z.number().min(0).max(1).optional(),
            problem: z.string().optional(),
            solution: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    metadata: MetadataSchema.optional(),
    weighted_score_card: z.record(z.any()).optional(),
    circular_economy_tier: z.record(z.any()).optional(),
    parameter_consistency: z.record(z.any()).optional(),
    r_strategy_alignment: z.record(z.any()).optional(),
    context: z.record(z.any()).optional(),
  })
  .passthrough(); // Allow additional properties from backend

/**
 * Complete Assessment schema for database records
 */
const AssessmentSchema = z
  .object({
    id: z.string().uuid().optional().or(z.number().optional()), // Allow both UUID string and number from database
    name: z.string().min(1).optional(),
    title: z.string().optional(),
    result_json: ResultJsonSchema.optional(),
    sub_scores: SubScoresSchema.optional(),
    metadata: MetadataSchema.optional(),
    industry: z.string().optional(),
    session_id: z.string().nullable().optional(), // Allow null from database
    created_at: z.string().or(z.date()).optional(),
    updated_at: z.string().or(z.date()).optional(),
    user_id: z.string().optional(),
    business_problem: z.string().optional(),
    business_solution: z.string().optional(),
    overall_score: z.number().min(0).max(100).optional(),
    confidence_level: z.number().min(0).max(100).optional(),
    technical_feasibility: z.number().min(0).max(100).optional(),
    economic_viability: z.number().min(0).max(100).optional(),
    circularity_potential: z.number().min(0).max(100).optional(),
    risk_level: z.enum(['low', 'medium', 'high']).optional(),
    scale: z.string().optional(),
    r_strategy: z.string().optional(),
    primary_material: z.string().optional(),
    geographic_focus: z.string().optional(),
    parameter_consistency_score: z.number().min(0).max(100).optional(),
    parameter_consistency_rating: z.string().optional(),
    r_strategy_alignment_score: z.number().min(0).max(100).optional(),
    r_strategy_alignment_rating: z.string().optional(),
    audit_confidence_score: z.number().min(0).max(100).optional(),
    audit_is_junk_input: z.boolean().optional(),
    audit_integrity_gaps_count: z.number().optional(),
    similar_cases_count: z.number().optional(),
    improvement_roadmap: z.array(z.any()).optional(),
    sdg_alignment: z.array(z.any()).optional(),
    market_opportunity_summary: z.string().optional(),
    is_public: z.boolean().optional(),
    public_id: z.string().optional(),
    contribute_to_global_benchmarks: z.boolean().optional(),
  })
  .passthrough();

/**
 * Schema for assessment list response
 */
const AssessmentsListSchema = z.object({
  assessments: z.array(AssessmentSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
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
function validateAssessmentsList(data) {
  return AssessmentsListSchema.parse(data);
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
    logger.error('[VALIDATION_ERROR]', error.message);
    return null;
  }
}
