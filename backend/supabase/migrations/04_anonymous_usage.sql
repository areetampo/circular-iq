-- Create table for tracking anonymous user limits
CREATE TABLE IF NOT EXISTS anonymous_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  first_used_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_ip_hash TEXT,
  user_agent_snippet TEXT
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_anonymous_usage_hash ON anonymous_usage(identifier_hash);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_last_used ON anonymous_usage(last_used_at);

-- Enable RLS (but allow anonymous inserts/updates)
ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access to anonymous_usage"
  ON anonymous_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Anonymous users can read their own records
CREATE POLICY "Anonymous users can read their usage"
  ON anonymous_usage
  FOR SELECT
  TO anon
  USING (true);

-- Add cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM anonymous_usage
  WHERE last_used_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE anonymous_usage IS 'Tracks anonymous user assessment attempts via IP+UA hashing';
COMMENT ON COLUMN anonymous_usage.identifier_hash IS 'SHA-256 hash of (IP + User Agent)';
COMMENT ON COLUMN anonymous_usage.usage_count IS 'Number of times this anonymous user has calculated scores';


-- ============================================================================
-- ATOMIC USAGE INCREMENT FUNCTION (Prevents race conditions)
-- ============================================================================

-- Atomic function to check and increment usage count in one transaction
CREATE OR REPLACE FUNCTION check_and_increment_anonymous_usage(
  p_identifier_hash TEXT,
  p_max_tries INTEGER,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent_snippet TEXT DEFAULT NULL
)
RETURNS TABLE(
  current_count INTEGER,
  is_allowed BOOLEAN
) AS $$
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
    -- First time user: insert new record
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

    -- Return: count=1, allowed=true (1 <= max_tries)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON FUNCTION check_and_increment_anonymous_usage IS
  'Atomically checks and increments anonymous usage count. Returns (current_count, is_allowed). Uses row locking to prevent race conditions.';
