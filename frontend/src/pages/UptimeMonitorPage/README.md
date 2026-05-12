# Uptime Monitor – Architecture & Usage

A real‑time health monitoring dashboard that continuously checks backend API health. The backend polls endpoints every 30 seconds **only in production**, stores results in Supabase, and broadcasts live updates to the frontend via Server‑Sent Events (SSE). The frontend reads historical data on load and then stays in sync through the SSE stream, falling back to polling if the connection is lost.

> **Important**: The `uptime_checks` table cleanup is controlled by the `UPTIME_CHECKS_CLEANUP_ON_START` environment variable (default: `true`), ensuring fresh monitoring data for production deployments.

---

## How It Works

1. **Backend polling** – When the server starts in **production only**, a polling service runs every 30 seconds. It calls each health endpoint (e.g., `/health`, `/health/database`, `/health/database/aiven`), measures response time, and captures the JSON response.

2. **Storage** – Each result is inserted into the `uptime_checks` table in Supabase using the `service_role` key. No frontend writes are involved.

3. **SSE broadcast** – After a successful batch insert, the polling service broadcasts a `poll-complete` event to all connected SSE clients via `uptime.broadcaster.js`. Clients receive live updates without polling.

4. **Environment-Controlled Cleanup** – The `UPTIME_CHECKS_CLEANUP_ON_START` environment variable controls whether the `uptime_checks` table is wiped clean on server start (default: `true`). This ensures fresh monitoring data for each deployment when enabled.

5. **Frontend display** – On load, the React page fetches historical data via `GET /api/uptime/history/:endpointId`, then opens an SSE connection to `GET /api/uptime/stream` to receive live `poll-complete` events. All charts and metrics are derived from the accumulated in-memory history.

6. **Fallback** – If the SSE connection drops, the frontend automatically falls back to polling `loadAllHistory` every 30 seconds and displays a disconnect banner with a manual reconnect button.

7. **Cleanup** – A daily background job deletes records older than **7 days** (retention policy). This runs only in production.

8. **UI** – The page shows:
   - Summary stats (overall uptime, total checks, next refresh countdown)
   - Disconnect banner + reconnect button when SSE is unavailable
   - Four charts in a 2×2 grid:
     - Health distribution (pie)
     - Global average response time (last 24h, line – hourly buckets)
     - Uptime over time (daily, line)
     - Average latency by endpoint (bar with per‑bar colours)
   - A full‑width heatmap of the last 24h in **5‑minute buckets**
   - Detailed cards for each endpoint with sparkline (last 20 checks), history bar (last 40 checks), and metrics

---

## Components & Files (Frontend)

| File                                      | Description                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `UptimeMonitorPage.jsx`                   | Main page – assembles components, displays stats, charts, and SSE status UI.      |
| `constants.js`                            | Endpoint definitions and history limit (`HISTORY_LIMIT = 3500`, ~29h of data).    |
| `hooks/useUptimeMonitor.js`               | Manages SSE connection, fallback polling, reconnect logic, and UI state.          |
| `utils/uptimeHelpers.js`                  | API calls to backend (`fetchHistoryFromBackend`).                                 |
| `utils/uptimeCharts.js`                   | Data aggregation for 5‑min heatmap, health distribution, trends.                  |
| `components/StatSummaryCard.jsx`          | Reusable stat tile.                                                               |
| `components/HistoryBar.jsx`               | Miniature status bar for an endpoint (last 40 checks).                            |
| `components/SectionLabel.jsx`             | Section divider.                                                                  |
| `components/EndpointCard.jsx`             | Individual endpoint card with sparkline, colour‑coded latency, etc.               |
| `components/HealthDistributionChart.jsx`  | Pie chart using `PieChart`.                                                       |
| `components/GlobalResponseTrendChart.jsx` | Line chart of global average response time (last 24h, hourly).                    |
| `components/UptimeOverTimeChart.jsx`      | Line chart of daily uptime percentage.                                            |
| `components/StatusHeatmap.jsx`            | 5‑minute heatmap of last 24h (tooltip shows status).                              |
| `components/EndpointLatencyBarChart.jsx`  | Horizontal bar chart with per‑bar colours (green<200ms, yellow<500ms, red≥500ms). |
| `components/ExportMetricsButton.jsx`      | Exports all stored checks as CSV.                                                 |

