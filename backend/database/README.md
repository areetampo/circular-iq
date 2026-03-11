# Supabase Configuration

## SQL Migration Files

The following SQL files set up the Supabase database infrastructure:

1. **01_vector_infrastructure.sql** - Vector search setup with pgvector extension, documents table, and HNSW indexes
2. **02_user_assessments.sql** - Assessment results and history tracking
3. **03_user_profiles.sql** - User data and preferences
4. **04_anonymous_usage.sql** - Anonymous usage tracking and analytics

## Running Migrations

For a new Supabase project:

1. Open SQL Editor in Supabase Dashboard
2. Create a new query
3. Paste each migration file in order (01, 02, 03, 04)
4. Execute each query

For existing deployments, apply migrations in sequence to ensure proper initialization.

## Key Features

- **Vector Search:** pgvector extension for semantic embeddings (text-embedding-3-small, 1536 dimensions)
- **Optimized Indexes:** HNSW for vector similarity, composite indexes for metadata
- **Row Level Security:** RLS policies for authenticated access control
- **Audit Trails:** Track assessments and modifications with timestamps

## Connection Methods

- **Service Role** (API backend): Use for embedding uploads and admin operations
- **Authenticated** (logged-in users): Use client-side for user-specific data
- **Anonymous** (public access): Limited for usage tracking (RLS protected)

For configuration details, see backend/.env.backend and frontend environment variables.
