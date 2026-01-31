# Supabase Database

Three-step setup:

1. **Run migration 01_vector_infrastructure.sql**
   - Creates vector search infrastructure (documents table, pgvector extension, search functions)

2. **Run migration 02_user_assessments.sql**
   - Creates user authentication and assessment portfolio system

3. **Run embedding scripts**
   - `node backend/scripts/chunk.js` - Chunk the dataset
   - `node backend/scripts/embed_and_store.js` - Generate embeddings and store

All migrations are in the `migrations/` folder and must be run in numerical order.
