/**
 * Scoring Controller
 * Handles all business logic for scoring and audit operations
 * - Calculate scores using 8-factor framework
 * - Vector search for similar cases
 * - Generate AI-powered audit
 * - Anonymous usage tracking
 */

import crypto from 'crypto';
import {
  calculateScores,
  identifyIntegrityGaps,
  dedupeResultsWeighted,
} from '#services/scoring.logic.js';
import {
  generateReasoning,
  validateInput,
  extractMetadata,
  calculateGapAnalysis,
} from '#services/scoring.service.js';
import { documentsRepository } from '#database/index.js';
import {
  getIdentifierFromRequest,
  MAX_FREE_TRIES,
  extractIPAddress,
} from '#utils/anonymousTracking.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { EMBEDDING_DIMENSION, VECTOR_SEARCH_VECTOR_WEIGHT } from '#config/embedding.js';

const IS_PROD = BACKEND_CONFIG.isProduction;

/**
 * Format error response
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
 * Log API operation
 * @private
 */
function logOperation(operation, status, duration) {
  if (!IS_PROD) {
    console.log(`[${new Date().toISOString()}] ${operation} - ${status} (${duration}ms)`);
  }
}

/**
 * Enforce anonymous usage limits
 * Verifies whether request is from authenticated user via Supabase
 * Returns null when allowed, otherwise returns blocking object
 * @param {Object} req - Express request object
 * @param {Object} supabase - Supabase client
 * @param {Object} serviceSupabase - Service-role Supabase client for tracking
 * @returns {Promise<Object|null>} Null if allowed, blocking object if denied
 */
