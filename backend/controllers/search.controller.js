import { documentsRepository } from '#database/index.js';
import { VECTOR_SEARCH_VECTOR_WEIGHT } from '#config/embedding.js';

export function searchDocuments(openai) {
  return async (req, res) => {
    try {
      const { query, filters = {} } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'query is required and must be a non-empty string' });
      }

      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.trim(),
      });
      const queryEmbedding = embeddingRes.data[0].embedding;

      const results = await documentsRepository.searchHybrid(
        queryEmbedding,
        query.trim(),
        filters.industry || null,
        filters.category || null,
        filters.source || null,
        20,
        VECTOR_SEARCH_VECTOR_WEIGHT,
        0.0,
      );

      // Return only safe, non-bloated fields
      const formatted = (results || []).map((r) => ({
        id: r.id,
        content: r.content ? String(r.content).substring(0, 500) : '',
        industry: r.industry || null,
        category: r.category || null,
        source: r.source || null,
        similarity: r.similarity ?? r.combined_score ?? 0,
        metadata: {
          source_id: r.metadata?.source_id,
          chunk_type: r.metadata?.chunk_type,
          r_strategy: r.metadata?.r_strategy,
          primary_material: r.metadata?.primary_material,
          word_count: r.metadata?.word_count,
        },
      }));

      res.json({ results: formatted, count: formatted.length });
    } catch (err) {
      console.error('[search] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  };
}
