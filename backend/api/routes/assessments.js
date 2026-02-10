import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateAssessment } from '../../src/middleware/validation.js';
import { requireAuth } from '../../src/middleware/auth.js';

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
 * Create assessments router
 * @param {Object} supabase - Supabase client instance
 * @returns {express.Router} Express router with assessment endpoints
 */
export default function createAssessmentsRouter(supabase) {
  const router = express.Router();

  /**
   * POST /
   * Save a completed assessment result for historical tracking
   */
  router.post('/', requireAuth(supabase), validateAssessment, async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).slice(2, 9);

    try {
      // Use validated body from middleware
      const { name, industry, result_json, is_public, contribute_to_global_benchmarks } =
        req.validatedBody;
      const { title, businessProblem, businessSolution, result, parameters } = req.body;

      // Check for required result data (either from result_json or result field)
      const resultData = result_json || result;
      if (!resultData || !resultData.overall_score) {
        return res.status(400).json({
          error: 'result with overall_score is required',
          code: 'MISSING_RESULT_DATA',
          timestamp: new Date().toISOString(),
        });
      }

      const assessmentData = {
        user_id: req.user.id,
        title: name || title?.substring(0, 255) || 'Untitled Assessment',
        business_problem: businessProblem || '',
        business_solution: businessSolution || '',
        result_json: result_json || {
          ...result,
          input_parameters: parameters || null,
        },
        industry: industry || resultData.metadata?.industry || 'general',
        overall_score: Math.round(resultData.overall_score),
        business_viability_score: resultData.sub_scores?.business_viability || 0,
        is_public: typeof is_public === 'boolean' ? is_public : false,
        contribute_to_global_benchmarks:
          typeof contribute_to_global_benchmarks === 'boolean'
            ? contribute_to_global_benchmarks
            : false,
      };

      // Insert assessment using an authenticated user client to respect RLS
      const token = req.headers.authorization?.slice(7).trim();

      let userClient;
      if (token) {
        userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } else {
        userClient = supabase;
      }

      const { data, error } = await userClient
        .from('assessments')
        .insert([assessmentData])
        .select();

      if (error) throw error;

      debugLog(`[${requestId}] Assessment saved: ${data[0].id}`);
      logRequest('POST', '/assessments', 201, Date.now() - startTime);

      res.status(201).json({
        id: data[0].id,
        message: 'Assessment saved successfully',
        assessment: data[0],
      });
    } catch (error) {
      console.error(`[${requestId}] Assessment save error:`, error);
      logRequest('POST', '/assessments', 500, Date.now() - startTime);
      res.status(500).json({
        error: error.message || 'Failed to save assessment',
        code: 'SAVE_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /
   * Retrieve list of saved assessments with filtering and sorting
   */
  router.get('/', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).slice(2, 9);

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
      } = req.query;

      const currentPage = Math.max(1, parseInt(page));
      const size = Math.max(1, Math.min(100, parseInt(pageSize)));
      const from = (currentPage - 1) * size;
      const to = from + size - 1;

      const allowedSort = new Set(['created_at', 'overall_score', 'title']);
      const sortBy = allowedSort.has(String(sortByRaw)) ? String(sortByRaw) : 'created_at';
      const order = String(orderRaw).toLowerCase() === 'asc' ? 'asc' : 'desc';

      // Create authenticated user client to respect RLS policies
      const token = req.headers.authorization?.slice(7).trim();

      let userClient;
      if (token) {
        // If we have a token, create an authenticated client with the token in Authorization header
        userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } else {
        // In test mode without a token, use the main client
        userClient = supabase;
      }

      let query = userClient.from('assessments').select('*', { count: 'exact' });

      // Filter by user_id to match the authenticated user (backup to RLS policy)
      if (req.user && req.user.id) {
        query = query.eq('user_id', req.user.id);
      }

      // RLS policy will automatically filter to user's own assessments

      if (industry) {
        const industries = String(industry)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

        if (industries.length === 1) {
          query = query.eq('industry', industries[0]);
        } else if (industries.length > 1) {
          query = query.in('industry', industries);
        }
      }

      if (search && String(search).trim().length > 0) {
        const term = String(search).trim().toLowerCase();
        // OR filter across title and industry fields using ilike
        query = query.or(`title.ilike.%${term}%,industry.ilike.%${term}%`);
      }

      if (createdFrom) {
        query = query.gte('created_at', new Date(createdFrom).toISOString());
      }
      if (createdTo) {
        query = query.lte('created_at', new Date(createdTo).toISOString());
      }
      if (minScore != null && !Number.isNaN(Number(minScore))) {
        query = query.gte('overall_score', Number(minScore));
      }
      if (maxScore != null && !Number.isNaN(Number(maxScore))) {
        query = query.lte('overall_score', Number(maxScore));
      }

      const { data, error, count } = await query
        .order(sortBy, { ascending: order === 'asc' })
        .range(from, to);

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      debugLog(`[${requestId}] Fetched ${data?.length || 0} assessments for user ${req.user.id}`);
      logRequest('GET', '/assessments', 200, Date.now() - startTime);

      res.json({
        assessments: data || [],
        total: count || 0,
        page: currentPage,
        pageSize: size,
      });
    } catch (error) {
      console.error('Error fetching assessments:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        hint: error.hint,
        details: error.details,
      });
      logRequest('GET', '/assessments', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch assessments'));
    }
  });

  /**
   * GET /stats
   * Retrieve aggregate statistics for all user assessments (independent of pagination)
   */
  router.get('/stats', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).slice(2, 9);

    try {
      const token = req.headers.authorization?.slice(7).trim();

      let userClient;
      if (token) {
        userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } else {
        userClient = supabase;
      }

      // Get all assessments for the user (no pagination) - fetch both score and industry
      let query = userClient
        .from('assessments')
        .select('overall_score, industry', { count: 'exact' });

      if (req.user && req.user.id) {
        query = query.eq('user_id', req.user.id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      // Calculate statistics
      const scores = (data || []).map((a) => a.overall_score || 0).filter((s) => s !== null);

      // Calculate top industry (handle ties by showing all industries with max count)
      let topIndustries = null;
      if (data && data.length > 0) {
        const industryCounts = (data || []).reduce((acc, assessment) => {
          const industry = assessment.industry || 'general';
          acc[industry] = (acc[industry] || 0) + 1;
          return acc;
        }, {});

        // Find max count
        const maxCount = Math.max(...Object.values(industryCounts));

        // Get all industries with max count
        const topIndustriesArray = Object.entries(industryCounts)
          .filter(([, count]) => count === maxCount)
          .map(([industry, count]) => ({ industry, count }))
          .sort((a, b) => a.industry.localeCompare(b.industry)); // Sort alphabetically for consistency

        topIndustries = topIndustriesArray;
      }

      const stats = {
        totalAssessments: count || 0,
        averageScore:
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : 0,
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        topIndustries,
      };

      debugLog(`[${requestId}] Fetched stats for user ${req.user.id}:`, stats);
      logRequest('GET', '/assessments/stats', 200, Date.now() - startTime);

      res.json(stats);
    } catch (error) {
      console.error('Error fetching assessment stats:', error);
      logRequest('GET', '/assessments/stats', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch assessment statistics'));
    }
  });

  /**
   * GET /public/:publicId
   * Retrieve a publicly shared assessment by public_id (no authentication required)
   */
  router.get('/public/:publicId', async (req, res) => {
    const startTime = Date.now();

    try {
      const { publicId } = req.params;

      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('public_id', publicId)
        .eq('is_public', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return res.status(404).json(
          errorResponse(
            {
              message: 'Assessment not found or is not public',
              code: 'NOT_FOUND',
            },
            'Assessment not found',
          ),
        );
      }

      logRequest('GET', `/assessments/public/${publicId}`, 200, Date.now() - startTime);
      res.json({ assessment: data });
    } catch (error) {
      console.error('Error fetching public assessment:', error);
      logRequest(
        'GET',
        `/assessments/public/${req && req.params && req.params.publicId ? req.params.publicId : 'unknown'}`,
        500,
        Date.now() - startTime,
      );
      res.status(500).json(errorResponse(error, 'Failed to fetch assessment'));
    }
  });

  /**
   * GET /:id
   * Retrieve a single assessment by ID
   */
  router.get('/:id', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      const token = req.headers.authorization?.slice(7).trim();

      let userClient;
      if (token) {
        userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } else {
        userClient = supabase;
      }

      let query = userClient.from('assessments').select('*').eq('id', id);

      if (req.user && req.user.id) {
        query = query.eq('user_id', req.user.id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        return res.status(404).json(
          errorResponse({
            message: 'Assessment not found',
            code: 'NOT_FOUND',
          }),
        );
      }

      logRequest('GET', `/assessments/${id}`, 200, Date.now() - startTime);
      res.json({ assessment: data });
    } catch (error) {
      console.error('Error fetching assessment:', error);
      logRequest(
        'GET',
        `/assessments/${req && req.params && req.params.id ? req.params.id : 'unknown'}`,
        500,
        Date.now() - startTime,
      );
      res.status(500).json(errorResponse(error, 'Failed to fetch assessment'));
    }
  });

  /**
   * PATCH /:id
   * Update assessment fields (e.g., is_public)
   */
  router.patch('/:id', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const updates = req.body;

      // Create authenticated user client
      const token = req.headers.authorization?.slice(7).trim();

      let userClient;
      if (token) {
        userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } else {
        userClient = supabase;
      }

      // Update only if the assessment belongs to the authenticated user
      const { data, error } = await userClient
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json(
          errorResponse({
            message: 'Assessment not found or unauthorized',
            code: 'NOT_FOUND',
          }),
        );
      }

      logRequest('PATCH', `/assessments/${id}`, 200, Date.now() - startTime);
      res.json({ assessment: data, message: 'Assessment updated successfully' });
    } catch (error) {
      console.error('Error updating assessment:', error);
      logRequest(
        'PATCH',
        `/assessments/${req && req.params && req.params.id ? req.params.id : 'unknown'}`,
        500,
        Date.now() - startTime,
      );
      res.status(500).json(errorResponse(error, 'Failed to update assessment'));
    }
  });

  /**
   * DELETE /:id
   * Delete a saved assessment
   */
  router.delete('/:id', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log('[DELETE_REQUEST]', { id, userId });

      // Create authenticated user client to respect RLS
      const token = req.headers.authorization?.slice(7).trim();

      let userClient;
      if (token) {
        userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } else {
        userClient = supabase;
      }

      // Verify assessment exists and belongs to user before deleting
      const { data: assessment, error: getError } = await userClient
        .from('assessments')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (getError || !assessment) {
        console.log('[DELETE_NOT_FOUND]', { id, userId, getError });
        logRequest('DELETE', `/assessments/${id}`, 404, Date.now() - startTime);
        return res.status(404).json(
          errorResponse({
            message: 'Assessment not found or you do not have permission to delete it',
            code: 'NOT_FOUND',
          }),
        );
      }

      // Delete the assessment using authenticated client
      const { error: deleteError } = await userClient
        .from('assessments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[DELETE_ERROR]', { id, userId, deleteError });
        throw new Error(`Deletion failed: ${deleteError.message}`);
      }

      console.log('[DELETE_SUCCESS]', { id, userId });
      logRequest('DELETE', `/assessments/${id}`, 200, Date.now() - startTime);
      res.json({ message: 'Assessment deleted successfully', id });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      logRequest(
        'DELETE',
        `/assessments/${req && req.params && req.params.id ? req.params.id : 'unknown'}`,
        500,
        Date.now() - startTime,
      );
      res.status(500).json(errorResponse(error, 'Failed to delete assessment'));
    }
  });

  /**
   * GET /market-analysis
   * Retrieve market analysis data (aggregate stats by industry/scale for competitive analysis)
   */
  router.get('/market-analysis', async (req, res) => {
    const startTime = Date.now();

    try {
      const { data: marketData, error: marketError } = await supabase.rpc('get_market_data');

      if (marketError) {
        console.warn('Market data query warning:', marketError.message);
        // Return empty structure if function not available yet
        return res.json({
          market_data: [],
          stats: null,
        });
      }

      const { data: stats, error: statsError } = await supabase.rpc('get_assessment_statistics');

      if (statsError) {
        console.warn('Assessment statistics query warning:', statsError.message);
      }

      logRequest('GET', '/market-analysis', 200, Date.now() - startTime);

      res.json({
        market_data: marketData || [],
        stats: stats?.[0] || null,
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
      logRequest('GET', '/market-analysis', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch market data'));
    }
  });

  return router;
}
