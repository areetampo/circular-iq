/**
 * @module uptimeMonitor.constants
 * @description Constants for the Uptime Monitor page.
 * Provides configuration values for refetch intervals, chart time windows,
 * heatmap buckets, and endpoint definitions.
 */

import { FRONTEND_CONFIG } from '@/config/frontend.config';

/**
 * Refetch interval in milliseconds from frontend config.
 * @type {number}
 */
export const REFETCH_INTERVAL_MS = FRONTEND_CONFIG.uptime.refetchIntervalMs;

/**
 * Maximum history per endpoint from frontend config.
 * 2 min interval -> 30/hr * 24h * 28d = 20160, 30d = 21600
 * FRONTEND_CONFIG.uptime.maxHistoryPerEndpoint=21600 max checks per endpoint as allowed by backend.
 * For EndpointCard purpose:
 * 2 min interval -> 30/hr * 24h = 720 checks per endpoint
 * 720 < 1000 sufficient for past 24 hours of data without overloading.
 * @type {number}
 */
export const MAX_HISTORY_PER_ENDPOINT = 1000;

/**
 * Hours of data shown in the GlobalResponseTrendChart.
 * @type {number}
 */
export const TREND_CHART_HOURS = 24;

/**
 * Days of data shown in the UptimeOverTimeChart.
 * @type {number}
 */
export const UPTIME_CHART_DAYS = 28;

/**
 * Hours of data shown in the EndpointLatencyBarChart.
 * @type {number}
 */
export const LATENCY_CHART_HOURS = 24;

// ── HEATMAP CONSTANTS ────────────────────────────────────────────────────────

/**
 * Default bucket size for the heatmap in minutes.
 * Used as the initial selection before the user makes a choice.
 * @type {number}
 */
export const HEATMAP_DEFAULT_BUCKET_MINUTES = 60;

/**
 * Default number of days covered by the heatmap window.
 * Used as the initial selection before the user makes a choice.
 * @type {number}
 */
const HEATMAP_DEFAULT_WINDOW_DAYS = 28;

/**
 * Default heatmap window size in minutes, derived from {@link HEATMAP_DEFAULT_WINDOW_DAYS}.
 * Used internally for preset comparisons and initial state.
 * @type {number}
 */
export const HEATMAP_DEFAULT_WINDOW_MINUTES = 60 * 24 * HEATMAP_DEFAULT_WINDOW_DAYS;

/**
 * Ordered list of all selectable bucket sizes in minutes.
 * Covers 2 minute through 24 hours. All values divide 1440 (minutes/day) evenly,
 * which is required for the backend's generate_series bucket logic to produce
 * clean clock-aligned edges.
 * @type {number[]}
 */
export const HEATMAP_BUCKET_PRESETS_MINUTES = [
  2, 3, 5, 10, 15, 20, 30, 45, 60, 120, 180, 240, 360, 480, 720, 1080, 1440,
];

/**
 * Ordered list of all selectable window sizes in minutes.
 * Covers 1 hour through 28 days, matching the backend's maximum query window.
 * @type {number[]}
 */
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
 * Maximum number of bars the heatmap will render on the frontend.
 * Derived from the worst-case readable configuration: 28 days at 3-hour buckets.
 * When the user selects a window/bucket combination that would exceed this limit,
 * the bucket is automatically clamped upward to the next valid preset.
 * The backend remains unconstrained — this guard is frontend-only.
 * @type {number}
 */
export const HEATMAP_MAX_BARS = 28 * (24 / 3); // 224 -> 3h buckets for 28 days

// ── ENDPOINT CARD CONSTANTS ──────────────────────────────────────────────────

/**
 * Time window in minutes for recent raw checks shown in the endpoint card.
 * @type {number}
 */
export const ENDPOINT_CARD_RECENT_WINDOW_MINUTES = 60;

/**
 * Time window in hours for the aggregated history bar and line chart
 * shown in the endpoint card.
 * @type {number}
 */
export const ENDPOINT_CARD_HISTORY_WINDOW_HOURS = 24;

/**
 * Bucket size in minutes for the aggregated history bar and line chart
 * shown in the endpoint card.
 * @type {number}
 */
export const ENDPOINT_CARD_HISTORY_BUCKET_MINUTES = 15;

/**
 * Endpoint definitions for uptime monitoring.
 * Each entry describes a health-check endpoint exposed by the backend.
 * @type {Array<{ id: string, label: string, path: string, desc: string }>}
 */
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
