-- MANUAL: Run once after bulk document ingestion. Not an automated migration.
-- Backfills `documents.source` from JSON metadata when missing.

UPDATE documents
SET source = metadata->>'source'
WHERE metadata->>'source' IS NOT NULL
  AND source IS NULL;

CREATE OR REPLACE FUNCTION safe_jsonb_cast(text) RETURNS jsonb AS $$
BEGIN
  RETURN $1::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

SELECT
  id,
  safe_jsonb_cast(metadata->'fields'->>'metadata_json')->'raw_extracted'->>'category' AS raw_category
FROM documents
WHERE metadata->'fields' ? 'metadata_json'
  AND safe_jsonb_cast(metadata->'fields'->>'metadata_json') ? 'raw_extracted'
LIMIT 5;

UPDATE documents
SET industry =
  COALESCE(
    safe_jsonb_cast(metadata->'fields'->>'metadata_json')->'raw_extracted'->>'category',
    industry
  )
WHERE industry = 'general'
  AND metadata->'fields' ? 'metadata_json'
  AND safe_jsonb_cast(metadata->'fields'->>'metadata_json') ? 'raw_extracted';

UPDATE documents
SET industry =
  COALESCE(
    SPLIT_PART(
      safe_jsonb_cast(metadata->'fields'->>'metadata_json')->'raw_extracted'->>'category',
      ' > ',
      1
    ),
    industry
  )
WHERE industry = 'general'
  AND metadata->'fields' ? 'metadata_json'
  AND safe_jsonb_cast(metadata->'fields'->>'metadata_json') ? 'raw_extracted';

SELECT
  COALESCE(industry, 'Unspecified') AS industry,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM documents
GROUP BY industry
ORDER BY count DESC;

UPDATE documents
SET industry = category
WHERE industry = 'general'
  AND category NOT IN ('General', 'Business case', 'Report', 'Policy case', 'Article / Report', 'Guide', 'Technical Framework', 'Case Study', 'Business Case', 'Policy');

DROP FUNCTION safe_jsonb_cast(text);
