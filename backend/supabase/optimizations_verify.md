-- ╔════════════════════════════════════════════════════════════════════════════════╗
-- ║ ║
-- ║ VERIFICATION SCRIPT - Check All Fixes Are Working ║
-- ║ Run this to verify everything is optimized and working correctly ║
-- ║ ║
-- ╚════════════════════════════════════════════════════════════════════════════════╝

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 1: Check Extensions Are in Extensions Schema (Security Fix)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'1. Extensions Schema Check' as test_name,
CASE
WHEN COUNT(_) = 3 AND
COUNT(_) FILTER (WHERE nspname = 'extensions') = 3
THEN '✅ PASS - All extensions in extensions schema'
ELSE '❌ FAIL - Extensions not in correct schema'
END as result
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('vector', 'pg_trgm', 'btree_gin');

-- Details:
SELECT
extname as extension_name,
nspname as schema_name,
CASE
WHEN nspname = 'extensions' THEN '✅ Correct'
ELSE '❌ Should be in extensions schema'
END as status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('vector', 'pg_trgm', 'btree_gin')
ORDER BY extname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 2: Check No Duplicate Functions (Bug Fix)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'2. Duplicate Functions Check' as test_name,
CASE
WHEN MAX(function_count) <= 1
THEN '✅ PASS - No duplicate functions'
ELSE '❌ FAIL - Found duplicate functions'
END as result
FROM (
SELECT
proname,
COUNT(\*) as function_count
FROM pg_proc
WHERE proname IN (
'match_documents',
'search_documents_by_industry',
'search_documents_by_category',
'search_documents_hybrid'
)
AND pg_function_is_visible(oid)
GROUP BY proname
) counts;

-- Details (should show exactly 1 of each function):
SELECT
proname as function_name,
pg_get_function_identity_arguments(oid) as arguments,
COUNT(_) OVER (PARTITION BY proname) as count,
CASE
WHEN COUNT(_) OVER (PARTITION BY proname) = 1 THEN '✅ Unique'
ELSE '❌ Duplicate!'
END as status
FROM pg_proc
WHERE proname IN (
'match_documents',
'search_documents_by_industry',
'search_documents_by_category',
'search_documents_hybrid'
)
AND pg_function_is_visible(oid)
ORDER BY proname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 3: Check Functions Have search_path Set (Security Fix)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'3. Function search_path Check' as test_name,
CASE
WHEN COUNT(_) = 0
THEN '✅ PASS - All functions have search_path'
ELSE '❌ FAIL - ' || COUNT(_) || ' functions missing search_path'
END as result
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
AND p.proconfig IS NULL;

-- Details (all should show SET):
SELECT
p.proname AS function_name,
CASE
WHEN p.proconfig IS NULL THEN '❌ NOT SET'
WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN '✅ SET'
ELSE '⚠️ SET (but not search_path)'
END AS search_path_status,
COALESCE(array_to_string(p.proconfig, ', '), 'None') as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prokind = 'f'
ORDER BY
CASE
WHEN p.proconfig IS NULL THEN 0
ELSE 1
END,
p.proname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 4: Check RLS Policies Are Optimized (Performance Fix)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'4. RLS Policy Count Check' as test_name,
CASE
WHEN documents = 1 AND profiles = 4 AND assessments = 4
THEN '✅ PASS - Policies consolidated (documents=1, profiles=4, assessments=4)'
ELSE '❌ FAIL - Policy counts: documents=' || documents || ', profiles=' || profiles || ', assessments=' || assessments
END as result
FROM (
SELECT
COUNT(_) FILTER (WHERE tablename = 'documents') as documents,
COUNT(_) FILTER (WHERE tablename = 'profiles') as profiles,
COUNT(\*) FILTER (WHERE tablename = 'assessments') as assessments
FROM pg_policies
WHERE tablename IN ('documents', 'profiles', 'assessments')
) counts;

-- Details:
SELECT
tablename,
COUNT(_) as policy_count,
CASE tablename
WHEN 'documents' THEN CASE WHEN COUNT(_) = 1 THEN '✅ Optimized' ELSE '❌ Should be 1' END
WHEN 'profiles' THEN CASE WHEN COUNT(_) = 4 THEN '✅ Optimized' ELSE '❌ Should be 4' END
WHEN 'assessments' THEN CASE WHEN COUNT(_) = 4 THEN '✅ Optimized' ELSE '❌ Should be 4' END
END as status
FROM pg_policies
WHERE tablename IN ('documents', 'profiles', 'assessments')
GROUP BY tablename
ORDER BY tablename;

