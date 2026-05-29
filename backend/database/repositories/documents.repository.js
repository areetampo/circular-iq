/**
 * Documents Repository
 *
 * Database abstraction layer for document search and retrieval.
 * Supports both Supabase (RPC) and Aiven (raw Postgres) backends; which one
 * is active is controlled by the USE_SUPABASE_DOCUMENTS_TABLE env flag.
 *
 * All vector operations use halfvec (half-precision) for efficient similarity
 * search. Queries support optional filters by industry, category, and source.
 */

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { getDatabaseClient, getDatabaseType, getSupabasePgPool } from '#database/client.js';
import { logger } from '#utils/logger.js';

const func = BACKEND_CONFIG.scoring.db.functions;

/**
 * Encapsulates document search/statistics queries across Supabase and Aiven backends.
 */
export class DocumentsRepository {
  constructor() {
    // Intentionally empty; clients are resolved per-call so that test
    // overrides via setDatabaseClientOverride() work correctly.
  }

  /**
   * Executes a configured database function through Supabase RPC or raw Postgres SQL.
   * Array parameters are serialized as halfvec literals for Aiven because pg's default array
   * representation is not accepted by the vector extension.
   *
   * @param {string} functionName - Database function name from backend config.
   * @param {unknown[]} [pgParams=[]] - Positional parameters for the raw SQL path.
   * @param {Record<string, unknown>} [rpcParams={}] - Named parameters for the Supabase RPC path.
   * @returns {Promise<Array<Record<string, unknown>>>} Rows returned by the selected database function.
   * @throws {Error} If Supabase RPC or the pg query returns an error.
   * @private
   */
  async #callFunction(functionName, pgParams = [], rpcParams = {}) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(functionName, rpcParams);
      if (error) throw error;
      return data ?? [];
    }

    // Aiven path formats vector arrays as "[x,y,z,...]" string literals
    // and cast to extensions.halfvec. All other params pass through as-is.
    const queryParams = [];
    const placeholders = pgParams.map((param) => {
      if (Array.isArray(param)) {
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
   * Vector similarity search.
   * Finds documents most similar to the query embedding using cosine distance.
   *
   * @param {number[]} queryEmbedding - Query vector (1536 dims).
   * @param {number} matchCount - Maximum number of nearest documents to return.
   * @returns {Promise<Array<Record<string, unknown>>>} Matching documents sorted by descending similarity.
   * @throws {Error} If the database call fails.
   */
  async matchDocuments(queryEmbedding, matchCount) {
    const startTime = Date.now();

    try {
      const data = await this.#callFunction(func.match_documents, [queryEmbedding, matchCount], {
        query_embedding: queryEmbedding,
        match_count: matchCount,
      });

      logger.logOperation(
        'matchDocuments',
        'documents/repository',
        'success',
        Date.now() - startTime,
        {
          resultCount: data.length,
          matchCount,
        },
      );

      return data;
    } catch (error) {
      logger.logOperation(
        'matchDocuments',
        'documents/repository',
        'error',
        Date.now() - startTime,
        {
          error,
          matchCount,
        },
      );
      throw error;
    }
  }

  /**
   * Hybrid vector + full-text search with optional metadata filters.
   * Final score = (vector_score * vectorWeight) + (keyword_score * (1 - vectorWeight)).
   *
   * @param {number[]} queryEmbedding - Query vector (1536 dims).
   * @param {string|null} keywordFilter - Full-text keyword filter (null = no filter).
   * @param {string|null} industryFilter - Industry metadata filter.
   * @param {string|null} categoryFilter - Category metadata filter.
   * @param {string|null} sourceFilter - Source metadata filter.
   * @param {number} matchCount - Maximum rows to return.
   * @param {number} vectorWeight - Weight of vector score vs keyword score (0-1).
   * @param {number} similarityThreshold - Minimum cosine similarity (0-1).
   * @returns {Promise<Array<Record<string, unknown>>>} Matching documents with similarity, keyword score, and metadata fields.
   * @throws {Error} If the database call fails.
   */
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
    const startTime = Date.now();

    try {
      const data = await this.#callFunction(
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

      logger.logOperation('searchHybrid', 'db/hybrid-search', 'success', Date.now() - startTime, {
        resultCount: data?.length ?? 0,
        hasFilters: !!(industryFilter || categoryFilter || sourceFilter),
      });

      return data ?? [];
    } catch (error) {
      logger.logOperation('searchHybrid', 'db/hybrid-search', 'error', Date.now() - startTime, {
        error,
      });
      throw error;
    }
  }

  /**
   * Aggregate document corpus statistics (counts by category, source, etc.).
   *
   * @returns {Promise<Array<Record<string, unknown>>>} Corpus statistics rows from `get_document_statistics`.
   * @throws {Error} If the database call fails.
   */
  async getStatistics() {
    const startTime = Date.now();

    try {
      const data = await this.#callFunction(func.get_document_statistics);

      logger.logOperation('getStatistics', 'db/statistics', 'success', Date.now() - startTime, {
        resultCount: data?.length ?? 0,
      });

      return data ?? [];
    } catch (error) {
      logger.logOperation('getStatistics', 'db/statistics', 'error', Date.now() - startTime, {
        error,
      });
      throw error;
    }
  }

  /**
   * Count documents grouped by a column or metadata expression.
   *
   * Simple column names ('industry', 'category', 'source') use the Supabase JS
   * client select path and aggregate in JS, since the JS client has no GROUP BY.
   *
   * Metadata expressions (e.g. "metadata->>'r_strategy'") always go through the
   * pg pool (Supabase pool on the Supabase path, the Aiven pool on the Aiven path)
   * so that raw SQL GROUP BY works correctly.
   *
   * @param {string} columnExpr - Caller-vetted column name or metadata expression.
   * @returns {Promise<Array<{value: string, count: number}>>} Grouped counts, sorted descending.
   * @throws {Error} If the database call fails.
   */
  async countBy(columnExpr) {
    const startTime = Date.now();
    const safeColumns = new Set(['industry', 'category', 'source']);
    const isSimpleColumn = safeColumns.has(columnExpr);

    try {
      const dbType = getDatabaseType();

      if (dbType === 'supabase') {
        if (isSimpleColumn) {
          // Supabase JS client has no GROUP BY, so fetch all and aggregate in JS.
          const { data, error } = await getDatabaseClient()
            .from('documents')
            .select(columnExpr)
            .neq(columnExpr, null);

          if (error) throw error;

          const counts = {};
          for (const row of data ?? []) {
            const val = row[columnExpr] ?? 'unknown';
            counts[val] = (counts[val] ?? 0) + 1;
          }

          const result = Object.entries(counts)
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count);

          logger.logOperation('countBy', 'db/count-simple', 'success', Date.now() - startTime, {
            columnExpr,
            resultCount: result.length,
          });

          return result;
        }

        // Metadata expressions need raw SQL, so bypass the JS client and use the pg pool.
        const sql = `
          SELECT ${columnExpr} AS value, COUNT(*)::int AS count
          FROM documents
          WHERE ${columnExpr} IS NOT NULL
          GROUP BY value
          ORDER BY count DESC
        `;
        const { rows } = await getSupabasePgPool().query(sql);

        logger.logOperation('countBy', 'db/count-metadata', 'success', Date.now() - startTime, {
          columnExpr,
          resultCount: rows.length,
        });

        return rows;
      }

      // Aiven uses raw SQL for both simple columns and metadata expressions.
      const sql = `
        SELECT ${columnExpr} AS value, COUNT(*)::int AS count
        FROM documents
        WHERE ${columnExpr} IS NOT NULL
        GROUP BY value
        ORDER BY count DESC
      `;
      const { rows } = await getDatabaseClient().query(sql);

      logger.logOperation('countBy', 'db/count-aiven', 'success', Date.now() - startTime, {
        columnExpr,
        resultCount: rows.length,
      });

      return rows;
    } catch (error) {
      logger.logOperation('countBy', 'db/count', 'error', Date.now() - startTime, {
        columnExpr,
        error,
      });
      throw error;
    }
  }

  /**
   * Total document count for a single category value.
   *
   * @param {string} category - Category label to count.
   * @returns {Promise<number>} Document count (0 if none found).
   * @throws {Error} If the database call fails.
   */
  async countByCategory(category) {
    const startTime = Date.now();

    try {
      const dbType = getDatabaseType();

      if (dbType === 'supabase') {
        const { data, error } = await getDatabaseClient().rpc(func.count_documents_by_category, {
          category,
        });
        if (error) throw error;

        const result = data ?? 0;
        logger.logOperation(
          'countByCategory',
          'db/count-category',
          'success',
          Date.now() - startTime,
          {
            category,
            result,
          },
        );
        return result;
      }

      const { rows } = await getDatabaseClient().query(
        `SELECT ${func.count_documents_by_category}($1) AS count`,
        [category],
      );
      const result = rows[0]?.count ?? 0;

      logger.logOperation(
        'countByCategory',
        'db/count-category',
        'success',
        Date.now() - startTime,
        {
          category,
          result,
        },
      );

      return result;
    } catch (error) {
      logger.logOperation('countByCategory', 'db/count-category', 'error', Date.now() - startTime, {
        category,
        error,
      });
      throw error;
    }
  }

  /**
   * Vector similarity search restricted to a single industry.
   *
   * @param {number[]} queryEmbedding - Query vector (1536 dims).
   * @param {string} industryFilter - Industry value to match.
   * @param {number} [matchCount=10] - Maximum rows to return.
   * @param {number} [similarityThreshold=0.7] - Minimum cosine similarity (0-1).
   * @returns {Promise<Array<Record<string, unknown>>>} Matching documents sorted by similarity.
   * @throws {Error} If the database call fails.
   */
  async searchByIndustry(
    queryEmbedding,
    industryFilter,
    matchCount = 10,
    similarityThreshold = 0.7,
  ) {
    const startTime = Date.now();

    try {
      const data = await this.#callFunction(
        func.search_documents_by_industry,
        [queryEmbedding, industryFilter, matchCount, similarityThreshold],
        {
          query_embedding: queryEmbedding,
          industry_filter: industryFilter,
          match_count: matchCount,
          similarity_threshold: similarityThreshold,
        },
      );

      logger.logOperation(
        'searchByIndustry',
        'db/search-industry',
        'success',
        Date.now() - startTime,
        {
          industryFilter,
          resultCount: data?.length ?? 0,
        },
      );

      return data ?? [];
    } catch (error) {
      logger.logOperation(
        'searchByIndustry',
        'db/search-industry',
        'error',
        Date.now() - startTime,
        {
          industryFilter,
          error,
        },
      );
      throw error;
    }
  }

  /**
   * Vector similarity search restricted to a single category.
   *
   * @param {number[]} queryEmbedding - Query vector (1536 dims).
   * @param {string} categoryFilter - Category value to match.
   * @param {number} [matchCount=10] - Maximum rows to return.
   * @param {number} [similarityThreshold=0.7] - Minimum cosine similarity (0-1).
   * @returns {Promise<Array<Record<string, unknown>>>} Matching documents sorted by similarity.
   * @throws {Error} If the database call fails.
   */
  async searchByCategory(
    queryEmbedding,
    categoryFilter,
    matchCount = 10,
    similarityThreshold = 0.7,
  ) {
    const startTime = Date.now();

    try {
      const data = await this.#callFunction(
        func.search_documents_by_category,
        [queryEmbedding, categoryFilter, matchCount, similarityThreshold],
        {
          query_embedding: queryEmbedding,
          category_filter: categoryFilter,
          match_count: matchCount,
          similarity_threshold: similarityThreshold,
        },
      );

      logger.logOperation(
        'searchByCategory',
        'db/search-category',
        'success',
        Date.now() - startTime,
        {
          categoryFilter,
          resultCount: data?.length ?? 0,
        },
      );

      return data ?? [];
    } catch (error) {
      logger.logOperation(
        'searchByCategory',
        'db/search-category',
        'error',
        Date.now() - startTime,
        {
          categoryFilter,
          error,
        },
      );
      throw error;
    }
  }

  /**
   * Returns the most recently indexed documents, optionally filtered by metadata.
   *
   * @param {number} limit - Maximum rows to return.
   * @param {Record<string, string|null|undefined>} [filters={}] - Optional metadata filters applied by the recent-documents RPC.
   * @param {string} [filters.industry] - Industry filter.
   * @param {string} [filters.category] - Category filter.
   * @param {string} [filters.source] - Source filter.
   * @returns {Promise<Array<Record<string, unknown>>>} Recent document rows sorted by the database function.
   * @throws {Error} If the database call fails.
   */
  async findRecent(limit, filters = {}) {
    const startTime = Date.now();
    const { industry = null, category = null, source = null } = filters;

    try {
      const data = await this.#callFunction(
        func.find_recent_documents,
        [limit, industry, category, source],
        {
          limit_count: limit,
          industry_filter: industry,
          category_filter: category,
          source_filter: source,
        },
      );

      logger.logOperation('findRecent', 'db/find-recent', 'success', Date.now() - startTime, {
        limit,
        hasFilters: !!(industry || category || source),
        resultCount: data?.length ?? 0,
      });

      return data ?? [];
    } catch (error) {
      logger.logOperation('findRecent', 'db/find-recent', 'error', Date.now() - startTime, {
        limit,
        filters,
        error,
      });
      throw error;
    }
  }

  /**
   * Truncates the documents table. Admin and pipeline use only.
   *
   * @returns {Promise<Array<Record<string, unknown>>>} Database response rows from the truncate RPC, usually an empty array.
   * @throws {Error} If the database call fails.
   */
  async truncate() {
    const startTime = Date.now();

    try {
      const result = await this.#callFunction(func.truncate_documents);
      logger.logOperation('truncate', 'db/truncate', 'success', Date.now() - startTime);
      return result;
    } catch (error) {
      logger.logOperation('truncate', 'db/truncate', 'error', Date.now() - startTime, { error });
      throw error;
    }
  }
}
