-- backend/database/diagnostics/uptime_checks_distribution.sql
-- Purpose: Audit the frequency and recency of checks per endpoint from Migration 07

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

-- output example

[
  {
    "endpoint_id": "config",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "database",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "database-aiven",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "detailed",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "health",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "liveness",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "openai",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "readiness",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "system",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  },
  {
    "endpoint_id": "version",
    "total_checks": 2085,
    "last_check_at": "2026-05-13 00:33:24.672862+00"
  }
]
