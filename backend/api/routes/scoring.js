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
   * Enforce anonymous usage limits.
   * - Verifies whether request is from an authenticated user (via Supabase).
   * - Returns null when the request is allowed to proceed.
   * - Returns an object { blocked: true, status, body } when the request should be blocked.
   *
   * Important changes:
   * - Auth verification now calls `supabase.auth.getUser(token)` instead of a plain header check.
   * - In test mode (NODE_ENV === 'test') behaviour matches `requireAuth` (treat as authenticated).
   * - Fail-closed for tracking DB failures: if the tracking RPC fails or an unexpected error
   *   occurs, return a 503 Service Unavailable (the store is closed).
   */
  async function enforceAnonymousUsage(req) {
    try {
      const IS_TEST = process.env.NODE_ENV === 'test';

      // 1. Check authentication properly using Supabase (not just header shape)
      const authHeader = req.headers.authorization || '';

      // If there's no Bearer header but we're running tests, treat as authenticated
      if (!authHeader.startsWith('Bearer ')) {
        if (IS_TEST) {
          debugLog('IS_TEST: treating request as authenticated (skip anonymous check)');
          return null;
        }
      } else {
        const token = authHeader.slice(7).trim();
        const MASTER_API_KEY = process.env.API_KEY || '';

        // If the provided bearer token is the master API key, treat as authenticated
        if (token && MASTER_API_KEY && token === MASTER_API_KEY) {
          debugLog('Master API key provided in Authorization header — treating as authenticated');
          return null;
        }

        if (token) {
          try {
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && data?.user) {
              debugLog('User token verified via Supabase, skipping anonymous usage check');
              return null; // Authenticated user — skip anonymous limits
            }
            // If token is invalid or expired, proceed as anonymous user
            debugLog(
              'Bearer token present but not a valid authenticated user — treating as anonymous',
            );
          } catch (authErr) {
            // If Supabase call fails, log and continue as anonymous (do not block here)
            console.warn(
              'Supabase auth.getUser failed when verifying token:',
              authErr?.message || authErr,
            );
          }
        }
      }

      // 2. Check if serviceSupabase is available for tracking
      if (!serviceSupabase) {
        console.warn(
          '⚠️ serviceSupabase client not initialized! Usage tracking will be skipped, Check SUPABASE_SERVICE_ROLE_KEY',
        );
        // Allow when tracking is not configured (keeps behaviour consistent with earlier setup)
        return null;
      }

      // 3. Get anonymous user identifier
      const { hash, ip, userAgent } = getIdentifierFromRequest(req);
      debugLog(
        `Anonymous request from IP: ${ip.substring(0, 10)}..., UA: ${userAgent.substring(0, 30)}...`,
      );

      const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
      const uaSnippet = (userAgent || '').substring(0, 100);

      // 4. Call the atomic database function
      debugLog(`Calling check_and_increment_anonymous_usage for hash: ${hash.substring(0, 10)}...`);

      const { data, error } = await serviceSupabase.rpc('check_and_increment_anonymous_usage', {
        p_identifier_hash: hash,
        p_max_tries: MAX_FREE_TRIES,
        p_ip_hash: ipHash,
        p_user_agent_snippet: uaSnippet,
      });

      // 5. Handle database errors — FAIL CLOSED: block if tracking is unavailable
      if (error) {
        console.error('❌ Error in atomic usage check:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return {
          blocked: true,
          status: 503,
          body: {
            code: 'TRACKING_SERVICE_UNAVAILABLE',
            message: 'Usage tracking temporarily unavailable. Please try again later.',
            timestamp: new Date().toISOString(),
          },
        };
      }

      // 6. Validate response
      const result = data?.[0];
      if (!result) {
        console.error('❌ Unexpected empty result from usage check');
        console.error('Response data:', data);
        // Treat as blocked to be conservative (tracking inconsistency)
        return {
          blocked: true,
          status: 503,
          body: {
            code: 'TRACKING_SERVICE_INCONSISTENT',
            message: 'Usage tracking returned an invalid response. Please try again later.',
            timestamp: new Date().toISOString(),
          },
        };
      }

      const { current_count, is_allowed } = result;

      debugLog(`✅ Usage check result: count=${current_count}, allowed=${is_allowed}`);

      // 7. Check if limit reached
      if (!is_allowed) {
        console.log(`🚫 Anonymous user limit reached: ${current_count}/${MAX_FREE_TRIES}`);
        return {
          blocked: true,
          status: 403,
          body: {
            code: 'LIMIT_REACHED',
            message: `You've used your ${MAX_FREE_TRIES} free evaluations. Create an account to continue assessing your circular economy initiatives!`,
            remaining: 0,
            currentCount: current_count,
            limit: MAX_FREE_TRIES,
            scoringRateLimiter: false,
          },
        };
      }

      // 8. Allow request
      debugLog(`✅ Anonymous user allowed: ${current_count}/${MAX_FREE_TRIES} tries used`);
      return null;
    } catch (e) {
      console.error('❌ Anonymous usage check failed:', e?.message || e);
      console.error('Stack trace:', e?.stack);
      // Fail-closed on unexpected exceptions related to tracking
      return {
        blocked: true,
        status: 503,
        body: {
          code: 'TRACKING_SERVICE_ERROR',
          message: 'Usage tracking failure. Service temporarily unavailable.',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * GET /test-anonymous-limit-tracking
   * Test endpoint to verify anonymous usage tracking is working correctly
   * Returns current count and allowed status for a fixed test identifier
   * Note: This is for testing purposes only and should not be exposed in production
   * Invoke-WebRequest -Uri http://localhost:3001/api/score/test-anonymous-limit-tracking -Method GET
   */
  router.get('/test-anonymous-limit-tracking', async (req, res) => {
    if (!serviceSupabase) {
      console.warn('⚠️ serviceSupabase client not initialized! Cannot perform test query.');
      return res.json({ error: 'serviceSupabase is null' });
    }

    const testHash = crypto.createHash('sha256').update('test-123').digest('hex');

    const { data, error } = await serviceSupabase.rpc('check_and_increment_anonymous_usage', {
      p_identifier_hash: testHash,
      p_max_tries: MAX_FREE_TRIES,
      p_ip_hash: 'test',
      p_user_agent_snippet: 'test',
    });

    return res.json({ success: !error, data, error });
  });

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
    // Short-circuit excessively large inputs before any debug logging or heavy work
    const MAX_INPUT_LENGTH = 5000;
    const _bp = req.body?.businessProblem;
    const _bs = req.body?.businessSolution;
    if (
      (typeof _bp === 'string' && _bp.length > MAX_INPUT_LENGTH) ||
      (typeof _bs === 'string' && _bs.length > MAX_INPUT_LENGTH)
    ) {
      return res.status(400).json(
        errorResponse({
          message: `Business Problem and Business Solution must be at most ${MAX_INPUT_LENGTH} characters`,
          code: 'INPUT_TOO_LONG',
        }),
      );
    }

    const startTime = Date.now();
    const requestId = Math.random().toString(36).slice(2, 9);

    // Performance tracking
    const timings = {
      validation: 0,
      scoring: 0,
      embeddings: 0,
      metadata: 0,
      vectorSearch: 0,
      integrityGaps: 0,
      audit: 0,
      gapAnalysis: 0,
    };

    let stepStart = Date.now();

    console.log('='.repeat(20));
    console.log(`📥 NEW SCORING REQUEST - ${requestId}`);
    console.log('Authorization header:', req.headers.authorization ? 'PRESENT ⚠️' : 'MISSING ✅');
    console.log('IP:', extractIPAddress(req));
    console.log('='.repeat(20));

    try {
      // Enforce anonymous usage limits (IP+UA fingerprint)
      console.log('⏳ Calling enforceAnonymousUsage...');
      const anonResult = await enforceAnonymousUsage(req);
      console.log('✅ enforceAnonymousUsage result:', anonResult ? 'BLOCKED 🚫' : 'ALLOWED ✅');

      if (anonResult && anonResult.blocked) {
        logRequest('POST', '/score', anonResult.status, Date.now() - startTime);
        console.log(anonResult.body);
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

      timings.validation = Date.now() - stepStart;
      stepStart = Date.now();

      debugLog(`[${requestId}] Starting score calculation...`);

      // ========== STEP 1: CALCULATE DETERMINISTIC SCORES ==========
      const scores = calculateScores(parameters);
      debugLog(`[${requestId}] Scores calculated: ${scores.overall_score} / 100`);

      timings.scoring = Date.now() - stepStart;
      stepStart = Date.now();

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

        timings.embeddings = Date.now() - stepStart;
        stepStart = Date.now();

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

        timings.metadata = Date.now() - stepStart;
        stepStart = Date.now();

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

        const [searchResults, industryResults] = await Promise.allSettled([
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
        ]);

        const problemRows =
          searchResults.status === 'fulfilled' ? searchResults.value[0]?.data || [] : [];
        const solutionRows =
          searchResults.status === 'fulfilled' ? searchResults.value[1]?.data || [] : [];
        const industryRows =
          industryResults.status === 'fulfilled' ? industryResults.value?.data || [] : [];

        if (searchResults.status === 'rejected') {
          console.error(`[${requestId}] Hybrid search failed:`, searchResults.reason);
        }
        if (industryResults.status === 'rejected') {
          console.error(`[${requestId}] Industry search failed:`, industryResults.reason);
        }

        // Combine and deduplicate using weighted multi-vector approach
        const combinedRows = [...problemRows, ...solutionRows, ...industryRows];

        if (combinedRows.length === 0) {
          debugLog(`[${requestId}] No similar cases found in database`);
        } else {
          // Filter by minimum similarity threshold
          const MIN_SIMILARITY = 0.3;
          const filtered = combinedRows.filter((row) => (row.similarity || 0) >= MIN_SIMILARITY);

          if (filtered.length === 0) {
            debugLog(
              `[${requestId}] No cases met minimum similarity threshold (${MIN_SIMILARITY})`,
            );
            similarCases = [];
          } else {
            // Use weighted dedup that averages or uses problem/solution maxima
            let deduped = dedupeResultsWeighted(filtered, {
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
                console.warn(`[${requestId}] Similar case metadata parsing warning:`, e.message);
              }
              return { ...c, similarity: (c.similarity || 0) * multiplier };
            });

            // Normalize if any scores exceed 1.0
            const maxScore = Math.max(...deduped.map((c) => c.similarity || 0));
            if (maxScore > 1) {
              deduped = deduped.map((c) => ({
                ...c,
                similarity: (c.similarity || 0) / maxScore,
              }));
            }

            // Sort and limit
            deduped.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
            similarCases = deduped.slice(0, 4);
            debugLog(
              `[${requestId}] Found ${combinedRows.length} vector rows -> ${filtered.length} above threshold -> ${similarCases.length} unique similar cases`,
            );
          }
        }

        timings.vectorSearch = Date.now() - stepStart;
        stepStart = Date.now();
      } catch (error) {
        console.error(`[${requestId}] Vector search error:`, error.message);
        timings.vectorSearch = Date.now() - stepStart;
        stepStart = Date.now();
        // Continue without database context - don't fail the request
      }

      // ========== STEP 3: IDENTIFY INTEGRITY GAPS ==========
      const integrityGaps = identifyIntegrityGaps(scores.sub_scores);
      debugLog(`[${requestId}] Identified ${integrityGaps.length} potential integrity gaps`);

      timings.integrityGaps = Date.now() - stepStart;
      stepStart = Date.now();

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

      timings.audit = Date.now() - stepStart;
      stepStart = Date.now();

      // ========== STEP 5: CALCULATE GAP ANALYSIS ==========
      debugLog(`[${requestId}] Calculating gap analysis and benchmarks...`);
      const gapAnalysis = calculateGapAnalysis(scores, similarCases);

      timings.gapAnalysis = Date.now() - stepStart;

      // ========== STEP 6: COMPILE FINAL RESPONSE ==========
      const response = {
        // Echo the original inputs so the response is self-contained and
        // downstream callers (frontend / session storage) can rely on a single
        // canonical object that includes the inputs that produced the result.
        businessProblem,
        businessSolution,
        input_parameters: parameters || {},
        // Main scoring results
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
          timings: timings,
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
