/**
 * CE Cases Repository
 *
 * Wraps Supabase RPC calls for searching the ce_cases table.
 * Two modes:
 *   - keyword:  full-text search via search_ce_cases_keyword()
 *   - hybrid:   vector similarity + keyword scoring via search_ce_cases_hybrid()
 *
 * Both functions are defined in 06_ce_cases.sql and live in the public schema.
 *
 * @module ce_cases.repository
 */

import { logger } from '#utils/logger.js';

/**
 * Keyword full-text search against ce_cases.
 * Uses the generated tsvector (search_vector) with GIN index.
 * Results are ranked by ts_rank (weighted A > B > C > D).
 *
 * @param {Object} supabase     - Supabase client
 * @param {string} keyword      - Raw search string from user
 * @param {number} [limit=20]   - Max rows to return
 * @returns {Promise<Array>}    - Ranked rows with relevance score
 */
export async function searchKeyword(supabase, keyword, limit = 20) {
  const { data, error } = await supabase.rpc('search_ce_cases_keyword', {
    keyword,
    match_limit: limit,
  });

  if (error) {
    logger.error({ err: error, keyword }, 'search_ce_cases_keyword RPC failed');
    throw error;
  }

  return data ?? [];
}

/**
 * Hybrid search against ce_cases.
 * Scores ALL embedded rows as:
 *   final = vec_score * vector_weight + kw_score * (1 - vector_weight)
 * Vector similarity provides semantic reach; keyword score boosts exact matches.
 * No AND filter — rows without keyword matches surface via vector alone.
 *
 * @param {Object} supabase           - Supabase client
 * @param {number[]} queryEmbedding   - 1536-dim float array from OpenAI
 * @param {string}  keyword           - Raw search string (same text that was embedded)
 * @param {number}  [limit=20]        - Max rows to return
 * @param {number}  [vectorWeight=0.7] - Weight for vector score (0.0–1.0)
 * @returns {Promise<Array>}          - Rows ranked by combined similarity score
 */
export async function searchHybrid(
  supabase,
  queryEmbedding,
  keyword,
  limit = 20,
  vectorWeight = 0.7,
) {
  const { data, error } = await supabase.rpc('search_ce_cases_hybrid', {
    query_embedding: queryEmbedding,
    keyword,
    match_limit: limit,
    vector_weight: vectorWeight,
  });

  if (error) {
    logger.error({ err: error, keyword }, 'search_ce_cases_hybrid RPC failed');
    throw error;
  }

  return data ?? [];
}
