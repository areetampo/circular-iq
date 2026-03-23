# Database Schema and Setup

Updated for the current refactor and Supabase/Aiven flexibility.

PostgreSQL database hosted on Supabase with pgvector extension for semantic search.

## Overview

The database stores:

1. **documents** - Vector-embedded circular economy case studies and solutions (50,000+)
2. **user_assessments** - User assessment results and scoring history
3. **user_profiles** - Anonymous user tracking and preferences
4. **anonymous_usage** - Free tier usage analytics

## Schema

### documents Table

Primary vector-searchable document store with both structured and flexible metadata:

```sql
CREATE TABLE documents (
  id                TEXT PRIMARY KEY,              -- chunk_id (e.g., 'c2c_00001')
  content           TEXT NOT NULL,                 -- Full document content
  embedding         extensions.vector(1536),       -- OpenAI embedding vector
  industry          TEXT,                          -- Indexed filter column
  category          TEXT,                          -- Indexed filter column
  source            TEXT,                          -- Dataset source identifier
  chunk_id          TEXT,                          -- Generated from metadata
  field_name        TEXT,                          -- Which field is chunked
  chunk_group       TEXT ARRAY,                    -- Related chunks for expansion
  metadata          JSONB,                         -- Flexible fields (scale, r_strategy, etc.)
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Vector similarity search
CREATE INDEX idx_documents_embedding ON documents
  USING hnsw(embedding vector_cosine_ops);

-- Metadata filtering (top-level columns for performance)
CREATE INDEX idx_documents_industry ON documents(industry);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_source ON documents(source);

-- Composite filtering
CREATE INDEX idx_documents_industry_category ON documents(industry, category);

-- Chunk expansion for RAG retrieval
CREATE INDEX idx_documents_chunk_group ON documents USING GIN(chunk_group);

-- Timestamp filtering for recent documents
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- Full-text search on content
CREATE INDEX idx_documents_content_fts ON documents
  USING GIN(to_tsvector('english', content));
```

### user_assessments Table

Stores completed assessments and scoring results:

```sql
CREATE TABLE user_assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT,                          -- Anonymous or authenticated user
  assessment_data   JSONB,                         -- Questionnaire responses
  scores            JSONB,                         -- Computed scores by dimension
  evidence          JSONB,                         -- Supporting documents and scores
  status            TEXT,                          -- draft, submitted, completed
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);
```

### user_profiles Table

Anonymous or authenticated user tracking:

```sql
CREATE TABLE user_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT UNIQUE,                   -- Anonymous or Supabase auth ID
  session_count     INTEGER DEFAULT 0,
  last_activity     TIMESTAMP,
  preferences       JSONB,                         -- User settings and preferences
  created_at        TIMESTAMP DEFAULT NOW()
);
```

### anonymous_usage Table

Track free tier usage for rate limiting:

```sql
CREATE TABLE anonymous_usage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT,                          -- Anonymous user identifier
  assessment_count  INTEGER DEFAULT 1,
  last_assessment   TIMESTAMP DEFAULT NOW(),
  created_at        TIMESTAMP DEFAULT NOW()
);
```

## Running Migrations

### Initial Setup

1. Open Supabase Dashboard SQL Editor
2. Copy each migration file in order (01, 02, 03, 04)
3. Execute each SQL file sequentially

### Migration Files

Located in `backend/database/migrations/`:

- **01_vector_infrastructure.sql** - pgvector setup, documents table, indexes
- **02_user_assessments.sql** - Assessment CRUD tables
- **03_user_profiles.sql** - User tracking and preferences
- **04_anonymous_usage.sql** - Free tier usage analytics

## RPC Functions

### search_documents_hybrid()

Combines vector similarity with keyword matching:

