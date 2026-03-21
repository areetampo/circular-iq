/**
 * Assessments Controller
 * Handles all business logic for assessment operations
 * - Save new assessments
 * - Fetch assessments (user and public)
 * - Retrieve statistics
 * - Market analysis
 * - Assessment updates and deletion
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { createSupabaseClientWithAuth } from '#database/supabase.client.js';

const IS_PROD = BACKEND_CONFIG.isProduction;

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
 * Save a new assessment
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {Object} validatedBody - Validated request body from middleware
 * @param {Object} rawBody - Raw request body
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} Assessment data with id
 */
export async function saveAssessment(supabase, user, validatedBody, rawBody, token) {
  const startTime = Date.now();

  try {
    const {
      name,
      industry,
      result_json,
      is_public,
      contribute_to_global_benchmarks,
      businessProblem,
      businessSolution,
      parameters,
    } = validatedBody;
    const { title, result, evaluation_parameters } = rawBody;

    // Check for required result data (either from result_json or result field)
    const resultData = result_json || result;
    if (!resultData || !resultData.overall_score) {
      throw new Error('result with overall_score is required');
    }

    // Ensure assessment stores the case-summary inputs even if the client
    // provided them inside `result_json` instead of top-level fields.
    const scoringResult = result_json || result; // full API response

    const assessmentData = {
      user_id: user.id,
      title: name || title?.substring(0, 255) || 'Untitled Assessment',
      business_problem:
        businessProblem || scoringResult?.businessProblem || scoringResult?.problem || '',
      business_solution:
        businessSolution || scoringResult?.businessSolution || scoringResult?.solution || '',

      // ── Scoring scalars ──────────────────────────────────────────────────────
      overall_score: Math.round(scoringResult.overall_score),
      confidence_level: scoringResult.confidence_level ?? null,

      // ── Derived metric scalars ───────────────────────────────────────────────
      technical_feasibility: scoringResult.derived_metrics?.technical_feasibility ?? null,
      economic_viability: scoringResult.derived_metrics?.economic_viability ?? null,
      circularity_potential: scoringResult.derived_metrics?.circularity_potential ?? null,
      risk_level: scoringResult.derived_metrics?.risk_level ?? null,

      // ── Metadata scalars ─────────────────────────────────────────────────────
      industry:
        (typeof industry === 'string' && industry.trim()) ||
        scoringResult.metadata?.industry ||
        null,
      scale: scoringResult.metadata?.scale ?? null,
      r_strategy: scoringResult.metadata?.r_strategy ?? null,
      primary_material: scoringResult.metadata?.primary_material ?? null,
      geographic_focus: scoringResult.metadata?.geographic_focus ?? null,

      // ── JSON blobs ───────────────────────────────────────────────────────────
      evaluation_parameters:
        parameters || evaluation_parameters || scoringResult.evaluation_parameters || null,
      sub_scores: scoringResult.sub_scores ?? null,
      derived_metrics: scoringResult.derived_metrics ?? null,
      score_breakdown: scoringResult.score_breakdown ?? null,
      audit: scoringResult.audit ?? null,
      gap_analysis: scoringResult.gap_analysis ?? null,
      similar_cases: scoringResult.similar_cases ?? null,
      metadata: scoringResult.metadata ?? null,

      // ── Layer 2 enrichment JSONB blobs ───────────────────────────────────────
      weighted_score_card: scoringResult.weighted_score_card ?? null,
      circular_economy_tier: scoringResult.circular_economy_tier ?? null,
      parameter_consistency: scoringResult.parameter_consistency ?? null,
      r_strategy_alignment: scoringResult.r_strategy_alignment ?? null,

      // ── Layer 2 enrichment scalars (promoted for fast analytics) ─────────────
      parameter_consistency_score: scoringResult.parameter_consistency?.score ?? null,
      parameter_consistency_rating: scoringResult.parameter_consistency?.rating ?? null,
      r_strategy_alignment_score: scoringResult.r_strategy_alignment?.alignment_score ?? null,
      r_strategy_alignment_rating: scoringResult.r_strategy_alignment?.rating ?? null,

      // ── Audit quality signals (promoted scalars) ──────────────────────────────
      audit_confidence_score: scoringResult.audit?.confidence_score ?? null,
      audit_is_junk_input: scoringResult.audit?.is_junk_input ?? false,
      audit_integrity_gaps_count: scoringResult.audit?.integrity_gaps?.length ?? 0,
      similar_cases_count: scoringResult.similar_cases?.length ?? 0,

      // ── Layer 3 audit sub-fields (promoted for fast access) ──────────────────
      improvement_roadmap: scoringResult.audit?.improvement_roadmap ?? null,
      sdg_alignment: scoringResult.audit?.sdg_alignment ?? null,
      market_opportunity_summary: scoringResult.audit?.market_opportunity_summary ?? null,

      // ── business_context: API response uses key "business_context" ───────────
      business_context: scoringResult.business_context ?? null,

      // Full snapshot — required NOT NULL
      result_json: scoringResult,

      // ── Sharing ──────────────────────────────────────────────────────────────
      is_public: typeof is_public === 'boolean' ? is_public : true,
      contribute_to_global_benchmarks:
        typeof contribute_to_global_benchmarks === 'boolean'
          ? contribute_to_global_benchmarks
          : true,
    };

    // Insert assessment using an authenticated user client to respect RLS
    const userClient = token ? createSupabaseClientWithAuth(token) : supabase;

    const { data, error } = await userClient
      .from('user_assessments')
      .insert([assessmentData])
      .select();

    if (error) throw error;

    logOperation('saveAssessment', 'success', Date.now() - startTime);

    return {
      id: data[0].id,
      message: 'Assessment saved successfully',
      assessment: data[0],
    };
  } catch (error) {
    logOperation('saveAssessment', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Fetch user's assessments with filtering, sorting, pagination
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {string} token - Authorization token
 * @param {Object} query - Query parameters (industry, sortBy, order, page, pageSize, search, etc.)
 * @returns {Promise<Object>} Assessments array, total count, pagination info
 */
export async function fetchUserAssessments(supabase, user, token, query) {
  const startTime = Date.now();

  try {
    const {
      industry,
      sortBy: sortByRaw = 'created_at',
      order: orderRaw = 'desc',
      page = 1,
      pageSize = 20,
      search,
      createdFrom,
      createdTo,
      minScore,
      maxScore,
    } = query;

    const currentPage = Math.max(1, parseInt(page));
    const size = Math.max(1, Math.min(100, parseInt(pageSize)));
    const from = (currentPage - 1) * size;
    const to = from + size - 1;

    const allowedSort = new Set(['created_at', 'overall_score', 'title']);
    const sortBy = allowedSort.has(String(sortByRaw)) ? String(sortByRaw) : 'created_at';
    const orderDirection = String(orderRaw).toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Create authenticated user client to respect RLS policies
    const userClient = token ? createSupabaseClientWithAuth(token) : supabase;

    let queryBuilder = userClient.from('user_assessments').select('*', { count: 'exact' });

    // Filter by user_id to match the authenticated user (mirrors RLS policy)
    if (user && user.id) {
      queryBuilder = queryBuilder.eq('user_id', user.id);
    }

    if (industry) {
      const industries = String(industry)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (industries.length === 1) {
        queryBuilder = queryBuilder.eq('industry', industries[0]);
      } else if (industries.length > 1) {
        queryBuilder = queryBuilder.in('industry', industries);
      }
    }

    if (search && String(search).trim().length > 0) {
      const term = String(search).trim().toLowerCase();
      // OR filter across title and industry fields using ilike
      queryBuilder = queryBuilder.or(`title.ilike.%${term}%,industry.ilike.%${term}%`);
    }

    if (createdFrom) {
      queryBuilder = queryBuilder.gte('created_at', new Date(createdFrom).toISOString());
    }
    if (createdTo) {
      queryBuilder = queryBuilder.lte('created_at', new Date(createdTo).toISOString());
    }
    if (minScore != null && !Number.isNaN(Number(minScore))) {
      queryBuilder = queryBuilder.gte('overall_score', Number(minScore));
    }
    if (maxScore != null && !Number.isNaN(Number(maxScore))) {
      queryBuilder = queryBuilder.lte('overall_score', Number(maxScore));
    }

    const { data, error, count } = await queryBuilder
      .order(sortBy, { ascending: orderDirection === 'asc' })
      .range(from, to);

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    logOperation('fetchUserAssessments', 'success', Date.now() - startTime);

    return {
      assessments: data || [],
      total: count || 0,
      page: currentPage,
      pageSize: size,
    };
  } catch (error) {
    logOperation('fetchUserAssessments', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Get aggregate statistics for user's assessments
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} Statistics including average score, top industries
 */
export async function getAssessmentStats(supabase, user, token) {
  const startTime = Date.now();

  try {
    const userClient = token ? createSupabaseClientWithAuth(token) : supabase;

    // Use the RPC function to get comprehensive statistics including new fields
    const { data, error } = await userClient.rpc('get_assessment_statistics', {
      user_uuid: user?.id || null,
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    const stats = data?.[0] || {};

    // Transform the RPC result to match expected format
    const result = {
      totalAssessments: Number(stats.total_assessments) || 0,
      completedAssessments: Number(stats.completed_assessments) || 0,
      averageScore: Number(stats.avg_score) || 0,
      medianScore: Number(stats.median_score) || 0,
      minScore: Number(stats.min_score) || null,
      maxScore: Number(stats.max_score) || null,
      avgConfidence: Number(stats.avg_confidence) || null,
      avgTechnicalFeasibility: Number(stats.avg_technical_feasibility) || null,
      avgEconomicViability: Number(stats.avg_economic_viability) || null,
      avgCircularityPotential: Number(stats.avg_circularity_potential) || null,
      assessmentsByIndustry: stats.assessments_by_industry || {},
      assessmentsByRisk: stats.assessments_by_risk || {},
      assessmentsByScale: stats.assessments_by_scale || {},
    };

    logOperation('getAssessmentStats', 'success', Date.now() - startTime);

    return result;
  } catch (error) {
    logOperation('getAssessmentStats', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Fetch a public assessment by public_id
 * @param {Object} supabase - Supabase client
 * @param {string} publicId - Public assessment ID
 * @returns {Promise<Object>} Assessment data with readonly flag
 */
export async function getPublicAssessment(supabase, publicId) {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('public_id', publicId)
      .eq('is_public', true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const notFoundError = new Error('Assessment not found or is not public');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    logOperation('getPublicAssessment', 'success', Date.now() - startTime);

    return { assessment: data, readonly: true };
  } catch (error) {
    logOperation('getPublicAssessment', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Validate a public assessment ID
 * @param {Object} supabase - Supabase client
 * @param {string} publicId - Public assessment ID to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validatePublicId(supabase, publicId) {
  const startTime = Date.now();

  try {
    // Quick UUID format check (basic)
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(publicId)) {
      const error = new Error('Invalid public id format');
      error.code = 'INVALID_FORMAT';
      throw error;
    }

    const { data, error } = await supabase
      .from('user_assessments')
      .select('id,is_public')
      .eq('public_id', publicId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const notFoundError = new Error('Invalid Public ID');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    if (!data.is_public) {
      const forbiddenError = new Error('Assessment not publicly available');
      forbiddenError.code = 'FORBIDDEN';
      throw forbiddenError;
    }

    logOperation('validatePublicId', 'success', Date.now() - startTime);

    return { valid: true };
  } catch (error) {
    logOperation('validatePublicId', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Fetch market analysis data (aggregate stats)
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Market data and statistics
 */
export async function getMarketAnalysis(supabase) {
  const startTime = Date.now();

  try {
    const { data: marketData, error: marketError } = await supabase.rpc('get_market_data');

    if (marketError) {
      console.warn('Market data query warning:', marketError.message);
      // Return empty structure if function not available yet
      return {
        market_data: [],
        stats: null,
      };
    }

    const { data: stats, error: statsError } = await supabase.rpc('get_assessment_statistics');

    if (statsError) {
      console.warn('Assessment statistics query warning:', statsError.message);
    }

    logOperation('getMarketAnalysis', 'success', Date.now() - startTime);

    return {
      market_data: marketData || [],
      stats: stats?.[0] || null,
    };
  } catch (error) {
    logOperation('getMarketAnalysis', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Fetch a single assessment by ID (user-specific)
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {string} token - Authorization token
 * @param {string} id - Assessment ID
 * @returns {Promise<Object>} Assessment data
 */
export async function getAssessmentById(supabase, user, token, id) {
  const startTime = Date.now();

  try {
    const userClient = token ? createSupabaseClientWithAuth(token) : supabase;

    let queryBuilder = userClient.from('user_assessments').select('*').eq('id', id);

    if (user && user.id) {
      queryBuilder = queryBuilder.eq('user_id', user.id);
    }

    const { data, error } = await queryBuilder.maybeSingle();

    if (error) throw error;

    if (!data) {
      const notFoundError = new Error('Assessment not found');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    logOperation('getAssessmentById', 'success', Date.now() - startTime);

    return { assessment: data };
  } catch (error) {
    logOperation('getAssessmentById', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Update assessment fields
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {string} token - Authorization token
 * @param {string} id - Assessment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated assessment data
 */
export async function updateAssessment(supabase, user, token, id, updates) {
  const startTime = Date.now();

  try {
    const userClient = token ? createSupabaseClientWithAuth(token) : supabase;

    // If setting is_public to true and no public_id exists, generate one
    const updateData = { ...updates };
    if (updates.is_public === true) {
      const { data: current } = await userClient
        .from('user_assessments')
        .select('public_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      // If no public_id exists, generate one using database function
      if (!current?.public_id) {
        updateData.public_id = null; // Let database generate via DEFAULT
      }
    }

    // Update only if the assessment belongs to the authenticated user
    const { data, error } = await userClient
      .from('user_assessments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      const notFoundError = new Error('Assessment not found or unauthorized');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    logOperation('updateAssessment', 'success', Date.now() - startTime);

    return { assessment: data, message: 'Assessment updated successfully' };
  } catch (error) {
    logOperation('updateAssessment', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Delete an assessment
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {string} token - Authorization token
 * @param {string} id - Assessment ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteAssessment(supabase, user, token, id) {
  const startTime = Date.now();
  const userId = user.id;

  try {
    console.log('[DELETE_REQUEST]', { id, userId });

    const userClient = token ? createSupabaseClientWithAuth(token) : supabase;

    // Verify assessment exists and belongs to user before deleting
    const { data: assessment, error: getError } = await userClient
      .from('user_assessments')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (getError || !assessment) {
      console.log('[DELETE_NOT_FOUND]', { id, userId, getError });
      const notFoundError = new Error(
        'Assessment not found or you do not have permission to delete it',
      );
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    // Delete the assessment using authenticated client
    const { error: deleteError } = await userClient
      .from('user_assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[DELETE_ERROR]', { id, userId, deleteError });
      throw new Error(`Deletion failed: ${deleteError.message}`);
    }

    console.log('[DELETE_SUCCESS]', { id, userId });
    logOperation('deleteAssessment', 'success', Date.now() - startTime);

    return { message: 'Assessment deleted successfully', id };
  } catch (error) {
    console.error('Error deleting assessment:', error);
    logOperation('deleteAssessment', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Get per-assessment market analysis (user-specific)
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Authenticated user object
 * @param {string} id - Assessment ID
 * @returns {Promise<Object>} Market analysis data including benchmarks
 */
export async function getPerAssessmentMarketAnalysis(supabase, user, id) {
  const startTime = Date.now();

  try {
    // Fetch market-level aggregates
    const { data: marketData, error: marketError } = await supabase.rpc('get_market_data');
    if (marketError) {
      console.warn('Market data query warning:', marketError.message);
    }

    const { data: stats, error: statsError } = await supabase.rpc('get_assessment_statistics');
    if (statsError) {
      console.warn('Assessment statistics query warning:', statsError.message);
    }

    // Fetch the assessment to obtain user score and metadata (ownership enforced)
    const { data: assessmentRow, error: assessmentError } = await supabase
      .from('user_assessments')
      .select('overall_score, result_json, industry')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (assessmentError) {
      console.warn('Assessment fetch warning:', assessmentError.message);
    }

    const userScore = assessmentRow?.overall_score ?? null;
    const userIndustry = assessmentRow?.industry ?? null; // structured column only

    // Compute percentile if possible
    let userPercentile = null;
    if (typeof userScore === 'number') {
      const { count: lessOrEqualCount } = await supabase
        .from('user_assessments')
        .select('id', { count: 'exact' })
        .lte('overall_score', userScore);

      const total = stats?.[0]?.total_assessments || null;
      if (total && typeof lessOrEqualCount === 'number') {
        userPercentile = Math.round((lessOrEqualCount / total) * 100);
      }
    }

    // Compute industry benchmark for the user's industry
    let industryBenchmark = null;
    if (userIndustry && Array.isArray(marketData)) {
      const match = marketData.find((m) => m.industry === userIndustry);
      if (match) {
        industryBenchmark = {
          avg_score: match.avg_score,
          min_score: match.min_score,
          max_score: match.max_score,
          count: match.count,
          scale: match.scale,
        };
      }
    }

    // Build strategy breakdown
    const strategyMap = {};
    (marketData || []).forEach((m) => {
      const strat = m.r_strategy || 'unknown';
      if (!strategyMap[strat]) {
        strategyMap[strat] = { strategy: strat, avg_score: 0, count: 0 };
      }
      strategyMap[strat].avg_score =
        (strategyMap[strat].avg_score * strategyMap[strat].count +
          Number(m.avg_score || 0) * (m.count || 0)) /
        (strategyMap[strat].count + (m.count || 0) || 1);
      strategyMap[strat].count += m.count || 0;
    });
    const strategyBreakdown = Object.values(strategyMap).sort((a, b) => b.count - a.count);

    // Normalize stats keys for frontend compatibility
    const normalizedStats = stats?.[0]
      ? {
          avg_score: stats[0].avg_score,
          median_score: stats[0].median_score,
          min_score: stats[0].min_score,
          max_score: stats[0].max_score,
          total_count: stats[0].total_assessments,
        }
      : null;

    logOperation('getPerAssessmentMarketAnalysis', 'success', Date.now() - startTime);

    return {
      market_data: marketData || [],
      stats: normalizedStats,
      userScore,
      user_percentile: userPercentile,
      userIndustry,
      industry_benchmark: industryBenchmark,
      strategy_breakdown: strategyBreakdown,
    };
  } catch (error) {
    logOperation('getPerAssessmentMarketAnalysis', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Get per-assessment market analysis for public assessments
 * @param {Object} supabase - Supabase client
 * @param {string} publicId - Public assessment ID
 * @returns {Promise<Object>} Market analysis data with readonly flag
 */
export async function getPublicPerAssessmentMarketAnalysis(supabase, publicId) {
  const startTime = Date.now();

  try {
    // Fetch market aggregates
    const { data: marketData, error: marketError } = await supabase.rpc('get_market_data');
    if (marketError) console.warn('Market data query warning:', marketError.message);

    const { data: stats, error: statsError } = await supabase.rpc('get_assessment_statistics');
    if (statsError) console.warn('Assessment statistics query warning:', statsError.message);

    // Fetch the assessment by public_id and ensure it is public
    const { data: assessmentRow, error: assessmentError } = await supabase
      .from('user_assessments')
      .select('overall_score, result_json, industry, is_public')
      .eq('public_id', publicId)
      .eq('is_public', true)
      .maybeSingle();

    if (assessmentError) console.warn('Assessment fetch warning:', assessmentError.message);

    if (!assessmentRow) {
      const notFoundError = new Error('Assessment not found or not public');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    // Defensive check: return 403 if the record exists but is not public
    if (!assessmentRow.is_public) {
      const forbiddenError = new Error('Assessment is not public');
      forbiddenError.code = 'FORBIDDEN';
      throw forbiddenError;
    }

    const userScore = assessmentRow?.overall_score ?? null;
    const userIndustry = assessmentRow?.industry ?? null; // structured column only

    let userPercentile = null;
    if (typeof userScore === 'number') {
      const { count: lessOrEqualCount } = await supabase
        .from('user_assessments')
        .select('id', { count: 'exact' })
        .lte('overall_score', userScore);

      const total = stats?.[0]?.total_assessments || null;
      if (total && typeof lessOrEqualCount === 'number') {
        userPercentile = Math.round((lessOrEqualCount / total) * 100);
      }
    }

    let industryBenchmark = null;
    if (userIndustry && Array.isArray(marketData)) {
      const match = marketData.find((m) => m.industry === userIndustry);
      if (match) {
        industryBenchmark = {
          avg_score: match.avg_score,
          min_score: match.min_score,
          max_score: match.max_score,
          count: match.count,
          scale: match.scale,
        };
      }
    }

    const strategyMap = {};
    (marketData || []).forEach((m) => {
      const strat = m.r_strategy || 'unknown';
      if (!strategyMap[strat]) {
        strategyMap[strat] = { strategy: strat, avg_score: 0, count: 0 };
      }
      strategyMap[strat].avg_score =
        (strategyMap[strat].avg_score * strategyMap[strat].count +
          Number(m.avg_score || 0) * (m.count || 0)) /
        (strategyMap[strat].count + (m.count || 0) || 1);
      strategyMap[strat].count += m.count || 0;
    });
    const strategyBreakdown = Object.values(strategyMap).sort((a, b) => b.count - a.count);

    const normalizedStats = stats?.[0]
      ? {
          avg_score: stats[0].avg_score,
          median_score: stats[0].median_score,
          min_score: stats[0].min_score,
          max_score: stats[0].max_score,
          total_count: stats[0].total_assessments,
        }
      : null;

    logOperation('getPublicPerAssessmentMarketAnalysis', 'success', Date.now() - startTime);

    return {
      market_data: marketData || [],
      stats: normalizedStats,
      userScore,
      user_percentile: userPercentile,
      userIndustry,
      industry_benchmark: industryBenchmark,
      strategy_breakdown: strategyBreakdown,
      readonly: true,
    };
  } catch (error) {
    logOperation('getPublicPerAssessmentMarketAnalysis', 'error', Date.now() - startTime);
    throw error;
  }
}
