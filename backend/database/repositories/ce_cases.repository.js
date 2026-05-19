/**
 * CE Cases Repository
 *
 * Database abstraction layer for the ce_cases table.
 * Always backed by Supabase (unlike documents, which supports Aiven too).
 *
 * Search modes:
 *   - keyword:  full-text search via search_ce_cases_keyword()
 *   - hybrid:   vector similarity + keyword scoring via search_ce_cases_hybrid()
 *
 * Both RPC functions are defined in 06_ce_cases.sql (public schema).
 *
 * @module ce_cases.repository
 */

import { getSupabaseClient } from '#database/client.js';

export class CeCasesRepository {
  /**
   * Returns the Supabase client.
   * Resolved per-call so that test overrides via setDatabaseClientOverride() work correctly.
   *
   * @returns {Object} Supabase client instance.
   * @private
   */
  #client() {
    return getSupabaseClient();
  }

  /**
   * Keyword full-text search against ce_cases.
   * Uses the generated tsvector (search_vector) with GIN index.
   * Results are ranked by ts_rank (weighted A > B > C > D).
   *
   * @param {string} keyword - Raw search string from user.
   * @param {number} [limit=20] - Max rows to return.
   * @returns {Promise<Array>} Ranked rows with relevance score.
   * @throws {Error} If the RPC call fails.
   */
  async searchKeyword(keyword, limit = 20) {
    const startTime = Date.now();

    try {
      const { data, error } = await this.#client().rpc('search_ce_cases_keyword', {
        keyword,
        match_limit: limit,
      });

      if (error) {
        logger.logOperation('searchKeyword', 'ce_cases/keyword', 'error', Date.now() - startTime, {
          keyword: keyword.substring(0, 50),
          error,
        });
        throw error;
      }

      logger.logOperation('searchKeyword', 'ce_cases/keyword', 'success', Date.now() - startTime, {
        keyword: keyword.substring(0, 50),
        resultCount: data?.length ?? 0,
        limit,
      });

      return data ?? [];
    } catch (error) {
      logger.logOperation('searchKeyword', 'ce_cases/keyword', 'error', Date.now() - startTime, {
        keyword: keyword.substring(0, 50),
        error,
      });
      throw error;
    }
  }

  /**
   * Hybrid search against ce_cases.
   * Scores all embedded rows as:
   *   final = (vec_score * vectorWeight) + (kw_score * (1 - vectorWeight))
   *
   * Vector similarity provides semantic reach; keyword score boosts exact matches.
   * Rows without keyword matches still surface via vector score alone.
   *
   * @param {number[]} queryEmbedding - 1536-dim float array from OpenAI.
   * @param {string} keyword - Raw search string (same text that was embedded).
   * @param {number} [limit=20] - Max rows to return.
   * @param {number} [vectorWeight=0.7] - Weight for vector score (0.0–1.0).
   * @returns {Promise<Array>} Rows ranked by combined similarity score.
   * @throws {Error} If the RPC call fails.
   */
  async searchHybrid(queryEmbedding, keyword, limit = 20, vectorWeight = 0.7) {
    const startTime = Date.now();

    try {
      const { data, error } = await this.#client().rpc('search_ce_cases_hybrid', {
        query_embedding: queryEmbedding,
        keyword,
        match_limit: limit,
        vector_weight: vectorWeight,
      });

      if (error) {
        logger.logOperation('searchHybrid', 'ce_cases/hybrid', 'error', Date.now() - startTime, {
          keyword: keyword.substring(0, 50),
          vectorWeight,
          error,
        });
        throw error;
      }

      logger.logOperation('searchHybrid', 'ce_cases/hybrid', 'success', Date.now() - startTime, {
        keyword: keyword.substring(0, 50),
        resultCount: data?.length ?? 0,
        limit,
        vectorWeight,
      });

      return data ?? [];
    } catch (error) {
      logger.logOperation('searchHybrid', 'ce_cases/hybrid', 'error', Date.now() - startTime, {
        keyword: keyword.substring(0, 50),
        vectorWeight,
        error,
      });
      throw error;
    }
  }
}
