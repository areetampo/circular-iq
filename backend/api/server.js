/**
 * Express API Server for Circular Economy Business Auditor
 *
 * Endpoints:
 * - POST /score - Main scoring and audit endpoint
 * - GET /health - Health check
 * - GET /docs/methodology - Methodology documentation
 */

import dotenv from 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import {
  calculateScores,
  identifyIntegrityGaps,
  generateScoreExplanations,
} from '../src/scoring.js';
import { generateReasoning, validateInput } from '../src/ask.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Supabase & OpenAI
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

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
  const requestId = Math.random().toString(36).substr(2, 9);

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
          message: `Business problem must be at least ${MIN_LENGTH} characters`,
          code: 'PROBLEM_TOO_SHORT',
        }),
      );
    }

    if (businessSolution.length < MIN_LENGTH) {
      return res.status(400).json(
        errorResponse({
          message: `Business solution must be at least ${MIN_LENGTH} characters`,
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
        return res.status(400).json(
          errorResponse({
            message: `${param} must be a number between 0 and 100`,
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

      // Search database for similar documents
      debugLog(`[${requestId}] Searching database for similar cases...`);
      const { data: results, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: queryVector,
        match_count: 3,
        similarity_threshold: 0.0,
      });

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

    // ========== STEP 5: COMPILE FINAL RESPONSE ==========
    const response = {
      overall_score: scores.overall_score,
      confidence_level: scores.confidence_level,
      sub_scores: scores.sub_scores,
      score_breakdown: scores.score_breakdown,
      audit: auditResult,
      similar_cases: similarCases,
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
// 404 HANDLER
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
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Circular Economy Business Auditor API                    ║
║   Server running on http://localhost:${PORT}                    ║
╚════════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                    - Health check
  POST /score                     - Score and audit a business idea
  GET  /docs/methodology          - View methodology documentation

Environment:
  Node: ${process.version}
  Port: ${PORT}
  OpenAI Model: GPT-4o-mini (reasoning), text-embedding-3-small (embeddings)

Database:
  Supabase: ${process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}

Ready for requests. Press Ctrl+C to stop.
  `);
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