```sql
CALL search_documents_hybrid(
  query_embedding := vector_input,      -- 1536-dim OpenAI embedding
  keyword_filter := 'plastic packaging', -- BM25 keyword search
  industry_filter := 'textiles',         -- Exact industry match (optional)
  category_filter := NULL,               -- Exact category match (optional)
  match_count := 10,                     -- Return top 10 results
  vector_weight := 0.7,                  -- 70% weight on vector similarity
  similarity_threshold := 0.0            -- Return all matches above score
)
RETURNS Table(id TEXT, content TEXT, similarity FLOAT8, rank INT);
```

**Returns**:

- Top-K documents by combined score
- Similarity score (0-1, higher is better)
- Rank position

### get_chunk_context()

Retrieves expanded context for a given chunk via chunk_group:

```sql
CALL get_chunk_context(
  chunk_id_input := 'c2c_00001',
  expand_limit := 5  -- Related chunks to include
)
RETURNS Table(id TEXT, content TEXT, field TEXT, group_id TEXT);
```

## Dual Backend Support

The pipeline can target either Supabase or Aiven for the `documents` table:

### Supabase (Default Recommended)

- Managed by Supabase
- REST API included
- Row-level security (RLS) built-in
- Real-time subscriptions available
- Easier row-level access control

### Aiven (External PostgreSQL)

- Self-managed PostgreSQL cluster
- Higher control and customization
- Better for high-volume vector operations
- Separate database client configuration

### Configuration

Set in `.env.backend`:

```env
# false (default) → Use Aiven PostgreSQL for documents table
# true → Use Supabase for documents table
USE_SUPABASE_DOCUMENTS_TABLE=false
```

Pipeline commands also accept flags:

```bash
npm run store               # Uses Aiven (default)
npm run store -- --archives # Uses Supabase
```

## Vector Embeddings

### Model Specifications

- **Model**: OpenAI text-embedding-3-small
- **Dimensions**: 1536
- **Cost**: ~$0.02 per 1M tokens
- **Speed**: ~50,000 tokens/second

### Index Configuration

The HNSW (Hierarchical Navigable Small World) index:

- **Algorithm**: Proximity graph for approximate nearest neighbor search
- **Distance Metric**: Cosine similarity (L2 also available)
- **m Parameter**: 16 (default, controls graph connectivity)
- **ef_construction**: 64 (default, controls index quality)
- **ef_search**: 10-40 (tunable during query, controls search accuracy)

### Performance Tuning

For large datasets (100,000+), consider:

```sql
-- Rebuild index with higher ef_construction for better quality
REINDEX INDEX idx_documents_embedding;

-- Adjust search parameters at query time
SET hnsw.ef_search = 100; -- Higher = slower but more accurate
```

## Backup and Recovery

### Automatic Backups

Supabase provides:

- Daily automated backups
- Point-in-time recovery (14 days default)
- Backup retention policies configurable in dashboard

### Manual Backups

```bash
# Export all documents
psql $SUPABASE_DATABASE_URL -c "COPY documents TO STDOUT;" > documents_backup.csv

# Import documents
psql $SUPABASE_DATABASE_URL -c "COPY documents FROM STDIN;" < documents_backup.csv
```

## Troubleshooting

### Vector Search Slow

- **Check indexes**: `SELECT * FROM pg_stat_user_indexes WHERE schemaname='public';`
- **Check table size**: `SELECT pg_size_pretty(pg_total_relation_size('documents'));`
- **Rebuild indexes**: `REINDEX TABLE CONCURRENTLY documents;`

### Connection Issues

- Verify Supabase credentials in `.env.backend`
- Check database limits (connection pooling may be needed)
- Monitor Supabase dashboard for table locks

### High Costs

- Monitor vector dimensions (1536 is default)
- Batch insert operations instead of single inserts
- Consider partial indexes for filtered searches

## See Also

- [Backend README](../README.md) - Architecture and API reference
- [Vector Infrastructure](./vector_infra.md) - Detailed vector search documentation
- [Pipeline Guide](../PIPELINE_RUNNING.md) - Data ingestion workflow
