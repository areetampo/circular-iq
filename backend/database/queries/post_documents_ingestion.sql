-- MANUAL: Run once after bulk document ingestion. Not an automated migration.
-- Backfills `documents.source` from JSON metadata when missing.

UPDATE documents
SET source = metadata->>'source'
WHERE metadata->>'source' IS NOT NULL
  AND source IS NULL;
