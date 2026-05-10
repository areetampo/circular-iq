-- MIGRATION: 07_uptime_monitor.sql
-- Uptime Monitor History Table (backend-polled, 7-day retention)

-- ============================================
-- 0. Clean slate teardown
-- ============================================

-- Drop table and all dependent objects
DROP TABLE IF EXISTS uptime_checks CASCADE;

-- Drop conflicting functions regardless of signature
DO $$
DECLARE
    func_names text[] := ARRAY[
        'cleanup_old_uptime_checks'
    ];
    func_name text;
    rec record;
BEGIN
    FOREACH func_name IN ARRAY func_names
    LOOP
        FOR rec IN
            SELECT
                n.nspname,
                p.proname,
                oidvectortypes(p.proargtypes) AS args
            FROM pg_proc p
            JOIN pg_namespace n
              ON n.oid = p.pronamespace
            WHERE p.proname = func_name
              AND n.nspname = 'public'
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

-- ============================================
-- 1. Create table
-- ============================================

CREATE TABLE IF NOT EXISTS uptime_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    endpoint_id TEXT NOT NULL,
    status TEXT NOT NULL,
    up BOOLEAN NOT NULL,

    response_time_ms INTEGER,

    payload JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_uptime_endpoint_created
ON uptime_checks (endpoint_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uptime_created_at
ON uptime_checks (created_at);

-- ============================================
-- 3. Comments
-- ============================================

COMMENT ON TABLE uptime_checks IS
'Historical health check results from backend-side polling';

COMMENT ON COLUMN uptime_checks.endpoint_id IS
'Identifier of the health endpoint';

COMMENT ON COLUMN uptime_checks.status IS
'Status string from the health endpoint response';

COMMENT ON COLUMN uptime_checks.up IS
'Boolean indicating if the endpoint was reachable';

COMMENT ON COLUMN uptime_checks.response_time_ms IS
'Response time in milliseconds';

COMMENT ON COLUMN uptime_checks.payload IS
'Full JSON payload returned by the health endpoint';

COMMENT ON COLUMN uptime_checks.created_at IS
'Timestamp of the uptime check result';

-- ============================================
-- 4. Autovacuum tuning (reduce table bloat)
-- ============================================

ALTER TABLE uptime_checks SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.01
);

-- ============================================
-- 5. Row Level Security
-- ============================================

ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS uptime_checks_public_all ON uptime_checks;

CREATE POLICY uptime_checks_public_all
ON uptime_checks
FOR ALL
USING (true);

-- ============================================
-- 6. Cleanup function
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_uptime_checks(
    days INTEGER DEFAULT 7
)
RETURNS BIGINT AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    -- Safety validation
    IF days < 0 THEN
        RAISE EXCEPTION 'days must be >= 0';
    END IF;

    -- Full wipe mode
    IF days = 0 THEN
        TRUNCATE TABLE uptime_checks;

        RETURN 0;
    END IF;

    -- Delete expired rows
    DELETE FROM uptime_checks
    WHERE created_at < NOW() - make_interval(days => days);

    -- Return deleted row count
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION cleanup_old_uptime_checks IS
'Deletes uptime checks older than the specified number of days. Uses TRUNCATE when days=0 for complete table cleanup.';

-- ============================================
-- 7. Permissions
-- ============================================

GRANT ALL ON uptime_checks TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION cleanup_old_uptime_checks(INTEGER)
TO service_role;

-- ============================================
-- 8. Scheduled cleanup job (pg_cron) - DISABLED
--    Cleanup is handled by backend/server/index.js
--    To enable, uncomment the sections below.
-- ============================================

-- -- Enable pg_cron extension
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- -- Remove existing job if migration reruns
-- DO $$
-- DECLARE
--     existing_job_id BIGINT;
-- BEGIN
--     SELECT jobid INTO existing_job_id FROM cron.job WHERE jobname = 'cleanup-uptime-checks';
--     IF existing_job_id IS NOT NULL THEN
--         PERFORM cron.unschedule(existing_job_id);
--     END IF;
-- END $$;

-- -- Schedule daily cleanup at midnight
-- SELECT cron.schedule(
--     'cleanup-uptime-checks',
--     '0 0 * * *',
--     $$ SELECT cleanup_old_uptime_checks(7); $$
-- );

-- ============================================
-- 9. Verification queries (optional)
-- ============================================

-- Verify indexes
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE tablename = 'uptime_checks'
ORDER BY indexname;

-- Verify RLS
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'uptime_checks';

-- Verify function exists
SELECT
    proname,
    proconfig
FROM pg_proc
WHERE proname = 'cleanup_old_uptime_checks';

-- Verify cron job exists (disabled – pg_cron not used)
-- SELECT
--     jobid,
--     jobname,
--     schedule
-- FROM cron.job
-- WHERE jobname = 'cleanup-uptime-checks';
