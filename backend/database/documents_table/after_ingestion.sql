UPDATE documents
SET source = metadata->>'source'
WHERE metadata->>'source' IS NOT NULL
  AND source IS NULL;
