-- ============================================================
-- FILE: diagnostics/project_sanity_check.sql
-- PURPOSE: Quick high-level inventory of schemas, row counts, and authentication state
-- ============================================================


-- ------------------------------------------------------------
-- [1] Application tables inventory
--
-- Lists all user-defined tables inside the core application schemas
-- ('public' and 'app'). Useful for verifying migrations successfully
-- created the expected database layout and tracking active namespaces.
-- ------------------------------------------------------------

SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public', 'app')
ORDER BY schemaname, tablename;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Live row counts across core application tables
--
-- Performs an exact count across your core platform tables to get
-- an immediate pulse check on application data density.
-- NOTE: Running direct COUNT(*) queries triggers sequential scans;
-- use primarily during development, debugging, or low-traffic audits.
-- ------------------------------------------------------------

SELECT 'profiles' AS tbl, COUNT(*) FROM profiles
UNION ALL SELECT 'user_assessments', COUNT(*) FROM user_assessments
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'ce_cases', COUNT(*) FROM ce_cases
UNION ALL SELECT 'anonymous_usage', COUNT(*) FROM anonymous_usage
UNION ALL SELECT 'scoring_results_log', COUNT(*) FROM scoring_results_log
UNION ALL SELECT 'uptime_checks', COUNT(*) FROM uptime_checks
UNION ALL SELECT 'app.settings', COUNT(*) FROM app.settings;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Authenticated users validation
--
-- Directly inspects the Supabase internal identity schema to check
-- which accounts physically exist. Essential for validating user
-- provisioning pipelines, metadata imports, and auth sync issues.
-- ------------------------------------------------------------

SELECT id, email FROM auth.users;

-- output example:
-- [
--
-- ]
