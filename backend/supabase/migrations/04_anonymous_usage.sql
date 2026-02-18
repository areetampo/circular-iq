-- ============================================================================
-- Anonymous Usage Tracking Migration
-- ============================================================================
-- Purpose: Track anonymous user assessment limits via IP+UA fingerprinting
-- Security: Uses SHA-256 hashing for privacy, atomic operations for race conditions
-- Cleanup: Auto-deletes records older than 30 days

-- ============================================================================
-- TABLE: anonymous_usage
-- ============================================================================

CREATE TABLE IF NOT EXISTS anonymous_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash TEXT UNIQUE NOT NULL, -- SHA-256(IP + UA) - UNIQUE creates implicit index
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  first_used_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip_hash TEXT,
  user_agent_snippet TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- NOTE: identifier_hash UNIQUE constraint creates implicit index automatically
-- So we DON'T need: CREATE INDEX idx_anonymous_usage_hash ON anonymous_usage(identifier_hash);
-- This would be a duplicate and cause the performance warning!

-- Index for cleanup queries (finding old records)
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_last_used ON anonymous_usage(last_used_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (backend API)
CREATE POLICY "Service role has full access to anonymous_usage"
  ON anonymous_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Anonymous users can read their own usage stats
CREATE POLICY "Anonymous users can read their usage"
  ON anonymous_usage
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- FUNCTION: cleanup_old_anonymous_usage
-- ============================================================================
-- Purpose: Delete records older than 30 days
-- Schedule: Run via cron job or manual cleanup
-- Security: SECURITY DEFINER with immutable search_path

CREATE OR REPLACE FUNCTION cleanup_old_anonymous_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public -- ✅ FIX: Use "TO" instead of "=" for immutable search_path
AS $$
BEGIN
  DELETE FROM anonymous_usage
  WHERE last_used_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_anonymous_usage IS
  'Deletes anonymous usage records older than 30 days. Run periodically to maintain table size.';

-- ============================================================================
-- FUNCTION: check_and_increment_anonymous_usage
-- ============================================================================
-- Purpose: Atomically check limit and increment usage count
-- Returns: (current_count, is_allowed) for each attempt
-- Security: Uses FOR UPDATE row locking to prevent race conditions
--           SECURITY DEFINER with immutable search_path

CREATE OR REPLACE FUNCTION check_and_increment_anonymous_usage(
  p_identifier_hash TEXT,
  p_max_tries INTEGER,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent_snippet TEXT DEFAULT NULL
)
RETURNS TABLE(
  current_count INTEGER,
  is_allowed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public -- ✅ FIX: Use "TO" instead of "=" for immutable search_path
AS $$
DECLARE
  v_current_count INTEGER;
  v_new_count INTEGER;
BEGIN
  -- Try to get existing record with row lock (prevents concurrent updates)
  SELECT usage_count INTO v_current_count
  FROM anonymous_usage
  WHERE identifier_hash = p_identifier_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First time user: insert new record with count=1
    INSERT INTO anonymous_usage (
      identifier_hash,
      usage_count,
      last_ip_hash,
      user_agent_snippet
    )
    VALUES (
      p_identifier_hash,
      1,
      p_ip_hash,
      p_user_agent_snippet
    );

    -- Return: count=1, allowed=(1 <= max_tries)
    RETURN QUERY SELECT 1::INTEGER, (1 <= p_max_tries)::BOOLEAN;
    RETURN;
  END IF;

  -- Existing user: check if already at limit
  IF v_current_count >= p_max_tries THEN
    -- Already at/over limit: return current count, not allowed
    RETURN QUERY SELECT v_current_count, FALSE;
    RETURN;
  END IF;

  -- Under limit: increment counter
  v_new_count := v_current_count + 1;

  UPDATE anonymous_usage
  SET
    usage_count = v_new_count,
    last_used_at = NOW(),
    last_ip_hash = COALESCE(p_ip_hash, last_ip_hash),
    user_agent_snippet = COALESCE(p_user_agent_snippet, user_agent_snippet)
  WHERE identifier_hash = p_identifier_hash;

  -- Return new count and whether it's still allowed
  RETURN QUERY SELECT v_new_count, (v_new_count <= p_max_tries)::BOOLEAN;
END;
$$;

COMMENT ON FUNCTION check_and_increment_anonymous_usage IS
  'Atomically checks and increments anonymous usage count. Returns (current_count, is_allowed). Uses FOR UPDATE row locking to prevent race conditions.';

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE anonymous_usage IS
  'Tracks anonymous user assessment attempts via IP+UA hashing for free trial limits';

COMMENT ON COLUMN anonymous_usage.identifier_hash IS
  'SHA-256 hash of (IP + User Agent) for privacy-preserving user tracking';

COMMENT ON COLUMN anonymous_usage.usage_count IS
  'Number of times this anonymous user has calculated scores';

COMMENT ON COLUMN anonymous_usage.last_ip_hash IS
  'SHA-256 hash of most recent IP address (for debugging, not for tracking)';

COMMENT ON COLUMN anonymous_usage.user_agent_snippet IS
  'First 100 characters of User Agent string (for debugging)';

-- ============================================================================
-- Restrict direct execution of the anonymous-usage RPC from public/anon roles
-- Only the backend service role should be able to execute this function.
-- ============================================================================
REVOKE EXECUTE ON FUNCTION check_and_increment_anonymous_usage(text, integer, text, text) FROM public, anon;
