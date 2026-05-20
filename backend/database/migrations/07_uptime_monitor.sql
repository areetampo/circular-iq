-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 07_uptime_monitor.sql (v2)
-- Uptime Monitor — health check history with analytics and retention
-- ══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE
-- ───────
-- • Records the result of every backend-polled health check (endpoint, status,
--   response time, timestamp) for uptime dashboards and heatmaps.
-- • Provides analytics functions covering daily uptime stats, 24-hour heatmaps,
--   global response trends, and per-endpoint bucketed latency data.
-- • Manages retention via cleanup_old_uptime_checks() — called by a backend
--   scheduled job, not pg_cron.
--
-- DESIGN DECISIONS
-- ────────────────
-- • Append-only table: no UPDATE or DELETE for application roles. The backend
--   polling service inserts rows; reads come via the Express API using
--   service_role. No direct Supabase client access.
-- • RLS FOR SELECT only: authenticated and anon may read uptime data for
--   dashboards, but cannot insert, update, or delete rows through PostgREST.
-- • All analytics functions are SECURITY DEFINER and locked to service_role.
--   All calls flow through the Express backend — no direct browser-to-Supabase
--   RPC is needed or desired.
-- • Runtime configuration (query window cap, warning threshold) is read from
--   app.settings via app.get_setting() — no hardcoded constants in functions.
--   Requires 00_app_settings.sql to have run first.
-- • clock-aligned mode: bucket and slot edges snap to clean UTC clock marks
--   (e.g. :00, :15, :30) instead of rolling from NOW(). Callers opt in via
--   p_clock_aligned=TRUE.
-- • get_heatmap_buckets uses p_reference_ts (ms epoch) so the frontend can
--   anchor buckets to a stable point in time across page refreshes.
-- • Autovacuum tuned for high-frequency inserts (every few seconds per endpoint).
--
-- ACCESS CONTROL
-- ──────────────
-- • uptime_checks table:
--     service_role  — full access (polling service writes, Express API reads).
--     authenticated — SELECT only (dashboard; RLS FOR SELECT policy).
--     anon          — SELECT only (public dashboard; RLS FOR SELECT policy).
-- • All analytics + cleanup functions: service_role only.
--   Rationale: all reads are proxied through Express — direct PostgREST RPC
--   access by anon/authenticated is unnecessary and should not be exposed.
--
-- IMPORTANT NOTES
-- ───────────────
-- • PREREQUISITE: 00_app_settings.sql must run before this migration.
--   This migration reads app.settings via app.get_setting() for:
--     - 'uptime_checks-query_window_days'           (max analytics window, days)
--     - 'uptime_checks-uptime_warning_threshold_ms' (heatmap warning threshold, ms)
-- • pg_cron is NOT used — cleanup is triggered by backend/server/index.js.
-- • All timestamps are TIMESTAMPTZ (UTC).
-- • response_time_ms is NULL for failed checks.
-- • Query window capped at the 'uptime_checks-query_window_days' setting in all
--   time-range functions.
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
-- Drop table first — CASCADE removes dependent indexes and RLS policies.
-- Then drop every function in this migration regardless of signature so that
-- signature changes never leave orphaned overloads behind.

DROP TABLE IF EXISTS uptime_checks CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'cleanup_old_uptime_checks',
        'get_uptime_check_count_estimate',
        'get_daily_uptime_stats',
        'get_global_response_trend',
        'get_endpoint_avg_latency',
        'get_heatmap_buckets',
        'get_endpoint_buckets'
    ];
    func_name text;
    rec       record;
