/**
 * Health routes polled by the uptime service (`uptimePolling.service.js`).
 * `id` is the DB/SSE key; `path` is appended to `BACKEND_CONFIG.app.apiUrl`.
 *
 * @type {Array<{id: string, path: string, label: string}>}
 */
const HEALTH_ENDPOINTS = [
  { id: 'health', path: '/health', label: 'Basic Health' },
  { id: 'detailed', path: '/health?detailed=true', label: 'Detailed Health' },
  { id: 'database', path: '/health/database', label: 'Database' },
  { id: 'database-aiven', path: '/health/database/aiven', label: 'Database (Aiven)' },
  { id: 'openai', path: '/health/openai', label: 'OpenAI API' },
  { id: 'system', path: '/health/system', label: 'System' },
  { id: 'config', path: '/health/config', label: 'Configuration' },
  { id: 'readiness', path: '/health/readiness', label: 'Readiness' },
  { id: 'liveness', path: '/health/liveness', label: 'Liveness' },
  { id: 'version', path: '/health/version', label: 'Version' },
];

export default HEALTH_ENDPOINTS;
