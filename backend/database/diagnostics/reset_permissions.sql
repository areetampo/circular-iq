-- ============================================================
-- FILE: diagnostics/reset_permissions.sql
-- PURPOSE: Idempotent reset of ALL function, table, and schema
--          grants across the full migration stack (00–07).
--
-- WHEN TO RUN:
--   • After any pg_restore (grants may not survive correctly)
--   • After adding a new migration that touches permissions
--   • After manually inserting auth.users rows
--   • Anytime function_privileges.sql shows unexpected results
--
-- SAFE TO RUN REPEATEDLY — all statements are idempotent.
--
-- COVERAGE:
--   • app schema (00_app_settings)
--   • extensions schema
--   • authenticator role (PostgREST internal)
--   • All public.* tables
--   • All public.* functions (grouped by intent)
--   • Trigger functions (locked to service_role)
--   • Auth hook (supabase_noop_send_email)
--   • Auth triggers on auth.users
-- ============================================================


-- ============================================================
-- [1] SCHEMA GRANTS
-- ============================================================

-- public schema: standard access for all API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- extensions schema: needed for halfvec, pgcrypto, pg_trgm etc
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- app schema: service_role and authenticator only — never anon/authenticated
GRANT  USAGE ON SCHEMA app TO service_role, authenticator;
REVOKE USAGE ON SCHEMA app FROM anon, authenticated;

-- authenticator is PostgREST's internal connection role.
-- It needs SELECT on app.settings and EXECUTE on app.get_setting
-- so PostgREST can introspect the schema without timing out.
GRANT SELECT  ON TABLE    app.settings          TO authenticator;
GRANT EXECUTE ON FUNCTION app.get_setting(text) TO authenticator;

-- authenticator needs SELECT on all public tables for schema introspection
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticator;


-- ============================================================
-- [2] TABLE GRANTS
-- ============================================================

-- app.settings — service_role read only; never exposed to anon/authenticated
REVOKE ALL   ON TABLE app.settings FROM anon, authenticated;
GRANT SELECT ON TABLE app.settings TO service_role;

-- documents — public reference data; writes via embedding pipeline only
GRANT SELECT ON TABLE public.documents TO anon, authenticated;
GRANT ALL    ON TABLE public.documents TO service_role;

-- user_assessments — full CRUD; RLS enforces per-user row isolation
GRANT ALL                            ON TABLE public.user_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_assessments TO anon;
GRANT ALL                            ON TABLE public.user_assessments TO service_role;

-- profiles — authenticated CRUD only; anon has no access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
REVOKE ALL                           ON TABLE public.profiles FROM anon;
GRANT ALL                            ON TABLE public.profiles TO service_role;

-- anonymous_usage — anon SELECT only (read own usage); all writes via backend
GRANT SELECT                  ON TABLE public.anonymous_usage TO anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.anonymous_usage FROM anon, authenticated;
GRANT ALL                     ON TABLE public.anonymous_usage TO service_role;

-- scoring_results_log — append-only audit log; authenticated SELECT own rows (RLS)
GRANT SELECT         ON TABLE public.scoring_results_log TO authenticated;
GRANT SELECT, INSERT ON TABLE public.scoring_results_log TO service_role;
REVOKE ALL           ON TABLE public.scoring_results_log FROM anon;

-- ce_cases — public reference data; writes via ingestion pipeline only
GRANT SELECT ON TABLE public.ce_cases TO anon, authenticated;
GRANT ALL    ON TABLE public.ce_cases TO service_role;

-- uptime_checks — public dashboard reads; writes via backend polling only
GRANT SELECT ON TABLE public.uptime_checks TO anon, authenticated;
GRANT ALL    ON TABLE public.uptime_checks TO service_role;


-- ============================================================
-- [3] SERVICE_ROLE ONLY FUNCTIONS
--     Target: anon=false, authenticated=false, service_role=true
--     REVOKE FROM public first — anon/authenticated inherit from
--     public, so revoking only from them directly has no effect.
-- ============================================================

