import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import {
  calculateScores,
  identifyIntegrityGaps,
  dedupeResultsWeighted,
} from '../../src/scoring.js';
import {
  generateReasoning,
  validateInput,
  extractMetadata,
  calculateGapAnalysis,
} from '../../src/ask.js';
import {
  getIdentifierFromRequest,
  MAX_FREE_TRIES,
  extractIPAddress,
} from '../../src/utils/anonymousTracking.js';

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
  // Create a service-role Supabase client for safe server-side writes to tracking table
  const serviceSupabase =
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : null;

  // Rate limiter: 10 requests per minute per IP
  const scoringRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait a minute and try again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => extractIPAddress(req),
  });

  /**
   * Enforce anonymous usage limits. Returns an object when the request should be blocked
   * or null when allowed. Handles DB errors silently (does not block scoring on DB failure).
   */
  async function enforceAnonymousUsage(req) {
    try {
      const { hash, ip, userAgent } = getIdentifierFromRequest(req);

      const authHeader = req.headers.authorization;
      const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');

      if (isAuthenticated || !serviceSupabase) return null;

      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
      const uaSnippet = (userAgent || '').substring(0, 100);

      const { data, error } = await serviceSupabase.rpc('check_and_increment_anonymous_usage', {
        p_identifier_hash: hash,
        p_max_tries: MAX_FREE_TRIES,
        p_ip_hash: ipHash,
        p_user_agent_snippet: uaSnippet,
      });

      if (error) {
        console.error('Error in atomic usage check:', error);
        return null; // don't block on DB errors
      }

      const result = data?.[0];
      if (!result) {
        console.error('Unexpected empty result from usage check');
        return null;
      }

      const { current_count, is_allowed } = result;
      if (!is_allowed) {
        return {
          blocked: true,
          status: 403,
          body: {
            error: 'LIMIT_REACHED',
            message: `You've used your ${MAX_FREE_TRIES} free assessments. Create an account to continue.`,
            remaining: 0,
            limit: MAX_FREE_TRIES,
            currentCount: current_count,
          },
        };
      }

      return null;
    } catch (e) {
      console.error('Anonymous usage check failed:', e?.message || e);
      return null; // don't block on unexpected errors
    }
  }

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
  router.post('/', scoringRateLimiter, async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).slice(2, 9);

    try {
      // Enforce anonymous usage limits (IP+UA fingerprint)
      const anonResult = await enforceAnonymousUsage(req);
      if (anonResult && anonResult.blocked) {
        logRequest('POST', '/score', anonResult.status, Date.now() - startTime);
        return res.status(anonResult.status).json(anonResult.body);
      }

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
        // Create separate embeddings for problem and solution to query respective vectors
        debugLog(`[${requestId}] Generating problem + solution embeddings...`);
        const problemEmbedRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: `Problem: ${businessProblem}`,
        });
        const solutionEmbedRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: `Solution: ${businessSolution}`,
        });

        const problemVector = problemEmbedRes.data[0].embedding;
        const solutionVector = solutionEmbedRes.data[0].embedding;

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

        // Use hybrid search for problem and solution separately (combines semantic+keyword)
        debugLog(`[${requestId}] Running hybrid searches for problem and solution...`);

        const keywordForProblem = metadata?.primary_material || 'circularity';
        const keywordForSolution = metadata?.primary_material || 'circularity';

        const matchCount = 8; // fetch slightly more rows to allow weighted dedupe

        const rpcParamsProblem = {
          query_embedding: problemVector,
          keyword_filter: keywordForProblem,
          match_count: matchCount,
          vector_weight: 0.8,
        };

        const rpcParamsSolution = {
          query_embedding: solutionVector,
          keyword_filter: keywordForSolution,
          match_count: matchCount,
          vector_weight: 0.8,
        };

        const [[problemRes, solutionRes], industryRes] = await Promise.all([
          Promise.all([
            supabase.rpc('search_documents_hybrid', rpcParamsProblem),
            supabase.rpc('search_documents_hybrid', rpcParamsSolution),
          ]),
          // Optionally run industry-specific search to boost industry matches
          metadata?.industry
            ? supabase.rpc('search_documents_by_industry', {
                query_embedding: problemVector,
                industry_filter: metadata.industry,
                match_count: 5,
                similarity_threshold: 0.0,
              })
            : Promise.resolve({ data: [] }),
        ]).catch((e) => [{ error: e }, { error: e }]);

        const problemRows = (problemRes && problemRes.data) || [];
        const solutionRows = (solutionRes && solutionRes.data) || [];
        const industryRows = (industryRes && industryRes.data) || [];

        // Combine and deduplicate using weighted multi-vector approach
        const combinedRows = [...problemRows, ...solutionRows, ...industryRows];

        if (combinedRows.length === 0) {
          debugLog(`[${requestId}] No similar cases found in database`);
        } else {
          // Use weighted dedup that averages or uses problem/solution maxima
          let deduped = dedupeResultsWeighted(combinedRows, {
            wProblem: 0.5,
            wSolution: 0.4,
            wDoc: 0.1,
          });

          // Boost relevance for industry/strategy/material matches
          deduped = deduped.map((c) => {
            let multiplier = 1.0;
            try {
              const cm = c.metadata || {};
              if (metadata?.industry && cm.industry && cm.industry === metadata.industry)
                multiplier += 0.12;
              if (metadata?.r_strategy && cm.r_strategy && cm.r_strategy === metadata.r_strategy)
                multiplier += 0.08;
              if (
                metadata?.primary_material &&
                cm.primary_material &&
                cm.primary_material === metadata.primary_material
              )
                multiplier += 0.06;
            } catch (e) {
              // ignore
            }
            return { ...c, similarity: Math.min(1, (c.similarity || 0) * multiplier) };
          });

          // Sort and limit
          deduped.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
          similarCases = deduped.slice(0, 4);
          debugLog(
            `[${requestId}] Found ${combinedRows.length} vector rows -> ${similarCases.length} unique similar cases`,
          );
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
