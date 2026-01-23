# Supabase Schema Setup Guide

This directory contains SQL files for initializing and extending your Supabase database.

## Directory Structure

```
supabase/
├── setup.sql                    # Phase 1 - Initial schema (run ONCE)
├── migrations/
│   └── 001_assessments_system.sql   # Phase 2 - Assessment tracking (run ONCE)
└── README.md                    # This file
```

## Setup Instructions

### Step 1: Phase 1 - Initial Setup (Required)

This sets up the foundational infrastructure for semantic search and document storage.

**When to run**: Once, during initial deployment

**Instructions**:

1. Open Supabase dashboard → Your Project → SQL Editor
2. Click "New Query" → Paste contents of `setup.sql`
3. Click "Run"

**What it creates**:

- pgvector extension (for embeddings)
- `documents` table (for chunked data + vectors)
- Search functions (match_documents, search_by_industry, search_hybrid)
- Analytical functions (get_document_statistics, count_documents_by_category)
- RLS policies for document access

**After running**:

- Run chunking pipeline: `backend/scripts/chunk.js`
- Run embedding pipeline: `backend/scripts/embed_and_store.js`
- Data is now searchable

---

### Step 2: Phase 2 - Assessment System (Optional - for Portfolio Tracking)

This adds assessment history, comparison, and market analysis features.

**When to run**: After Phase 1 is complete, when deploying Phase 2 features

**Instructions**:

1. Open Supabase dashboard → Your Project → SQL Editor
2. Click "New Query" → Paste contents of `migrations/001_assessments_system.sql`
3. Click "Run"

**What it creates**:

- `assessments` table (stores saved evaluation results)
- Indexes for fast filtering (user_id, industry, score, created_at)
- RLS policies (users see only their assessments)
- Analytics functions:
  - `get_assessment_statistics()` - Overall market stats
  - `get_market_data()` - Grouped by industry/scale/strategy

**After running**:

- Assessment save/history features are now available
- Backend endpoints for `/assessments` and `/analytics/market` work
- Frontend views (HistoryView, ComparisonView, MarketAnalysisView) are functional

---

## Important Notes

### Safe to Re-run?

- ✅ **setup.sql**: Safe to re-run (all statements use `IF NOT EXISTS` or `DROP IF EXISTS`)
- ✅ **migrations/001_assessments_system.sql**: Safe to re-run (drops functions before recreating)

### Data Safety

- **Running setup.sql again**: Will NOT delete documents or assessments (uses IF NOT EXISTS)
- **Running migrations again**: Will NOT delete assessments (only recreates functions)
- **Chunking pipeline**: Can be re-run anytime without losing data
- **Embedding pipeline**: Can be re-run to update embeddings

### Verification Queries

After each migration, verify success:

```sql
-- Phase 1 verification
SELECT COUNT(*) as total_docs FROM documents;
SELECT * FROM get_document_statistics();
SELECT * FROM count_documents_by_category();

-- Phase 2 verification
SELECT COUNT(*) as total_assessments FROM assessments;
SELECT * FROM get_assessment_statistics();
SELECT * FROM get_market_data();
```

---

## Future Migrations

For additional features in Phase 3+, create new migration files:

```
migrations/
├── 001_assessments_system.sql      # Phase 2 ✅
├── 002_user_authentication.sql     # Phase 3 (example)
├── 003_advanced_analytics.sql      # Phase 4 (example)
└── ...
```

Run each migration sequentially in order.

---

## Troubleshooting

**Q: I ran setup.sql but migrations won't run**

- A: Make sure setup.sql completed successfully. Check table exists: `SELECT * FROM documents LIMIT 1;`

**Q: I want to reset everything and start over**

- A: You'll need to manually drop tables in Supabase SQL Editor:
  ```sql
  DROP TABLE IF EXISTS assessments CASCADE;
  DROP TABLE IF EXISTS documents CASCADE;
  ```
  Then re-run setup.sql and migrations in order.

**Q: Which Supabase features do I need?**

- A: Vector extension (pgvector) is required. Ensure it's enabled in your project.

---

## Support

For questions or issues:

1. Check Supabase docs: https://supabase.com/docs
2. Review error messages in SQL Editor
3. Verify all dependencies exist before running migrations