BEGIN
    FOREACH func_name IN ARRAY func_names LOOP
        FOR rec IN
            SELECT nspname, proname, oidvectortypes(pg_proc.proargtypes) AS args
            FROM   pg_proc
            JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE  proname = func_name AND nspname = 'public'
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
                rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE — uptime_checks
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS uptime_checks (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id      TEXT        NOT NULL,       -- e.g. "api", "db", "vector"
    endpoint_path    TEXT        NOT NULL,       -- e.g. "/health", "/health/database"
    status           TEXT        NOT NULL,       -- e.g. "ok", "degraded", "down"
    up               BOOLEAN     NOT NULL,       -- TRUE = healthy
    response_time_ms INTEGER,                    -- NULL for failed / timed-out checks
    payload          JSONB,                      -- full health endpoint response (for debugging)
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  uptime_checks IS
    'Append-only historical health check results from backend polling. '
    'Used for uptime dashboards and heatmaps. Written by service_role only.';
COMMENT ON COLUMN uptime_checks.endpoint_id      IS 'Identifier of the monitored endpoint (e.g. "api", "db", "vector").';
COMMENT ON COLUMN uptime_checks.endpoint_path    IS 'API route of the monitored endpoint (e.g. "/health", "/health/database").';
COMMENT ON COLUMN uptime_checks.status           IS 'Status string returned by the health endpoint (e.g. "ok", "degraded").';
COMMENT ON COLUMN uptime_checks.up               IS 'TRUE if the endpoint was reachable and healthy; FALSE otherwise.';
COMMENT ON COLUMN uptime_checks.response_time_ms IS 'Round-trip time in milliseconds. NULL for failed or timed-out checks.';
COMMENT ON COLUMN uptime_checks.payload          IS 'Full JSON payload from the health endpoint. Stored for debugging only.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Primary access pattern: per-endpoint time-series and heatmap bucket queries.
CREATE INDEX IF NOT EXISTS idx_uptime_endpoint_created
    ON uptime_checks (endpoint_id, created_at DESC);
COMMENT ON INDEX idx_uptime_endpoint_created IS
    'Covers per-endpoint time-series queries and heatmap bucket scans.';

-- Global time-based filters and retention cleanup.
CREATE INDEX IF NOT EXISTS idx_uptime_created_at
    ON uptime_checks (created_at);
COMMENT ON INDEX idx_uptime_created_at IS
    'Accelerates global time-range filters and the cleanup DELETE.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. AUTOVACUUM TUNING
-- ══════════════════════════════════════════════════════════════════════════════
-- Health checks arrive every few seconds. The default autovacuum thresholds
-- (20% dead tuples) are too conservative for a high-insert table.
-- These lower scale factors trigger vacuuming earlier to prevent bloat.

ALTER TABLE uptime_checks SET (
    autovacuum_vacuum_scale_factor  = 0.02,   -- vacuum after 2% dead tuples
    autovacuum_analyze_scale_factor = 0.01    -- analyze after 1% new tuples
);


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;

-- service_role: full access — backend polling inserts rows.
CREATE POLICY "uptime_checks_service_role_full"
    ON uptime_checks FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- authenticated + anon: SELECT only (public/dashboard reads).
-- FOR SELECT (not FOR ALL) prevents INSERT/UPDATE/DELETE via PostgREST
-- even though service_role writes via the backend bypass RLS entirely.
CREATE POLICY "uptime_checks_public_read"
    ON uptime_checks FOR SELECT
    USING (true);

COMMENT ON POLICY "uptime_checks_service_role_full" ON uptime_checks IS
    'Service role has full access (backend polling writes).';
COMMENT ON POLICY "uptime_checks_public_read"       ON uptime_checks IS
    'All roles may SELECT uptime data (FOR SELECT — no write access via PostgREST).';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 5a. cleanup_old_uptime_checks ────────────────────────────────────────────
-- Deletes rows older than the given number of days.
-- days = 0: full TRUNCATE (faster, reclaims disk space immediately).
-- Called by backend/server/index.js on a schedule — not pg_cron.
-- Returns the number of rows deleted (or 0 for TRUNCATE).

CREATE OR REPLACE FUNCTION cleanup_old_uptime_checks(days INTEGER DEFAULT 30)
RETURNS BIGINT
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
    deleted_count BIGINT;
BEGIN
    IF days < 0 THEN
        RAISE EXCEPTION 'days must be >= 0';
    END IF;

    IF days = 0 THEN
        TRUNCATE TABLE uptime_checks;
        RETURN 0;
    END IF;

    DELETE FROM uptime_checks
    WHERE created_at < NOW() - make_interval(days => days);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_uptime_checks(INTEGER) IS
    'Deletes uptime_checks rows older than N days. days=0 performs a full TRUNCATE. '
    'Returns row count deleted (0 for TRUNCATE). Called by backend scheduled job.';


-- ── 5b. get_uptime_check_count_estimate ──────────────────────────────────────
-- Returns a fast approximate total row count for uptime_checks using the
-- pg_class system catalogue (reltuples). Avoids a full table scan.
-- Updated automatically by autovacuum/analyze — accurate to within ~1%
-- given the tuned scale factors set above.
-- Used by the frontend display stat only; exact count is not required.
CREATE OR REPLACE FUNCTION get_uptime_check_count_estimate()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
SELECT reltuples::BIGINT
FROM   pg_class
WHERE  relname = 'uptime_checks';
$$;

COMMENT ON FUNCTION get_uptime_check_count_estimate() IS
    'Fast approximate row count for uptime_checks via pg_class.reltuples. '
    'Avoids a full table scan — suitable for display stats only, not exact counts. '
    'Accuracy within ~1% given tuned autovacuum settings.';


-- ── 5c. get_daily_uptime_stats ───────────────────────────────────────────────
-- Returns one row per day: average uptime % across all endpoints.
-- Each endpoint is averaged independently first (per-endpoint daily uptime),
-- then those per-endpoint values are averaged — so a single high-volume endpoint
-- does not skew the global figure.
--
-- Converted from plpgsql RETURN QUERY wrapper to LANGUAGE sql.
-- Logic and return columns unchanged; planner can now inline and optimise freely.
-- Query window capped at app.uptime_checks-query_window_days days.
CREATE OR REPLACE FUNCTION get_daily_uptime_stats(days INTEGER DEFAULT 28)
RETURNS TABLE (day DATE, uptime_pct NUMERIC)
LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE
AS $$
WITH daily_endpoint_uptime AS (
    -- Per-endpoint uptime % per calendar day.
    -- DATE(created_at) uses the session timezone; all timestamps are TIMESTAMPTZ (UTC).
    SELECT
        DATE(created_at)                        AS stat_date,
        endpoint_id,
        AVG(CASE WHEN up THEN 100 ELSE 0 END)  AS endpoint_uptime
    FROM  uptime_checks
    WHERE created_at >= NOW() - (LEAST(days, app.get_setting('uptime_checks-query_window_days')::INT) || ' days')::INTERVAL
    GROUP BY stat_date, endpoint_id
),
daily_avg AS (
    -- Average the per-endpoint values so each endpoint contributes equally
    -- regardless of how many checks it received that day.
    SELECT stat_date, AVG(endpoint_uptime) AS avg_uptime
    FROM   daily_endpoint_uptime
    GROUP  BY stat_date
)
SELECT stat_date, ROUND(avg_uptime, 1)
FROM   daily_avg
ORDER  BY stat_date;
$$;

COMMENT ON FUNCTION get_daily_uptime_stats(INTEGER) IS
    'Returns daily average uptime % across all endpoints for the last N days. '
    'Each endpoint is averaged independently to prevent high-volume skew. '
    'Days capped at app.uptime_checks-query_window_days. Converted to LANGUAGE sql for planner inlining.';


-- ── 5d. get_global_response_trend ────────────────────────────────────────────
-- Returns one row per hour: average response time across all endpoints.
-- Used to render the global hourly trend chart.
--
-- p_clock_aligned = TRUE:  slots anchor to clean HH:00 UTC boundaries.
--                          The current (newest) hour is partial.
-- p_clock_aligned = FALSE: rolling window backward from NOW() (default).
--
-- Converted from plpgsql RETURN QUERY wrapper to LANGUAGE sql.
-- Logic and return columns unchanged; DECLARE block replaced with inline CASEs.
-- Query window capped at app.uptime_checks-query_window_days * 24 hours (app.uptime_checks-query_window_days days).
-- avg_response_time: 0 for hours with no data (COALESCE behaviour preserved).
CREATE OR REPLACE FUNCTION get_global_response_trend(
    p_hours         INT     DEFAULT 24,
    p_clock_aligned BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (hour_label TIMESTAMPTZ, avg_response_time NUMERIC)
LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE
AS $$
WITH
-- Derive series_start and series_end inline, matching the original DECLARE block.
-- clock-aligned: truncate to the hour so slot edges land on clean HH:00 marks.
-- rolling: use NOW() directly so the window slides with each call.
bounds AS (
    SELECT
        CASE
            WHEN p_clock_aligned
                THEN date_trunc('hour', NOW()) - ((LEAST(p_hours, app.get_setting('uptime_checks-query_window_days')::INT * 24) - 1) || ' hours')::INTERVAL
            ELSE NOW() - ((LEAST(p_hours, app.get_setting('uptime_checks-query_window_days')::INT * 24) - 1) || ' hours')::INTERVAL
        END AS series_start,
        CASE
            WHEN p_clock_aligned THEN date_trunc('hour', NOW())
            ELSE NOW()
        END AS series_end
),
-- One slot per hour across the full window.
-- generate_series is inclusive of series_end, so the current hour is always present.
hours AS (
    SELECT generate_series(bounds.series_start, bounds.series_end, INTERVAL '1 hour') AS slot_start
    FROM bounds
)
SELECT
    h.slot_start,
    -- COALESCE to 0 preserves the original behaviour: empty hours render as 0 on the chart.
    COALESCE(ROUND(AVG(u.response_time_ms), 0), 0)
FROM hours h
-- idx_uptime_created_at covers (created_at) for this global time-range join.
LEFT JOIN uptime_checks u
    ON  u.created_at >= h.slot_start
    AND u.created_at <  h.slot_start + INTERVAL '1 hour'
GROUP BY h.slot_start
ORDER BY h.slot_start;
$$;

COMMENT ON FUNCTION get_global_response_trend(INT, BOOLEAN) IS
    'Returns hourly avg response time (all endpoints) for the past N hours. '
    'p_clock_aligned=TRUE anchors slots to HH:00 boundaries; current hour is partial. '
    'Empty hours return 0 (not NULL). '
    'Query window capped at app.uptime_checks-query_window_days * 24 hours (app.uptime_checks-query_window_days days). '
    'Converted to LANGUAGE sql for planner inlining.';


-- ── 5e. get_endpoint_avg_latency ─────────────────────────────────────────────
-- Returns one scalar row per endpoint: average response time for successful
-- checks (up=TRUE, response_time_ms IS NOT NULL) over the past N hours.
-- Used for the per-endpoint latency summary panel.
--
-- Converted from plpgsql RETURN QUERY wrapper to LANGUAGE sql.
-- Logic and return columns unchanged.
-- Query window capped at app.uptime_checks-query_window_days * 24 hours (app.uptime_checks-query_window_days days).
-- Excludes failed checks and null response times.
-- Results ordered by avg_ms DESC (highest latency first).
CREATE OR REPLACE FUNCTION get_endpoint_avg_latency(p_hours INT DEFAULT 24)
RETURNS TABLE (endpoint_id TEXT, avg_ms NUMERIC)
LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE
AS $$
-- idx_uptime_endpoint_created covers (endpoint_id, created_at DESC).
-- The WHERE clause on created_at uses idx_uptime_created_at for the time filter.
SELECT
    uc.endpoint_id::TEXT,
    ROUND(AVG(uc.response_time_ms), 0)
FROM uptime_checks uc
WHERE uc.created_at        >= NOW() - (LEAST(p_hours, app.get_setting('uptime_checks-query_window_days')::INT * 24) || ' hours')::INTERVAL
  AND uc.up                 = TRUE
  AND uc.response_time_ms  IS NOT NULL
GROUP BY uc.endpoint_id
ORDER BY ROUND(AVG(uc.response_time_ms), 0) DESC;
$$;

COMMENT ON FUNCTION get_endpoint_avg_latency(INT) IS
    'Returns avg response time (ms) per endpoint for successful checks in the past N hours. '
    'Excludes failed checks (up=FALSE) and null response times. '
    'Results ordered by avg_ms DESC. '
    'Query window capped at app.uptime_checks-query_window_days * 24 hours (app.uptime_checks-query_window_days days). '
    'Converted to LANGUAGE sql for planner inlining.';


-- ── 5f. get_heatmap_buckets ───────────────────────────────────────────────────
-- Returns time buckets across all endpoints for heatmap rendering.
-- Anchored to a caller-supplied p_reference_ts (ms epoch) so bucket edges remain
-- stable across page refreshes regardless of when the request arrives.
--
-- Uses generate_series to materialise all bucket edges, then joins uptime_checks
-- once across the full window (a single index range scan) and fans results out to
-- buckets via GROUP BY — rather than issuing a separate subquery or scan per bucket.
--
-- p_clock_aligned = TRUE:  snaps the window END to the nearest UTC bucket_minutes
--                          mark at or after p_reference_ts, then walks the full
--                          window backward so all edges land on clean clock marks.
-- p_clock_aligned = FALSE: rolling window backward from p_reference_ts (default).
--
-- Query window capped at app.uptime_checks-query_window_days days.
-- average_ms:      NULL for buckets with no successful checks.
-- is_warning:      TRUE when average_ms exceeds uptime_checks-uptime_warning_threshold_ms,
--                  FALSE otherwise (never NULL).
-- failure_details: JSON array of { endpoint_id, endpoint_path, ts } where ts is ms epoch.
-- is_partial:      TRUE for any bucket whose end_time extends beyond p_reference_ts.
CREATE OR REPLACE FUNCTION get_heatmap_buckets(
    bucket_minutes  INT,
    days            INT,
    p_reference_ts    BIGINT,
    p_clock_aligned BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    any_failure     BOOLEAN,
    has_data        BOOLEAN,
    average_ms      NUMERIC,
    is_warning      BOOLEAN,
    failure_details JSONB,
    is_partial      BOOLEAN
)
LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE
AS $$
WITH
params AS (
    SELECT to_timestamp(p_reference_ts / 1000.0) AS ref_ts
),
aligned_end AS (
    SELECT
        p.ref_ts,
        CASE
            WHEN p_clock_aligned THEN
                to_timestamp(
                    ceil(EXTRACT(EPOCH FROM p.ref_ts) / (bucket_minutes * 60))
                    * (bucket_minutes * 60)
                )
            ELSE
                p.ref_ts
        END AS end_ts
    FROM params p
),
aligned_start AS (
    SELECT
        ae.ref_ts,
        ae.end_ts,
        ae.end_ts - (60 * 24 * LEAST(days, app.get_setting('uptime_checks-query_window_days')::INT) / bucket_minutes) * bucket_minutes * INTERVAL '1 minute' AS start_ts
    FROM aligned_end ae
),
buckets AS (
    SELECT
        as_t.start_ts + (g.n * bucket_minutes * INTERVAL '1 minute') AS b_start,
        as_t.start_ts + ((g.n + 1) * bucket_minutes * INTERVAL '1 minute') AS b_end,
        as_t.ref_ts
    FROM aligned_start as_t
    CROSS JOIN LATERAL generate_series(
        0,
        (EXTRACT(EPOCH FROM (as_t.end_ts - as_t.start_ts)) / 60 / bucket_minutes)::INT - 1
    ) AS g(n)
),
checks AS (
    SELECT c.endpoint_id, c.endpoint_path, c.created_at, c.up, c.response_time_ms
    FROM aligned_start as_t
    JOIN uptime_checks c ON c.created_at >= as_t.start_ts AND c.created_at < as_t.end_ts
),
agg AS (
    SELECT
        b.b_start,
        b.b_end,
        b.ref_ts,
        count(c.created_at) > 0                                           AS has_data,
        coalesce(bool_or(c.up = FALSE), FALSE)                            AS any_failure,
        CASE WHEN count(c.up) FILTER (WHERE c.up AND c.response_time_ms IS NOT NULL) > 0
             THEN ROUND(
                avg(c.response_time_ms) FILTER (WHERE c.up AND c.response_time_ms IS NOT NULL),
             0) END                                                       AS average_ms,
        coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'endpoint_id',   c.endpoint_id,
                    'endpoint_path', c.endpoint_path,
                    'ts',            EXTRACT(EPOCH FROM c.created_at) * 1000
                )
            ) FILTER (WHERE c.up = FALSE),
            '[]'::jsonb
        )                                                                 AS failure_details
    FROM buckets b
    LEFT JOIN checks c ON c.created_at >= b.b_start AND c.created_at < b.b_end
    GROUP BY b.b_start, b.b_end, b.ref_ts
)
SELECT
    b_start                                                                                         AS start_time,
    b_end                                                                                           AS end_time,
    any_failure,
    has_data,
    average_ms,
    coalesce(average_ms > app.get_setting('uptime_checks-uptime_warning_threshold_ms')::INT, FALSE) AS is_warning,
    failure_details,
    b_end > ref_ts                                                                                  AS is_partial
