-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 00_app_settings.sql
-- Shared application runtime configuration
-- ══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE
-- ───────
-- • Stores global application runtime configuration shared across SQL
--   functions and backend services.
-- • Replaces ALTER ROLE / ALTER DATABASE custom GUC configuration because
--   Supabase managed Postgres does not allow persistent custom parameters.
-- • Provides strongly centralized config access via app.get_setting().
--
-- DESIGN DECISIONS
-- ────────────────
-- • Configuration stored as key/value rows for runtime flexibility.
-- • Values stored as TEXT and cast by consuming functions.
-- • SECURITY DEFINER accessor ensures controlled read access.
-- • Centralized table avoids hardcoded constants across migrations/functions.
--
-- ACCESS CONTROL
-- ──────────────
-- • service_role — full read access.
-- • anon/authenticated — no direct access.
-- • Config reads should happen through backend-controlled SQL functions.
--
-- IMPORTANT NOTES
-- ───────────────
-- • This migration must run BEFORE uptime analytics migrations.
-- • Functions consuming settings should use:
--       app.get_setting('<key>')
-- • Returned values are TEXT and should be explicitly cast.
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    func_names text[] := ARRAY['get_setting'];
    func_name text;
    rec       record;
BEGIN
    FOREACH func_name IN ARRAY func_names LOOP
        FOR rec IN
            SELECT nspname, proname, oidvectortypes(pg_proc.proargtypes) AS args
            FROM   pg_proc
            JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE  proname = func_name AND nspname = 'app'
        LOOP
            EXECUTE format(
                'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
                rec.nspname,
                rec.proname,
                rec.args
            );
        END LOOP;
    END LOOP;
END $$;

DROP TABLE IF EXISTS app.settings CASCADE;
DROP SCHEMA IF EXISTS app CASCADE;


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. SCHEMA
-- ══════════════════════════════════════════════════════════════════════════════

CREATE SCHEMA app;

COMMENT ON SCHEMA app IS
    'Shared application configuration and helper utilities.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. SETTINGS TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE app.settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    description TEXT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app.settings IS
    'Global application runtime configuration values.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. DEFAULT SETTINGS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO app.settings (key, value, description) VALUES
(
    'uptime_checks-query_window_days',
    '28',
    'Uptime Checks - Maximum analytics query window in days.'
),
(
    'uptime_checks-uptime_warning_threshold_ms',
    '1000',
    'Uptime Checks - Average response time threshold for warning buckets.'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. SETTINGS ACCESS FUNCTION
-- ══════════════════════════════════════════════════════════════════════════════

CREATE FUNCTION app.get_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app
AS $$
    SELECT value
    FROM app.settings
    WHERE key = p_key
    LIMIT 1;
$$;

COMMENT ON FUNCTION app.get_setting(TEXT) IS
    'Returns application runtime configuration values.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════

GRANT SELECT ON app.settings TO service_role;

REVOKE EXECUTE ON FUNCTION app.get_setting(TEXT) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION app.get_setting(TEXT) TO service_role;


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- Settings table and keys
SELECT key, value
FROM   app.settings
ORDER  BY key;

-- Function exists and is SECURITY DEFINER
SELECT proname, prosecdef, proconfig
FROM   pg_proc
JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE  nspname = 'app' AND proname = 'get_setting';
