-- ============================================================
-- FILE: diagnostics/replication_and_wal.sql
-- PURPOSE: WAL generation rate, replication lag, and checkpoint health
-- CONTEXT: Supabase uses streaming replication for HA replicas.
--   WAL (Write-Ahead Log) is also where logical replication
--   and Supabase Realtime read from. Lag here = Realtime lag.
-- ============================================================


-- ------------------------------------------------------------
-- [1] Replication slot status and lag
--
-- Replication slots retain WAL until the subscriber has consumed it.
-- An inactive slot with growing lag will eventually fill disk.
-- confirmed_flush_lsn vs pg_current_wal_lsn = bytes of WAL retained.
-- ------------------------------------------------------------

SELECT
  slot_name,
  plugin,
  slot_type,
  active,
  pg_size_pretty(
    pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)
  ) AS lag_behind_primary
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [2] Streaming replication lag per replica
--
-- Shows connected standbys and how far behind they are in bytes.
-- write_lag / flush_lag / replay_lag = progressive stages of applying WAL.
-- Important during heavy write periods or after long transactions.
-- ------------------------------------------------------------

SELECT
  application_name,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  write_lag,
  flush_lag,
  replay_lag,
  pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS total_lag_bytes
FROM pg_stat_replication
ORDER BY total_lag_bytes DESC;

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [3] WAL generation rate estimate
--
-- Estimates how much WAL is being written per second by measuring
-- the LSN advance over a short window. High WAL generation can
-- stress disk I/O and replicas. Useful for load characterisation.
-- NOTE: runs for ~5 seconds.
-- ------------------------------------------------------------

SELECT
  pg_size_pretty(
    pg_wal_lsn_diff(pg_current_wal_lsn(), start_lsn) / 5
  ) AS wal_per_second
FROM (SELECT pg_current_wal_lsn() AS start_lsn) t
CROSS JOIN pg_sleep(5)
CROSS JOIN LATERAL (SELECT pg_current_wal_lsn()) AS t2(end_lsn);

-- output example:
-- [
--
-- ]


-- ------------------------------------------------------------
-- [4] Checkpoint health
--
-- checkpoints_timed: vacuum/autovacuum triggered — normal
-- checkpoints_req: write pressure triggered — too frequent = problem
-- A high checkpoints_req / checkpoints_timed ratio means
-- checkpoint_completion_target or max_wal_size may need tuning.
-- buffers_clean / maxwritten_clean ratio reveals background writer pressure.
-- ------------------------------------------------------------

SELECT
  checkpoints_timed,
  checkpoints_req,
  round(checkpoints_req::numeric / nullif(checkpoints_timed + checkpoints_req, 0) * 100, 1) || '%' AS forced_pct,
  buffers_checkpoint,
  buffers_clean,
  maxwritten_clean,
  buffers_backend,
  stats_reset
FROM pg_stat_bgwriter;

-- output example:
-- [
--
-- ]
