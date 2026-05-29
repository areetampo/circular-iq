-- ============================================================
-- FILE: diagnostics/grant_and_verify_privileges.sql
-- PURPOSE: Set AND verify all function execution privileges
--          across the full migration stack (00–07).
--
-- STRUCTURE
-- ─────────
-- [SECTION A] SET PRIVILEGES  — idempotent REVOKE + GRANT for
--             every function, mirroring reset_permissions.sql
--             but scoped to function-level EXECUTE only.
--             Run this to fix function permission warnings.
--
-- [SECTION B] VERIFY PRIVILEGES — SELECT queries that report
--             the current EXECUTE state per role for every
--             tracked function. Run after Section A to confirm.
--
-- SAFE TO RUN REPEATEDLY — all statements are idempotent.
-- Does NOT touch table grants or schema grants (see reset_permissions.sql).
-- ============================================================


-- ============================================================
-- [SECTION A] SET PRIVILEGES
-- Sets correct EXECUTE privileges for all functions.
-- Mirrors the grants in migrations 00–07 and reset_permissions.sql.
-- ============================================================

-- ── app schema ───────────────────────────────────────────────────────────────
-- get_setting: service_role only (and authenticator for PostgREST introspection)
REVOKE EXECUTE ON FUNCTION app.get_setting(text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION app.get_setting(text) TO service_role;
GRANT  EXECUTE ON FUNCTION app.get_setting(text) TO authenticator;


-- ── 01_vector_infrastructure — service_role only ─────────────────────────────
REVOKE EXECUTE ON FUNCTION public.truncate_documents()                                        FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.truncate_documents()                                        TO service_role;

REVOKE EXECUTE ON FUNCTION public.backfill_document_metadata()                                FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.backfill_document_metadata()                                TO service_role;

REVOKE EXECUTE ON FUNCTION public.safe_jsonb_cast(text)                                       FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.safe_jsonb_cast(text)                                       TO service_role;


-- ── 01_vector_infrastructure — trigger only ───────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()                                  FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_updated_at_column()                                  TO service_role;


-- ── 01_vector_infrastructure — public (anon + authenticated + service_role) ───
GRANT EXECUTE ON FUNCTION public.match_documents(extensions.halfvec, integer)                                                      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_by_industry(extensions.halfvec, text, integer, float)                           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_by_category(extensions.halfvec, text, integer, float)                           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_hybrid(extensions.halfvec, text, text, text, text, integer, float, float)       TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_hybrid_filtered(extensions.halfvec, text, text, integer, float)                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_recent_documents(integer, text, text, text)                                                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_document_statistics()                                                                        TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_documents_by_category(text)                                                                TO anon, authenticated, service_role;


-- ── 02_user_assessments — public ──────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_assessment_statistics(uuid)                                                                  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_data()                                                                                TO anon, authenticated, service_role;


-- ── 02_user_assessments — trigger only ────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.update_assessments_updated_at_column()                      FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_assessments_updated_at_column()                      TO service_role;


-- ── 03_user_profiles — service_role only ──────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.get_user_profile(uuid)                                      FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_profile(uuid)                                      TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_username(uuid, text)                                 FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_username(uuid, text)                                 TO service_role;


-- ── 03_user_profiles — trigger only ──────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.force_internal_email()                                      FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.force_internal_email()                                      TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                           FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user()                                           TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_profiles_updated_at_column()                         FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_profiles_updated_at_column()                         TO service_role;

REVOKE EXECUTE ON FUNCTION public.increment_profile_assessment_count()                        FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_profile_assessment_count()                        TO service_role;

REVOKE EXECUTE ON FUNCTION public.decrement_profile_assessment_count()                        FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.decrement_profile_assessment_count()                        TO service_role;


-- ── 03_user_profiles — auth hook (supabase_auth_admin only) ──────────────────
-- supabase_noop_send_email must be callable by supabase_auth_admin (Auth hook),
-- NOT by service_role or any user-facing role.
REVOKE EXECUTE ON FUNCTION public.supabase_noop_send_email(jsonb)                             FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.supabase_noop_send_email(jsonb)                             TO supabase_auth_admin;


-- ── 04_anonymous_usage — service_role only ────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.check_and_increment_anonymous_usage(text, integer, text, text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_increment_anonymous_usage(text, integer, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_anonymous_usage()                               FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_anonymous_usage()                               TO service_role;


-- ── 05_results_logs — service_role only ──────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.cleanup_old_scoring_results_log()                           FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_scoring_results_log()                           TO service_role;


-- ── 06_ce_cases — public ──────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.search_ce_cases_keyword(text, integer)                                                           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_ce_cases_hybrid(extensions.halfvec, text, integer, float)                                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ce_cases_statistics()                                                                        TO anon, authenticated, service_role;


-- ── 06_ce_cases — service_role only ──────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.truncate_ce_cases()                                         FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.truncate_ce_cases()                                         TO service_role;


-- ── 06_ce_cases — trigger only ────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.update_ce_cases_updated_at()                                FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_ce_cases_updated_at()                                TO service_role;


-- ── 07_uptime_monitor — service_role only ────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.cleanup_old_uptime_checks(integer)                          FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_uptime_checks(integer)                          TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_uptime_check_count_estimate()                           FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_uptime_check_count_estimate()                           TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_daily_uptime_stats(integer)                             FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_daily_uptime_stats(integer)                             TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_global_response_trend(integer, boolean)                 FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_global_response_trend(integer, boolean)                 TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_endpoint_avg_latency(integer)                           FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_endpoint_avg_latency(integer)                           TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_heatmap_buckets(integer, integer, bigint, boolean)      FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_heatmap_buckets(integer, integer, bigint, boolean)      TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_endpoint_buckets(text, integer, integer, boolean)       FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_endpoint_buckets(text, integer, integer, boolean)       TO service_role;


-- ============================================================
-- [SECTION B] VERIFY PRIVILEGES
-- Reports current EXECUTE state for every tracked function.
-- Expected outcomes:
--   service_role only  → anon=false, authenticated=false, service_role=true
--   trigger only       → same as service_role only (triggers run as owner,
--                         but explicit service_role grant is kept for clarity)
--   public             → anon=true,  authenticated=true,  service_role=true
-- ============================================================

-- ------------------------------------------------------------
-- [B-1] public schema functions — checked against anon / authenticated / service_role
-- ------------------------------------------------------------

SELECT
  p.proname AS function_name,
  r.rolname AS role,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND r.rolname IN ('anon', 'authenticated', 'service_role')
  AND p.proname IN (
    -- service_role only (should be false/false/true)
    'backfill_document_metadata',
    'check_and_increment_anonymous_usage',
    'cleanup_old_anonymous_usage',
    'cleanup_old_uptime_checks',
    'cleanup_old_scoring_results_log',
    'get_daily_uptime_stats',
    'get_endpoint_avg_latency',
    'get_endpoint_buckets',
    'get_global_response_trend',
    'get_heatmap_buckets',
    'get_uptime_check_count_estimate',
    'get_user_profile',
    'update_username',
    'safe_jsonb_cast',
    'truncate_ce_cases',
    'truncate_documents',

    -- trigger only (should be false/false/true)
    'force_internal_email',
    'handle_new_user',
    'update_ce_cases_updated_at',
    'update_updated_at_column',
    'update_assessments_updated_at_column',
    'update_profiles_updated_at_column',
    'decrement_profile_assessment_count',
    'increment_profile_assessment_count',

    -- public (should be true/true/true)
    'match_documents',
    'search_documents_by_industry',
    'search_documents_by_category',
    'search_documents_hybrid',
    'search_documents_hybrid_filtered',
    'find_recent_documents',
    'get_document_statistics',
    'count_documents_by_category',
    'search_ce_cases_keyword',
    'search_ce_cases_hybrid',
    'get_ce_cases_statistics',
    'get_assessment_statistics',
    'get_market_data'
  )
ORDER BY
  CASE r.rolname
    WHEN 'anon' THEN 1
    WHEN 'authenticated' THEN 2
    WHEN 'service_role' THEN 3
  END,
  p.proname;


-- ------------------------------------------------------------
-- [B-2] app schema — get_setting
-- Expected: service_role=true, authenticator=true, anon=false, authenticated=false
-- NOTE: get_setting lives in the 'app' schema, not 'public'.
--       The query above does not cover it — checked separately here.
-- ------------------------------------------------------------

SELECT
  p.proname AS function_name,
  r.rolname AS role,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'app'
  AND p.proname = 'get_setting'
  AND r.rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
ORDER BY
  CASE r.rolname
    WHEN 'anon'          THEN 1
    WHEN 'authenticated' THEN 2
    WHEN 'service_role'  THEN 3
    WHEN 'authenticator' THEN 4
  END;


-- ------------------------------------------------------------
-- [B-3] supabase_noop_send_email — auth hook
-- Expected: anon=false, authenticated=false, service_role=false,
--           supabase_auth_admin=true
-- NOTE: This function must NOT be callable by service_role.
--       It is an Auth hook — supabase_auth_admin only.
-- ------------------------------------------------------------

SELECT
  p.proname AS function_name,
  r.rolname AS role,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN pg_roles r
WHERE n.nspname = 'public'
  AND p.proname = 'supabase_noop_send_email'
  AND r.rolname IN ('anon', 'authenticated', 'service_role', 'supabase_auth_admin')
ORDER BY
  CASE r.rolname
    WHEN 'anon'               THEN 1
    WHEN 'authenticated'      THEN 2
    WHEN 'service_role'       THEN 3
    WHEN 'supabase_auth_admin' THEN 4
  END;
