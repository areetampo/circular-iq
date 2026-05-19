# Uptime Monitor – Architecture & Usage

A real-time health monitoring dashboard that continuously checks backend API health. The backend polls endpoints every 30 seconds **only in production**, stores results in Supabase, and broadcasts live updates to the frontend via Server-Sent Events (SSE). The frontend reads historical data on load and then stays in sync through the SSE stream, falling back to polling if the connection is lost.

> **Important**: The `uptime_checks` table cleanup is controlled by the `UPTIME_CHECKS_CLEANUP_ON_START` environment variable (default: `true`), ensuring fresh monitoring data for production deployments.
>
> **Note**: `queryWindowDaysLimit` (`VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT` on the frontend, `UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT` on the backend) caps how far back any query will look. `retentionDays` (`UPTIME_CHECKS_RETENTION_DAYS`) controls how long raw check data is kept in the database. The constraint `queryWindowDaysLimit` ≤ `retentionDays` must hold — querying beyond the retention window returns no data.
>
> **Database-level settings**: Two additional runtime parameters live in `app.settings` (migration `00_app_settings.sql`) and are read by the SQL analytics functions directly — independent of env vars. See the [Database-level Runtime Settings](#database-level-runtime-settings-appsettings) section for details.

---

## How It Works

1. **Backend polling** – When the server starts in **production only**, a polling service runs every 30 seconds. It calls each health endpoint (e.g., `/health`, `/health/database`, `/health/openai`), measures response time, and captures the JSON response.

2. **Storage** – Each result is inserted into the `uptime_checks` table in Supabase using the `service_role` key. No frontend writes are involved.

3. **SSE broadcast** – After a successful batch insert, the polling service broadcasts a `poll-complete` event to all connected SSE clients via `uptime.broadcaster.js`. Clients receive live updates without polling.

4. **Environment-controlled cleanup** – The `UPTIME_CHECKS_CLEANUP_ON_START` environment variable controls whether the `uptime_checks` table is wiped clean on server start (default: `true`). This ensures fresh monitoring data for each deployment when enabled.

5. **Frontend display** – On load, the React page fetches historical data via `GET /api/uptime/history/:endpointId` (up to `MAX_HISTORY_PER_ENDPOINT` = 3500 checks per endpoint), then opens an SSE connection to `GET /api/uptime/stream` to receive live `poll-complete` events. The header shows the **total number of checks in the database** (fetched from `/api/uptime/count`).

6. **Fallback** – If the SSE connection drops, the frontend automatically falls back to polling every 30 seconds and displays a disconnect banner with a manual reconnect button (also shown during initial load or reconnection attempts).

7. **Cleanup** – On server start, `uptime_checks` is truncated if `UPTIME_CHECKS_CLEANUP_ON_START` is `true` (default). A daily background job then deletes records older than `retentionDays` (30 days; configurable via `UPTIME_CHECKS_RETENTION_DAYS`). Both only run in production.

8. **UI** – The page shows:
   - Summary stats (overall uptime, status, total checks fetched in session, update interval)
   - Clock-aligned buckets toggle (checkbox in header) — when enabled, all bucketed charts snap their boundaries to clean clock marks instead of rolling from the current moment
   - Disconnect banner + reconnect button when SSE is unavailable
   - Four charts in a 2×2 grid:
     - Health distribution pie — categorises endpoints as healthy / degraded / unhealthy / no data based on latest SSE result or history fallback
     - Global average response time line — hourly buckets, configurable window via `TREND_CHART_HOURS`
     - Uptime over time line — daily averages, configurable window via `UPTIME_CHART_DAYS`
     - Average latency by endpoint bar — per-endpoint 24h average, configurable via `LATENCY_CHART_HOURS`
   - A full-width status heatmap fetched from `/api/uptime/heatmap-aggregated` (bucket size `HEATMAP_DEFAULT_BUCKET_MINUTES` = 60 min, window `HEATMAP_DEFAULT_WINDOW_DAYS` = 28 days)
   - Detailed endpoint cards, each with:
     - Recent raw history bar + sparkline (last `ENDPOINT_CARD_RECENT_WINDOW_MINUTES` = 60 min)
     - Aggregated history bar + bucketed line chart (last `ENDPOINT_CARD_HISTORY_WINDOW_HOURS` = 24h, `ENDPOINT_CARD_HISTORY_BUCKET_MINUTES` = 15-min buckets)
     - Footer metrics (uptime %, avg latency, status, checks count) — all scoped to the last 24h window

---

## Components & Files (Frontend)

| File                                      | Description                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UptimeMonitorPage.jsx`                   | Main page — assembles all components, manages `clockAligned` boolean state (checkbox toggle), passes it as a prop to all bucketed chart components. Displays summary stats and SSE status UI.                                                                                                      |
| `constants.js`                            | All frontend timing constants — see Constants section below.                                                                                                                                                                                                                                       |
| `hooks/useUptimeMonitor.js`               | Manages SSE connection, reactive fallback polling (via `useEffect` watching `isUsingFallback`), reconnect logic, `pollCount` counter (incremented on each SSE event to trigger component refetches), and `latestPollResults` for `HealthDistributionChart`.                                        |
| `utils/uptimeHelpers.js`                  | All API fetch functions: `fetchHistory`, `fetchDailyStats`, `fetchHeatmapAggregated`, `fetchGlobalTrend`, `fetchEndpointLatency`, `fetchEndpointBuckets`.                                                                                                                                          |
| `utils/uptimeCharts.js`                   | Pure data utilities: `getHealthDistribution` (history fallback for pie chart), `getRecentRawChecks` (sparkline data points for recent checks section).                                                                                                                                             |
| `components/EndpointCard.jsx`             | Endpoint card — two sections: recent raw (60-min sparkline) and aggregated (24h history bar + bucketed line chart). Footer metrics scoped to `ENDPOINT_CARD_HISTORY_WINDOW_HOURS` window. Accepts `clockAligned` prop; re-fetches buckets when it changes.                                         |
| `components/HistoryGrid.jsx`              | Colour-coded dot history bar. Two modes: **raw** (individual checks, no partial indicator) and **aggregated** (DB-backed buckets, partial bucket rendered in clock-aligned colour). Tooltips show time range, status, avg latency, and individual failure timestamps including on partial buckets. |
| `components/HealthDistributionChart.jsx`  | Pie chart — uses `latestPollResults` from SSE as primary source, falls back to `history` state before first SSE event. No periodic refetch needed.                                                                                                                                                 |
| `components/GlobalResponseTrendChart.jsx` | Line chart of global avg response time. Fetches from `/api/uptime/global-trend`. Accepts `clockAligned` prop; resets loading state and refetches on toggle. Silent background updates on subsequent polls (no loading flash).                                                                      |
| `components/UptimeOverTimeChart.jsx`      | Line chart of daily uptime % over `UPTIME_CHART_DAYS` days. Fetches from `/api/uptime/daily-stats`. Silent background updates on subsequent polls.                                                                                                                                                 |
| `components/StatusHeatmap.jsx`            | Full-width heatmap of bucketed status. Fetches from `/api/uptime/heatmap-aggregated`. Accepts `clockAligned` prop; refetches on toggle. Tooltip shows time range, status, avg latency, and per-failure `endpointId` + timestamp.                                                                   |
| `components/EndpointLatencyBarChart.jsx`  | Bar chart of per-endpoint avg latency over `LATENCY_CHART_HOURS`. Fetches from `/api/uptime/endpoint-latency`. Silent background updates on subsequent polls. Bar colours: green < 200ms, yellow < 500ms, red ≥ 500ms.                                                                             |
| `components/ExportMetricsButton.jsx`      | Exports all in-session checks as CSV. Disabled when no data.                                                                                                                                                                                                                                       |
| `components/StatSummaryCard.jsx`          | Reusable stat tile used in the summary grid.                                                                                                                                                                                                                                                       |
| `components/SectionLabel.jsx`             | Section divider above endpoint cards.                                                                                                                                                                                                                                                              |

---

## Backend API Endpoints (Public)

| Method | Path                                                                                         | Description                                                                                                                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/uptime/history/:endpointId?limit=3500`                                                 | Raw checks for one endpoint (frontend default 3500, backend max 86400). Returns `{ endpointId, checks[] }`.                                                                                                                            |
| `GET`  | `/api/uptime/count`                                                                          | Total stored checks in DB. Used for header counter. When no `endpointId` is supplied, returns a fast approximate count via `pg_class.reltuples` (no table scan). When `endpointId` is supplied, returns an exact count via index scan. |
| `GET`  | `/api/uptime/stream`                                                                         | SSE stream — pushes `connected` and `poll-complete` events.                                                                                                                                                                            |
| `GET`  | `/api/uptime/daily-stats?days=28`                                                            | Daily uptime % per day for last N days (max `queryWindowDaysLimit`). Echoes back `days`.                                                                                                                                               |
| `GET`  | `/api/uptime/heatmap-aggregated?bucketMinutes=180&days=28&reference=<ms>&clockAligned=false` | Bucketed heatmap data. Supports clock-aligned mode. Echoes back `days`, `bucketMinutes`, `clockAligned`.                                                                                                                               |
| `GET`  | `/api/uptime/global-trend?hours=24&clockAligned=false`                                       | Hourly avg response time across all endpoints for last N hours. Echoes back `hours`, `clockAligned`.                                                                                                                                   |
| `GET`  | `/api/uptime/endpoint-latency?hours=24`                                                      | Per-endpoint avg latency scalar for last N hours. Echoes back `hours`.                                                                                                                                                                 |
| `GET`  | `/api/uptime/endpoint-buckets/:endpointId?bucketMinutes=15&hours=24&clockAligned=false`      | Bucketed avg response time for one endpoint. Supports clock-aligned mode. Echoes back `bucketMinutes`, `hours`, `clockAligned`.                                                                                                        |

All endpoints are **public** (no authentication). The backend write path (polling → Supabase insert) is never exposed via HTTP.

### Clock-aligned mode

Three endpoints support `clockAligned=true`: `/heatmap-aggregated`, `/global-trend`, and `/endpoint-buckets`. When enabled, bucket boundaries snap to the nearest clean clock mark (e.g. whole hours, whole 15-minute slots) instead of rolling from the current moment. The newest bucket is always marked `isPartial: true` since its window hasn't closed yet. When disabled (default), boundaries are rolling from the current timestamp.

### Echoed-back response fields

Every aggregation endpoint echoes back its effective parameters (`hours`, `days`, `bucketMinutes`, `clockAligned`) so components can derive heading labels from the server response rather than importing constants directly — consistent with how `days` was already echoed by `/daily-stats` and `/heatmap-aggregated`.

### GET `/api/uptime/daily-stats`

```json
{
  "stats": [
    { "day": "2026-05-14", "uptimePct": 98.2 },
    { "day": "2026-05-15", "uptimePct": 99.5 }
  ],
  "days": 28
}
```

### GET `/api/uptime/heatmap-aggregated`

```json
{
  "buckets": [
    {
      "startTime": "2026-05-15T10:00:00.000Z",
      "endTime": "2026-05-15T11:00:00.000Z",
      "anyFailure": false,
      "hasData": true,
      "averageMs": 245,
      "isWarning": false,
      "failureDetails": [],
      "isPartial": false
    }
  ],
  "days": 28,
  "bucketMinutes": 180,
  "clockAligned": true
}
```

`isWarning` is `true` when average response time exceeds the `uptime_checks-uptime_warning_threshold_ms` setting in `app.settings` (default 1000 ms).

### GET `/api/uptime/global-trend`

```json
{
  "trend": [
    { "hourLabel": "2026-05-15T09:00:00.000Z", "avgResponseTime": 241 },
    { "hourLabel": "2026-05-15T10:00:00.000Z", "avgResponseTime": 267 }
  ],
  "hours": 24,
  "clockAligned": true
}
```

`hourLabel` is a `TIMESTAMPTZ` — the frontend converts it to local time via `formatTimestamp`.

### GET `/api/uptime/endpoint-latency`

```json
{
  "latency": [
    { "endpointId": "openai", "avgMs": 312 },
    { "endpointId": "database", "avgMs": 198 }
  ],
  "hours": 24
}
```

### GET `/api/uptime/endpoint-buckets/:endpointId`

```json
{
  "endpointId": "health",
  "buckets": [
    {
      "startTime": "2026-05-15T09:00:00.000Z",
      "endTime": "2026-05-15T09:15:00.000Z",
      "avgMs": 231,
      "hasData": true,
      "anyFailure": false,
      "failureDetails": [],
      "isPartial": false
    }
  ],
  "bucketMinutes": 15,
  "hours": 24,
  "clockAligned": true
}
```

`failureDetails` is an array of `{ ts }` objects (no `endpointId` since the endpoint is fixed). `isPartial` marks the last open bucket.

---

## SSE Events

| Event           | Direction       | Payload                    | Description                                  |
| --------------- | --------------- | -------------------------- | -------------------------------------------- |
| `connected`     | Server → Client | `{ timestamp }`            | Sent immediately on connection open.         |
| `poll-complete` | Server → Client | `{ timestamp, results[] }` | Sent after each successful poll + DB insert. |
| `: heartbeat`   | Server → Client | _(SSE comment, no data)_   | Sent every 30s to keep the connection alive. |

`results[]` shape:

```js
{
  endpointId: string,
  up: boolean,
  responseTimeMs: number,
  status: string
}
```

On receiving `poll-complete`, `useUptimeMonitor` does three things: appends new checks to in-memory `history`, updates `latestPollResults` (used by `HealthDistributionChart`), and increments `pollCount`. The `pollCount` increment is what triggers all chart components to refetch their aggregated data from the DB.

---

## SSE Architecture

```txt
uptimePolling.service.js
  └── runPoll()
        ├── pings all endpoints in parallel
        ├── batch-inserts to Supabase
        └── broadcastUptimeEvent('poll-complete', { results })
                └── uptime.broadcaster.js
                          └── writes to all clients in Set

uptime.routes.js  /stream
  ├── addClient(res)     ← uptime.broadcaster.js
  └── removeClient(res)  on request close
```

`uptime.broadcaster.js` owns the `clients` Set and is the single source of truth for connected clients. Both the routes file and the polling service import from it — no circular dependency.

---

## Frontend SSE Flow (`useUptimeMonitor`)

1. **Initial load** – `loadAllHistory()` fetches up to `MAX_HISTORY_PER_ENDPOINT` checks per endpoint. The countdown is initialised from the most recent check's timestamp so it reflects the actual remaining time in the backend's poll cycle, not a hardcoded 30s.

2. **SSE connect** – After initial load completes, `connectSSE()` opens an `EventSource` to `/api/uptime/stream`.

3. **Live updates** – Each `poll-complete` event appends new checks to in-memory history, updates `latestPollResults`, increments `pollCount`, and resets the countdown to 30s. Chart components watching `pollCount` re-fetch their aggregated data silently in the background.

4. **Error / disconnect** – `onerror` closes the `EventSource` and sets `isUsingFallback = true`. A reactive `useEffect` watching `isUsingFallback` automatically starts or stops the fallback polling interval.

5. **Reconnect** – The reconnect button calls `connectSSE()` again. It is shown and enabled whenever `isUsingFallback`, `isReconnecting`, or `hasNoData` is true.

---

## Database Schema (Supabase)

> **Migration dependency**: `07_uptime_monitor.sql` depends on `00_app_settings.sql`. Migration 00 must be run first — it creates the `app` schema, the `app.settings` table, and the `app.get_setting()` accessor function that all analytics functions in 07 call at query time. See [Database-level Runtime Settings](#database-level-runtime-settings-appsettings) below.

Table: `uptime_checks`

| Column             | Type        | Description                                  |
| ------------------ | ----------- | -------------------------------------------- |
| `id`               | UUID        | Primary key                                  |
| `endpoint_id`      | TEXT        | e.g. `health`, `database`, `openai`          |
| `endpoint_path`    | TEXT        | e.g. `/health`, `/health/database`           |
| `status`           | TEXT        | Status string from health endpoint           |
| `up`               | BOOLEAN     | `true` if endpoint responded with OK         |
| `response_time_ms` | INTEGER     | Response time in ms (NULL for failed checks) |
| `payload`          | JSONB       | Full JSON response from health endpoint      |
| `created_at`       | TIMESTAMPTZ | When the check was performed (UTC)           |

**Indexes:**

- `idx_uptime_endpoint_created` on `(endpoint_id, created_at DESC)` — per-endpoint time-series queries
- `idx_uptime_created_at` on `(created_at)` — global time filters and retention cleanup

**SQL Functions (migration 07):**

All analytics functions are implemented as `LANGUAGE sql` using `generate_series + LEFT JOIN + GROUP BY` — a single index scan per call across the full query window. The previous plpgsql loop implementation issued one index scan per bucket, which was the primary source of slow query time on this table.

All query window caps are enforced inside the SQL functions by reading `app.get_setting('uptime_checks-query_window_days')` from `app.settings` at query time. The warning threshold for `is_warning` is similarly read from `app.get_setting('uptime_checks-uptime_warning_threshold_ms')`. These are DB-level settings, not env vars — see [Database-level Runtime Settings](#database-level-runtime-settings-appsettings).

| Function                          | Signature                                                                                                              | Description                                                                                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cleanup_old_uptime_checks`       | `(days INTEGER DEFAULT 30)`                                                                                            | Deletes checks older than N days. `days=0` truncates the table. Called by backend job (not pg_cron).                                                                                                                                                                                         |
| `get_daily_uptime_stats`          | `(days INTEGER DEFAULT 28)`                                                                                            | Daily avg uptime % across all endpoints for last N days. Window capped at `uptime_checks-query_window_days`.                                                                                                                                                                                 |
| `get_heatmap_buckets`             | `(bucket_minutes INT, days INT, p_reference_ts BIGINT, p_clock_aligned BOOLEAN DEFAULT FALSE)`                         | Time-bucketed status for all endpoints. Supports clock-aligned mode. Window capped at `uptime_checks-query_window_days` days. Returns `failure_details` as `[{ endpointId, endpointPath, ts }]`. `isWarning` is `true` when `averageMs` exceeds `uptime_checks-uptime_warning_threshold_ms`. |
| `get_global_response_trend`       | `(p_hours INT DEFAULT 24, p_clock_aligned BOOLEAN DEFAULT FALSE)`                                                      | Hourly avg response time across all endpoints. Supports clock-aligned mode. Hours capped at `uptime_checks-query_window_days * 24`. Empty hours return 0, not NULL.                                                                                                                          |
| `get_endpoint_avg_latency`        | `(p_hours INT DEFAULT 24)`                                                                                             | Per-endpoint avg response time scalar for last N hours. Window capped at `uptime_checks-query_window_days * 24` hours.                                                                                                                                                                       |
| `get_endpoint_buckets`            | `(p_endpoint_id TEXT, p_bucket_minutes INT DEFAULT 15, p_hours INT DEFAULT 24, p_clock_aligned BOOLEAN DEFAULT FALSE)` | Bucketed avg response time for one endpoint. Supports clock-aligned mode. Window capped at `uptime_checks-query_window_days * 24` hours. Returns `failure_details` as `[{ ts }]`.                                                                                                            |
| `get_uptime_check_count_estimate` | `()`                                                                                                                   | Fast approximate row count via `pg_class.reltuples`. No table scan. Accurate to ~1% given tuned autovacuum. Used by `/api/uptime/count` (no filter).                                                                                                                                         |

**Clock-aligned SQL logic:**

When `p_clock_aligned=TRUE`, bucket boundaries snap to the nearest UTC clock mark for the given bucket size (e.g. `:00`, `:15`, `:30`). All edges are clean; the newest bucket always straddles the current time and is therefore `is_partial = true`. Rolling mode (default) builds forward from `now − window` with no snapping.

**RLS:** `service_role` has full access. `authenticated` and `anon` have SELECT only via a `FOR SELECT` policy — no writes permitted through PostgREST. Autovacuum tuned to `scale_factor = 0.02 / 0.01` for high-frequency writes.

---

## Database-level Runtime Settings (`app.settings`)

Migration `00_app_settings.sql` creates the `app` schema, an `app.settings` key/value table, and a `SECURITY DEFINER` accessor function `app.get_setting(key TEXT)`. This replaces hardcoded constants inside SQL functions and allows runtime reconfiguration without redeploying migrations.

**These settings are not env vars** — they live in the database and are read by the SQL analytics functions at query time via `app.get_setting(key)`. To change them, run an `UPDATE` directly against `app.settings` using `service_role`.

| Key                                         | Default | Read by                                                                                                                          | Description                                                                                                                               |
| ------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `uptime_checks-query_window_days`           | `28`    | `get_daily_uptime_stats`, `get_global_response_trend`, `get_endpoint_avg_latency`, `get_heatmap_buckets`, `get_endpoint_buckets` | Maximum number of days any analytics function will look back. Acts as a hard cap on the `days` / `hours` parameter passed by callers.     |
| `uptime_checks-uptime_warning_threshold_ms` | `1000`  | `get_heatmap_buckets`                                                                                                            | Average response time threshold (ms) above which a bucket's `is_warning` flag is set to `true`. Only applies to buckets with no failures. |

**To update a setting at runtime:**

```sql
UPDATE app.settings
SET value = '14', updated_at = NOW()
WHERE key = 'uptime_checks-query_window_days';

UPDATE app.settings
SET value = '500', updated_at = NOW()
WHERE key = 'uptime_checks-uptime_warning_threshold_ms';
```

**Access control for `app.settings`:**

- `service_role` — `SELECT` on the table; `EXECUTE` on `app.get_setting()`.
- `anon` / `authenticated` — no access to the table or the function. All reads are proxied through `SECURITY DEFINER` analytics functions called via the Express backend.
- RLS is intentionally **not** enabled on `app.settings` — the schema-level grants and function-level revokes are sufficient, and RLS would be redundant given the access pattern.

> **Constraint**: `uptime_checks-query_window_days` should be ≤ `UPTIME_CHECKS_RETENTION_DAYS`. Querying beyond the retention window returns no data since rows have already been deleted.

---

## Constants (`constants.js`)

| Constant                               | Default | Used by                    | Description                                                                                                               |
| -------------------------------------- | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `REFETCH_INTERVAL_MS`                  | `30000` | `useUptimeMonitor`         | Fallback polling interval and countdown reset value. Read from `frontend.config.js`.                                      |
| `MAX_HISTORY_PER_ENDPOINT`             | `3500`  | `useUptimeMonitor`         | Max checks fetched per endpoint on load. Covers ~29h at 30s intervals (buffer above 24h). Read from `frontend.config.js`. |
| `TREND_CHART_HOURS`                    | `24`    | `GlobalResponseTrendChart` | Time window for global response trend line chart.                                                                         |
| `UPTIME_CHART_DAYS`                    | `28`    | `UptimeOverTimeChart`      | Days of daily uptime stats to fetch and display.                                                                          |
| `LATENCY_CHART_HOURS`                  | `24`    | `EndpointLatencyBarChart`  | Time window for per-endpoint latency bar chart.                                                                           |
| `HEATMAP_DEFAULT_BUCKET_MINUTES`       | `60`    | `StatusHeatmap`            | Bucket size for the heatmap.                                                                                              |
| `HEATMAP_DEFAULT_WINDOW_DAYS`          | `28`    | `StatusHeatmap`            | Days of history shown in the heatmap.                                                                                     |
| `ENDPOINT_CARD_RECENT_WINDOW_MINUTES`  | `60`    | `EndpointCard`             | Window for the recent raw checks history bar and sparkline.                                                               |
| `ENDPOINT_CARD_HISTORY_WINDOW_HOURS`   | `24`    | `EndpointCard`             | Window for the aggregated history bar, line chart, and all footer metrics (uptime %, avg latency, status, checks count).  |
| `ENDPOINT_CARD_HISTORY_BUCKET_MINUTES` | `15`    | `EndpointCard`             | Bucket size for the aggregated history bar and line chart.                                                                |

All constants in `useEffect` and `useMemo` dependency arrays are intentionally omitted — they are module-level constants that never change at runtime and do not need to be reactive.

---

## Configuration

### Backend (`BACKEND_CONFIG.uptime`)

```js
uptime: {
  pollIntervalMs: env.UPTIME_CHECKS_POLL_INTERVAL_MS,     // default 30000ms
  retentionDays: env.UPTIME_CHECKS_RETENTION_DAYS,        // default 30 days
  pollingEnabled: env.NODE_ENV === 'production',
  cleanupOnStart: env.UPTIME_CHECKS_CLEANUP_ON_START,
  cleanupIntervalDurationMs: 24 * 60 * 60 * 1000,
  endpoints: HEALTH_ENDPOINTS.map((endpoint) => endpoint.path),
},
```

| Variable                         | Default | Description                                             |
| -------------------------------- | ------- | ------------------------------------------------------- |
| `UPTIME_CHECKS_POLL_INTERVAL_MS` | `30000` | Polling interval in ms (min 5000).                      |
| `UPTIME_CHECKS_RETENTION_DAYS`   | `30`    | Data retention in days.                                 |
| `UPTIME_CHECKS_CLEANUP_ON_START` | `true`  | When `true`, truncates `uptime_checks` on server start. |
| `NODE_ENV`                       | —       | Polling and cleanup only run when `production`.         |

### Frontend (`frontend.config.js`)

```js
uptimeMonitor: {
  refetchIntervalMs: env.VITE_UPTIME_CHECKS_REFETCH_INTERVAL_MS,
  maxHistoryPerEndpoint: env.VITE_UPTIME_CHECKS_MAX_HISTORY_PER_ENDPOINT,
  queryWindowDaysLimit: env.VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT, // 28 days
},
```

- `refetchIntervalMs` is used as the fallback polling interval and countdown reset value.
- `maxHistoryPerEndpoint` controls how many checks per endpoint are fetched on initial load (`UptimeMonitorPage/constants: MAX_HISTORY_PER_ENDPOINT` defaults to 3500 since it covers ~29h at 30s intervals, giving a buffer above the 24h window used for metrics).
- `queryWindowDaysLimit` defines the maximum historical time frame (in days) allowed for database queries on the initial page load or dashboard refresh. While `maxHistoryPerEndpoint` caps the absolute number of data points retrieved, `queryWindowDaysLimit` acts as a time-based boundary to prevent the application from accidentally requesting massive, deep-history datasets that could degrade database performance.

> **Keep in sync**: `VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT` (frontend env) and `uptime_checks-query_window_days` (`app.settings` in the DB) should always be set to the same value. The frontend uses its copy to guard API call parameters before they reach the backend; the DB setting is the enforcement layer inside the SQL functions themselves.

---

## `formatDuration` Utility

`formatDuration({ days?, hours?, minutes? })` in `@/lib/formatting.js` converts any combination of time units to a human-readable string. All fields are optional and summed.

```js
formatDuration({ minutes: 15 }); // "15 mins"
formatDuration({ hours: 24 }); // "1 day"
formatDuration({ hours: 1, minutes: 20 }); // "1 hr 20 mins"
formatDuration({ days: 14 }); // "14 days"
formatDuration({ minutes: 90 }); // "1 hr 30 mins"
```

Components use this instead of hardcoding labels — heading text is derived from server-echoed values (`hours`, `days`, `bucketMinutes`) so labels always reflect what the server actually used, not what the constant says.

---

## Usage Notes

- **Continuous monitoring** – In production, the backend polls every 30 seconds, 24/7.
- **Data retention** – 30 days. Adjust via `UPTIME_CHECKS_RETENTION_DAYS`. The cleanup function uses `retentionDays` from `BACKEND_CONFIG.uptime`.
- **Real-time updates** – SSE delivers updates immediately. No periodic full refetch while SSE is healthy. Chart components refetch their aggregated DB data on each `poll-complete` event via `pollCount` without flashing loading states.
- **Fallback behaviour** – If SSE drops, a banner is shown and polling resumes automatically. The user can manually reconnect via the reconnect button.
- **Clock-aligned buckets** – Toggle in the page header. When on, all bucketed charts (heatmap, global trend, endpoint cards) snap bucket edges to clean clock marks and show a partial bucket for the current incomplete period. When off, buckets roll from the current moment.
- **Partial buckets** – The last bucket in any aggregated view is marked `isPartial: true` and rendered in the clock-aligned colour (purple). Tooltips on partial buckets show the time range, current average, and any failure timestamps already recorded in the partial window.
- **Two total check counters** – The header shows the **absolute DB total** (via `/count`, `dbTotalChecks`). The "Total checks" stat card shows **checks fetched in the current session** and is labelled "fetched in session".
- **Footer metrics scope** – Uptime %, avg latency, status, and checks count in endpoint cards are all scoped to the last `ENDPOINT_CARD_HISTORY_WINDOW_HOURS` (24h), not the full session history, for a more meaningful and stable reading.
- **Development behaviour** – Polling and cleanup are disabled when `NODE_ENV !== 'production'`. The frontend still reads whatever data exists (e.g. from a shared Supabase instance). The SSE stream is available in dev but receives no `poll-complete` events unless polling is manually enabled.
- **Performance** – Fetching up to 3500 (with a potential of 86400) rows per endpoint (~35k rows total for 10 endpoints) is efficient; payloads are compressed and indexes ensure fast queries. All chart data beyond the raw history uses DB-level aggregation (no client-side number crunching on large datasets).
- **Warning threshold** – `isWarning` on heatmap buckets is driven by the `uptime_checks-uptime_warning_threshold_ms` setting in `app.settings` (default 1000 ms). Adjust it with a direct `UPDATE` against `app.settings` — no migration or redeployment required.

---

## Extending

- **Add a new endpoint** – update `ENDPOINTS` in `constants.js` and `HEALTH_ENDPOINTS` in backend constants.
- **Change polling interval** – set `UPTIME_CHECKS_POLL_INTERVAL_MS` in `.env`. Keep `refetchIntervalMs` in `frontend.config.js` equal for best UX.
- **Change retention period** – set `UPTIME_CHECKS_RETENTION_DAYS` in `.env` (30 days). The cleanup function uses `retentionDays` from `BACKEND_CONFIG.uptime`.
- **Change the query window cap** – update `uptime_checks-query_window_days` in `app.settings` via SQL (`UPDATE app.settings SET value = '14' WHERE key = 'uptime_checks-query_window_days'`) and keep `VITE_UPTIME_CHECKS_QUERY_WINDOW_DAYS_LIMIT` in sync.
- **Change the warning threshold** – update `uptime_checks-uptime_warning_threshold_ms` in `app.settings` via SQL (`UPDATE app.settings SET value = '500' WHERE key = 'uptime_checks-uptime_warning_threshold_ms'`). No code change needed.
- **Change chart time windows** – edit the relevant constant in `constants.js` (`TREND_CHART_HOURS`, `LATENCY_CHART_HOURS`, `UPTIME_CHART_DAYS`, `HEATMAP_DEFAULT_WINDOW_DAYS`, `ENDPOINT_CARD_HISTORY_WINDOW_HOURS`). All heading labels derive from server-echoed values so they update automatically.
- **Change heatmap granularity** – edit `HEATMAP_DEFAULT_BUCKET_MINUTES` in `constants.js`. The bucket count and labels adjust automatically.
- **Change endpoint card bucket size** – edit `ENDPOINT_CARD_HISTORY_BUCKET_MINUTES` in `constants.js`.
- **Enable polling in development** – modify `pollingEnabled` in `BACKEND_CONFIG.uptime`.
- **Add SSE events** – call `broadcastUptimeEvent(eventName, payload)` from anywhere on the backend; add a matching `eventSource.addEventListener(eventName, …)` in `useUptimeMonitor.js`.

---

## Troubleshooting

| Issue                                              | Likely cause                                            | Resolution                                                                                                                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No data on dashboard                               | Backend polling not running (dev mode) or table empty   | Check `NODE_ENV` and that the production server is running. Run migrations 00 then 07 to create the schema and table.                                                                                                                                       |
| Charts show gaps                                   | Polling interval changed or server restarted            | Ensure `UPTIME_CHECKS_POLL_INTERVAL_MS` is configured and the server stays up.                                                                                                                                                                              |
| `cleanup_old_uptime_checks` error                  | Function not defined or permission denied               | Run migration 07 as `service_role`.                                                                                                                                                                                                                         |
| SSE disconnect banner always showing               | Proxy or load balancer closing idle connections         | Check `X-Accel-Buffering: no` header is respected; heartbeat fires every 30s.                                                                                                                                                                               |
| Countdown out of sync on load                      | No history (table empty)                                | Expected — countdown defaults to 0 until first SSE event.                                                                                                                                                                                                   |
| Heatmap shows no data                              | `get_heatmap_buckets` RPC failed or table is empty      | Check the function exists in Supabase; run migrations 00 then 07.                                                                                                                                                                                           |
| Endpoint buckets show no data                      | `get_endpoint_buckets` RPC failed                       | Check the function exists in Supabase; run migrations 00 then 07.                                                                                                                                                                                           |
| Global trend shows no data                         | `get_global_response_trend` RPC failed                  | Check the function exists in Supabase; run migrations 00 then 07.                                                                                                                                                                                           |
| Daily stats chart shows no data                    | `get_daily_uptime_stats` RPC failed or no data in range | Check the function exists in Supabase; run migrations 00 then 07.                                                                                                                                                                                           |
| All analytics functions return no data / null caps | `app.settings` missing or migration 00 not run          | Run `00_app_settings.sql` first. All window caps and the warning threshold are read from `app.settings` at query time — if the rows are missing, `app.get_setting()` returns NULL and `LEAST(p_hours, NULL)` evaluates to NULL, silently disabling the cap. |
| `is_warning` always `false` on heatmap             | `uptime_checks-uptime_warning_threshold_ms` missing     | Verify the row exists in `app.settings`. If missing, re-run migration 00.                                                                                                                                                                                   |
| Partial bucket not appearing in clock-aligned mode | Old SQL migration deployed                              | Ensure migration 07 v2 is applied — `get_heatmap_buckets` and `get_endpoint_buckets` must have the `p_clock_aligned BOOLEAN` parameter.                                                                                                                     |
| Charts flash loading spinner every 30s             | Old component code without `firstLoadDone` ref          | Update `GlobalResponseTrendChart`, `EndpointLatencyBarChart`, and `UptimeOverTimeChart` to use the `firstLoadDone` ref pattern.                                                                                                                             |

---

## Related Files

- `backend/database/migrations/00_app_settings.sql` – `app` schema, `app.settings` table, and `app.get_setting()` accessor. **Must run before migration 07.**
- `backend/database/migrations/07_uptime_monitor.sql` – table schema, indexes, RLS, autovacuum tuning, and all SQL analytics functions. Depends on migration 00.
- `backend/routes/uptime.routes.js` – all API routes including SSE `/stream`, aggregation endpoints, and clock-aligned parameter handling.
- `backend/services/uptime.broadcaster.js` – owns the SSE client Set; `addClient`, `removeClient`, `broadcastUptimeEvent`.
- `backend/services/uptimePolling.service.js` – polling loop (production only); calls `broadcastUptimeEvent` after each successful insert.
- `backend/server/index.js` – starts polling and cleanup intervals (production only).
- `backend/config/backend.config.js` – `uptime` configuration section (env-driven for `pollIntervalMs` and `retentionDays`).
- `backend/config/env.schema.js` – validation for `UPTIME_CHECKS_POLL_INTERVAL_MS` and `UPTIME_CHECKS_RETENTION_DAYS`.
- `frontend/src/config/frontend.config.js` – `refetchIntervalMs` and `maxHistoryPerEndpoint`.
- `frontend/src/pages/UptimeMonitorPage/*` – all UI components and logic.
