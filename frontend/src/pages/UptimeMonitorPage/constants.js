/**
 * Constants for the Uptime Monitor page.
 * Values coordinate frontend polling, chart query windows, heatmap controls, endpoint cards,
 * and the backend health endpoints presented in the dashboard.
 */

import { FRONTEND_CONFIG } from '@/config/frontend.config';

/** Refetch interval, in milliseconds, shared by SSE fallback polling and manual refresh timers. */
export const REFETCH_INTERVAL_MS = FRONTEND_CONFIG.uptime.refetchIntervalMs;

/**
 * Raw check cap requested by each endpoint card.
 * The backend permits 21,600 checks per endpoint, but cards only need one day of 2-minute
 * checks (720 records), so this frontend cap leaves headroom without overfetching.
 */
export const MAX_HISTORY_PER_ENDPOINT = 1000;

/** Lookback hours shown in the global response-time trend chart. */
export const TREND_CHART_HOURS = 24;

/** Lookback days shown in the uptime-over-time chart. */
export const UPTIME_CHART_DAYS = 28;

/** Lookback hours shown in the endpoint latency bar chart. */
export const LATENCY_CHART_HOURS = 24;

/** Initial heatmap bucket size in minutes before the user changes the control. */
export const HEATMAP_DEFAULT_BUCKET_MINUTES = 60;

/** Initial heatmap window size in days, matching the longest dashboard preset. */
const HEATMAP_DEFAULT_WINDOW_DAYS = 28;

/** Initial heatmap window size in minutes, derived for preset comparisons and queries. */
export const HEATMAP_DEFAULT_WINDOW_MINUTES = 60 * 24 * HEATMAP_DEFAULT_WINDOW_DAYS;

/**
 * Selectable heatmap bucket sizes in minutes.
 * Every value divides one day evenly so backend clock-aligned buckets produce clean edges.
 */
export const HEATMAP_BUCKET_PRESETS_MINUTES = [
  2, 3, 5, 10, 15, 20, 30, 45, 60, 120, 180, 240, 360, 480, 720, 1080, 1440,
];

/** Selectable heatmap windows in minutes, from one hour through the backend's 28-day limit. */
export const HEATMAP_WINDOW_PRESETS_MINUTES = [
  60, // 1 h
  120, // 2 h
  240, // 4 h
  360, // 6 h
  720, // 12 h
  1440, // 1 d
  2880, // 2 d
  4320, // 3 d
  10080, // 7 d
  20160, // 14 d
  40320, // 28 d
];

/**
 * Maximum readable heatmap bar count before the bucket is clamped upward.
 * The limit corresponds to 28 days at 3-hour buckets and is frontend-only; the backend can
 * still serve larger raw bucket combinations.
 */
export const HEATMAP_MAX_BARS = 28 * (24 / 3); // 224 -> 3h buckets for 28 days

/** Recent raw-check window, in minutes, shown inside each endpoint card. */
export const ENDPOINT_CARD_RECENT_WINDOW_MINUTES = 60;

/** Aggregated endpoint-card history window, in hours, for bar and line summaries. */
export const ENDPOINT_CARD_HISTORY_WINDOW_HOURS = 24;

/** Aggregated endpoint-card bucket size, in minutes, for bar and line summaries. */
export const ENDPOINT_CARD_HISTORY_BUCKET_MINUTES = 15;

/** Endpoint metadata rendered by the uptime dashboard and matched to backend health routes. */
export const ENDPOINTS = [
  { id: 'health', label: 'Basic Health', path: '/health', desc: 'Load balancer check' },
  {
    id: 'detailed',
    label: 'Detailed Health',
    path: '/health?detailed=true',
    desc: 'Comprehensive system status',
  },
  { id: 'database', label: 'Supabase DB', path: '/health/database', desc: 'Supabase connectivity' },
  {
    id: 'database-aiven',
    label: 'Aiven DB',
    path: '/health/database/aiven',
    desc: 'Aiven PostgreSQL connectivity',
  },
  { id: 'openai', label: 'OpenAI API', path: '/health/openai', desc: 'AI service availability' },
  { id: 'system', label: 'System', path: '/health/system', desc: 'Memory & node runtime' },
  { id: 'config', label: 'Configuration', path: '/health/config', desc: 'Config integrity' },
  {
    id: 'readiness',
    label: 'Readiness',
    path: '/health/readiness',
    desc: 'Kubernetes readiness probe',
  },
  {
    id: 'liveness',
    label: 'Liveness',
    path: '/health/liveness',
    desc: 'Kubernetes liveness probe',
  },
  { id: 'version', label: 'Version', path: '/health/version', desc: 'Build and version info' },
];
