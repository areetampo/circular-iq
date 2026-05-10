export const HISTORY_LIMIT = 3500;

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
