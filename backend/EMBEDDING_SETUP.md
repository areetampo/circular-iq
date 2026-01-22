# Embedding Pipeline Setup Guide

## Step 1: Update Supabase Schema

Execute the updated SQL schema in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/setup.sql`

Key changes:
- Added `metadata` JSONB column to store chunk metadata
- Added `created_at` timestamp column
- Updated `match_documents` function to return metadata

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your credentials:

```
OPENAI_API_KEY=sk-your-openai-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Run the Embedding Pipeline

```bash
cd backend
node scripts/embed_and_store.js
```

### What the script does:

1. Reads `dataset/chunks.json` (1299 chunks available)
2. Generates embeddings using OpenAI text-embedding-3-small
3. Processes in batches of 50 chunks
4. Stores embeddings + metadata in Supabase
5. Shows progress: batch X/Y with percentage
6. Handles errors and rate limits gracefully

### Expected output:

```
=== Starting Embedding & Storage Pipeline ===

Reading chunks from: dataset/chunks.json
Loaded 1299 chunks

Processing in batches of 50
Total batches: 26

--- Batch 1/26 ---
Processing chunks 1 to 50
Generating embeddings with OpenAI...
Storing embeddings in Supabase...
✓ Successfully stored 50 chunks
  Database IDs: 1 to 50
Progress: 50/1299 (3.8%)
...
```

### Verification:

After completion, verify in Supabase:

```sql
-- Check total documents
SELECT COUNT(*) FROM documents;

-- Check metadata is stored
SELECT id, metadata->>'category' as category, metadata->>'source_id' as source_id
FROM documents
LIMIT 10;

-- Test similarity search
SELECT * FROM match_documents(
  (SELECT embedding FROM documents LIMIT 1),
  5
);
```

## Troubleshooting

### Rate limits
If you hit OpenAI rate limits, the script will automatically wait 60 seconds and retry.

### Missing chunks.json
Run `node scripts/chunk.js` first to generate the chunks file.

### Supabase errors
Ensure your schema is up to date and the `documents` table has the `metadata` column.