---

## Backend API Endpoints (Public)

| Method | Path                                          | Description                                                                 |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------- |
| `GET`  | `/api/uptime/history/:endpointId?limit=10000` | Retrieve recent checks for an endpoint (max 10000, frontend requests 3500). |
| `GET`  | `/api/uptime/count`                           | Total number of stored checks (used in header).                             |
| `GET`  | `/api/uptime/stream`                          | SSE stream – pushes `poll-complete` and `connected` events to clients.      |

All endpoints are **public** (no authentication) because the data is not sensitive.
The internal write endpoint is **not exposed** in the API; the polling service writes directly to Supabase.

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

---

## SSE Architecture

```txt
uptimePolling.service.js
  └── runPoll()
        ├── pings all endpoints
        ├── inserts to Supabase
        └── broadcastUptimeEvent()  ←─ uptime.broadcaster.js
                                              └── writes to all clients in Set

uptime.routes.js  /stream
  ├── addClient(res)    ←─ uptime.broadcaster.js
  └── removeClient(res) on close
```

`uptime.broadcaster.js` owns the `clients` Set and is the single source of truth for who is connected. Both the routes file and the polling service import from it, eliminating the previous circular dependency between those two files.

---

## Frontend SSE Flow (`useUptimeMonitor`)

1. **Initial load** – `loadAllHistory()` fetches all endpoint history from the REST API. The "next update" countdown is initialised from the timestamp of the most recent fetched check (not a hardcoded 30s), so it reflects the actual time remaining in the backend's current poll cycle.
2. **SSE connect** – After initial load, `connectSSE()` opens an `EventSource` to `/api/uptime/stream`.
3. **Live updates** – Each `poll-complete` event appends new checks to in-memory history and resets the countdown to 30s.
4. **Error / disconnect** – `onerror` closes the `EventSource`, sets `isUsingFallback = true`, and starts a `setInterval` fallback that calls `loadAllHistory` every 30s.
5. **Reconnect** – The user can press the reconnect button, which calls `connectSSE()` again. On `onopen`, `isUsingFallback` is cleared and the fallback interval is stopped.

---

## Database Schema (Supabase)

Table: `uptime_checks`

| Column             | Type        | Description                             |
| ------------------ | ----------- | --------------------------------------- |
| `id`               | UUID        | Primary key                             |
| `endpoint_id`      | TEXT        | e.g., `health`, `database`, `openai`    |
| `status`           | TEXT        | Status string from health endpoint      |
| `up`               | BOOLEAN     | `true` if endpoint responded with OK    |
| `response_time_ms` | INTEGER     | Response time in milliseconds           |
| `payload`          | JSONB       | Full JSON response from health endpoint |
| `created_at`       | TIMESTAMPTZ | When the check was performed            |

**Indexes:**

- `idx_uptime_endpoint_created` on `(endpoint_id, created_at DESC)`
- `idx_uptime_created_at` on `(created_at)`

**Cleanup function:** `cleanup_old_uptime_checks(days INTEGER DEFAULT 7)` – deletes records older than the given number of days. Called daily by the backend (production only).

**Autovacuum tuning** – set to reduce table bloat.

---

## Configuration

### Backend (in `BACKEND_CONFIG.uptime`)

```js
uptime: {
  pollIntervalMs: 30 * 1000,
  retentionDays: 7,
  pollingEnabled: env.NODE_ENV === 'production',
  cleanupOnStart: env.UPTIME_CHECKS_CLEANUP_ON_START,
  cleanupIntervalDurationMs: 24 * 60 * 60 * 1000,
  endpoints: UPTIME_ENDPOINTS.map((endpoint) => endpoint.path),
},
```

| Variable         | Default                              | Description                                      |
| ---------------- | ------------------------------------ | ------------------------------------------------ |
| `pollingEnabled` | `true` only if `NODE_ENV=production` | When `false`, polling and cleanup are disabled.  |
| `cleanupOnStart` | `true`                               | When `true`, truncates `uptime_checks` on start. |

