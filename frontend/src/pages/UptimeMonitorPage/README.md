# Uptime Monitor – Architecture & Usage

A real‑time health monitoring dashboard that continuously checks backend API health. The backend polls endpoints every 30 seconds, stores results in Supabase, and the frontend reads this data to display uptime percentages, latency trends, and a detailed health distribution.

> **Note:** Polling runs **only in production** (`NODE_ENV=production`) to avoid duplicate data during development.

---

## How It Works

1. **Backend polling** – When the server starts in production, a polling service runs every 30 seconds. It calls each health endpoint (e.g., `/health`, `/health/database`, `/health/database/aiven`), measures response time, and captures the JSON response.

2. **Storage** – Each result is inserted into the `uptime_checks` table in Supabase using the `service_role` key. No frontend writes are involved.

3. **Frontend display** – The React page reads historical data via `GET /api/uptime/history/:endpointId` and refreshes every 30 seconds (matching the backend poll interval). All charts and metrics are derived from stored data.

4. **Cleanup** – A daily background job deletes records older than **7 days** (retention policy). This is also run only in production.

5. **UI** – The page shows:
   - Summary stats (overall uptime, total checks, next refresh countdown)
   - Four charts in a 2×2 grid:
     - Health distribution (pie)
     - Global average response time (last 24h, line)
     - Uptime over time (daily, line)
     - Average latency by endpoint (bar with per‑bar colours)
   - A full‑width heatmap of the last 24h in 30‑minute buckets
   - Detailed cards for each endpoint with sparkline, history bar, and metrics

---

## Components & Files (Frontend)

| File                                      | Description                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `UptimeMonitorPage.jsx`                   | Main page – assembles components, displays stats and charts.                      |
| `constants.js`                            | Endpoint definitions and history limit (`HISTORY_LIMIT = 3500`, ~29h of data).    |
| `hooks/useUptimeMonitor.js`               | Fetches history every 30s and manages UI state.                                   |
| `utils/uptimeHelpers.js`                  | API calls to backend (`fetchHistoryFromBackend`).                                 |
| `utils/uptimeCharts.js`                   | Data aggregation for heatmap, health distribution, trends.                        |
| `components/StatSummaryCard.jsx`          | Reusable stat tile.                                                               |
| `components/HistoryBar.jsx`               | Miniature status bar for an endpoint (last 40 checks).                            |
| `components/SectionLabel.jsx`             | Section divider.                                                                  |
| `components/EndpointCard.jsx`             | Individual endpoint card with sparkline, colour‑coded latency, etc.               |
| `components/HealthDistributionChart.jsx`  | Pie chart using `PieChart`.                                                       |
| `components/GlobalResponseTrendChart.jsx` | Line chart of global average response time (last 24h).                            |
| `components/UptimeOverTimeChart.jsx`      | Line chart of daily uptime percentage.                                            |
| `components/StatusHeatmap.jsx`            | 30‑minute heatmap of last 24h.                                                    |
| `components/EndpointLatencyBarChart.jsx`  | Horizontal bar chart with per‑bar colours (green<200ms, yellow<500ms, red≥500ms). |
| `components/ExportMetricsButton.jsx`      | Exports all stored checks as CSV.                                                 |

---

## Backend API Endpoints (Public)

| Method | Path                                          | Description                                                                 |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------- |
| `POST` | `/api/uptime/checks`                          | **Internal** – used by polling service to store a check result.             |
| `GET`  | `/api/uptime/history/:endpointId?limit=10000` | Retrieve recent checks for an endpoint (max 10000, frontend requests 3500). |
| `GET`  | `/api/uptime/count`                           | Total number of stored checks (used in header).                             |

All endpoints are **public** (no authentication) because the data is not sensitive.

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

| Variable         | Default                              | Description                                     |
| ---------------- | ------------------------------------ | ----------------------------------------------- |
| `pollingEnabled` | `true` only if `NODE_ENV=production` | When `false`, polling and cleanup are disabled. |

The backend config `BACKEND_CONFIG.uptime` contains:

- `pollIntervalMs`: 30 000 (30 seconds)
- `retentionDays`: 7
- `pollingEnabled`: derived from `NODE_ENV`
- `endpoints`: list of health paths to poll

### Frontend (build‑time config via `frontend.config.js`)

```javascript
uptime: {
  refetchIntervalMs: 30_000,
},
```

The frontend uses this interval to refresh the data from the backend (read‑only).

---

## Usage Notes

- **Continuous monitoring** – In production, the backend polls every 30 seconds, 24/7. No user interaction is needed.
- **Data retention** – 7 days (default). You can adjust by changing `retentionDays` in `backend.config.js` and the function default in the migration.
- **Frontend refresh** – The UI refreshes every 30 seconds by re‑fetching the last 3500 checks per endpoint. This provides up‑to‑date charts without over‑fetching.
- **Development behaviour** – Polling and cleanup are disabled when `NODE_ENV !== 'production'`. The frontend still reads whatever data exists (e.g., from a shared Supabase instance) to allow testing UI without writing duplicates.
- **Performance** – Each frontend fetch retrieves up to 3500 rows per endpoint (≈31.5k rows total). The payload is compressed and indexes ensure fast queries.

---

## Extending

- **Add a new endpoint** – update `ENDPOINTS` in `constants.js`.
- **Change polling interval** – modify `pollIntervalMs` in `BACKEND_CONFIG.uptime` and `refetchIntervalMs` in frontend config (keep them equal for best UX).
- **Change retention period** – change `retentionDays` in `BACKEND_CONFIG.uptime` and/or the default parameter in `cleanup_old_uptime_checks()` SQL function.
- **Enable polling in development** – modify `pollingEnabled` in `BACKEND_CONFIG.uptime` to work in dev environment as well.

---

## Troubleshooting

| Issue                             | Likely cause                                               | Resolution                                                                                 |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| No data on dashboard              | Backend polling not running (dev mode) or table empty      | Check `NODE_ENV` and that the production server is running. Run migration to create table. |
| Charts show gaps                  | Polling interval may have been changed or server restarted | Ensure `pollIntervalMs` is 30s and the server stays up.                                    |
| `cleanup_old_uptime_checks` error | Function not defined or permission denied                  | Run the migration SQL as `service_role`.                                                   |
| Frontend shows old data           | Frontend refetch interval may be longer or network issue   | Check `refetchIntervalMs` and browser console for fetch errors.                            |

---

## Related Files

- `backend/database/migrations/07_uptime_monitor.sql` – table schema, indexes, cleanup function.
- `backend/routes/uptime.routes.js` – API endpoints.
- `backend/services/uptimePolling.service.js` – polling loop (runs in production).
- `backend/server/index.js` – starts polling and cleanup intervals (production only).
- `backend/config/backend.config.js` – `uptime` configuration section.
- `frontend/src/config/frontend.config.js` – frontend refresh interval.
- `frontend/src/pages/UptimeMonitorPage/*` – all UI components and logic.