FROM agg
ORDER BY b_start;
$$;

COMMENT ON FUNCTION get_heatmap_buckets(INT, INT, BIGINT, BOOLEAN) IS
    'Returns bucketed heatmap data across all endpoints for the given window. '
    'Set-based: generate_series materialises bucket edges; uptime_checks is scanned '
    'once across the full window and fanned out to buckets via GROUP BY — one index '
    'range scan per call regardless of bucket count. '
    'Anchored to p_reference_ts (ms epoch) for stable bucket edges across page refreshes. '
    'p_clock_aligned=TRUE snaps the window end to the nearest bucket_minutes UTC mark '
    'then walks backward — all edges land on clean clock marks with no drift. '
    'Query window capped at app.uptime_checks-query_window_days days. '
    'average_ms: NULL for buckets with no successful checks. '
    'is_warning: TRUE when average_ms exceeds uptime_checks-uptime_warning_threshold_ms, FALSE otherwise (never NULL). '
    'failure_details: [{endpoint_id, endpoint_path, ts}] where ts is ms epoch. '
    'is_partial: TRUE for any bucket whose end_time extends beyond p_reference_ts.';


-- ── 5g. get_endpoint_buckets ──────────────────────────────────────────────────
-- Returns bucketed avg response time and failure info for a single endpoint
-- over the last N hours. Used to render per-endpoint sparklines and detail panels.
--
-- Uses generate_series to materialise all bucket edges, then joins uptime_checks
-- once across the full window (a single index scan) and fans results out to
-- buckets via GROUP BY — rather than issuing a separate subquery or scan per bucket.
--
-- NOTE: unlike get_heatmap_buckets, this function is anchored to NOW(), not a
-- caller-supplied timestamp. Bucket edges will drift slightly between page refreshes
-- when p_clock_aligned=FALSE.
--
-- p_clock_aligned = TRUE:  snaps the newest bucket boundary to the nearest UTC
--                          clock mark (e.g. :00, :15, :30). Stable across refreshes.
-- p_clock_aligned = FALSE: rolling window of p_hours ending at NOW() (default).
--
-- Query window capped at uptime_checks-query_window_days days.
-- avg_ms:          NULL for buckets with no successful checks (up=TRUE).
-- failure_details: JSON array of { ts } (ms epoch) for each failed check.
-- is_partial:      TRUE for any bucket whose end_time extends beyond NOW().
CREATE OR REPLACE FUNCTION get_endpoint_buckets(
    p_endpoint_id    TEXT,
    p_bucket_minutes INT     DEFAULT 15,
    p_hours          INT     DEFAULT 24,
    p_clock_aligned  BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    start_time      TIMESTAMPTZ,
    end_time        TIMESTAMPTZ,
    avg_ms          NUMERIC,
    has_data        BOOLEAN,
    any_failure     BOOLEAN,
    failure_details JSONB,
    is_partial      BOOLEAN
)
LANGUAGE sql
SET search_path = public
SECURITY DEFINER
STABLE
AS $$
WITH
-- Derive the window start based on clock-alignment mode.
-- clock-aligned: snap the newest bucket edge to the nearest UTC bucket mark,
--   then walk backward so all edges land on clean clock marks.
-- rolling: subtract the capped hour count from NOW().
aligned_start AS (
    SELECT CASE
        WHEN p_clock_aligned THEN
            to_timestamp(
                floor(EXTRACT(EPOCH FROM NOW()) / (p_bucket_minutes * 60))
                * (p_bucket_minutes * 60)
            ) - ((LEAST(p_hours, app.get_setting('uptime_checks-query_window_days')::INT * 24) * 60 / p_bucket_minutes - 1) * p_bucket_minutes * INTERVAL '1 minute')
        ELSE
            NOW() - (LEAST(p_hours, app.get_setting('uptime_checks-query_window_days')::INT * 24) || ' hours')::INTERVAL
        END AS start_ts
),
-- One row per bucket across the full window.
-- n=0 is the oldest bucket; the highest n is the newest (possibly partial).
buckets AS (
    SELECT
        aligned_start.start_ts + (n * p_bucket_minutes * INTERVAL '1 minute') AS b_start,
        aligned_start.start_ts + ((n + 1) * p_bucket_minutes * INTERVAL '1 minute') AS b_end
    FROM aligned_start,
         generate_series(0, (LEAST(p_hours, app.get_setting('uptime_checks-query_window_days')::INT * 24) * 60 / p_bucket_minutes) - 1) AS n
),
-- Single index range scan across the full window for this endpoint.
-- idx_uptime_endpoint_created covers (endpoint_id, created_at DESC).
checks AS (
    SELECT created_at, up, response_time_ms
    FROM uptime_checks
    WHERE endpoint_id = p_endpoint_id
      AND created_at >= (SELECT start_ts FROM aligned_start)
      AND created_at <  NOW()
),
-- Fan checks into buckets in one pass via LEFT JOIN.
-- LEFT JOIN ensures empty buckets appear with has_data=FALSE and avg_ms=NULL.
-- any_failure is NULL (not FALSE) here for empty buckets; COALESCE applied in
-- the outer SELECT to avoid masking the LEFT JOIN nulls prematurely.
agg AS (
    SELECT
        b.b_start,
        b.b_end,
        count(c.created_at) > 0 AS has_data,
        bool_or(c.up = FALSE)   AS any_failure,
        -- avg_ms: average of successful checks only; NULL if none exist.
        CASE WHEN count(c.up) FILTER (WHERE c.up AND c.response_time_ms IS NOT NULL) > 0
             THEN ROUND(
                avg(c.response_time_ms) FILTER (WHERE c.up AND c.response_time_ms IS NOT NULL),
             0) END                                                       AS avg_ms,
        -- failure_details: [{ts}] array for each failed check; empty array if none.
        coalesce(
            jsonb_agg(
                jsonb_build_object('ts', EXTRACT(EPOCH FROM c.created_at) * 1000)
            ) FILTER (WHERE c.up = FALSE),
            '[]'::jsonb
        ) AS failure_details
    FROM buckets b
    LEFT JOIN checks c ON c.created_at >= b.b_start AND c.created_at < b.b_end
    GROUP BY b.b_start, b.b_end
)
SELECT
    b_start                       AS start_time,
    b_end                         AS end_time,
    avg_ms,
    coalesce(has_data, FALSE)     AS has_data,
    coalesce(any_failure, FALSE)  AS any_failure,
    failure_details,
    b_end > NOW()                 AS is_partial
