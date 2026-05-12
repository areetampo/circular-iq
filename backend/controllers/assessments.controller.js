/**
 * Assessments Controller
 * CRUD operations for user assessments: save, fetch, update, delete,
 * public sharing, market analysis per assessment.
 */

/**
 * Save a new assessment
 */
export async function saveAssessment(supabase, user, validatedBody, rawBody) {
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

    // Validate title length after trimming (additional safety check)
    const assessmentTitle = name || title?.substring(0, 255) || 'Untitled Assessment';
    const trimmedTitle = assessmentTitle.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 50) {
      const titleError = new Error(
        'Title must be between 3 and 50 characters after removing leading/trailing whitespace',
      );
      titleError.code = 'TITLE_LENGTH_INVALID';
      throw titleError;
    }

    const resultData = result_json || result;
    if (!resultData || !resultData.overall_score) {
      throw new Error('result with overall_score is required');
    }

    const scoringResult = result_json || result;

    const assessmentData = {
      user_id: user.id,
      title: name || title?.substring(0, 255) || 'Untitled Assessment',
      business_problem:
        businessProblem || scoringResult?.businessProblem || scoringResult?.problem || '',
      business_solution:
        businessSolution || scoringResult?.businessSolution || scoringResult?.solution || '',
      overall_score: Math.round(scoringResult.overall_score),
      confidence_level: scoringResult.confidence_level ?? null,
      technical_feasibility: scoringResult.derived_metrics?.technical_feasibility ?? null,
      economic_viability: scoringResult.derived_metrics?.economic_viability ?? null,
      circularity_potential: scoringResult.derived_metrics?.circularity_potential ?? null,
      risk_level: scoringResult.derived_metrics?.risk_level ?? null,
      industry:
        (typeof industry === 'string' && industry.trim()) ||
        scoringResult.metadata?.industry ||
        null,
      scale: scoringResult.metadata?.scale ?? null,
      r_strategy: scoringResult.metadata?.r_strategy ?? null,
      primary_material: scoringResult.metadata?.primary_material ?? null,
      geographic_focus: scoringResult.metadata?.geographic_focus ?? null,
      evaluation_parameters:
        parameters || evaluation_parameters || scoringResult.evaluation_parameters || null,
      sub_scores: scoringResult.sub_scores ?? null,
      derived_metrics: scoringResult.derived_metrics ?? null,
      score_breakdown: scoringResult.score_breakdown ?? null,
      audit: scoringResult.audit ?? null,
      gap_analysis: scoringResult.gap_analysis ?? null,
      similar_cases: scoringResult.similar_cases ?? null,
      metadata: scoringResult.metadata ?? null,
      weighted_score_card: scoringResult.weighted_score_card ?? null,
      circular_economy_tier: scoringResult.circular_economy_tier ?? null,
      parameter_consistency: scoringResult.parameter_consistency ?? null,
      r_strategy_alignment: scoringResult.r_strategy_alignment ?? null,
      parameter_consistency_score: scoringResult.parameter_consistency?.score ?? null,
      parameter_consistency_rating: scoringResult.parameter_consistency?.rating ?? null,
      r_strategy_alignment_score: scoringResult.r_strategy_alignment?.alignment_score ?? null,
      r_strategy_alignment_rating: scoringResult.r_strategy_alignment?.rating ?? null,
      audit_confidence_score: scoringResult.audit?.confidence_score ?? null,
      audit_is_junk_input: scoringResult.audit?.is_junk_input ?? false,
      audit_integrity_gaps_count: scoringResult.audit?.integrity_gaps?.length ?? 0,
      similar_cases_count: scoringResult.similar_cases?.length ?? 0,
      improvement_roadmap: scoringResult.audit?.improvement_roadmap ?? null,
      sdg_alignment: scoringResult.audit?.sdg_alignment ?? null,
      market_opportunity_summary: scoringResult.audit?.market_opportunity_summary ?? null,
      business_context: scoringResult.business_context ?? null,
      result_json: scoringResult,
      is_public: typeof is_public === 'boolean' ? is_public : true,
      contribute_to_global_benchmarks:
        typeof contribute_to_global_benchmarks === 'boolean'
          ? contribute_to_global_benchmarks
          : true,
    };

    const { data, error } = await supabase
      .from('user_assessments')
      .insert([assessmentData])
      .select();

    if (error) {
      // Handle duplicate name errors gracefully
      if (
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique constraint') ||
        error.message?.includes('unique_user_title')
      ) {
        const duplicateError = new Error('name already exists');
        duplicateError.code = 'DUPLICATE_NAME';
        throw duplicateError;
      }
      throw error;
    }

    logger.logOperation('saveAssessment', '/assessments', 'success', Date.now() - startTime);

    return {
      id: data[0].id,
      message: 'Assessment saved successfully',
      assessment: data[0],
    };
  } catch (error) {
    logger.logOperation('saveAssessment', '/assessments', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Fetch user's assessments with filtering, sorting, pagination
 */
export async function fetchUserAssessments(supabase, user, query) {
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

    let queryBuilder = supabase.from('user_assessments').select('*', { count: 'exact' });

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
      logger.error({ error }, 'User assessments query error');
      throw error;
    }

    logger.logOperation('fetchUserAssessments', '/assessments', 'success', Date.now() - startTime);

    return {
      assessments: data || [],
      total: count || 0,
      page: currentPage,
      pageSize: size,
    };
  } catch (error) {
    logger.logOperation('fetchUserAssessments', '/assessments', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Get aggregate statistics for user's assessments
 */
export async function getAssessmentStats(supabase, user) {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.rpc('get_assessment_statistics', {
      user_uuid: user?.id || null,
    });

    if (error) {
      logger.error({ error }, 'RPC error in get_assessment_statistics');
      throw error;
    }

    const stats = data?.[0] || {};

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

    logger.logOperation(
      'getAssessmentStats',
      '/assessments/stats',
      'success',
      Date.now() - startTime,
    );

    return result;
  } catch (error) {
    logger.logOperation(
      'getAssessmentStats',
      '/assessments/stats',
      'error',
      Date.now() - startTime,
    );
    throw error;
  }
}

/**
 * Fetch a public assessment by public_id
 * Users can access their own assessments regardless of public status
 * Other users can only access public assessments
 */
export async function getPublicAssessment(supabase, user, publicId) {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('public_id', publicId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const notFoundError = new Error('Assessment not found');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    // Check ownership and public status
    const isOwner = user && user.id && data.user_id === user.id;
    const isPublic = data.is_public;

    // If user owns the assessment, they can access it regardless of public status
    // If user doesn't own it, it must be public
    if (!isOwner && !isPublic) {
      const forbiddenError = new Error('Assessment not publicly available');
      forbiddenError.code = 'FORBIDDEN';
      throw forbiddenError;
    }

    logger.logOperation(
      'getPublicAssessment',
      '/assessments/public',
      'success',
      Date.now() - startTime,
    );

    return {
      assessment: data,
      readonly: !isOwner, // Only owners can edit
    };
  } catch (error) {
    logger.logOperation(
      'getPublicAssessment',
      '/assessments/public',
      'error',
      Date.now() - startTime,
    );
    throw error;
  }
}

/**
 * Validate a public assessment ID
 * Users can always validate their own assessments regardless of public status
 */
export async function validatePublicId(supabase, publicId, user = null) {
  const startTime = Date.now();

  try {
    // logger.info(
    //   {
    //     publicId,
    //     user: user ? { id: user.id, email: user.email } : null,
    //   },
    //   'validatePublicId called',
    // );

    // Check for null/undefined first
    if (!publicId || typeof publicId !== 'string') {
      const error = new Error('Public ID is required');
      error.code = 'INVALID_FORMAT';
      throw error;
    }

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(publicId)) {
      const error = new Error('Invalid public id format');
      error.code = 'INVALID_FORMAT';
      throw error;
    }

    const { data, error } = await supabase
      .from('user_assessments')
      .select('id,is_public,user_id')
      .eq('public_id', publicId)
      .maybeSingle();

    if (error) throw error;

    // logger.info({ data }, 'Assessment data');

    if (!data) {
      const notFoundError = new Error('Invalid Public ID');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    // If user is authenticated and owns this assessment, it's always valid
    const isOwner = user && user.id && data.user_id === user.id;
    // logger.info(
    //   {
    //     isOwner,
    //     userId: user?.id,
    //     assessmentUserId: data.user_id,
    //     isPublic: data.is_public,
    //   },
    //   'Ownership check',
    // );

    if (!isOwner && !data.is_public) {
      const forbiddenError = new Error('Assessment not publicly available');
      forbiddenError.code = 'FORBIDDEN';
      throw forbiddenError;
    }

    logger.logOperation(
      'validatePublicId',
      '/assessments/validate',
      'success',
      Date.now() - startTime,
    );

    return {
      valid: true,
      isOwner,
      isPublic: data.is_public,
    };
  } catch (error) {
    logger.logOperation(
      'validatePublicId',
      '/assessments/validate',
      'error',
      Date.now() - startTime,
    );
    throw error;
  }
}

/**
 * Fetch a single assessment by publicId (user-specific)
 */
export async function getAssessmentById(supabase, user, publicId) {
  const startTime = Date.now();

  try {
    let queryBuilder = supabase.from('user_assessments').select('*').eq('public_id', publicId);

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

    logger.logOperation('getAssessmentById', '/assessments/:id', 'success', Date.now() - startTime);

    return { assessment: data };
  } catch (error) {
    logger.logOperation('getAssessmentById', '/assessments/:id', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Update assessment fields
 */
export async function updateAssessment(supabase, user, id, updates) {
  const startTime = Date.now();

  try {
    const updateData = { ...updates };

    // Validate title length if title is being updated
    if (updates.title) {
      const trimmedTitle = updates.title.trim();
      if (trimmedTitle.length < 3 || trimmedTitle.length > 50) {
        const titleError = new Error(
          'Title must be between 3 and 50 characters after removing leading/trailing whitespace',
        );
        titleError.code = 'TITLE_LENGTH_INVALID';
        throw titleError;
      }
    }

    if (updates.is_public === true) {
      const { data: current } = await supabase
        .from('user_assessments')
        .select('public_id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!current?.public_id) {
        updateData.public_id = null;
      }
    }

    const { data, error } = await supabase
      .from('user_assessments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      // Handle duplicate name errors gracefully
      if (
        error.message?.includes('duplicate key') ||
        error.message?.includes('unique constraint') ||
        error.message?.includes('unique_user_title')
      ) {
        const duplicateError = new Error('name already exists');
        duplicateError.code = 'DUPLICATE_NAME';
        throw duplicateError;
      }
      throw error;
    }

    if (!data) {
      const notFoundError = new Error('Assessment not found or unauthorized');
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    logger.logOperation('updateAssessment', '/assessments/:id', 'success', Date.now() - startTime);

    return { assessment: data, message: 'Assessment updated successfully' };
  } catch (error) {
    logger.logOperation('updateAssessment', '/assessments/:id', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(supabase, user, id) {
  const startTime = Date.now();

  const userId = user.id;

  try {
    // logger.info({ id, userId }, 'DELETE request received');

    const { data: assessment, error: getError } = await supabase
      .from('user_assessments')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (getError || !assessment) {
      // logger.info({ id, userId, getError }, 'Assessment not found for deletion');
      const notFoundError = new Error(
        'Assessment not found or you do not have permission to delete it',
      );
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    const { error: deleteError } = await supabase
      .from('user_assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error({ id, userId, deleteError }, 'Error deleting assessment');
      throw new Error(`Deletion failed: ${deleteError.message}`);
    }

    // logger.info({ id, userId }, 'Assessment deleted successfully');
    logger.logOperation('deleteAssessment', '/assessments/:id', 'success', Date.now() - startTime);

    return { message: 'Assessment deleted successfully', id };
  } catch (error) {
    logger.error({ error }, 'Error during deleteAssessment operation');
    logger.logOperation('deleteAssessment', '/assessments/:id', 'error', Date.now() - startTime);
    throw error;
  }
}

/**
 * Compare two assessments with visibility rules
 * For public access (user is null), both assessments must be public
 */
export async function compareAssessments(supabase, user, publicId1, publicId2) {
  const startTime = Date.now();

  try {
    const userId = user?.id;

    // Validate input parameters
    if (
      !publicId1 ||
      !publicId2 ||
      typeof publicId1 !== 'string' ||
      typeof publicId2 !== 'string'
    ) {
      // logger.info('[ASSESSMENT_CONTROLLER_DEBUG] Validation failed, throwing error');
      const error = new Error('Both assessment IDs are required and must be valid strings');
      error.code = 'INVALID_IDS';
      throw error;
    }

    // Fetch basic info for both to check ownership/visibility
    const [basicRes1, basicRes2] = await Promise.all([
      supabase
        .from('user_assessments')
        .select('id,user_id,is_public,public_id')
        .eq('public_id', publicId1)
        .maybeSingle(),
      supabase
        .from('user_assessments')
        .select('id,user_id,is_public,public_id')
        .eq('public_id', publicId2)
        .maybeSingle(),
    ]);

    if (basicRes1.error || basicRes2.error) throw basicRes1.error || basicRes2.error;

    const basic1 = basicRes1.data;
    const basic2 = basicRes2.data;

    if (!basic1 || !basic2) {
      const error = new Error('One or more ids incorrect');
      error.code = 'INVALID_IDS';
      throw error;
    }

    // Helper: fetch full row, optionally requiring is_public
    const fetchFull = async (publicId, requirePublic = false) => {
      let q = supabase.from('user_assessments').select('*').eq('public_id', publicId);
      if (requirePublic) q = q.eq('is_public', true);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data;
    };

    // Pre-validate access rights before proceeding
    const validateAccess = (basic, userId, publicId) => {
      const isOwner = userId && basic.user_id === userId;
      const isPublic = basic.is_public;

      // User can access if: they own it OR it's public
      if (!isOwner && !isPublic) {
        const error = new Error(`Assessment ${publicId} is not publicly available for comparison`);
        error.code = 'NOT_PUBLIC';
        throw error;
      }
    };

    // Validate access for both assessments
    validateAccess(basic1, userId, publicId1);
    validateAccess(basic2, userId, publicId2);

    const isOwn1 = userId ? basic1.user_id === userId : false;
    const isOwn2 = userId ? basic2.user_id === userId : false;

    // Since we've already validated access rights, we can fetch both assessments
    // Use requirePublic flag only for assessments that are not owned by the user
    const result1 = await fetchFull(publicId1, !isOwn1);
    const result2 = await fetchFull(publicId2, !isOwn2);

    if (!result1 || !result2) {
      const missingIds = [];
      if (!result1) missingIds.push(publicId1);
      if (!result2) missingIds.push(publicId2);
      const error = new Error(`Assessment(s) ${missingIds.join(', ')} not found`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    logger.logOperation(
      'compareAssessments',
      '/assessments/compare',
      'success',
      Date.now() - startTime,
    );
    return { assessment1: result1, assessment2: result2 };
  } catch (error) {
    logger.logOperation(
      'compareAssessments',
      '/assessments/compare',
      'error',
      Date.now() - startTime,
    );
    throw error;
  }
}
