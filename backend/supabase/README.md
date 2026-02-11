# Supabase Database Configuration

**Location**: `backend/supabase/`

This directory contains all database migrations and setup for the Circular Economy Business Auditor.
It follows a two-phase migration strategy with comprehensive documentation in each migration file.

---

## Quick Start - Deployment Checklist

### Phase 1: Vector Infrastructure (Required First)

```bash
# 1. Ensure pgvector is enabled in Supabase dashboard
#    Dashboard → Database → Extensions → Search "vector" → Enable

# 2. Execute migration in Supabase SQL Editor
#    Copy contents of: migrations/01_vector_infrastructure.sql
#    Paste in dashboard → Run

# 3. Verify it worked
#    SELECT COUNT(*) as total_docs FROM documents;
```

**What this gives you:**

- ✅ Documents table with vector embeddings
- ✅ Semantic search functions (match_documents, search_by_industry, etc.)
- ✅ Performance indexes (IVFFlat on vectors, TRGM on text)
- ✅ Analytics functions

---

### Phase 2: User Assessments & Authentication (Run After Phase 1)

```bash
# 1. Execute migration in Supabase SQL Editor
#    Copy contents of: migrations/02_user_assessments.sql
#    Paste in dashboard → Run

# 2. Verify it worked
#    SELECT * FROM pg_policies WHERE tablename = 'assessments';
#    (Should show 4 policies: SELECT, INSERT, UPDATE, DELETE)
```

**What this gives you:**

- ✅ Assessments table with user ownership
- ✅ Row Level Security (RLS) - users see only their own data
- ✅ Foreign key to auth.users (Supabase managed)
- ✅ Portfolio analytics functions

---

### Phase 3: Populate Embeddings (After Phase 1)

After Phase 1 is complete, populate the documents table with embeddings:

API Endpoints (server)

- GET /api/analytics/featured-solutions?q=...&industry=...&limit=3 — Performs a hybrid semantic + keyword search and returns top problem→solution examples
- POST /api/analytics/embeddings/reindex — Triggers the backend embedding pipeline (admin only; requires API key)
- GET /api/analytics/documents/stats — Returns document statistics from the database

These endpoints rely on the `search_documents_hybrid` RPC and the embedding pipeline described below.

```bash
# From backend/ directory
cd backend

# Step 1: Configure environment variables in .env
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# OPENAI_API_KEY=your-openai-key

# Step 2: Chunk the dataset
node scripts/chunk.js
# Output: backend/dataset/chunks.json

# Step 3: Generate embeddings and store in Supabase
node scripts/embed_and_store.js
# Inserts thousands of documents with vectors into documents table

# Step 4: Verify
# SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;
```

---

## Migration Files Reference

### `migrations/01_vector_infrastructure.sql` (327 lines)

**Purpose**: Set up vector search infrastructure for semantic document retrieval

**Provides:**

- pgvector extension (semantic search on 1536-dim OpenAI embeddings)
- documents table with metadata and vector columns
- Search functions: `match_documents()`, `search_by_industry()`, `search_hybrid()`, `search_by_category()`
- Analytics: `get_document_statistics()`, `count_documents_by_category()`
- Performance indexes: IVFFlat, TRGM, GIN, BRIN
- RLS: Public read-only access, service role write access

**Dependencies:** None (initial setup)

**Read this file for:**

- Prerequisites (pgvector enabled, OpenAI key, service role key)
- Step-by-step verification queries to run after migration
- Detailed instructions for running embedding pipeline
- Field documentation and table schema

---

### `migrations/02_user_assessments.sql` (272 lines)

**Purpose**: User authentication system with secure data isolation via Row Level Security

**Provides:**

- assessments table (stores user evaluation results)
- User ownership: `user_id` foreign key to `auth.users(id)`
- Row Level Security: Users can ONLY see/edit their own assessments
- 4 RLS policies: SELECT, INSERT, UPDATE, DELETE (all enforce `user_id = auth.uid()`)
- Analytics: `get_assessment_statistics()`, `get_market_data()`
- Performance indexes on user_id, industry, score, created_at
- Optional guest mode (commented out, ready to enable)

**Dependencies:** 01_vector_infrastructure.sql must run first

**Read this file for:**

- How auth.users relationship works
- Deep dive: How RLS protects data privacy
- Detailed RLS policy explanations with SQL examples
- Verification queries to confirm policies are active
- Understanding user_id FK with ON DELETE CASCADE

---

## Understanding the Architecture

### Two-Phase Migration Strategy

```
Phase 1: Infrastructure
├── pgvector extension
├── documents table (data + embeddings)
└── Vector search functions
    ↓
    (Run embedding pipeline here)
    ↓
Phase 2: User Authentication
├── assessments table
├── auth.users integration
├── Row Level Security policies
└── Assessment analytics functions
```

