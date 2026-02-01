import express from 'express';
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
      const { name, industry, result_json } = req.validatedBody;
      const { title, businessProblem, businessSolution, result, parameters } = req.body;

      if (!result || !result.overall_score) {
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
        industry: industry || result.metadata?.industry || 'general',
        overall_score: Math.round(result.overall_score),
        business_viability_score: result.sub_scores?.business_viability || 0,
      };

      const { data, error } = await supabase.from('assessments').insert([assessmentData]).select();

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

      let query = supabase.from('assessments').select('*', { count: 'exact' });

      // Filter to only user's own assessments
      query = query.eq('user_id', req.user.id);

      if (industry) {
        query = query.eq('industry', industry);
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

      if (error) throw error;

      logRequest('GET', '/assessments', 200, Date.now() - startTime);

      res.json({
        assessments: data || [],
        total: count || 0,
        page: currentPage,
        pageSize: size,
      });
    } catch (error) {
      console.error('Error fetching assessments:', error);
      logRequest('GET', '/assessments', 500, Date.now() - startTime);
      res.status(500).json(errorResponse(error, 'Failed to fetch assessments'));
    }
  });

  /**
   * GET /:id
   * Retrieve a single assessment by ID
   */
  router.get('/:id', async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();

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
   * DELETE /:id
   * Delete a saved assessment
   */
  router.delete('/:id', requireAuth(supabase), async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      // Delete only if the assessment belongs to the authenticated user
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);

      if (error) throw error;

      logRequest('DELETE', `/assessments/${id}`, 200, Date.now() - startTime);
      res.json({ message: 'Assessment deleted successfully' });
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
