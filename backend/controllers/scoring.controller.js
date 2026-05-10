/**
 * Scoring Controller
 * Handles /api/score — validates input, runs scoring pipeline,
 * calls LLM audit, vector search, enrichment layers, and logs results.
 */

import crypto from 'crypto';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { VECTOR_SEARCH_VECTOR_WEIGHT } from '#config/embedding.js';
import { documentsRepository } from '#database/index.js';
import {
  calculateRStrategyAlignment,
  calculateScores,
  dedupeResultsWeighted,
  identifyIntegrityGaps,
} from '#services/scoring.logic.js';
import {
  calculateGapAnalysis,
  cleanSimilarCases,
  extractMetadata,
  generateReasoning,
  validateInput,
} from '#services/scoring.service.js';
import {
  extractIPAddress,
  getIdentifierFromRequest,
  SCORING_MAX_FREE_TRIES,
} from '#utils/anonymousTracking.js';
import { logOperation } from '#utils/controller-helpers.js';

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
    if (!authHeader.startsWith('Bearer ') && IS_TEST) {
      logger.info({ isTest: true }, 'Test environment detected - skipping anonymous usage check');
      return null;
    }

    // If there's no Bearer header, proceed as anonymous user
    if (!authHeader.startsWith('Bearer ')) {
      logger.info({ authenticated: false }, 'No Bearer token present — treating as anonymous');
    } else {
      const token = authHeader.slice(7).trim();
      const MASTER_API_KEY = BACKEND_CONFIG.app.apiKey;

      // If the provided bearer token is the master API key, treat as authenticated
      if (token && MASTER_API_KEY && token === MASTER_API_KEY) {
        logger.info(
          { authenticated: true },
          'Master API key provided in Authorization header — treating as authenticated',
        );
        return null;
      }

      if (token) {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data?.user) {
            logger.info(
              { userId: data.user.id },
              'User token verified via Supabase, skipping anonymous usage check',
            );
            return null; // Authenticated user — skip anonymous limits
          }
          // If token is invalid or expired, proceed as anonymous user
          logger.info(
            { authenticated: false },
            'Bearer token present but not a valid authenticated user — treating as anonymous',
          );
        } catch (authErr) {
          // If Supabase call fails, log and continue as anonymous (do not block here)
          logger.warn({ authErr }, 'Supabase auth.getUser failed when verifying token');
        }
      }
    }

    // 2. Check if serviceSupabase is available for tracking
    if (!serviceSupabase) {
      if (IS_TEST) {
        logger.info(
          { tracking: false, isTest: true },
          'Test environment - serviceSupabase not available, skipping usage tracking',
        );
        return null;
      }
      logger.warn(
        { tracking: false },
        'serviceSupabase client not initialized! Usage tracking will be skipped. Check SUPABASE_SERVICE_ROLE_KEY',
      );
      // Allow when tracking is not configured
      return null;
    }

    // 3. Get anonymous user identifier
    const { hash, ip, userAgent } = getIdentifierFromRequest(req);
    logger.info(
      { ipPrefix: ip.substring(0, 10), uaPrefix: userAgent.substring(0, 30) },
      'Anonymous request received',
    );

    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    const uaSnippet = (userAgent || '').substring(0, 100);

    // 4. Call the atomic database function with timeout
    logger.info(
      { hashPrefix: hash.substring(0, 10) },
      'Calling check_and_increment_anonymous_usage',
    );

    // Create a timeout promise that rejects after 3 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database RPC call timeout'));
      }, 3000);
    });

    // Race the database call against the timeout
    const rpcPromise = serviceSupabase.rpc('check_and_increment_anonymous_usage', {
      p_identifier_hash: hash,
      p_max_tries: SCORING_MAX_FREE_TRIES,
      p_ip_hash: ipHash,
      p_user_agent_snippet: uaSnippet,
    });

    const { data, error } = await Promise.race([rpcPromise, timeoutPromise]).catch((err) => {
      if (err.message === 'Database RPC call timeout') {
        logger.error({ err }, 'Database RPC call timed out');
        return { data: null, error: { message: 'RPC_TIMEOUT', code: 'TIMEOUT' } };
      }
      return { data: null, error: { message: err.message, code: 'RPC_ERROR' } };
    });

    // 5. Handle database errors — FAIL CLOSED: block if tracking is unavailable
    if (error) {
      logger.error({ error }, 'Error in atomic usage check');
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
      logger.error({ data }, 'Unexpected empty result from usage check');
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

    logger.info({ currentCount: current_count, isAllowed: is_allowed }, 'Usage check result');

    // 7. Check if limit reached
    if (!is_allowed) {
      logger.info(
        { currentCount: current_count, limit: SCORING_MAX_FREE_TRIES },
        'Anonymous user limit reached',
      );
      return {
        blocked: true,
        status: 403,
        body: {
          code: 'LIMIT_REACHED',
          message: `You've used your ${SCORING_MAX_FREE_TRIES} free evaluations. Create an account to continue assessing your circular economy initiatives!`,
          remaining: 0,
          currentCount: current_count,
          limit: SCORING_MAX_FREE_TRIES,
          scoringRateLimiter: false,
        },
      };
    }

    // 8. Allow request
    logger.info(
      { currentCount: current_count, limit: SCORING_MAX_FREE_TRIES },
      'Anonymous user allowed',
    );
    return null;
  } catch (e) {
    logger.error({ e }, 'Anonymous usage check failed');
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
 * @param {Object} serviceSupabase - Service-role Supabase client for logging
 * @param {string|null} userId - User ID if authenticated, null if anonymous
 * @returns {Promise<Object>} Complete scoring audit response
 */
export async function performScoring(req, openai, supabase, serviceSupabase, userId) {
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

  logger.info(
    {
      requestId,
      authHeader: req.headers.authorization ? 'PRESENT' : 'MISSING',
      ip: extractIPAddress(req),
    },
    'NEW SCORING REQUEST',
  );

  try {
    const { businessProblem, businessSolution, evaluationParameters, businessContext } = req.body;

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

    // Validate evaluation parameters
    if (!evaluationParameters || typeof evaluationParameters !== 'object') {
      const error = new Error('Evaluation parameters object is required');
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
        typeof evaluationParameters[param] !== 'number' ||
        evaluationParameters[param] < 0 ||
        evaluationParameters[param] > 100
      ) {
        let msg = `${param.replace(/_/g, ' ')} must be a number between 0 and 100`;
        if (typeof evaluationParameters[param] !== 'number') {
          msg = `${param.replace(/_/g, ' ')} must be a number (received: ${typeof evaluationParameters[param]})`;
        } else if (evaluationParameters[param] < 0) {
          msg = `${param.replace(/_/g, ' ')} cannot be negative (received: ${evaluationParameters[param]})`;
        } else if (evaluationParameters[param] > 100) {
          msg = `${param.replace(/_/g, ' ')} cannot exceed 100 (received: ${evaluationParameters[param]})`;
        }
        const error = new Error(msg);
        error.code = 'INVALID_PARAMETER_VALUE';
        error.status = 400;
        throw error;
      }
    }

    timings.validation = Date.now() - stepStart;
    stepStart = Date.now();

    logger.info({ requestId }, 'Starting score calculation');

    // ========== STEP 1: CALCULATE DETERMINISTIC SCORES ==========
    const scores = calculateScores(evaluationParameters);
    logger.info({ requestId, overallScore: scores.overall_score }, 'Scores calculated');

    timings.scoring = Date.now() - stepStart;
    stepStart = Date.now();

    // ========== STEP 2: VECTOR SEARCH FOR SIMILAR CASES ==========
    let metadata = null;
    let similarCases = [];

    try {
      // Create separate embeddings for problem and solution to query respective vectors
      logger.info({ requestId }, 'Generating problem + solution embeddings');
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
        logger.info({ requestId }, 'Extracting metadata (industry, scale, strategy)');
        metadata = await extractMetadata(businessProblem, businessSolution);
        logger.info(
          {
            requestId,
            industry: metadata.industry,
            scale: metadata.scale,
            rStrategy: metadata.r_strategy,
          },
          'Metadata extracted',
        );
      } catch (error) {
        logger.warn({ requestId, error }, 'Metadata extraction warning');
        metadata = null;
      }

      timings.metadata = Date.now() - stepStart;
      stepStart = Date.now();

      // Use hybrid search for problem and solution separately
      logger.info({ requestId }, 'Running hybrid searches for problem and solution');

      const keywordForProblem = metadata?.primary_material || '';
      const keywordForSolution = metadata?.primary_material || '';
      const matchCount = 8;

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

      const problemRows = searchResults.status === 'fulfilled' ? searchResults.value[0] || [] : [];
      const solutionRows = searchResults.status === 'fulfilled' ? searchResults.value[1] || [] : [];
      const industryRows =
        industryResults.status === 'fulfilled' ? industryResults.value || [] : [];

      if (searchResults.status === 'rejected') {
        logger.error(
          { requestId, searchResultsError: searchResults.reason },
          'Hybrid search failed',
        );
      }
      if (industryResults.status === 'rejected') {
        logger.error(
          { requestId, industryResultsError: industryResults.reason },
          'Industry search failed',
        );
      }

      // Combine and deduplicate using weighted multi-vector approach
      const combinedRows = [...problemRows, ...solutionRows, ...industryRows];

      if (combinedRows.length === 0) {
        logger.info({ requestId }, 'No similar cases found in database');
      } else {
        // Filter by minimum similarity threshold
        const MIN_SIMILARITY = 0.3;
        const filtered = combinedRows.filter((row) => (row.similarity || 0) >= MIN_SIMILARITY);

        if (filtered.length === 0) {
          logger.info(
            { requestId, minSimilarity: MIN_SIMILARITY },
            'No cases met minimum similarity threshold',
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
              logger.warn({ requestId, e }, 'Similar case metadata parsing warning');
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

          // Helper: Ensure we always return at least 4 similar cases when possible
          async function ensureAtLeastFour(dedupedList, problemVector, solutionVector, metadata) {
            if (dedupedList.length >= 4) return dedupedList;

            logger.info(
              { requestId, caseCount: dedupedList.length },
              'Only cases above threshold — running fallback search',
            );

            const [fallbackProblem, fallbackSolution] = await Promise.all([
              documentsRepository.searchHybrid(
                problemVector,
                keywordForProblem,
                metadata?.industry ?? null,
                null, // drop category filter for broader results
                null,
                20,
                VECTOR_SEARCH_VECTOR_WEIGHT,
                0.0,
              ),
              documentsRepository.searchHybrid(
                solutionVector,
                keywordForSolution,
                metadata?.industry ?? null,
                null,
                null,
                20,
                VECTOR_SEARCH_VECTOR_WEIGHT,
                0.0,
              ),
            ]);

            // No client-side similarity floor on fallback — use all results
            const fallbackDeduped = dedupeResultsWeighted(
              [...fallbackProblem, ...fallbackSolution],
              {
                wProblem: 0.5,
                wSolution: 0.4,
                wDoc: 0.1,
              },
            );

            return fallbackDeduped.length > 0 ? fallbackDeduped : dedupedList;
          }

          // Ensure we have at least 4 cases if possible
          deduped = await ensureAtLeastFour(deduped, problemVector, solutionVector, metadata);

          // Sort and limit
          deduped.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
          similarCases = deduped.slice(0, 4);
          logger.info(
            {
              requestId,
              totalRows: combinedRows.length,
              aboveThreshold: filtered.length,
              uniqueCases: similarCases.length,
            },
            'Similar cases identified',
          );
        }
      }

      timings.vectorSearch = Date.now() - stepStart;
      stepStart = Date.now();
    } catch (error) {
      logger.error({ requestId, error }, 'Vector search error');
      timings.vectorSearch = Date.now() - stepStart;
      stepStart = Date.now();
      // Continue without database context - don't fail the request
    }

    // ========== STEP 2b: R-STRATEGY ALIGNMENT ==========
    const rStrategyAlignment = calculateRStrategyAlignment(
      scores.sub_scores,
      metadata?.r_strategy || null,
    );

    // ========== STEP 3: IDENTIFY INTEGRITY GAPS ==========
    const integrityGaps = identifyIntegrityGaps(scores.sub_scores);
    logger.info(
      { requestId, gapCount: integrityGaps.length },
      'Identified potential integrity gaps',
    );

    timings.integrityGaps = Date.now() - stepStart;
    stepStart = Date.now();

    // ========== STEP 4: GENERATE AI-POWERED AUDIT ==========
    logger.info({ requestId }, 'Generating audit analysis');

    const auditResult = await generateReasoning(
      businessProblem,
      businessSolution,
      scores,
      similarCases || [],
      businessContext || null,
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
    logger.info({ requestId }, 'Calculating gap analysis and benchmarks');
    const gapAnalysis = calculateGapAnalysis(scores, similarCases);

    timings.gapAnalysis = Date.now() - stepStart;

    // ========== STEP 6: COMPILE FINAL RESPONSE ==========
    // Format similar cases using structured columns only.
    const formattedCases = (similarCases || []).map((c) => {
      const fields = c.metadata?.fields || {};

      // Extract title, summary, projectName from metadata_json
      let title = c.title || ''; // already extracted by previous mapping
      let summary = c.summary || ''; // already cleaned by cleanSimilarCases
      let projectName = c.title || '';
      let year = '';
      let location = '';
      let useType = '';

      try {
        const metaJson = fields.metadata_json ? JSON.parse(fields.metadata_json) : null;
        if (metaJson) {
          if (!summary) summary = metaJson.summary || '';
          const ceText = metaJson.circular_economy_case_studies || '';

          // Extract project name (before first " | ")
          if (!projectName) {
            const pipeIdx = ceText.indexOf(' | ');
            projectName = pipeIdx > -1 ? ceText.substring(0, pipeIdx).trim() : '';
          }

          // Extract YEAR using regex: "YEAR 2023"
          const yearMatch = ceText.match(/YEAR\s+(\d{4})/);
          if (yearMatch) year = yearMatch[1];

          // Extract LOCATION: text between "LOCATION " and " USE "
          const locationMatch = ceText.match(/LOCATION\s+(.+?)\s+USE\s/);
          if (locationMatch) location = locationMatch[1].trim();

          // Extract USE TYPE: text after "USE " to end of line or "__"
          const useMatch = ceText.match(
            /USE\s+([A-Za-z][A-Za-z &/-]*?)(?=\s*C(?:\s*ONSTRUCTION|ONSTRUCTION)|\s*_{3,}|$)/,
          );
          if (useMatch) {
            // Trim and clean: remove trailing "C" fragment if present, clean spacing
            useType = useMatch[1]
              .trim()
              .replace(/\s*\bC\s*$/, '') // remove trailing isolated "C"
              .replace(/\s{2,}/g, ' ') // collapse multiple spaces
              .replace(/ - /g, '-') // clean spaced hyphens
              .trim();
          }
        }
      } catch {
        // metadata_json parse failed
      }

      title =
        projectName ||
        (summary ? summary.substring(0, 80) : '') ||
        `Case ${c.id?.substring(0, 8) || '?'}`;

      // Clean summary: strip trailing "\nCIRCULAR ECONOMY CASE STUDIES..." noise
      // (may still be present even after LLM cleanup on some cases)
      summary = summary.split('\nCIRCULAR ECONOMY CASE STUDIES')[0].trim();

      // Source URL — strip to domain for display
      const rawSourceUrl = fields.source_url || '';
      let sourceDisplay = '';
      try {
        if (rawSourceUrl) {
          sourceDisplay = new URL(rawSourceUrl).hostname.replace(/^www\./, '');
        }
      } catch {
        sourceDisplay = rawSourceUrl;
      }

      return {
        id: c.id,
        title,
        summary,
        problem: fields.problem || '',
        solution: fields.solution || '',
        impact: fields.impact || '',
        materials: fields.materials || '',
        circular_strategy:
          fields.circular_strategy ||
          (c.metadata?.r_strategy
            ? c.metadata.r_strategy.charAt(0).toUpperCase() + c.metadata.r_strategy.slice(1)
            : null),
        // New enrichment fields
        year,
        location,
        use_type: useType,
        source_url: rawSourceUrl,
        source_display: sourceDisplay, // e.g. "wbcsd.org"
        // Per-case scores for comparison with user scores
        case_scores: c.metadata?.scores || null,
        industry: c.industry ?? null,
        category: c.category ?? null,
        source: c.source ?? null,
        similarity: c.similarity ?? c.combined_score ?? 0,
        rrf_score: c.rrf_score ?? null,
        metadata: c.metadata
          ? {
              ...c.metadata,
              fields: {
                ...fields,
                metadata_json: undefined,
              },
            }
          : null,
      };
    });

    // ========== STEP 6b: CLEAN SIMILAR CASE TEXT ==========
    // Run AFTER formattedCases mapping so c.problem/solution/impact/summary
    // are already extracted from metadata.fields into top-level fields.
    // cleanSimilarCases never throws — returns originals on any failure.
    const cleanedFormattedCases = await cleanSimilarCases(formattedCases);

    const response = {
      // input echo
      businessProblem,
      businessSolution,
      evaluation_parameters: evaluationParameters || {},
      business_context: businessContext || {},
      // Main scoring results
      overall_score: scores.overall_score,
      confidence_level: scores.confidence_level,
      sub_scores: scores.sub_scores,
      derived_metrics: scores.derived_metrics,
      score_breakdown: scores.score_breakdown,
      // Layer 2: New deterministic computed outputs
      weighted_score_card: scores.weighted_score_card,
      circular_economy_tier: scores.circular_economy_tier,
      parameter_consistency: scores.parameter_consistency,
      // LLM audit and analysis
      audit: auditResult,
      similar_cases: cleanedFormattedCases,
      metadata: metadata,
      r_strategy_alignment: rStrategyAlignment,
      gap_analysis: gapAnalysis,
      processing_info: {
        request_id: requestId,
        processing_time_ms: Date.now() - startTime,
        timings: timings,
        timestamp: new Date().toISOString(),
      },
    };

    // Fire-and-forget logging to scoring_results_log table
    const logData = {
      // ── Request provenance ──────────────────────────────────────────────────────
      request_id: response.processing_info.request_id,
      user_id: userId,
      is_anonymous: userId === null,

      // ── Privacy fingerprints ────────────────────────────────────────────────────
      ip_hash: crypto.createHash('sha256').update(extractIPAddress(req)).digest('hex'),
      identifier_hash: getIdentifierFromRequest(req).hash,
      user_agent_snippet: req.headers['user-agent']?.substring(0, 200),

      // ── User-supplied inputs ────────────────────────────────────────────────────
      business_problem: businessProblem,
      business_solution: businessSolution,
      business_problem_len: businessProblem.length,
      business_solution_len: businessSolution.length,
      evaluation_parameters: evaluationParameters || {},
      business_context: businessContext || {},

      // ── Top-level scoring scalars ───────────────────────────────────────────────
      overall_score: response.overall_score,
      confidence_level: response.confidence_level,

      // ── Derived metric scalars ──────────────────────────────────────────────────
      technical_feasibility: response.derived_metrics.technical_feasibility,
      economic_viability: response.derived_metrics.economic_viability,
      circularity_potential: response.derived_metrics.circularity_potential,
      risk_level: response.derived_metrics.risk_level,

      // ── Metadata scalars ────────────────────────────────────────────────────────
      industry: response.metadata?.industry,
      scale: response.metadata?.scale,
      primary_material: response.metadata?.primary_material,
      geographic_focus: response.metadata?.geographic_focus,

      // ── Audit quality signals ───────────────────────────────────────────────────
      audit_confidence_score: response.audit?.confidence_score ?? null,
      audit_is_junk_input: response.audit?.is_junk_input ?? false,
      audit_integrity_gaps_count: response.audit?.integrity_gaps?.length ?? 0,
      similar_cases_count: response.similar_cases?.length ?? 0,

      // ── Layer 2 enrichment scalars ──────────────────────────────────────────────
      parameter_consistency_score: response.parameter_consistency?.score ?? null,
      parameter_consistency_rating: response.parameter_consistency?.rating ?? null,
      r_strategy_alignment_score: response.r_strategy_alignment?.alignment_score ?? null,
      r_strategy_alignment_rating: response.r_strategy_alignment?.rating ?? null,
      r_strategy: response.r_strategy_alignment?.strategy ?? response.metadata?.r_strategy ?? null,

      // ── Full JSON blobs ─────────────────────────────────────────────────────────
      sub_scores: response.sub_scores ?? null,
      derived_metrics: response.derived_metrics ?? null,
      score_breakdown: response.score_breakdown ?? null,
      weighted_score_card: response.weighted_score_card ?? null,
      circular_economy_tier: response.circular_economy_tier ?? null,
      parameter_consistency: response.parameter_consistency ?? null,
      r_strategy_alignment: response.r_strategy_alignment ?? null,
      audit: response.audit ?? null,
      gap_analysis: response.gap_analysis ?? null,
      similar_cases: response.similar_cases ?? null,
      metadata: response.metadata ?? null,

      // ── Layer 3 audit sub-fields ────────────────────────────────────────────────
      improvement_roadmap: response.audit?.improvement_roadmap ?? null,
      sdg_alignment: response.audit?.sdg_alignment ?? null,
      market_opportunity_summary: response.audit?.market_opportunity_summary ?? null,

      // ── Processing performance ──────────────────────────────────────────────────
      processing_time_ms: response.processing_info.processing_time_ms,
      timings: response.processing_info.timings,

      // ── Full snapshot ───────────────────────────────────────────────────────────
      result_snapshot: response,
    };

    // --- BACKGROUND LOGGING ---
    // We do not 'await' this. It triggers and the function immediately returns.
    serviceSupabase
      .from('scoring_results_log')
      .insert(logData)
      .then(({ error }) => {
        if (error) {
          logger.error({ requestId, error }, 'Database error during result logging');
        } else {
          logger.info({ requestId }, 'Result logged successfully to database');
        }
      })
      .catch((err) => {
        logger.error({ requestId, err }, 'Result logging critical failure');
      });

    // --- RETURN TO CONTROLLER ---
    logOperation('performScoring', '/scoring', 'success', Date.now() - startTime);
    return response; // The controller gets this immediately while the .insert() is still in-flight
  } catch (error) {
    logger.error({ requestId, error }, 'Scoring request error');
    logOperation('performScoring', '/scoring', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Perform scoring audit with real-time progress streaming
 * Same logic as performScoring but with emitter callbacks for SSE
 * @param {Object} req - Express request object
 * @param {Object} openai - OpenAI client instance
 * @param {Object} supabase - Supabase client
 * @param {Object} serviceSupabase - Service-role Supabase client for logging
 * @param {string|null} userId - User ID if authenticated, null if anonymous
 * @param {Function} emitter - Callback function for progress updates (stage, message, data)
 * @returns {Promise<Object>} Complete scoring audit response
 */
export async function performScoringWithStream(
  req,
  openai,
  supabase,
  serviceSupabase,
  userId,
  emitter,
) {
  // --- SETUP & VALIDATION ---
  const startTime = Date.now();
  const requestId = req.id || Math.random().toString(36).slice(2, 9);

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

  logger.info(
    {
      requestId,
      authHeader: req.headers.authorization ? 'PRESENT' : 'MISSING',
      ip: extractIPAddress(req),
    },
    'NEW SCORING REQUEST (STREAM)',
  );

  try {
    const { businessProblem, businessSolution, evaluationParameters, businessContext } = req.body;

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

    // Validate evaluation parameters
    if (!evaluationParameters || typeof evaluationParameters !== 'object') {
      const error = new Error('Evaluation parameters object is required');
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
        typeof evaluationParameters[param] !== 'number' ||
        evaluationParameters[param] < 0 ||
        evaluationParameters[param] > 100
      ) {
        let msg = `${param.replace(/_/g, ' ')} must be a number between 0 and 100`;
        if (typeof evaluationParameters[param] !== 'number') {
          msg = `${param.replace(/_/g, ' ')} must be a number (received: ${typeof evaluationParameters[param]})`;
        } else if (evaluationParameters[param] < 0) {
          msg = `${param.replace(/_/g, ' ')} cannot be negative (received: ${evaluationParameters[param]})`;
        } else if (evaluationParameters[param] > 100) {
          msg = `${param.replace(/_/g, ' ')} cannot exceed 100 (received: ${evaluationParameters[param]})`;
        }
        const error = new Error(msg);
        error.code = 'INVALID_PARAMETER_VALUE';
        error.status = 400;
        throw error;
      }
    }

    timings.validation = Date.now() - stepStart;
    stepStart = Date.now();

    logger.info({ requestId }, 'Starting score calculation');

    // ========== STEP 1: CALCULATE DETERMINISTIC SCORES ==========
    emitter('scoring', 'Running scoring pipeline...');
    const scores = calculateScores(evaluationParameters);
    logger.info({ requestId, overallScore: scores.overall_score }, 'Scores calculated');

    timings.scoring = Date.now() - stepStart;
    stepStart = Date.now();

    // ========== STEP 2: VECTOR SEARCH FOR SIMILAR CASES ==========
    let metadata = null;
    let similarCases = [];

    try {
      // Create separate embeddings for problem and solution to query respective vectors
      logger.info({ requestId }, 'Generating problem + solution embeddings');
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
        logger.info({ requestId }, 'Extracting metadata (industry, scale, strategy)');
        metadata = await extractMetadata(businessProblem, businessSolution);
        logger.info(
          {
            requestId,
            industry: metadata.industry,
            scale: metadata.scale,
            rStrategy: metadata.r_strategy,
          },
          'Metadata extracted',
        );
      } catch (error) {
        logger.warn({ requestId, error }, 'Metadata extraction warning');
        metadata = null;
      }

      timings.metadata = Date.now() - stepStart;
      stepStart = Date.now();

      // Use hybrid search for problem and solution separately
      logger.info({ requestId }, 'Running hybrid searches for problem and solution');

      const keywordForProblem = metadata?.primary_material || '';
      const keywordForSolution = metadata?.primary_material || '';
      const matchCount = 8;

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

      const problemRows = searchResults.status === 'fulfilled' ? searchResults.value[0] || [] : [];
      const solutionRows = searchResults.status === 'fulfilled' ? searchResults.value[1] || [] : [];
      const industryRows =
        industryResults.status === 'fulfilled' ? industryResults.value || [] : [];

      if (searchResults.status === 'rejected') {
        logger.error(
          { requestId, searchResultsError: searchResults.reason },
          'Hybrid search failed',
        );
      }
      if (industryResults.status === 'rejected') {
        logger.error(
          { requestId, industryResultsError: industryResults.reason },
          'Industry search failed',
        );
      }

      // Combine and deduplicate using weighted multi-vector approach
      const combinedRows = [...problemRows, ...solutionRows, ...industryRows];

      if (combinedRows.length === 0) {
        logger.info({ requestId }, 'No similar cases found in database');
      } else {
        // Filter by minimum similarity threshold
        const MIN_SIMILARITY = 0.3;
        const filtered = combinedRows.filter((row) => (row.similarity || 0) >= MIN_SIMILARITY);

        if (filtered.length === 0) {
          logger.info(
            { requestId, minSimilarity: MIN_SIMILARITY },
            'No cases met minimum similarity threshold',
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
              logger.warn({ requestId, e }, 'Similar case metadata parsing warning');
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

          // Helper: Ensure we always return at least 4 similar cases when possible
          async function ensureAtLeastFour(dedupedList, problemVector, solutionVector, metadata) {
            if (dedupedList.length >= 4) return dedupedList;

            logger.info(
              { requestId, caseCount: dedupedList.length },
              'Only cases above threshold — running fallback search',
            );

            const [fallbackProblem, fallbackSolution] = await Promise.all([
              documentsRepository.searchHybrid(
                problemVector,
                keywordForProblem,
                metadata?.industry ?? null,
                null, // drop category filter for broader results
                null,
                20,
                VECTOR_SEARCH_VECTOR_WEIGHT,
                0.0,
              ),
              documentsRepository.searchHybrid(
                solutionVector,
                keywordForSolution,
                metadata?.industry ?? null,
                null,
                null,
                20,
                VECTOR_SEARCH_VECTOR_WEIGHT,
                0.0,
              ),
            ]);

            // No client-side similarity floor on fallback — use all results
            const fallbackDeduped = dedupeResultsWeighted(
              [...fallbackProblem, ...fallbackSolution],
              {
                wProblem: 0.5,
                wSolution: 0.4,
                wDoc: 0.1,
              },
            );

            return fallbackDeduped.length > 0 ? fallbackDeduped : dedupedList;
          }

          // Ensure we have at least 4 cases if possible
          deduped = await ensureAtLeastFour(deduped, problemVector, solutionVector, metadata);

          // Sort and limit
          deduped.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
          similarCases = deduped.slice(0, 4);
          logger.info(
            {
              requestId,
              totalRows: combinedRows.length,
              aboveThreshold: filtered.length,
              uniqueCases: similarCases.length,
            },
            'Similar cases identified',
          );
        }
      }

      timings.vectorSearch = Date.now() - stepStart;
      stepStart = Date.now();
    } catch (error) {
      logger.error({ requestId, error }, 'Vector search error');
      timings.vectorSearch = Date.now() - stepStart;
      stepStart = Date.now();
      // Continue without database context - don't fail the request
    }

    // ========== STEP 2b: R-STRATEGY ALIGNMENT ==========
    emitter('strategy', 'Analysing circular strategy…');
    const rStrategyAlignment = calculateRStrategyAlignment(
      scores.sub_scores,
      metadata?.r_strategy || null,
    );

    // ========== STEP 3: IDENTIFY INTEGRITY GAPS ==========
    const integrityGaps = identifyIntegrityGaps(scores.sub_scores);
    logger.info(
      { requestId, gapCount: integrityGaps.length },
      'Identified potential integrity gaps',
    );

    timings.integrityGaps = Date.now() - stepStart;
    stepStart = Date.now();

    // ========== STEP 4: GENERATE AI-POWERED AUDIT ==========
    emitter('audit_start', 'Starting audit generation…');
    logger.info({ requestId }, 'Generating audit analysis');

    const auditResult = await generateReasoning(
      businessProblem,
      businessSolution,
      scores,
      similarCases || [],
      businessContext || null,
      emitter,
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
    emitter('gap_analysis', 'Finalising analysis…');
    logger.info({ requestId }, 'Calculating gap analysis and benchmarks');
    const gapAnalysis = calculateGapAnalysis(scores, similarCases);

    timings.gapAnalysis = Date.now() - stepStart;

    // ========== STEP 6: COMPILE FINAL RESPONSE ==========
    // Format similar cases using structured columns only.
    const formattedCases = (similarCases || []).map((c) => {
      const fields = c.metadata?.fields || {};

      // Extract title, summary, projectName from metadata_json
      let title = c.title || ''; // already extracted by previous mapping
      let summary = c.summary || ''; // already cleaned by cleanSimilarCases
      let projectName = c.title || '';
      let year = '';
      let location = '';
      let useType = '';

      try {
        const metaJson = fields.metadata_json ? JSON.parse(fields.metadata_json) : null;
        if (metaJson) {
          if (!summary) summary = metaJson.summary || '';
          const ceText = metaJson.circular_economy_case_studies || '';

          // Extract project name (before first " | ")
          if (!projectName) {
            const pipeIdx = ceText.indexOf(' | ');
            projectName = pipeIdx > -1 ? ceText.substring(0, pipeIdx).trim() : '';
          }

          // Extract YEAR using regex: "YEAR 2023"
          const yearMatch = ceText.match(/YEAR\s+(\d{4})/);
          if (yearMatch) year = yearMatch[1];

          // Extract LOCATION: text between "LOCATION " and " USE "
          const locationMatch = ceText.match(/LOCATION\s+(.+?)\s+USE\s/);
          if (locationMatch) location = locationMatch[1].trim();

          // Extract USE TYPE: text after "USE " to end of line or "__"
          const useMatch = ceText.match(
            /USE\s+([A-Za-z][A-Za-z &/-]*?)(?=\s+C(?:\s*ONSTRUCTION|ONSTRUCTION)|\s*_{3,}|$)/,
          );
          if (useMatch) {
            // Trim and clean: remove trailing "C" fragment if present, clean spacing
            useType = useMatch[1]
              .trim()
              .replace(/\s*\bC\s*$/, '') // remove trailing isolated "C"
              .replace(/\s{2,}/g, ' ') // collapse multiple spaces
              .replace(/ - /g, '-') // clean spaced hyphens
              .trim();
          }
        }
      } catch {
        // metadata_json parse failed
      }

      title =
        projectName ||
        (summary ? summary.substring(0, 80) : '') ||
        `Case ${c.id?.substring(0, 8) || '?'}`;

      // Clean summary: strip trailing "\nCIRCULAR ECONOMY CASE STUDIES..." noise
      // (may still be present even after LLM cleanup on some cases)
      summary = summary.split('\nCIRCULAR ECONOMY CASE STUDIES')[0].trim();

      // Source URL — strip to domain for display
      const rawSourceUrl = fields.source_url || '';
      let sourceDisplay = '';
      try {
        if (rawSourceUrl) {
          sourceDisplay = new URL(rawSourceUrl).hostname.replace(/^www\./, '');
        }
      } catch {
        sourceDisplay = rawSourceUrl;
      }

      return {
        id: c.id,
        title,
        summary,
        problem: fields.problem || '',
        solution: fields.solution || '',
        impact: fields.impact || '',
        materials: fields.materials || '',
        circular_strategy:
          fields.circular_strategy ||
          (c.metadata?.r_strategy
            ? c.metadata.r_strategy.charAt(0).toUpperCase() + c.metadata.r_strategy.slice(1)
            : null),
        // New enrichment fields
        year,
        location,
        use_type: useType,
        source_url: rawSourceUrl,
        source_display: sourceDisplay, // e.g. "wbcsd.org"
        // Per-case scores for comparison with user scores
        case_scores: c.metadata?.scores || null,
        industry: c.industry ?? null,
        category: c.category ?? null,
        source: c.source ?? null,
        similarity: c.similarity ?? c.combined_score ?? 0,
        rrf_score: c.rrf_score ?? null,
        metadata: c.metadata
          ? {
              ...c.metadata,
              fields: {
                ...fields,
                metadata_json: undefined,
              },
            }
          : null,
      };
    });

    // ========== STEP 6b: CLEAN SIMILAR CASE TEXT ==========
    // Run AFTER formattedCases mapping so c.problem/solution/impact/summary
    // are already extracted from metadata.fields into top-level fields.
    // cleanSimilarCases never throws — returns originals on any failure.
    const cleanedFormattedCases = await cleanSimilarCases(formattedCases);

    const response = {
      // input echo
      businessProblem,
      businessSolution,
      evaluation_parameters: evaluationParameters || {},
      business_context: businessContext || {},
      // Main scoring results
      overall_score: scores.overall_score,
      confidence_level: scores.confidence_level,
      sub_scores: scores.sub_scores,
      derived_metrics: scores.derived_metrics,
      score_breakdown: scores.score_breakdown,
      // Layer 2: New deterministic computed outputs
      weighted_score_card: scores.weighted_score_card,
      circular_economy_tier: scores.circular_economy_tier,
      parameter_consistency: scores.parameter_consistency,
      // LLM audit and analysis
      audit: auditResult,
      similar_cases: cleanedFormattedCases,
      metadata: metadata,
      r_strategy_alignment: rStrategyAlignment,
      gap_analysis: gapAnalysis,
      processing_info: {
        request_id: requestId,
        processing_time_ms: Date.now() - startTime,
        timings: timings,
        timestamp: new Date().toISOString(),
      },
    };

    // Fire-and-forget logging to scoring_results_log table
    const logData = {
      // ── Request provenance ──────────────────────────────────────────────────────
      request_id: response.processing_info.request_id,
      user_id: userId,
      is_anonymous: userId === null,

      // ── Privacy fingerprints ────────────────────────────────────────────────────
      ip_hash: crypto.createHash('sha256').update(extractIPAddress(req)).digest('hex'),
      identifier_hash: getIdentifierFromRequest(req).hash,
      user_agent_snippet: req.headers['user-agent']?.substring(0, 200),

      // ── User-supplied inputs ────────────────────────────────────────────────────
      business_problem: businessProblem,
      business_solution: businessSolution,
      business_problem_len: businessProblem.length,
      business_solution_len: businessSolution.length,
      evaluation_parameters: evaluationParameters || {},
      business_context: businessContext || {},

      // ── Top-level scoring scalars ───────────────────────────────────────────────
      overall_score: response.overall_score,
      confidence_level: response.confidence_level,

      // ── Derived metric scalars ──────────────────────────────────────────────────
      technical_feasibility: response.derived_metrics.technical_feasibility,
      economic_viability: response.derived_metrics.economic_viability,
      circularity_potential: response.derived_metrics.circularity_potential,
      risk_level: response.derived_metrics.risk_level,

      // ── Metadata scalars ────────────────────────────────────────────────────────
      industry: response.metadata?.industry,
      scale: response.metadata?.scale,
      primary_material: response.metadata?.primary_material,
      geographic_focus: response.metadata?.geographic_focus,

      // ── Audit quality signals ───────────────────────────────────────────────────
      audit_confidence_score: response.audit?.confidence_score ?? null,
      audit_is_junk_input: response.audit?.is_junk_input ?? false,
      audit_integrity_gaps_count: response.audit?.integrity_gaps?.length ?? 0,
      similar_cases_count: response.similar_cases?.length ?? 0,

      // ── Layer 2 enrichment scalars ──────────────────────────────────────────────
      parameter_consistency_score: response.parameter_consistency?.score ?? null,
      parameter_consistency_rating: response.parameter_consistency?.rating ?? null,
      r_strategy_alignment_score: response.r_strategy_alignment?.alignment_score ?? null,
      r_strategy_alignment_rating: response.r_strategy_alignment?.rating ?? null,
      r_strategy: response.r_strategy_alignment?.strategy ?? response.metadata?.r_strategy ?? null,

      // ── Full JSON blobs ─────────────────────────────────────────────────────────
      sub_scores: response.sub_scores ?? null,
      derived_metrics: response.derived_metrics ?? null,
      score_breakdown: response.score_breakdown ?? null,
      weighted_score_card: response.weighted_score_card ?? null,
      circular_economy_tier: response.circular_economy_tier ?? null,
      parameter_consistency: response.parameter_consistency ?? null,
      r_strategy_alignment: response.r_strategy_alignment ?? null,
      audit: response.audit ?? null,
      gap_analysis: response.gap_analysis ?? null,
      similar_cases: response.similar_cases ?? null,
      metadata: response.metadata ?? null,

      // ── Layer 3 audit sub-fields ────────────────────────────────────────────────
      improvement_roadmap: response.audit?.improvement_roadmap ?? null,
      sdg_alignment: response.audit?.sdg_alignment ?? null,
      market_opportunity_summary: response.audit?.market_opportunity_summary ?? null,

      // ── Processing performance ──────────────────────────────────────────────────
      processing_time_ms: response.processing_info.processing_time_ms,
      timings: response.processing_info.timings,

      // ── Full snapshot ───────────────────────────────────────────────────────────
      result_snapshot: response,
    };

    // --- BACKGROUND LOGGING ---
    // We do not 'await' this. It triggers and the function immediately returns.
    serviceSupabase
      .from('scoring_results_log')
      .insert(logData)
      .then(({ error }) => {
        if (error) {
          logger.error({ requestId, error }, 'Database error during result logging');
        } else {
          logger.info({ requestId }, 'Result logged successfully to database');
        }
      })
      .catch((err) => {
        logger.error({ requestId, err }, 'Result logging critical failure');
      });

    // --- EMIT FINAL RESULT ---
    emitter('done', 'Complete!', { result: response });

    // --- RETURN TO CONTROLLER ---
    logOperation('performScoringWithStream', '/scoring/stream', 'success', Date.now() - startTime);
    return response; // The controller gets this immediately while the .insert() is still in-flight
  } catch (error) {
    logger.error({ requestId, error }, 'Scoring request error (stream)');
    logOperation('performScoringWithStream', '/scoring/stream', 'error', Date.now() - startTime);
    throw error;
  }
}