FROM agg
ORDER BY b_start;
$$;

COMMENT ON FUNCTION get_endpoint_buckets(TEXT, INT, INT, BOOLEAN) IS
    'Returns bucketed avg response time and failure info for a single endpoint over the last N hours. '
    'Set-based: generate_series materialises bucket edges; uptime_checks is scanned once across '
    'the full window and fanned out to buckets via GROUP BY — one index range scan per call '
    'regardless of bucket count. '
    'Anchored to NOW() (not a caller-supplied timestamp); bucket edges drift between refreshes '
    'when p_clock_aligned=FALSE. '
    'p_clock_aligned=TRUE snaps the newest bucket boundary to the nearest bucket_minutes UTC mark. '
    'Query window capped at uptime_checks-query_window_days days. '
    'avg_ms: NULL for buckets with no successful checks. '
    'failure_details: [{ts}] where ts is ms epoch. '
    'is_partial: TRUE for any bucket whose end_time extends beyond NOW().';


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════
-- All analytics and cleanup functions are called exclusively through the Express
-- backend using service_role. No direct browser-to-Supabase RPC is used or
-- needed, so anon and authenticated are revoked from all functions.

-- Table: service_role writes; anon/authenticated read via RLS FOR SELECT policy.
GRANT SELECT ON uptime_checks TO anon, authenticated;
GRANT ALL ON uptime_checks TO service_role;

