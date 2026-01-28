/* eslint-env node */
/* global process */
/**
 * Express API Server for Circular Economy Business Auditor
 *
 * Endpoints:
 * - POST /score - Main scoring and audit endpoint
 * - GET /health - Health check
 * - GET /docs/methodology - Methodology documentation
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import { calculateScores, identifyIntegrityGaps } from '../src/scoring.js';
import {
  generateReasoning,
  validateInput,
  extractMetadata,
  calculateGapAnalysis,
} from '../src/ask.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(apiKeyGuard);

// Initialize Supabase & OpenAI
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
const API_AUTH_ENABLED = process.env.API_AUTH_ENABLED === 'true';
const API_KEY = process.env.API_KEY || '';
validateConfig();

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

const OPEN_ENDPOINTS = new Set(['/health']);

function apiKeyGuard(req, res, next) {
  if (!API_AUTH_ENABLED) return next();
  if (OPEN_ENDPOINTS.has(req.path)) return next();

  if (!API_KEY) {
    return res
      .status(500)
      .json(
        errorResponse(
          { message: 'API auth enabled but API_KEY is not configured', code: 'API_KEY_MISSING' },
          'API auth misconfigured',
        ),
      );
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const apiKeyHeader = (req.headers['x-api-key'] || '').toString().trim();
  const token = bearerToken || apiKeyHeader;

  if (token && token === API_KEY) {
    return next();
  }

  return res
    .status(401)
    .json(
      errorResponse(
        { message: 'Invalid or missing API key', code: 'UNAUTHORIZED' },
        'Unauthorized',
      ),
    );
}

function validateConfig() {
  if (API_AUTH_ENABLED && !API_KEY) {
    const message = 'API_AUTH_ENABLED=true but API_KEY is not set';
    if (IS_PROD) {
      throw new Error(message);
    }
    console.warn(message);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or anon key is missing; database calls will fail.');
  }
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

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// MAIN SCORING ENDPOINT
// ============================================

/**
 * POST /score
 *
 * Accepts:
 * {
 *   businessProblem: string (min 50 chars),
 *   businessSolution: string (min 50 chars),
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
 *   similar_cases: array of database matches
 * }
 */
