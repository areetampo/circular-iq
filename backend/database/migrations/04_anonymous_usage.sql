-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 04_anonymous_usage.sql (v2)
-- Anonymous Usage Tracking — free-trial enforcement via IP+UA fingerprinting
-- ══════════════════════════════════════════════════════════════════════════════
--
-- PURPOSE
-- ───────
-- • Tracks anonymous scoring attempts using a SHA-256 fingerprint of
--   (IP + User-Agent), stored as identifier_hash.
-- • Enforces free-trial limits atomically using row-level locking (FOR UPDATE)
--   to prevent race conditions under concurrent requests.
-- • Records when a fingerprint last successfully used the API (last_used_at)
--   and when it was last blocked (last_blocked_at) — these are intentionally
--   separate to enable correct cleanup behaviour.
-- • Provides a cleanup function that removes rows inactive beyond the rolling retention window.
--
-- DESIGN DECISIONS
-- ────────────────
-- • identifier_hash = SHA-256(IP + UA): coarse fingerprint that balances
--   abuse detection with privacy — no PII is stored.
-- • last_used_at is NOT updated on blocked requests: persistent abusers
--   keep their row stale so cleanup_old_anonymous_usage() can evict them
--   once their retention window lapses.
-- • last_blocked_at IS updated on blocked requests: lets the frontend show
--   the user how long until their window resets.
-- • FOR UPDATE row lock: guarantees atomicity — concurrent requests for the
--   same fingerprint queue rather than race past the limit check.
--
-- RETURN SHAPE (check_and_increment_anonymous_usage)
-- ───────────────────────────────────────────────────
--   current_count   — usage count after this call
--   is_allowed      — false when count >= p_max_tries
--   last_used_at    — last successful use timestamp
--   last_blocked_at — last time limit was hit (NULL if never)
--
-- ACCESS CONTROL
-- ──────────────
-- • anonymous_usage table:
--     service_role — full access (all writes come from the Express backend).
--     anon         — SELECT only (read own usage, no writes via RLS).
-- • check_and_increment_anonymous_usage: service_role only.
-- • cleanup_old_anonymous_usage:         service_role only (cron / scheduled job).
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 0. CLEAN SLATE — Drop existing objects
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS anonymous_usage CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'cleanup_old_anonymous_usage',
        'check_and_increment_anonymous_usage'
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
-- 1. TABLE — anonymous_usage
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS anonymous_usage (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ── Fingerprint ──────────────────────────────────────────────────────────
    identifier_hash    TEXT        UNIQUE NOT NULL,  -- SHA-256(IP + User-Agent)
    last_ip_hash       TEXT,                         -- SHA-256 of most recent IP (abuse debugging)
    user_agent_snippet TEXT,                         -- first 200 chars of User-Agent

    -- ── Usage tracking ───────────────────────────────────────────────────────
    usage_count        INTEGER     NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    first_used_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- NOTE: last_used_at is intentionally NOT updated on blocked requests.
    -- Cleanup removes rows stale past the retention threshold, so persistent
    -- abusers are evicted after their trial window expires without resetting
    -- the clock on every blocked attempt.
    last_blocked_at    TIMESTAMPTZ,                  -- NULL = never blocked

    -- ── Audit ────────────────────────────────────────────────────────────────
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  anonymous_usage IS
    'Tracks anonymous scoring API attempts via IP+UA fingerprinting for free-trial enforcement.';
COMMENT ON COLUMN anonymous_usage.identifier_hash IS
    'SHA-256 of (IP + User-Agent). Matches scoring_results_log.identifier_hash for join-based abuse analysis.';
COMMENT ON COLUMN anonymous_usage.usage_count IS
    'Number of times this fingerprint has successfully called the scoring API.';
COMMENT ON COLUMN anonymous_usage.last_used_at IS
    'Timestamp of last successful (allowed) use. Intentionally not updated on blocked requests — drives the cleanup eviction window.';
COMMENT ON COLUMN anonymous_usage.last_blocked_at IS
    'Timestamp of most recent blocked attempt. NULL if never blocked. Returned to the frontend to compute days-until-reset.';
COMMENT ON COLUMN anonymous_usage.last_ip_hash IS
    'SHA-256 of the most recent client IP. For abuse debugging only — not used for fingerprinting.';
COMMENT ON COLUMN anonymous_usage.user_agent_snippet IS
    'First 200 chars of the User-Agent string. Stored for pattern analysis; not PII.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Accelerates cleanup queries (DELETE WHERE last_used_at < threshold)
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_last_used
    ON anonymous_usage (last_used_at);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;

-- service_role: full access — all writes come from the Express backend.
CREATE POLICY "anonymous_usage_service_role_full"
    ON anonymous_usage FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- anon: read-only — lets the frontend query remaining tries without a backend.
CREATE POLICY "anonymous_usage_anon_read"
    ON anonymous_usage FOR SELECT TO anon
    USING (true);

COMMENT ON POLICY "anonymous_usage_service_role_full" ON anonymous_usage IS
    'Service role has unrestricted access (all writes via Express backend).';
COMMENT ON POLICY "anonymous_usage_anon_read" ON anonymous_usage IS
    'Anonymous role may read usage rows (SELECT only — no writes).';


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 4a. cleanup_old_anonymous_usage ──────────────────────────────────────────
-- Removes rows that have not been used legitimately beyond the configured window threshold.
-- Because last_used_at is NOT updated on blocked attempts, persistent abusers
-- are automatically evicted after their trial window passes.
-- Called by a backend scheduled job (not pg_cron).

CREATE OR REPLACE FUNCTION cleanup_old_anonymous_usage(p_retention_days INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    DELETE FROM anonymous_usage
    WHERE last_used_at < NOW() - (p_retention_days || ' days')::INTERVAL;
END;
$$;

COMMENT ON FUNCTION cleanup_old_anonymous_usage IS
    'Deletes anonymous_usage rows whose last_used_at is older than the configured threshold parameter. '
    'Because last_used_at is not updated on blocked requests, persistent abusers '
    'are evicted once their trial window expires. Called by backend scheduled job.';


-- ── 4b. check_and_increment_anonymous_usage ──────────────────────────────────
-- Atomically checks the usage count for a fingerprint and either:
--   a) Resets/cleans up the row in-place if the window has passed since last legitimate use, or
--   b) Inserts a new row and returns count=1 (first use), or
--   c) Increments the count and returns the new count (under limit), or
--   d) Updates last_blocked_at only and returns is_allowed=false (at/over limit).
--
-- Row-level locking (FOR UPDATE) prevents race conditions: concurrent requests
-- for the same fingerprint queue at the SELECT rather than racing the limit check.
--
-- Returns:
--   current_count   — usage count after this call
--   is_allowed      — false when current_count >= p_max_tries
--   last_used_at    — timestamp of last successful use
--   last_blocked_at — timestamp of most recent block (NULL if never blocked)