-- 00_app_settings
REVOKE EXECUTE ON FUNCTION app.get_setting(text)                                              FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION app.get_setting(text)                                              TO service_role;

-- 01_vector_infrastructure
REVOKE EXECUTE ON FUNCTION public.truncate_documents()                                        FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.truncate_documents()                                        TO service_role;

REVOKE EXECUTE ON FUNCTION public.backfill_document_metadata()                                FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.backfill_document_metadata()                                TO service_role;

REVOKE EXECUTE ON FUNCTION public.safe_jsonb_cast(text)                                       FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.safe_jsonb_cast(text)                                       TO service_role;

-- 03_user_profiles — Express backend RPCs called via service_role only
REVOKE EXECUTE ON FUNCTION public.get_user_profile(uuid)                                      FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_profile(uuid)                                      TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_username(uuid, text)                                 FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_username(uuid, text)                                 TO service_role;

-- 04_anonymous_usage
REVOKE EXECUTE ON FUNCTION public.check_and_increment_anonymous_usage(text,integer,text,text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_increment_anonymous_usage(text,integer,text,text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_anonymous_usage()                               FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_anonymous_usage()                               TO service_role;

-- 05_results_logs
REVOKE EXECUTE ON FUNCTION public.cleanup_old_scoring_results_log()                           FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_old_scoring_results_log()                           TO service_role;

-- 06_ce_cases
REVOKE EXECUTE ON FUNCTION public.truncate_ce_cases()                                         FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.truncate_ce_cases()                                         TO service_role;

-- 07_uptime_monitor
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
-- [4] TRIGGER-ONLY FUNCTIONS
--     Never callable via RPC — revoke from all user-facing roles.
--     service_role kept for completeness / trigger invocation.
-- ============================================================

-- 01_vector_infrastructure
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()                                  FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_updated_at_column()                                  TO service_role;

-- 02_user_assessments
REVOKE EXECUTE ON FUNCTION public.update_assessments_updated_at_column()                      FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_assessments_updated_at_column()                      TO service_role;

-- 03_user_profiles
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

-- 06_ce_cases
REVOKE EXECUTE ON FUNCTION public.update_ce_cases_updated_at()                                FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_ce_cases_updated_at()                                TO service_role;

-- 03_user_profiles — auth hook; only supabase_auth_admin may call this
REVOKE EXECUTE ON FUNCTION public.supabase_noop_send_email(jsonb)                             FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.supabase_noop_send_email(jsonb)                             TO supabase_auth_admin;


-- ============================================================
-- [5] PUBLIC FUNCTIONS
--     Target: anon=true, authenticated=true, service_role=true
-- ============================================================

-- 01_vector_infrastructure
GRANT EXECUTE ON FUNCTION public.match_documents(extensions.halfvec, integer)                                                      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_by_industry(extensions.halfvec, text, integer, float)                           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_by_category(extensions.halfvec, text, integer, float)                           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_hybrid(extensions.halfvec, text, text, text, text, integer, float, float)       TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_documents_hybrid_filtered(extensions.halfvec, text, text, integer, float)                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.find_recent_documents(integer, text, text, text)                                                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_document_statistics()                                                                        TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_documents_by_category(text)                                                                TO anon, authenticated, service_role;

-- 02_user_assessments
GRANT EXECUTE ON FUNCTION public.get_assessment_statistics(uuid)                                                                  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_market_data()                                                                                TO anon, authenticated, service_role;

-- 06_ce_cases
GRANT EXECUTE ON FUNCTION public.search_ce_cases_keyword(text, integer)                                                           TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_ce_cases_hybrid(extensions.halfvec, text, integer, float)                                 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ce_cases_statistics()                                                                        TO anon, authenticated, service_role;


-- ============================================================
-- [6] AUTH TRIGGERS — bind to auth.users
--     Run after any migration reset or if signup breaks.
--     force_internal_email: validates username, rewrites email to @ce.internal
--     handle_new_user: creates matching profiles row after successful signup
-- ============================================================

DROP TRIGGER IF EXISTS trg_force_internal_email ON auth.users;
CREATE TRIGGER trg_force_internal_email
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.force_internal_email();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
