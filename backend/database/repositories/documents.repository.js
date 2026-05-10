/**
 * Documents Repository
 *
 * Database abstraction layer for document search and retrieval.
 * Supports both Supabase (RPC) and Aiven (raw Postgres) backends.
 *
 * All vector operations are performed using halfvec (half-precision vectors)
 * for efficient similarity search. Queries support filters by industry/category.
 *
 * @module documents.repository
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getDatabaseClient, getDatabaseType, getSupabasePgPool } from '#database/client.js';

const func = BACKEND_CONFIG.scoring.db.functions;

/**
 * Documents Repository
 *
 * Provides database-agnostic interface for:
 * - Vector similarity search (matchDocuments)
 * - Hybrid search combining vector + full-text (searchHybrid)
 * - Metadata filtering (industry, category, source)
 *
 * Implementation automatically selects Supabase RPC or Aiven SQL based on
 * current client configuration (setDatabaseClientOverride for testing).
 */
export class DocumentsRepository {
  constructor() {
    // constructor intentionally left blank; clients are resolved per-call
    // so that test overrides via setDatabaseClientOverride() work correctly.
  }

  /**
   * Call database function - either via Supabase RPC or raw Postgres
   *
   * Supabase: Uses rpc() method with named parameters
   * Aiven: Generates SQL with explicit halfvec casts for vector parameters
   *
   * @param {string} functionName - Function name in database
   * @param {Array} params - Positional parameters (for Aiven SQL generation)
   * @param {Object} rpcParams - Named parameters for Supabase RPC
   * @returns {Promise<Array>} Function result rows
   * @throws {Error} If database call fails
   *
   * @private
   */
  async callFunction(functionName, params = [], rpcParams = {}) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(functionName, rpcParams);
      if (error) throw error;
      return data || [];
    }

    // Aiven Postgres path — build SQL with explicit halfvec cast on any
    // array parameter (all vector search functions take the embedding as
    // the first positional argument and it must be cast to halfvec).
    // The pg driver serialises JS float arrays as {"0.04","0.08",...}
    // (JSON object syntax) which Postgres halfvec rejects. We must format
    // the array as a proper vector literal "[0.04,0.08,...]" and cast it.
    const queryParams = [];
    const placeholders = params.map((param) => {
      if (Array.isArray(param)) {
        // Format as a halfvec literal — square brackets, comma-separated
        queryParams.push(`[${param.join(',')}]`);
        return `$${queryParams.length}::extensions.halfvec`;
      }
      queryParams.push(param);
      return `$${queryParams.length}`;
    });

    const sql = `SELECT * FROM ${functionName}(${placeholders.join(',')})`;
    const { rows } = await client.query(sql, queryParams);
    return rows;
  }

  /**
   * Vector similarity search
   *
   * Finds documents most similar to the query embedding using cosine distance.
   *
   * @param {Array<number>} queryEmbedding - Query vector (1536 dims)
   * @param {number} matchCount - Number of results to return
   * @returns {Promise<Array>} Matching documents sorted by similarity (descending)
   *
   * @example
   * const results = await repo.matchDocuments(embedding, 5);
   * // [{id, content, similarity}, ...]
   */
  async matchDocuments(queryEmbedding, matchCount) {
    const data = await this.callFunction(func.match_documents, [queryEmbedding, matchCount], {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });
    return data || [];
  }

  async searchHybrid(
    queryEmbedding,
    keywordFilter,
    industryFilter,
    categoryFilter,
    sourceFilter,
    matchCount,
    vectorWeight,
    similarityThreshold,
  ) {
    const data = await this.callFunction(
      func.search_documents_hybrid_filtered,
      [
        queryEmbedding,
        keywordFilter,
        industryFilter,
        categoryFilter,
        sourceFilter,
        matchCount,
        vectorWeight,
        similarityThreshold,
      ],
      {
        query_embedding: queryEmbedding,
        keyword_filter: keywordFilter,
        industry_filter: industryFilter,
        category_filter: categoryFilter,
        source_filter: sourceFilter,
        match_count: matchCount,
        vector_weight: vectorWeight,
        similarity_threshold: similarityThreshold,
      },
    );
    return data || [];
  }

  async getStatistics() {
    const data = await this.callFunction(func.get_document_statistics);
    return data || [];
  }

  /**
   * Count documents grouped by a column or metadata expression.
   * @param {string} columnExpr - A safe column name ('industry', 'category', 'source')
   *   or a metadata expression (e.g., "metadata->>'r_strategy'").
   *   For Supabase, only simple column names are supported via RPC; expressions require raw SQL
   *   via the pg pool. For Aiven postgres, raw SQL is used directly.
   */
  async countBy(columnExpr) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    // Simple column names can use the structured columns directly
    const safeColumns = ['industry', 'category', 'source'];
    const isSimpleColumn = safeColumns.includes(columnExpr);

    if (dbType === 'supabase') {
      if (isSimpleColumn) {
        // Use Supabase select with group — no RPC needed for simple columns
        const { data, error } = await client
          .from('documents')
          .select(columnExpr)
          .neq(columnExpr, null);
        if (error) throw error;

        // Aggregate in JS since Supabase JS client doesn't support GROUP BY directly
        const counts = {};
        for (const row of data || []) {
          const val = row[columnExpr] || 'unknown';
          counts[val] = (counts[val] || 0) + 1;
        }
        return Object.entries(counts)
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count);
      } else {
        // For metadata expressions, use the pg pool directly (Supabase exposes it)
        const pool = getSupabasePgPool();
        const sql = `SELECT ${columnExpr} AS value, COUNT(*)::int AS count FROM documents WHERE ${columnExpr} IS NOT NULL GROUP BY value ORDER BY count DESC`;
        const { rows } = await pool.query(sql);
        return rows;
      }
    } else {
      // Aiven postgres — raw SQL always works
      const sql = `SELECT ${columnExpr} AS value, COUNT(*)::int AS count FROM documents WHERE ${columnExpr} IS NOT NULL GROUP BY value ORDER BY count DESC`;
      const { rows } = await client.query(sql);
      return rows;
    }
  }

  async countByCategory(category) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    // Special case: scalar return values often behave differently in pg vs rpc
    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(func.count_documents_by_category, { category });
      if (error) throw error;
      return data ?? 0;
    }

    const res = await client.query(`SELECT ${func.count_documents_by_category}($1) as count`, [
      category,
    ]);
    return res.rows[0]?.count ?? 0;
  }

  async searchByIndustry(
    queryEmbedding,
    industryFilter,
    matchCount = 10,
    similarityThreshold = 0.7,
  ) {
    const data = await this.callFunction(
      func.search_documents_by_industry,
      [queryEmbedding, industryFilter, matchCount, similarityThreshold],
      {
        query_embedding: queryEmbedding,
        industry_filter: industryFilter,
        match_count: matchCount,
        similarity_threshold: similarityThreshold,
      },
    );
    return data || [];
  }

  async searchByCategory(
    queryEmbedding,
    categoryFilter,
    matchCount = 10,
    similarityThreshold = 0.7,
  ) {
    const data = await this.callFunction(
      func.search_documents_by_category,
      [queryEmbedding, categoryFilter, matchCount, similarityThreshold],
      {
        query_embedding: queryEmbedding,
        category_filter: categoryFilter,
        match_count: matchCount,
        similarity_threshold: similarityThreshold,
      },
    );
    return data || [];
  }

  async truncate() {
    return this.callFunction(func.truncate_documents);
  }

  async findRecent(limit, filters = {}) {
    // 1. Map the arguments for both Postgres (array) and Supabase (object)
    const params = [
      limit,
      filters.industry || null,
      filters.category || null,
      filters.source || null,
    ];

    const rpcParams = {
      limit_count: limit,
      industry_filter: filters.industry || null,
      category_filter: filters.category || null,
      source_filter: filters.source || null,
    };

    // 2. Execute via your centralized helper
    const data = await this.callFunction(func.find_recent_documents, params, rpcParams);

    return data || [];
  }
}