app.post('/score', async (req, res) => {
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
    debugLog(`[${requestId}] Scores calculated: ${scores.overall_score}/100`);

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

    // ========== STEP 2B: EXTRACT METADATA ==========
    // Metadata already extracted above; continue

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

// ============================================
// METHODOLOGY ENDPOINT
// ============================================

/**
 * GET /docs/methodology
 * Returns documentation about the 8-factor scoring framework
 */
app.get('/docs/methodology', (req, res) => {
  res.json({
    title: 'Circular Economy Business Auditor - Methodology',
    version: '1.0.0',
    framework: {
      name: '8-Factor Circular Economy Evaluation Framework',
      description: 'Deterministic scoring system for assessing circular economy business viability',
      factors: {
        'Access Value (Social & Participation)': {
          public_participation: {
            weight: 0.15,
            range: '0-100',
            description: 'How easily can stakeholders engage with your system?',
            low: 'Limited to specific groups',
            high: 'Universal accessibility',
          },
          infrastructure: {
            weight: 0.15,
            range: '0-100',
            description: 'Existing infrastructure availability and geographic reach',
            low: 'Limited infrastructure - significant investment needed',
            high: 'Strong existing infrastructure supports this',
          },
        },
        'Embedded Value (Economic & Material)': {
          market_price: {
            weight: 0.2,
            range: '0-100',
            description: 'Economic value of recovered materials and market demand',
            low: 'Requires subsidies or policy support',
            high: 'Strong market demand and recovery value',
          },
          maintenance: {
            weight: 0.1,
            range: '0-100',
            description: 'Ease and cost of upkeep, system durability',
            low: 'High maintenance demands',
            high: 'Very easy to maintain, low cost',
          },
          uniqueness: {
            weight: 0.1,
            range: '0-100',
            description: 'Innovation level and competitive advantage',
            low: 'Conventional approach',
            high: 'Highly innovative',
          },
        },
        'Processing Value (Technical & Operational)': {
          size_efficiency: {
            weight: 0.1,
            range: '0-100',
            description: 'Physical footprint and transportation efficiency',
            low: 'Significant space and resources needed',
            high: 'Highly space-efficient, minimal footprint',
          },
          chemical_safety: {
            weight: 0.1,
            range: '0-100',
            description: 'Environmental hazards and health risks (inverse scale)',
            low: 'Significant hazards - strict protocols required',
            high: 'Minimal environmental and health risks',
          },
          tech_readiness: {
            weight: 0.1,
            range: '0-100',
            description: 'Technology maturity and implementation complexity',
            low: 'Emerging technology, significant R&D needed',
            high: 'Proven technology, ready for deployment',
          },
        },
      },
    },
    scoring_formula: 'overall_score = Σ(sub_score * weight) for all 8 factors',
    total_weight: 1.0,
    database: {
      name: 'GreenTechGuardians',
      size: 'Dynamic (embedded in Supabase)',
      embedding_model: 'text-embedding-3-small',
      embedding_dimensions: 1536,
      retrieval_method: 'Cosine similarity search',
    },
  });
});

// ============================================
// ASSESSMENT HISTORY ENDPOINTS (Phase 2)
// ============================================

/**
 * POST /assessments
 * Save a completed assessment result for historical tracking
 */
app.post('/assessments', async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).slice(2, 9);

  try {
    const { title, businessProblem, businessSolution, result, parameters, sessionId } = req.body;

    if (!title || !result || !result.overall_score) {
      return res.status(400).json(
        errorResponse({
          message: 'title and result with overall_score are required',
          code: 'MISSING_ASSESSMENT_DATA',
        }),
      );
    }

    const assessmentData = {
      title: title.substring(0, 255),
      session_id: sessionId || null,
      business_problem: businessProblem || '',
      business_solution: businessSolution || '',
      result_json: result
        ? {
            ...result,
            input_parameters: parameters || null,
          }
        : result,
      industry: result.metadata?.industry || 'general',
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
    res.status(500).json(errorResponse(error, 'Failed to save assessment'));
  }
});

/**
 * GET /assessments
 * Retrieve list of saved assessments with filtering and sorting
 */
app.get('/assessments', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      sessionId,
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

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

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
 * GET /assessments/:id
 * Retrieve a single assessment by ID
 */
app.get('/assessments/:id', async (req, res) => {
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
 * DELETE /assessments/:id
 * Delete a saved assessment
 */
app.delete('/assessments/:id', async (req, res) => {
  const startTime = Date.now();

  try {
    const { id } = req.params;

    const { error } = await supabase.from('assessments').delete().eq('id', id);

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
 * GET /analytics/market
 * Retrieve market analysis data (aggregate stats by industry/scale for competitive analysis)
 */
app.get('/analytics/market', async (req, res) => {
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

    logRequest('GET', '/analytics/market', 200, Date.now() - startTime);

    res.json({
      market_data: marketData || [],
      stats: stats?.[0] || null,
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    logRequest('GET', '/analytics/market', 500, Date.now() - startTime);
    res.status(500).json(errorResponse(error, 'Failed to fetch market data'));
  }
});

// ============================================
// 404 HANDLER (must be after all routes)
// ============================================

app.use((req, res) => {
  res.status(404).json(
    errorResponse({
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    }),
  );
});

// ============================================
// START SERVER (skip when running tests)
// ============================================

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   Circular Economy Business Auditor API                    ║
║   Server running on http://localhost:${PORT}               ║
╚════════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                    - Health check
  POST /score                     - Score and audit a business idea
  GET  /docs/methodology          - View methodology documentation
  POST /assessments               - Save an assessment (Phase 2)
  GET  /assessments               - List assessments (Phase 2)
  GET  /assessments/:id           - Get assessment detail (Phase 2)
  DELETE /assessments/:id         - Delete assessment (Phase 2)
  GET  /analytics/market          - Market analysis (Phase 2)

Environment:
  Node: ${typeof process !== 'undefined' && process.version ? process.version : 'unknown'}
  Port: ${PORT}
  OpenAI Model: GPT-4o-mini (reasoning), text-embedding-3-small (embeddings)

Database:
  Supabase: ${typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}

Ready for requests. Press Ctrl+C to stop.
    `);
  });
}

// Error handling for unhandled rejections
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

export default app;
