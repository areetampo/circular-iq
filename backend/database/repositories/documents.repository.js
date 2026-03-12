import { getDatabaseClient, getDatabaseType } from '#database/client.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

export class DocumentsRepository {
  constructor() {
    // constructor intentionally left blank; clients are resolved per-call
    // so that test overrides via setDatabaseClientOverride() work correctly.
  }

  async matchDocuments(queryEmbedding, matchCount) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(BACKEND_CONFIG.db.functions.match_documents, {
        query_embedding: queryEmbedding,
        match_count: matchCount,
      });
      if (error) throw error;
      return data || [];
    }

    // postgres
    const pool = client;
    const sql = `SELECT * FROM ${BACKEND_CONFIG.db.functions.match_documents}($1,$2)`;
    const { rows } = await pool.query(sql, [queryEmbedding, matchCount]);
    return rows;
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
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(
        BACKEND_CONFIG.db.functions.search_documents_hybrid_filtered,
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
      if (error) throw error;
      return data || [];
    }

    const pool = client;
    // note: parameter order matches Postgres function signature
    const { rows } = await pool.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.search_documents_hybrid_filtered}($1,$2,$3,$4,$5,$6,$7,$8)`,
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
    );
    return rows;
  }

  async getStatistics() {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(BACKEND_CONFIG.db.functions.get_document_statistics);
      if (error) throw error;
      return data || [];
    }
    const { rows } = await client.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.get_document_statistics}()`,
    );
    return rows;
  }

  async countByCategory(category) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(
        BACKEND_CONFIG.db.functions.count_documents_by_category,
        { category },
      );
      if (error) throw error;
      // Supabase returns a scalar number for this RPC
      return data ?? 0;
    }

    // postgres: alias result column to 'count' for consistency
    const res = await client.query(
      `SELECT ${BACKEND_CONFIG.db.functions.count_documents_by_category}($1) as count`,
      [category],
    );
    return res.rows[0]?.count ?? 0;
  }

  async searchByIndustry(
    queryEmbedding,
    industryFilter,
    matchCount = 10,
    similarityThreshold = 0.7,
  ) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(
        BACKEND_CONFIG.db.functions.search_documents_by_industry,
        {
          query_embedding: queryEmbedding,
          industry_filter: industryFilter,
          match_count: matchCount,
          similarity_threshold: similarityThreshold,
        },
      );
      if (error) throw error;
      return data || [];
    }
    const pool = client;
    const { rows } = await pool.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.search_documents_by_industry}($1,$2,$3,$4)`,
      [queryEmbedding, industryFilter, matchCount, similarityThreshold],
    );
    return rows;
  }

  async searchByCategory(
    queryEmbedding,
    categoryFilter,
    matchCount = 10,
    similarityThreshold = 0.7,
  ) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(
        BACKEND_CONFIG.db.functions.search_documents_by_category,
        {
          query_embedding: queryEmbedding,
          category_filter: categoryFilter,
          match_count: matchCount,
          similarity_threshold: similarityThreshold,
        },
      );
      if (error) throw error;
      return data || [];
    }
    const pool = client;
    const { rows } = await pool.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.search_documents_by_category}($1,$2,$3,$4)`,
      [queryEmbedding, categoryFilter, matchCount, similarityThreshold],
    );
    return rows;
  }

  async truncate() {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      const { data, error } = await client.rpc(BACKEND_CONFIG.db.functions.truncate_documents);
      if (error) throw error;
      return data;
    }
    return client.query(`SELECT ${BACKEND_CONFIG.db.functions.truncate_documents}()`);
  }

  async findRecent(limit, filters = {}) {
    const client = getDatabaseClient();
    const dbType = getDatabaseType();

    if (dbType === 'supabase') {
      let query = client
        .from('documents')
        .select('id, content, metadata, industry, category, source')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    // PostgreSQL
    let sql = 'SELECT id, content, metadata, industry, category, source FROM documents';
    const params = [];
    let whereClauses = [];
    if (filters.industry) {
      whereClauses.push(`industry = $${params.length + 1}`);
      params.push(filters.industry);
    }
    if (filters.category) {
      whereClauses.push(`category = $${params.length + 1}`);
      params.push(filters.category);
    }
    if (filters.source) {
      whereClauses.push(`source = $${params.length + 1}`);
      params.push(filters.source);
    }
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const { rows } = await client.query(sql, params);
    return rows;
  }
}