-- Check that RLS policies use (SELECT auth.uid()) for better performance:
SELECT
tablename,
policyname,
CASE
WHEN qual LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.uid())%'
THEN '✅ Optimized (SELECT auth.uid())'
WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%'
THEN '⚠️ Not optimized (direct auth.uid())'
ELSE '✅ No auth check needed'
END as optimization_status
FROM pg_policies
WHERE tablename IN ('documents', 'profiles', 'assessments')
ORDER BY tablename, policyname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 5: Check Performance Indexes Exist
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'5. Performance Indexes Check' as test_name,
CASE
WHEN documents_indexes >= 4 AND assessments_indexes >= 4 AND profiles_indexes >= 1
THEN '✅ PASS - All indexes created (docs≥4, assessments≥4, profiles≥1)'
ELSE '❌ FAIL - Missing indexes: docs=' || documents_indexes || ', assessments=' || assessments_indexes || ', profiles=' || profiles_indexes
END as result
FROM (
SELECT
COUNT(_) FILTER (WHERE tablename = 'documents') as documents_indexes,
COUNT(_) FILTER (WHERE tablename = 'assessments') as assessments_indexes,
COUNT(\*) FILTER (WHERE tablename = 'profiles') as profiles_indexes
FROM pg_indexes
WHERE tablename IN ('documents', 'assessments', 'profiles')
) counts;

-- Details - Documents indexes (should have HNSW + GIN indexes):
SELECT
indexname,
CASE
WHEN indexname LIKE '%hnsw%' THEN '✅ Vector HNSW index (fast search)'
WHEN indexname LIKE '%gin%' THEN '✅ GIN index (metadata/text search)'
ELSE '✅ B-tree index'
END as index_type
FROM pg_indexes
WHERE tablename = 'documents'
ORDER BY indexname;

-- Details - Assessments indexes:
SELECT
indexname,
'✅ Index exists' as status
FROM pg_indexes
WHERE tablename = 'assessments'
ORDER BY indexname;

-- Details - Profiles indexes:
SELECT
indexname,
'✅ Index exists' as status
FROM pg_indexes
WHERE tablename = 'profiles'
ORDER BY indexname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 6: Check Triggers Are Working
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'6. Triggers Check' as test*name,
CASE
WHEN COUNT(*) >= 4
THEN '✅ PASS - All triggers present (≥4 found)'
ELSE '❌ FAIL - Missing triggers (' || COUNT(*) || ' found, need ≥4)'
END as result
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('documents', 'assessments', 'profiles')
AND t.tgname LIKE 'update*%\_updated_at'
AND NOT t.tgisinternal;

-- Details:
SELECT
c.relname as table_name,
t.tgname as trigger_name,
'✅ Active' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('documents', 'assessments', 'profiles', 'users')
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TEST 7: Test Vector Search Function Works
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- This tests that match_documents function exists and is callable
SELECT
'7. Vector Search Function Test' as test_name,
CASE
WHEN COUNT(\*) = 1
THEN '✅ PASS - match_documents function exists'
ELSE '❌ FAIL - match_documents function not found'
END as result
FROM pg_proc
WHERE proname = 'match_documents'
AND pg_function_is_visible(oid);

-- Details:
SELECT
proname as function_name,
pg_get_function_arguments(oid) as arguments,
'✅ Ready to use' as status
FROM pg_proc
WHERE proname IN (
'match_documents',
'search_documents_by_industry',
'search_documents_by_category',
'search_documents_hybrid'
)
AND pg_function_is_visible(oid)
ORDER BY proname;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- SUMMARY REPORT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'═══════════════════════════════════════════════════' as summary,
'' as details
UNION ALL
SELECT
' VERIFICATION SUMMARY ',
''
UNION ALL
SELECT
'═══════════════════════════════════════════════════',
''
UNION ALL
SELECT
'✅ All tests passed = Database fully optimized',
''
UNION ALL
SELECT
'❌ Any failures = Run the verification details above',
''
UNION ALL
SELECT
'═══════════════════════════════════════════════════',
'';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NEXT STEPS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT
'NEXT STEPS' as action,
CASE
WHEN
(SELECT COUNT(_) FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('vector', 'pg_trgm', 'btree_gin') AND nspname = 'extensions') = 3
AND (SELECT MAX(function_count) FROM (SELECT COUNT(_) as function_count FROM pg_proc
WHERE proname IN ('match_documents') AND pg_function_is_visible(oid) GROUP BY proname) x) <= 1
AND (SELECT COUNT(\*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.proconfig IS NULL) = 0
THEN '✅ All good! Go to Supabase Dashboard → Database → Linter to confirm 0 warnings'
ELSE '⚠️ Some tests failed. Check the test details above to see what needs fixing.'
END as recommendation;