### Frontend (build‑time config via `frontend.config.js`)

```js
uptime: {
  refetchIntervalMs: 30_000,
},
```

Used as both the SSE fallback polling interval and the countdown reset value after each `poll-complete` event.

---

## Usage Notes

- **Continuous monitoring** – In production, the backend polls every 30 seconds, 24/7. No user interaction is needed.
- **Data retention** – 7 days (default). Adjust by changing `retentionDays` in `backend.config.js` and the function default in the migration.
- **Real-time updates** – The frontend receives live updates via SSE; no periodic full refetch occurs while the SSE connection is healthy.
- **Fallback behaviour** – If SSE drops, a banner is shown and polling resumes automatically. The user can manually reconnect via the reconnect button.
- **Countdown accuracy** – On initial load, the countdown is calculated from the most recent check's timestamp rather than reset to 30s, so it stays in sync with the backend's actual poll cycle.
- **Development behaviour** – Polling and cleanup are disabled when `NODE_ENV !== 'production'`. The frontend still reads whatever data exists (e.g., from a shared Supabase instance) to allow testing UI without writing duplicates. SSE stream is available in dev but will receive no `poll-complete` events unless polling is manually enabled.
- **Performance** – Each frontend fetch retrieves up to 3500 rows per endpoint (≈31.5k rows total). The payload is compressed and indexes ensure fast queries.

---

## Extending

- **Add a new endpoint** – update `ENDPOINTS` in `constants.js` and `UPTIME_ENDPOINTS` in the backend constants.
- **Change polling interval** – modify `pollIntervalMs` in `BACKEND_CONFIG.uptime` and `refetchIntervalMs` in frontend config (keep them equal for best UX).
- **Change retention period** – change `retentionDays` in `BACKEND_CONFIG.uptime` and/or the default parameter in `cleanup_old_uptime_checks()` SQL function.
- **Change heatmap granularity** – adjust `getLast24hStatus5min` in `uptimeCharts.js` (e.g., switch to 10‑minute buckets).
- **Enable polling in development** – modify `pollingEnabled` in `BACKEND_CONFIG.uptime`.
- **Add SSE events** – call `broadcastUptimeEvent(eventName, payload)` from anywhere on the backend; add a matching `eventSource.addEventListener(eventName, ...)` in `useUptimeMonitor.js`.

---

## Troubleshooting

| Issue                                | Likely cause                                           | Resolution                                                                                 |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| No data on dashboard                 | Backend polling not running (dev mode) or table empty  | Check `NODE_ENV` and that the production server is running. Run migration to create table. |
| Charts show gaps                     | Polling interval changed or server restarted           | Ensure `pollIntervalMs` is 30s and the server stays up.                                    |
| `cleanup_old_uptime_checks` error    | Function not defined or permission denied              | Run the migration SQL as `service_role`.                                                   |
| SSE disconnect banner always showing | Proxy or load balancer closing idle connections        | Check `X-Accel-Buffering: no` header is respected; heartbeat fires every 30s.              |
| Countdown out of sync on load        | `mostRecentTs` calculation returned `NaN` (no history) | Expected when table is empty; countdown defaults to 0 until first SSE event.               |
| Heatmap shows circles (not bars)     | Old version of `StatusHeatmap.jsx`                     | Update to the 5‑minute bar version from the final implementation.                          |

---

## Related Files

- `backend/database/migrations/07_uptime_monitor.sql` – table schema, indexes, cleanup function.
- `backend/routes/uptime.routes.js` – API endpoints including SSE `/stream`.
- `backend/services/uptime.broadcaster.js` – owns the SSE client Set; `addClient`, `removeClient`, `broadcastUptimeEvent`.
- `backend/services/uptimePolling.service.js` – polling loop (runs in production); calls `broadcastUptimeEvent` after each successful insert.
- `backend/server/index.js` – starts polling and cleanup intervals (production only).
- `backend/config/backend.config.js` – `uptime` configuration section.
- `frontend/src/config/frontend.config.js` – frontend refresh interval.
- `frontend/src/pages/UptimeMonitorPage/*` – all UI components and logic.