### Data Security via RLS

**The Problem:**

- Frontend might have bugs
- Backend might be compromised
- Developers might make mistakes
- We need privacy at the database level

**The Solution: Row Level Security (RLS)**

RLS is a Postgres feature that enforces data access at the database layer:

```sql
-- Example RLS Policy
CREATE POLICY "users can see their own assessments"
ON assessments FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

**When user 123 runs: `SELECT * FROM assessments;`**

1. Database sees the request is from user 123
2. auth.uid() returns 123
3. Policy checks: WHERE user_id = 123
4. Only rows with user_id = 123 are returned
5. User literally cannot query other users' data

**Why this matters:**

- ✅ Cannot be bypassed by frontend code
- ✅ Cannot be bypassed by SQL mistakes
- ✅ Protects even if API keys are exposed
- ✅ Enforced at the database level (hardest to compromise)

---

## Adding New Migrations

If you need to add Phase 3, 4, etc.:

### Naming Convention

```
migrations/
├── 01_vector_infrastructure.sql
├── 02_user_assessments.sql
├── 03_your_feature_name.sql       ← Next migration
├── 04_another_feature.sql
└── ...
```

### Template for New Migration

```sql
/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  MIGRATION: 03_your_feature_name.sql                                      ║
 * ║  PHASE 3 - Brief Description                                              ║
 * ║  STATUS: Optional / Required                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS MIGRATION DOES
 * ────────────────────────
 * [Detailed explanation of what this phase adds]
 *
 * WHEN TO RUN
 * ──────────
 * - After 02_user_assessments.sql
 * - Safe to re-run: [explain idempotency]
 *
 * VERIFICATION QUERIES
 * ───────────────────
 * [Verification queries to run after]
 *
 * DEPENDENCIES
 * ────────────
 * [What must run before this migration]
 */

-- Migration SQL here
```

### Deployment Process

1. **Create migration file**: `migrations/03_your_feature_name.sql`
2. **Add comprehensive header** with context (see template above)
3. **Make it idempotent** (safe to re-run):
   - Use `CREATE TABLE IF NOT EXISTS`
   - Use `DROP IF EXISTS` before recreating functions/policies
   - Use `DROP POLICY IF EXISTS` before recreating policies
4. **Test locally** first
5. **Run in Supabase dashboard** (SQL Editor)
6. **Verify** with the queries you documented in the migration
7. **Update deployment scripts** if needed

---

## Environment Setup

Required in `backend/.env`:

```env
# Supabase API Keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI for embeddings
OPENAI_API_KEY=your-openai-key

# Optional: Port override
PORT=3001
NODE_ENV=development
```

Where to find these:

- **SUPABASE_URL**: Supabase dashboard → Project Settings → API
- **SUPABASE_ANON_KEY**: Supabase dashboard → Project Settings → API
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase dashboard → Project Settings → API (⚠️ Keep secret!)
- **OPENAI_API_KEY**: OpenAI dashboard → API Keys

---

## Troubleshooting

### Migration fails with "extension not found"

- pgvector not enabled in Supabase
- ✓ Fix: Dashboard → Extensions → Search "vector" → Enable

### RLS policies not working

- Table exists but policies not created
- ✓ Run: `SELECT * FROM pg_policies WHERE tablename = 'assessments';`
- ✓ Verify: Should show 4 policies

### Embeddings not stored

- Phase 1 migration might have failed
- ✓ Check: `SELECT COUNT(*) FROM documents;`
- ✓ If 0: Re-run embedding scripts

### Foreign key constraint error

- Trying to insert assessment with user_id that doesn't exist
- ✓ Check: User must exist in auth.users first
- ✓ Frontend must authenticate user before saving assessment

---

## File Structure

```
backend/supabase/
├── README.md                              ← You are here
└── migrations/
    ├── 01_vector_infrastructure.sql       (327 lines, vector search setup)
    └── 02_user_assessments.sql            (272 lines, user auth + RLS)
```

---

## Summary

| Phase | Migration File                 | Purpose                    | Required | Can Re-run |
| ----- | ------------------------------ | -------------------------- | -------- | ---------- |
| 1     | `01_vector_infrastructure.sql` | Vector search & embeddings | ✅       | ✅         |
| 2     | `02_user_assessments.sql`      | User auth & RLS            | ✅       | ✅         |
| 3+    | Create as needed               | Your features              | ⚠️       | ✅         |

Each migration file contains detailed documentation. Open them to understand:

- Prerequisites and verification queries
- RLS policies and how they work
- Performance indexes and why they matter
- Next steps and dependencies

**Start with Phase 1 → Phase 2 → Embedding Pipeline → Deploy Frontend**
