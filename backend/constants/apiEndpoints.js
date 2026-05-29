/**
 * Registry of HTTP routes for API discovery, health checks, and `BACKEND_CONFIG.api`.
 * Each entry has `{ method, endpoint, description }`; auth notes live in the description field.
 *
 * @type {Array<{method: string, endpoint: string, description: string}>}
 */
export default [
  // Health & Root
  { method: 'GET', endpoint: '/health', description: 'Basic Health Check (Load Balancer)' },
  { method: 'GET', endpoint: '/health/detailed', description: 'Comprehensive Health Check' },
  { method: 'GET', endpoint: '/health/database', description: 'Database Health Check' },
  { method: 'GET', endpoint: '/health/openai', description: 'OpenAI API Health Check' },
  { method: 'GET', endpoint: '/health/system', description: 'System Resources Health Check' },
  { method: 'GET', endpoint: '/health/config', description: 'Configuration Health Check' },
  { method: 'GET', endpoint: '/health/readiness', description: 'Kubernetes Readiness Probe' },
  { method: 'GET', endpoint: '/health/liveness', description: 'Kubernetes Liveness Probe' },
  { method: 'GET', endpoint: '/health/version', description: 'Version and Build Information' },
  { method: 'GET', endpoint: '/', description: 'Welcome/Root Endpoint' },

  // User Profile
  { method: 'GET', endpoint: '/api/profile', description: 'User Profile Data (Auth Required)' },

  // Search
  {
    method: 'GET',
    endpoint: '/api/search/ce-cases',
    description: 'Search Circular Economy Cases Knowledge Base (Public)',
  },

  // Scoring/RAG
  {
    method: 'POST',
    endpoint: '/api/score',
    description: 'RAG Analysis & Scoring (Rate Limited)',
  },
  {
    method: 'POST',
    endpoint: '/api/score/stream',
    description: 'RAG Analysis & Scoring with SSE Streaming (Rate Limited)',
  },
  {
    method: 'GET',
    endpoint: '/api/analytics/global-stats',
    description: 'Global Dashboard Statistics (Public)',
  },
  {
    method: 'POST',
    endpoint: '/api/analytics/embeddings/reindex',
    description: 'Reindex Embeddings Pipeline (Admin)',
  },

  // Assessments
  {
    method: 'POST',
    endpoint: '/api/assessments',
    description: 'Create Assessment (Auth Required)',
  },
  {
    method: 'GET',
    endpoint: '/api/assessments',
    description: 'List User Assessments (Auth Required)',
  },
  {
    method: 'GET',
    endpoint: '/api/assessments/stats',
    description: 'Assessment Statistics (Auth Required)',
  },
  {
    method: 'GET',
    endpoint: '/api/assessments/compare',
    description: 'Compare Two Assessments (Optional Auth)',
  },
  {
    method: 'GET',
    endpoint: '/api/assessments/public/:publicId',
    description: 'Get Public Assessment (Optional Auth for Ownership Check)',
  },
  {
    method: 'GET',
    endpoint: '/api/assessments/validate/:publicId',
    description: 'Validate Public Assessment ID (Optional Auth)',
  },
  {
    method: 'GET',
    endpoint: '/api/assessments/:publicId',
    description: 'Get Assessment by Public ID (Auth Required)',
  },
  {
    method: 'PATCH',
    endpoint: '/api/assessments/:id',
    description: 'Update Assessment (Auth Required)',
  },
  {
    method: 'DELETE',
    endpoint: '/api/assessments/:id',
    description: 'Delete Assessment (Auth Required)',
  },

  // Uptime Monitor
  {
    method: 'GET',
    endpoint: '/api/uptime/count',
    description: 'Get total number of uptime checks (optionally per endpoint)',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/history/:endpointId',
    description: 'Retrieve recent checks for specific endpoint (max configured in BACKEND_CONFIG)',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/stream',
    description: 'SSE stream for real-time uptime updates with fallback to polling',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/daily-stats',
    description: 'Get daily uptime statistics for the last N days',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/heatmap-aggregated',
    description: 'Get aggregated heatmap buckets for uptime visualization',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/global-trend',
    description:
      'Hourly avg response time across all endpoints for last N hours (supports clock-aligned)',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/endpoint-latency',
    description: 'Per-endpoint avg latency scalar for last N hours',
  },
  {
    method: 'GET',
    endpoint: '/api/uptime/endpoint-buckets/:endpointId',
    description: 'Bucketed avg response time for one endpoint (supports clock-aligned)',
  },
];
