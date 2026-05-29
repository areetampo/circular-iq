-- ============================================================
-- FILE: diagnostics/uptime_checks_distribution.sql
-- PURPOSE: Audit the frequency and recency of checks per endpoint
-- ============================================================


-- ------------------------------------------------------------
-- [1] Uptime checks distribution per endpoint
--
-- Computes aggregate frequency counts and captures the most recent
-- execution timestamp for each target service. Essential for
-- verifying that the background monitoring daemon is running on-schedule,
-- processing jobs uniformly, and not stalling on specific endpoints.
-- ------------------------------------------------------------

SELECT
    endpoint_id,
    COUNT(*) AS total_checks,
    MAX(created_at) AS last_check_at
FROM
    uptime_checks
GROUP BY
    endpoint_id
ORDER BY
    total_checks DESC;

-- output example:
-- [
--
-- ]
