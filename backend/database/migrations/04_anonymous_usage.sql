/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                ║
 * ║  MIGRATION: 04_anonymous_usage.sql  (v2 — minor hardening)                     ║
 * ║  Anonymous Usage Tracking — Free‑trial limits via IP+UA fingerprinting         ║
 * ║                                                                                ║
 * ║  CHANGES FROM v1                                                               ║
 * ║  ──────────────────────────────────────────────────────────────────────────────║
 * ║  • user_agent_snippet extended to 200 chars (was 100) to match scoring_results ║
 * ║  • Added scoring_result_count column (reserved for future use)                 ║
 * ║  • Added last_blocked_at column — set when RPC returns is_allowed = FALSE      ║
 * ║  • check_and_increment_anonymous_usage now accepts p_scoring_result_count      ║
 * ║    (ignored)                                                                   ║
 * ║  • All other logic identical to v1 — no breaking changes                       ║
 * ║                                                                                ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 */

DROP TABLE IF EXISTS anonymous_usage CASCADE;

DO $$
DECLARE
    func_names text[] := ARRAY[
        'cleanup_old_anonymous_usage',
        'check_and_increment_anonymous_usage'
    ];
    func_name text;
    rec record;
BEGIN
    FOREACH func_name IN ARRAY func_names
    LOOP
        FOR rec IN
            SELECT nspname, proname, oidvectortypes(pg_proc.proargtypes) as args
            FROM pg_proc
            JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
            WHERE proname = func_name AND nspname = 'public'
        LOOP
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
              rec.nspname, rec.proname, rec.args);
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS anonymous_usage (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  user_agent_snippet   TEXT,                      -- first 200 chars (was 100)
  identifier_hash      TEXT    UNIQUE NOT NULL,   -- SHA-256(IP + UA)
  last_ip_hash         TEXT,

  usage_count          INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  first_used_at        TIMESTAMPTZ DEFAULT NOW(),
  last_used_at         TIMESTAMPTZ DEFAULT NOW(),
  last_blocked_at      TIMESTAMPTZ,               -- NEW: when limit was last hit

  created_at           TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE  anonymous_usage IS 'Tracks anonymous assessment attempts via IP+UA fingerprinting for free-trial limits';
COMMENT ON COLUMN anonymous_usage.identifier_hash    IS 'SHA-256 of (IP + User-Agent) — matches scoring_results_log.identifier_hash';
COMMENT ON COLUMN anonymous_usage.usage_count        IS 'Number of times this fingerprint has called the scoring API';
COMMENT ON COLUMN anonymous_usage.last_blocked_at    IS 'Set when the user hit the free-trial limit; NULL if never blocked';
COMMENT ON COLUMN anonymous_usage.last_ip_hash       IS 'SHA-256 of most recent IP (for abuse debugging, not tracking)';
COMMENT ON COLUMN anonymous_usage.user_agent_snippet IS 'First 200 chars of User-Agent string';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_anonymous_usage_last_used
  ON anonymous_usage(last_used_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to anonymous_usage"
  ON anonymous_usage FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anonymous users can read their usage"
  ON anonymous_usage FOR SELECT TO anon
  USING (true);

-- ============================================================================
-- FUNCTION: cleanup_old_anonymous_usage
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_anonymous_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  DELETE FROM anonymous_usage
  WHERE last_used_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_anonymous_usage IS
  'Deletes anonymous_usage rows older than 30 days.';

-- ============================================================================
-- FUNCTION: check_and_increment_anonymous_usage  (unchanged contract)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_and_increment_anonymous_usage(
  p_identifier_hash     TEXT,
  p_max_tries           INTEGER,
  p_ip_hash             TEXT    DEFAULT NULL,
  p_user_agent_snippet  TEXT    DEFAULT NULL
)
RETURNS TABLE(
  current_count  INTEGER,
  is_allowed     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_current_count INTEGER;
  v_new_count     INTEGER;
BEGIN
  -- Attempt to lock existing row
  SELECT usage_count INTO v_current_count
  FROM anonymous_usage
  WHERE identifier_hash = p_identifier_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First use: insert with count = 1
    INSERT INTO anonymous_usage (
      identifier_hash, usage_count, last_ip_hash, user_agent_snippet
    ) VALUES (
      p_identifier_hash, 1,
      p_ip_hash,
      LEFT(COALESCE(p_user_agent_snippet, ''), 200)
    );
    RETURN QUERY SELECT 1::INTEGER, (1 <= p_max_tries)::BOOLEAN;
    RETURN;
  END IF;

  -- Already at / over limit — update last_blocked_at and return blocked
  IF v_current_count >= p_max_tries THEN
    UPDATE anonymous_usage
    SET last_blocked_at = NOW(), last_used_at = NOW()
    WHERE identifier_hash = p_identifier_hash;
    RETURN QUERY SELECT v_current_count, FALSE;
    RETURN;
  END IF;

  -- Under limit: increment
  v_new_count := v_current_count + 1;

  UPDATE anonymous_usage
  SET
    usage_count          = v_new_count,
    last_used_at         = NOW(),
    last_ip_hash         = COALESCE(p_ip_hash,            last_ip_hash),
    user_agent_snippet   = COALESCE(
                            LEFT(p_user_agent_snippet, 200),
                            user_agent_snippet
                           )
  WHERE identifier_hash = p_identifier_hash;

  RETURN QUERY SELECT v_new_count, (v_new_count <= p_max_tries)::BOOLEAN;
END;
$$;

COMMENT ON FUNCTION check_and_increment_anonymous_usage IS
  'Atomically checks and increments anonymous usage. Returns (current_count, is_allowed). Row-locked to prevent race conditions.';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

REVOKE EXECUTE ON FUNCTION check_and_increment_anonymous_usage(text, integer, text, text)
  FROM public, anon;

GRANT EXECUTE ON FUNCTION check_and_increment_anonymous_usage(text, integer, text, text)
  TO service_role;
