-- ============================================================
-- FILE: diagnostics/connections_and_locks.sql
-- PURPOSE: Active connections, lock contention, and blocking queries
-- NOTE: Supabase free/pro tiers have connection limits.
--   Use this to catch connection leaks before hitting the cap.
-- ============================================================


-- ------------------------------------------------------------
-- [1] Connection summary by user and state
--
-- States: active, idle, idle in transaction, idle in transaction (aborted)
-- "idle in transaction" connections are dangerous — they hold
-- locks and prevent autovacuum from running on affected tables.
-- longest_in_state helps identify stale or stuck connections.
-- ------------------------------------------------------------

SELECT
  usename,
  state,
  count(*) AS connections,
  max(now() - state_change) AS longest_in_state
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
GROUP BY usename, state
ORDER BY connections DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Total connection count vs limit
--
-- Shows how close you are to the connection ceiling.
-- Supabase limits vary by plan. >80% of max_conn is a warning sign.
-- Consider pgBouncer / Supabase connection pooler if consistently high.
-- ------------------------------------------------------------

SELECT
  count(*) AS current_connections,
  max_conn,
  round(count(*)::numeric / max_conn * 100, 1) || '%' AS utilization_pct
FROM pg_stat_activity,
     (SELECT setting::int AS max_conn FROM pg_settings WHERE name = 'max_connections') limits
GROUP BY max_conn;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] Currently blocked queries
--
-- Shows which queries are waiting and what is blocking them.
-- waiting_duration > a few seconds warrants investigation.
-- The blocking_query column shows the culprit.
-- ------------------------------------------------------------

SELECT
  blocked.pid AS blocked_pid,
  blocked.usename AS blocked_user,
  now() - blocked.query_start AS waiting_duration,
  left(blocked.query, 200) AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.usename AS blocking_user,
  left(blocking.query, 200) AS blocking_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE cardinality(pg_blocking_pids(blocked.pid)) > 0;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Long-running queries (currently active)
--
-- Queries running longer than 30 seconds right now.
-- Adjust the interval threshold as needed.
-- These may be holding locks that block other operations.
-- ------------------------------------------------------------

SELECT
  pid,
  usename,
  now() - query_start AS duration,
  state,
  left(query, 300) AS query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '30 seconds'
  AND pid <> pg_backend_pid()
ORDER BY duration DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [5] Lock inventory (current held locks)
--
-- Lists all non-granted or non-trivial locks in the system.
-- Useful when you suspect lock contention but no query is
-- visibly blocked yet (e.g. during migrations or bulk writes).
-- ------------------------------------------------------------

SELECT
  locktype,
  relation::regclass AS table_name,
  mode,
  granted,
  pid,
  left(query, 150) AS query
FROM pg_locks
LEFT JOIN pg_stat_activity USING (pid)
WHERE relation IS NOT NULL
  AND locktype = 'relation'
ORDER BY granted, table_name;

-- output example:
-- [
--
-- ]