-- All functions: service_role only.
REVOKE EXECUTE ON FUNCTION cleanup_old_uptime_checks(INTEGER)              FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION cleanup_old_uptime_checks(INTEGER)              TO service_role;

REVOKE EXECUTE ON FUNCTION get_uptime_check_count_estimate()               FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_uptime_check_count_estimate()               TO service_role;

REVOKE EXECUTE ON FUNCTION get_daily_uptime_stats(INTEGER)                 FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_daily_uptime_stats(INTEGER)                 TO service_role;

REVOKE EXECUTE ON FUNCTION get_global_response_trend(INT, BOOLEAN)         FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_global_response_trend(INT, BOOLEAN)         TO service_role;

REVOKE EXECUTE ON FUNCTION get_endpoint_avg_latency(INT)                   FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_endpoint_avg_latency(INT)                   TO service_role;

REVOKE EXECUTE ON FUNCTION get_heatmap_buckets(INT, INT, BIGINT, BOOLEAN)  FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_heatmap_buckets(INT, INT, BIGINT, BOOLEAN)  TO service_role;

REVOKE EXECUTE ON FUNCTION get_endpoint_buckets(TEXT, INT, INT, BOOLEAN)   FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION get_endpoint_buckets(TEXT, INT, INT, BOOLEAN)   TO service_role;


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. SCHEDULED CLEANUP — note (pg_cron not used)
-- ══════════════════════════════════════════════════════════════════════════════
-- Cleanup is performed by backend/server/index.js on a schedule by calling
-- cleanup_old_uptime_checks(15) via service_role. pg_cron is NOT enabled.
--
-- To switch to pg_cron if available, uncomment:
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--     'cleanup-uptime-checks',
--     '0 0 * * *',
--     $$ SELECT cleanup_old_uptime_checks(15); $$
-- );


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- Indexes
SELECT tablename, indexname
FROM   pg_indexes
WHERE  tablename = 'uptime_checks'
ORDER  BY indexname;

-- RLS enabled
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  tablename = 'uptime_checks';

-- Policies (should see service_role_full and public_read)
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  tablename = 'uptime_checks';

-- Functions with search_path pinned (proconfig non-null for all)
SELECT proname, proconfig
FROM   pg_proc
JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE  nspname = 'public'
  AND  proname IN (
    'cleanup_old_uptime_checks',      'get_daily_uptime_stats',
    'get_heatmap_buckets',            'get_global_response_trend',
    'get_endpoint_avg_latency',       'get_endpoint_buckets',
    'get_uptime_check_count_estimate'
  )
ORDER  BY proname;
