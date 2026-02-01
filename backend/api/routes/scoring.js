import express from 'express';
import { calculateScores, identifyIntegrityGaps } from '../../src/scoring.js';
import {
  generateReasoning,
  validateInput,
  extractMetadata,
  calculateGapAnalysis,
} from '../../src/ask.js';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Log API request/response
 * @private
 */
function logRequest(method, path, status, duration) {
  if (!IS_PROD) {
    console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
  }
}

function debugLog(...args) {
  if (!IS_PROD) console.log(...args);
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
 * Create scoring router
 * @param {Object} openai - OpenAI client instance
 * @param {Object} supabase - Supabase client instance
 * @returns {express.Router} Express router with scoring endpoint
 */
export default function createScoringRouter(openai, supabase) {
  const router = express.Router();

  /**
   * POST /
   * Main scoring and audit endpoint
   *
   * Accepts:
   * {
   *   businessProblem: string (min 200 chars),
   *   businessSolution: string (min 200 chars),
   *   parameters: {
   *     public_participation: 0-100,
   *     infrastructure: 0-100,
   *     market_price: 0-100,
   *     maintenance: 0-100,
   *     uniqueness: 0-100,
   *     size_efficiency: 0-100,
   *     chemical_safety: 0-100,
   *     tech_readiness: 0-100
   *   }
   * }
   *
   * Returns:
   * {
   *   overall_score: number,
   *   sub_scores: object,
   *   confidence_level: number,
   *   audit: object with findings and recommendations,
   *   similar_cases: array of database matches,
   *   metadata: object with extracted industry/scale/strategy,
   *   gap_analysis: object with benchmark comparisons
   * }
   */
  router.post('/', async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).slice(2, 9);

    try {
      const { businessProblem, businessSolution, parameters } = req.body;

      // ========== INPUT VALIDATION ==========
      if (!businessProblem || !businessSolution) {
        return res.status(400).json(
          errorResponse({
            message: 'Both businessProblem and businessSolution are required',
            code: 'MISSING_FIELDS',
          }),
        );
      }

      // Validate minimum length (200 chars as per spec)
      const MIN_LENGTH = 200; // Per specification
      if (businessProblem.length < MIN_LENGTH) {
        return res.status(400).json(
          errorResponse({
            message: `Business Problem is too short. Please provide ${MIN_LENGTH - businessProblem.length} more characters (currently ${businessProblem.length}/${MIN_LENGTH}).`,
            code: 'PROBLEM_TOO_SHORT',
          }),
        );
      }

      if (businessSolution.length < MIN_LENGTH) {
        return res.status(400).json(
          errorResponse({
            message: `Business Solution is too short. Please provide ${MIN_LENGTH - businessSolution.length} more characters (currently ${businessSolution.length}/${MIN_LENGTH}).`,
            code: 'SOLUTION_TOO_SHORT',
          }),
        );
      }

      // Junk input detection
      const junkCheck = validateInput(businessProblem, businessSolution);
      if (junkCheck) {
        return res.status(400).json(
          errorResponse({
            message: junkCheck.reason,
            code: 'JUNK_INPUT',
          }),
        );
      }

      // Validate parameters
      if (!parameters || typeof parameters !== 'object') {
        return res.status(400).json(
          errorResponse({
            message: 'Parameters object is required',
            code: 'INVALID_PARAMETERS',
          }),
        );
      }

      const requiredParams = [
        'public_participation',
        'infrastructure',
        'market_price',
        'maintenance',
        'uniqueness',
        'size_efficiency',
        'chemical_safety',
        'tech_readiness',
      ];

      for (const param of requiredParams) {
        if (
          typeof parameters[param] !== 'number' ||
          parameters[param] < 0 ||
          parameters[param] > 100
        ) {
          let msg = `${param.replace(/_/g, ' ')} must be a number between 0 and 100`;
          if (typeof parameters[param] !== 'number') {
            msg = `${param.replace(/_/g, ' ')} must be a number (received: ${typeof parameters[param]})`;
          } else if (parameters[param] < 0) {
            msg = `${param.replace(/_/g, ' ')} cannot be negative (received: ${parameters[param]})`;
          } else if (parameters[param] > 100) {
            msg = `${param.replace(/_/g, ' ')} cannot exceed 100 (received: ${parameters[param]})`;
          }
          return res.status(400).json(
            errorResponse({
              message: msg,
              code: 'INVALID_PARAMETER_VALUE',
            }),
          );
        }
      }

      debugLog(`[${requestId}] Starting score calculation...`);

      // ========== STEP 1: CALCULATE DETERMINISTIC SCORES ==========
      const scores = calculateScores(parameters);
      debugLog(`[${requestId}] Scores calculated: ${scores.overall_score} / 100`);

      // ========== STEP 2: VECTOR SEARCH FOR SIMILAR CASES ==========
      let metadata = null; // will populate and reuse in response
      let similarCases = [];
      try {
        // Combine problem and solution for embedding
        const queryText = `Problem: ${businessProblem}\n\nSolution: ${businessSolution}`;

        debugLog(`[${requestId}] Generating query embedding...`);
        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: queryText,
        });

        const queryVector = embeddingRes.data[0].embedding;

        // Extract metadata to enable industry-filtered search
        try {
          debugLog(`[${requestId}] Extracting metadata (industry, scale, strategy)...`);
          metadata = await extractMetadata(businessProblem, businessSolution);
          debugLog(
            `[${requestId}] Metadata extracted: ${metadata.industry}, ${metadata.scale}, ${metadata.r_strategy}`,
          );
        } catch (error) {
          console.warn(`[${requestId}] Metadata extraction warning:`, error.message);
          metadata = null;
        }

        // Prefer industry-filtered search when metadata is available
        debugLog(`[${requestId}] Searching database for similar cases...`);
        let results = null;
        let searchError = null;
        if (metadata?.industry) {
          const industryFilter = metadata.industry || 'all';
          const res = await supabase.rpc('search_documents_by_industry', {
            query_embedding: queryVector,
            industry_filter: industryFilter,
            match_count: 3,
            similarity_threshold: 0.0,
          });
          results = res.data;
          searchError = res.error;
        }

        // Fallback to generic match if no results or no metadata
        if (!results || results.length === 0) {
          const res2 = await supabase.rpc('match_documents', {
            query_embedding: queryVector,
            match_count: 3,
            similarity_threshold: 0.0,
          });
          if (!results) results = res2.data;
          if (!searchError) searchError = res2.error;
        }

        if (searchError) {
          console.warn(`[${requestId}] Database search warning:`, searchError.message);
        } else if (results && results.length > 0) {
          similarCases = results;
          debugLog(`[${requestId}] Found ${results.length} similar cases`);
        } else {
          debugLog(`[${requestId}] No similar cases found in database`);
        }
      } catch (error) {
        console.error(`[${requestId}] Vector search error:`, error.message);
        // Continue without database context - don't fail the request
      }

      // ========== STEP 3: IDENTIFY INTEGRITY GAPS ==========
      const integrityGaps = identifyIntegrityGaps(scores.sub_scores);
      debugLog(`[${requestId}] Identified ${integrityGaps.length} potential integrity gaps`);

      // ========== STEP 4: GENERATE AI-POWERED AUDIT ==========
      debugLog(`[${requestId}] Generating audit analysis...`);
      const auditResult = await generateReasoning(
        businessProblem,
        businessSolution,
        scores,
        similarCases || [],
      );

      // Add integrity gaps to audit result
      if (
        integrityGaps.length > 0 &&
        (!auditResult.integrity_gaps || auditResult.integrity_gaps.length === 0)
      ) {
        auditResult.integrity_gaps = integrityGaps;
      }

      // ========== STEP 5: CALCULATE GAP ANALYSIS ==========
      debugLog(`[${requestId}] Calculating gap analysis and benchmarks...`);
      const gapAnalysis = calculateGapAnalysis(scores, similarCases);

      // ========== STEP 6: COMPILE FINAL RESPONSE ==========
      const response = {
        overall_score: scores.overall_score,
        confidence_level: scores.confidence_level,
        sub_scores: scores.sub_scores,
        score_breakdown: scores.score_breakdown,
        audit: auditResult,
        similar_cases: similarCases,
        metadata: metadata,
        gap_analysis: gapAnalysis,
        processing_info: {
          request_id: requestId,
          processing_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };

      logRequest('POST', '/score', 200, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      console.error(`[${requestId}] Request error:`, error);
      logRequest('POST', '/score', 500, Date.now() - startTime);

      res.status(500).json(errorResponse(error, 'Failed to generate scoring audit'));
    }
  });

  return router;
}