export async function enforceAnonymousUsage(req, supabase, serviceSupabase) {
  try {
    const IS_TEST = BACKEND_CONFIG.nodeEnv === 'test';

    // 1. Check authentication properly using Supabase (not just header shape)
    const authHeader = req.headers.authorization || '';

    // If there's no Bearer header but we're running tests, treat as authenticated
    if (!authHeader.startsWith('Bearer ')) {
      if (IS_TEST) {
        console.log('IS_TEST: treating request as authenticated (skip anonymous check)');
        return null;
      }
    } else {
      const token = authHeader.slice(7).trim();
      const MASTER_API_KEY = BACKEND_CONFIG.app.apiKey;

      // If the provided bearer token is the master API key, treat as authenticated
      if (token && MASTER_API_KEY && token === MASTER_API_KEY) {
        console.log('Master API key provided in Authorization header — treating as authenticated');
        return null;
      }

      if (token) {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data?.user) {
            console.log('User token verified via Supabase, skipping anonymous usage check');
            return null; // Authenticated user — skip anonymous limits
          }
          // If token is invalid or expired, proceed as anonymous user
          console.log(
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
        '⚠️️️ serviceSupabase client not initialized! Usage tracking will be skipped. Check SUPABASE_SERVICE_ROLE_KEY',
      );
      // Allow when tracking is not configured
      return null;
    }

    // 3. Get anonymous user identifier
    const { hash, ip, userAgent } = getIdentifierFromRequest(req);
    console.log(
      `Anonymous request from IP: ${ip.substring(0, 10)}..., UA: ${userAgent.substring(0, 30)}...`,
    );

    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    const uaSnippet = (userAgent || '').substring(0, 100);

    // 4. Call the atomic database function
    console.log(
      `Calling check_and_increment_anonymous_usage for hash: ${hash.substring(0, 10)}...`,
    );

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

    console.log(`✅ Usage check result: count=${current_count}, allowed=${is_allowed}`);

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
    console.log(`✅ Anonymous user allowed: ${current_count}/${MAX_FREE_TRIES} tries used`);
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
 * Perform scoring audit with vector search and AI analysis
 * @param {Object} req - Express request object
 * @param {Object} openai - OpenAI client instance
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Complete scoring audit response
 */
export async function performScoring(req, openai, supabase) {
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
  console.log('Authorization header:', req.headers.authorization ? 'PRESENT ⚠️️️' : 'MISSING ✅');
  console.log('IP:', extractIPAddress(req));
  console.log('='.repeat(20));

  try {
    const { businessProblem, businessSolution, parameters } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!businessProblem || !businessSolution) {
      const error = new Error('Both businessProblem and businessSolution are required');
      error.code = 'MISSING_FIELDS';
      error.status = 400;
      throw error;
    }

    // Validate minimum length (200 chars as per spec)
    const MIN_LENGTH = 200;
    if (businessProblem.length < MIN_LENGTH) {
      const error = new Error(
        `Business Problem is too short. Please provide ${MIN_LENGTH - businessProblem.length} more characters (currently ${businessProblem.length}/${MIN_LENGTH}).`,
      );
      error.code = 'PROBLEM_TOO_SHORT';
      error.status = 400;
      throw error;
    }

    if (businessSolution.length < MIN_LENGTH) {
      const error = new Error(
        `Business Solution is too short. Please provide ${MIN_LENGTH - businessSolution.length} more characters (currently ${businessSolution.length}/${MIN_LENGTH}).`,
      );
      error.code = 'SOLUTION_TOO_SHORT';
      error.status = 400;
      throw error;
    }

    // Junk input detection
    const junkCheck = validateInput(businessProblem, businessSolution);
    if (junkCheck) {
      const error = new Error(junkCheck.reason);
      error.code = 'JUNK_INPUT';
      error.status = 400;
      throw error;
    }

    // Validate parameters
    if (!parameters || typeof parameters !== 'object') {
      const error = new Error('Parameters object is required');
      error.code = 'MISSING_PARAMETERS';
      error.status = 400;
      throw error;
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
        const error = new Error(msg);
        error.code = 'INVALID_PARAMETER_VALUE';
        error.status = 400;
        throw error;
      }
    }

    timings.validation = Date.now() - stepStart;
    stepStart = Date.now();

    console.log(`[${requestId}] Starting score calculation...`);

    // ========== STEP 1: CALCULATE DETERMINISTIC SCORES ==========
    const scores = calculateScores(parameters);
    console.log(`[${requestId}] Scores calculated: ${scores.overall_score} / 100`);

    timings.scoring = Date.now() - stepStart;
    stepStart = Date.now();

    // ========== STEP 2: VECTOR SEARCH FOR SIMILAR CASES ==========
    let metadata = null;
    let similarCases = [];

    try {
      // Create separate embeddings for problem and solution to query respective vectors
      console.log(`[${requestId}] Generating problem + solution embeddings...`);
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
        console.log(`[${requestId}] Extracting metadata (industry, scale, strategy)...`);
        metadata = await extractMetadata(businessProblem, businessSolution);
        console.log(
          `[${requestId}] Metadata extracted: ${metadata.industry}, ${metadata.scale}, ${metadata.r_strategy}`,
        );
      } catch (error) {
        console.warn(`[${requestId}] Metadata extraction warning:`, error.message);
        metadata = null;
      }

      timings.metadata = Date.now() - stepStart;
      stepStart = Date.now();

      // Use hybrid search for problem and solution separately
      console.log(`[${requestId}] Running hybrid searches for problem and solution...`);

      const keywordForProblem = metadata?.primary_material || 'circularity';
      const keywordForSolution = metadata?.primary_material || 'circularity';
      const matchCount = 8;

      const rpcParamsProblem = {
        query_embedding: problemVector,
        keyword_filter: keywordForProblem,
        industry_filter: metadata?.industry ?? null,
        category_filter: metadata?.category ?? null,
        source_filter: metadata?.source ?? null,
        match_count: matchCount,
        vector_weight: VECTOR_SEARCH_VECTOR_WEIGHT,
        similarity_threshold: 0.0,
      };

      const rpcParamsSolution = {
        query_embedding: solutionVector,
        keyword_filter: keywordForSolution,
        industry_filter: metadata?.industry ?? null,
        category_filter: metadata?.category ?? null,
        source_filter: metadata?.source ?? null,
        match_count: matchCount,
        vector_weight: VECTOR_SEARCH_VECTOR_WEIGHT,
        similarity_threshold: 0.0,
      };

      const [searchResults, industryResults] = await Promise.allSettled([
        Promise.all([
          documentsRepository.searchHybrid(
            problemVector,
            keywordForProblem,
            metadata?.industry ?? null,
            metadata?.category ?? null,
            metadata?.source ?? null,
            matchCount,
            VECTOR_SEARCH_VECTOR_WEIGHT,
            0.0,
          ),
          documentsRepository.searchHybrid(
            solutionVector,
            keywordForSolution,
            metadata?.industry ?? null,
            metadata?.category ?? null,
            metadata?.source ?? null,
            matchCount,
            VECTOR_SEARCH_VECTOR_WEIGHT,
            0.0,
          ),
        ]),
        metadata?.industry
          ? documentsRepository.searchByIndustry(problemVector, metadata.industry, 5, 0.0)
          : Promise.resolve([]),
      ]);

      const problemRows =
        searchResults.status === 'fulfilled' ? searchResults.value[0] || [] : [];
      const solutionRows =
        searchResults.status === 'fulfilled' ? searchResults.value[1] || [] : [];
      const industryRows =
        industryResults.status === 'fulfilled' ? industryResults.value || [] : [];

      if (searchResults.status === 'rejected') {
        console.error(`[${requestId}] Hybrid search failed:`, searchResults.reason);
      }
      if (industryResults.status === 'rejected') {
        console.error(`[${requestId}] Industry search failed:`, industryResults.reason);
      }

      // Combine and deduplicate using weighted multi-vector approach
      const combinedRows = [...problemRows, ...solutionRows, ...industryRows];

      if (combinedRows.length === 0) {
        console.log(`[${requestId}] No similar cases found in database`);
      } else {
        // Filter by minimum similarity threshold
        const MIN_SIMILARITY = 0.3;
        const filtered = combinedRows.filter((row) => (row.similarity || 0) >= MIN_SIMILARITY);

        if (filtered.length === 0) {
          console.log(
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
              // Use structured industry field only
              const rowIndustry = c.industry;
              if (metadata?.industry && rowIndustry && rowIndustry === metadata.industry)
                multiplier += 0.12;

              // other boosts can still rely on metadata as they are not structured
              const cm = c.metadata || {};
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
          console.log(
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
    console.log(`[${requestId}] Identified ${integrityGaps.length} potential integrity gaps`);

    timings.integrityGaps = Date.now() - stepStart;
    stepStart = Date.now();

    // ========== STEP 4: GENERATE AI-POWERED AUDIT ==========
    console.log(`[${requestId}] Generating audit analysis...`);
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
    console.log(`[${requestId}] Calculating gap analysis and benchmarks...`);
    const gapAnalysis = calculateGapAnalysis(scores, similarCases);

    timings.gapAnalysis = Date.now() - stepStart;

    // ========== STEP 6: COMPILE FINAL RESPONSE ==========
    // Format similar cases using structured columns only.
    const formattedCases = (similarCases || []).map((c) => ({
      id: c.id,
      title: c.title || (c.content ? String(c.content).substring(0, 100) : ''),
      industry: c.industry ?? null,
      category: c.category ?? null,
      source: c.source ?? null,
      similarity: c.similarity ?? c.combined_score ?? 0,
      rrf_score: c.rrf_score ?? null,
      metadata: c.metadata,
    }));

    const response = {
      businessProblem,
      businessSolution,
      // keep old name for tests/clients
      parameters: parameters || {},
      input_parameters: parameters || {},
      // Main scoring results
      overall_score: scores.overall_score,
      confidence_level: scores.confidence_level,
      sub_scores: scores.sub_scores,
      score_breakdown: scores.score_breakdown,
      audit: auditResult,
      similar_cases: formattedCases,
      metadata: metadata,
      gap_analysis: gapAnalysis,
      processing_info: {
        request_id: requestId,
        processing_time_ms: Date.now() - startTime,
        timings: timings,
        timestamp: new Date().toISOString(),
      },
    };

    logOperation('performScoring', 'success', Date.now() - startTime);
    return response;
  } catch (error) {
    console.error(`[${requestId}] Request error:`, error);
    logOperation('performScoring', 'error', Date.now() - startTime);
    throw error;
  }
}
