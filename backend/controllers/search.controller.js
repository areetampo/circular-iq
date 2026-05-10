/**
 * Search Controller
 *
 * Handles GET /api/search/ce-cases
 * Supports two modes:
 *   - keyword (default): fast full-text search, no OpenAI call
 *   - hybrid:            semantic vector search + keyword scoring (calls OpenAI to embed the query)
 *
 * Query parameters:
 *   q             {string}  Required. The search query.
 *   mode          {string}  "keyword" | "hybrid". Default: "keyword".
 *   limit         {number}  Max results to return. Default: 20. Max: 50.
 *   vector_weight {number}  0.0–1.0, hybrid mode only. Default: 0.7.
 *
 * @module search.controller
 */

import { ce_cases } from '#database/index.js';
import { createEmbedding } from '#services/embedding.service.js';

const MAX_QUERY_LENGTH = 500;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_VECTOR_WEIGHT = 0.7;

/**
 * Format a raw row from the RPC function into a clean response shape.
 * Extracts useful fields from metadata_json without exposing the raw blob.
 *
 * @param {Object} row - Raw row from search_ce_cases_keyword or search_ce_cases_hybrid
 * @returns {Object} Formatted result
 */
function formatResult(row) {
  const meta = row.metadata_json || {};

  // Extract the most useful display fields from metadata_json
  const title = meta.title || meta.product_name || null;
  const company = meta.company || meta.Company || null;
  const summary = meta.summary || meta.description || null;

  // Source URL display (hostname only)
  let sourceDisplay = null;
  try {
    if (row.source_url) {
      sourceDisplay = new URL(row.source_url).hostname.replace(/^www\./, '');
    }
  } catch {
    sourceDisplay = row.source_url;
  }

  return {
    id: row.id,
    // Core fields
    problem: row.problem || null,
    solution: row.solution || null,
    materials: row.materials || null,
    circular_strategy: row.circular_strategy || null,
    category: row.category || null,
    impact: row.impact || null,
    source_url: row.source_url || null,
    // Extracted from metadata_json for convenience
    title,
    company,
    summary,
    // Display helpers
    source_display: sourceDisplay,
    // Relevance score — field name differs by mode
    score: row.similarity ?? row.relevance ?? 0,
  };
}

/**
 * Search CE cases knowledge base.
 * Exported as a factory so the route can inject the supabase client.
 *
 * @param {Object} supabase - Supabase client (anon or service role)
 * @returns {Function} Express async handler
 */
export function searchCeCases(supabase) {
  return async function handler(req, res) {
    const startTime = Date.now();

    try {
      // ── 1. Parse & validate query params ─────────────────────────────────
      const { q, mode = 'keyword', limit: limitRaw, vector_weight: vwRaw } = req.query;

      if (!q || !q.trim()) {
        return res.status(400).json({
          error: 'Query parameter "q" is required and cannot be empty',
          code: 'MISSING_QUERY',
          timestamp: new Date().toISOString(),
        });
      }

      const query = q.trim();

      if (query.length > MAX_QUERY_LENGTH) {
        return res.status(400).json({
          error: `Query is too long. Maximum ${MAX_QUERY_LENGTH} characters.`,
          code: 'QUERY_TOO_LONG',
          timestamp: new Date().toISOString(),
        });
      }

      if (mode !== 'keyword' && mode !== 'hybrid') {
        return res.status(400).json({
          error: 'Parameter "mode" must be "keyword" or "hybrid"',
          code: 'INVALID_MODE',
          timestamp: new Date().toISOString(),
        });
      }

      const limit = Math.min(parseInt(limitRaw, 10) || DEFAULT_LIMIT, MAX_LIMIT);

      const vectorWeight = vwRaw !== undefined ? parseFloat(vwRaw) : DEFAULT_VECTOR_WEIGHT;
      if (isNaN(vectorWeight) || vectorWeight < 0 || vectorWeight > 1) {
        return res.status(400).json({
          error: 'Parameter "vector_weight" must be a number between 0.0 and 1.0',
          code: 'INVALID_VECTOR_WEIGHT',
          timestamp: new Date().toISOString(),
        });
      }

      logger.info({ query, mode, limit, vectorWeight }, 'CE cases search request');

      // ── 2. Execute search ─────────────────────────────────────────────────
      let rawResults;

      if (mode === 'keyword') {
        rawResults = await ce_cases.searchKeyword(supabase, query, limit);
      } else {
        // Hybrid: embed the query first, then pass vector + keyword to RPC
        let queryEmbedding;
        try {
          queryEmbedding = await createEmbedding(query);
        } catch (embedError) {
          logger.error({ embedError, query }, 'Failed to create query embedding');
          return res.status(503).json({
            error: 'Embedding service temporarily unavailable. Try mode=keyword instead.',
            code: 'EMBEDDING_FAILED',
            timestamp: new Date().toISOString(),
          });
        }

        rawResults = await ce_cases.searchHybrid(
          supabase,
          queryEmbedding,
          query,
          limit,
          vectorWeight,
        );
      }

      // ── 3. Format & respond ───────────────────────────────────────────────
      const results = rawResults.map(formatResult);

      const processingMs = Date.now() - startTime;
      logger.info({ query, mode, resultCount: results.length, processingMs }, 'Search complete');
      logger.logOperation('searchCeCases', '/search', 'success', processingMs);

      return res.json({
        query,
        mode,
        count: results.length,
        results,
        processing_info: {
          processing_time_ms: processingMs,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const processingMs = Date.now() - startTime;
      logger.error({ error, query: req.query.q }, 'CE cases search error');
      logger.logOperation('searchCeCases', '/search', 'error', processingMs);

      return res.status(500).json({
        error: error.message || 'Search failed',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  };
}
