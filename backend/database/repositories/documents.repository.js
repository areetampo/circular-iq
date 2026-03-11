import { getDatabaseClient, getDatabaseType } from '#database/client.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';

export class DocumentsRepository {
  constructor() {
    this.client = getDatabaseClient();
    this.dbType = getDatabaseType();
  }

  async matchDocuments(queryEmbedding, matchCount) {
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
        BACKEND_CONFIG.db.functions.match_documents,
        {
          query_embedding: queryEmbedding,
          match_count: matchCount,
        },
      );
      if (error) throw error;
      return data || [];
    }

    // postgres
    const pool = this.client;
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
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
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

    const pool = this.client;
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
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
        BACKEND_CONFIG.db.functions.get_document_statistics,
      );
      if (error) throw error;
      return data || [];
    }
    const { rows } = await this.client.query(`SELECT * FROM ${BACKEND_CONFIG.db.functions.get_document_statistics}()`);
    return rows;
  }

  async countByCategory(category) {
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
        BACKEND_CONFIG.db.functions.count_documents_by_category,
        { category },
      );
      if (error) throw error;
      return data?.[0]?.count || 0;
    }
    const { rows } = await this.client.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.count_documents_by_category}($1)`,
      [category],
    );
    return rows[0]?.count || 0;
  }

  async searchByIndustry(queryEmbedding, industryFilter, matchCount = 10, similarityThreshold = 0.7) {
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
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
    const pool = this.client;
    const { rows } = await pool.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.search_documents_by_industry}($1,$2,$3,$4)`,
      [queryEmbedding, industryFilter, matchCount, similarityThreshold],
    );
    return rows;
  }

  async searchByCategory(queryEmbedding, categoryFilter, matchCount = 10, similarityThreshold = 0.7) {
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
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
    const pool = this.client;
    const { rows } = await pool.query(
      `SELECT * FROM ${BACKEND_CONFIG.db.functions.search_documents_by_category}($1,$2,$3,$4)`,
      [queryEmbedding, categoryFilter, matchCount, similarityThreshold],
    );
    return rows;
  }

  async truncate() {
    if (this.dbType === 'supabase') {
      const { data, error } = await this.client.rpc(
        BACKEND_CONFIG.db.functions.truncate_documents,
      );
      if (error) throw error;
      return data;
    }
    return this.client.query(`SELECT ${BACKEND_CONFIG.db.functions.truncate_documents}()`);
  }
}