CREATE OR REPLACE FUNCTION check_and_increment_anonymous_usage(
    p_max_tries          INTEGER,
    p_cleanup_days       INTEGER,
    p_identifier_hash    TEXT,
    p_ip_hash            TEXT    DEFAULT NULL,
    p_user_agent_snippet TEXT    DEFAULT NULL
)
RETURNS TABLE (
    current_count   INTEGER,
    is_allowed      BOOLEAN,
    last_used_at    TIMESTAMPTZ,
    last_blocked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    v_current_count   INTEGER;
    v_new_count       INTEGER;
    v_last_used_at    TIMESTAMPTZ;
    v_last_blocked_at TIMESTAMPTZ;
BEGIN
    -- ── Lock existing row and fetch current state ─────────────────────────────
    SELECT
        usage_count,
        au.last_used_at,
        au.last_blocked_at
    INTO
        v_current_count,
        v_last_used_at,
        v_last_blocked_at
    FROM anonymous_usage au
    WHERE identifier_hash = p_identifier_hash
    FOR UPDATE;   -- serialize concurrent requests for this fingerprint

    -- ── First use: insert with count = 1 ─────────────────────────────────────
    IF NOT FOUND THEN
        INSERT INTO anonymous_usage (
            identifier_hash,
            usage_count,
            last_ip_hash,
            user_agent_snippet
        ) VALUES (
            p_identifier_hash,
            1,
            p_ip_hash,
            LEFT(COALESCE(p_user_agent_snippet, ''), 200)
        );

        RETURN QUERY
        SELECT
            1::INTEGER,
            (1 <= p_max_tries)::BOOLEAN,
            NOW()::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- ── Inline Reset: If window has passed, wipe usage count in-place ────────
    -- This handles the case where a user returns after the window has expired,
    -- bypassing the need for a separate cron job.
    IF v_last_used_at < NOW() - (p_cleanup_days || ' days')::INTERVAL THEN
        UPDATE anonymous_usage
        SET
            usage_count        = 1,
            first_used_at      = NOW(),
            last_used_at       = NOW(),
            last_blocked_at    = NULL,
            last_ip_hash       = COALESCE(p_ip_hash, last_ip_hash),
            user_agent_snippet = COALESCE(LEFT(p_user_agent_snippet, 200), user_agent_snippet)
        WHERE identifier_hash = p_identifier_hash;

        RETURN QUERY
        SELECT
            1::INTEGER,
            (1 <= p_max_tries)::BOOLEAN,
            NOW()::TIMESTAMPTZ,
            NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- ── At or over limit: update last_blocked_at only ─────────────────────────
    IF v_current_count >= p_max_tries THEN
        UPDATE anonymous_usage
        SET last_blocked_at = NOW()
        WHERE identifier_hash = p_identifier_hash
        RETURNING
            anonymous_usage.last_used_at,
            anonymous_usage.last_blocked_at
        INTO v_last_used_at, v_last_blocked_at;

        RETURN QUERY
        SELECT
            v_current_count,
            FALSE,
            v_last_used_at,
            v_last_blocked_at;
        RETURN;
    END IF;

    -- ── Under limit: increment usage ──────────────────────────────────────────
    v_new_count := v_current_count + 1;

    UPDATE anonymous_usage
    SET
        usage_count        = v_new_count,
        last_used_at       = NOW(),
        last_ip_hash       = COALESCE(p_ip_hash, last_ip_hash),
        user_agent_snippet = COALESCE(LEFT(p_user_agent_snippet, 200), user_agent_snippet)
    WHERE identifier_hash = p_identifier_hash
    RETURNING
        anonymous_usage.last_used_at,
        anonymous_usage.last_blocked_at
    INTO v_last_used_at, v_last_blocked_at;

    RETURN QUERY
    SELECT
        v_new_count,
        (v_new_count <= p_max_tries)::BOOLEAN,
        v_last_used_at,
        v_last_blocked_at;
END;
$$;

COMMENT ON FUNCTION check_and_increment_anonymous_usage IS
    'Atomically checks and increments anonymous usage for a given fingerprint. '
    'Returns (current_count, is_allowed, last_used_at, last_blocked_at). '
    'Uses FOR UPDATE row-locking to prevent race conditions. '
    'Blocked attempts update only last_blocked_at — last_used_at is unchanged '
    'so persistent abusers are evicted once their window expires.';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. GRANTS & PERMISSIONS
-- ══════════════════════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION cleanup_old_anonymous_usage(integer)
    FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION cleanup_old_anonymous_usage(integer)
    TO service_role;

REVOKE EXECUTE ON FUNCTION check_and_increment_anonymous_usage(integer, integer, text, text, text)
    FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION check_and_increment_anonymous_usage(integer, integer, text, text, text)
    TO service_role;


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════

-- RLS enabled
SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  tablename = 'anonymous_usage';

-- Policies
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  tablename = 'anonymous_usage';

-- Function execute permissions (should show service_role only for both fns)
SELECT proname, proacl
FROM   pg_proc
JOIN   pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE  nspname = 'public'
  AND  proname IN ('check_and_increment_anonymous_usage', 'cleanup_old_anonymous_usage');
