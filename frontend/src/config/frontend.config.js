import { frontendSchema } from './env.schema';

const rawEnv = {
  VITE_APP_URL: import.meta.env.VITE_APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173',

  VITE_API_URL: import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:3000',

  VITE_TEST_USER_NAME: import.meta.env.VITE_TEST_USER_NAME || process.env.VITE_TEST_USER_NAME,
  VITE_TEST_USER_NAME_EXT:
    import.meta.env.VITE_TEST_USER_NAME_EXT || process.env.VITE_TEST_USER_NAME_EXT,
  VITE_TEST_USER_PASSWORD:
    import.meta.env.VITE_TEST_USER_PASSWORD || process.env.VITE_TEST_USER_PASSWORD,

  VITE_SUPABASE_URL:
    import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY:
    import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'test-key',

  MODE: import.meta.env.MODE || process.env.MODE || process.env.NODE_ENV || 'development',
  PROD: import.meta.env.PROD ?? process.env.NODE_ENV === 'production',
};

const result = frontendSchema.safeParse(rawEnv);

// Helper for deep freezing
const deepFreeze = (obj) => {
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (obj[prop] !== null && typeof obj[prop] === 'object' && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
};

// Handle Test Mode / Failure Logic
let validatedConfig;

// Test mode bypass: skip all validation if running in test mode
const isTest = rawEnv.MODE === 'test' || process.env.NODE_ENV === 'test';
if (isTest) {
  validatedConfig = {
    appUrl: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
    apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',

    testCredentials: {
      username: import.meta.env.VITE_TEST_USER_NAME,
      usernameExt: import.meta.env.VITE_TEST_USER_NAME_EXT,
      password: import.meta.env.VITE_TEST_USER_PASSWORD,
    },

    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL ?? 'https://test.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'test-anon-key',
    },

    isProd: false,
    mode: 'test',
  };
  // Skip all validation in test mode
} else {
  if (!result.success) {
    logger.error('Frontend Environment Validation Failed:', result.error.flatten().fieldErrors);
    if (import.meta.env.DEV) {
      alert('Environment Variable Error: Check browser console');
    }
    throw new Error('Invalid environment configuration');
  } else {
    // 2. Handle Success Logic
    const env = result.data;
    // Only reject localhost FRONTEND URL and API URL in production builds
    if (env.PROD && env.VITE_APP_URL && env.VITE_APP_URL.includes('localhost')) {
      throw new Error('Production build cannot use localhost APP URL');
    }
    if (env.PROD && env.VITE_API_URL && env.VITE_API_URL.includes('localhost')) {
      throw new Error('Production build cannot use localhost API URL');
    }
    validatedConfig = {
      appUrl: env.VITE_APP_URL,
      apiUrl: env.VITE_API_URL,

      testCredentials: {
        username: env.VITE_TEST_USER_NAME,
        usernameExt: env.VITE_TEST_USER_NAME_EXT,
        password: env.VITE_TEST_USER_PASSWORD,
      },

      supabase: {
        url: env.VITE_SUPABASE_URL,
        anonKey: env.VITE_SUPABASE_ANON_KEY,
      },

      isProd: env.PROD,
      mode: env.MODE,
    };
  }
}

export const FRONTEND_CONFIG = deepFreeze({
  ...validatedConfig,

  // Frontend Routes Configuration
  // All routes and their supported query parameters based on actual implementation
  routes: [
    // Public Routes (No Authentication Required)
    {
      path: '/',
      name: 'Landing Page',
      description: 'Main landing page with app overview',
      authRequired: false,
      queryParameters: [],
    },
    {
      path: '/auth',
      name: 'Authentication',
      description: 'Login and signup page',
      authRequired: false,
      queryParameters: [],
    },
    {
      path: '/guide',
      name: 'User Guide',
      description: 'Comprehensive user guide and documentation',
      authRequired: false,
      queryParameters: [],
    },
    {
      path: '/results',
      name: 'Assessment Results',
      description: 'View assessment results from session state or navigation state',
      authRequired: false,
      queryParameters: [],
      stateParameters: ['result', 'formData', 'isRestored'],
    },
    {
      path: '/share/:publicId',
      name: 'Legacy Share Redirect',
      description: 'Legacy share URL redirect (redirects to /assessments/share)',
      authRequired: false,
      queryParameters: [],
      pathParameters: ['publicId'],
    },
    {
      path: '/assessments/share',
      name: 'Share Gateway',
      description: 'Public assessment share gateway and viewer',
      authRequired: false,
      queryParameters: [
        {
          name: 'id',
          type: 'string',
          required: false,
          description: 'Assessment public ID for direct share access',
          validation: 'UUID format',
        },
      ],
    },

    // Protected Routes (Authentication Required)
    {
      path: '/dashboard',
      name: 'Global Intelligence Dashboard',
      description: 'Two-tab dashboard with search solutions and global activity',
      authRequired: true,
      queryParameters: [
        {
          name: 'activeTab',
          type: 'string',
          required: false,
          default: 'search',
          description: 'Active tab: "search" or "global"',
          validation: 'search|global',
        },
        {
          name: 'searchQuery',
          type: 'string',
          required: false,
          description: 'Search query for solutions (min 2 chars)',
        },
        {
          name: 'mode',
          type: 'string',
          required: false,
          default: 'hybrid',
          description: 'Search mode: "keyword" or "hybrid"',
          validation: 'keyword|hybrid',
        },
        {
          name: 'page',
          type: 'number',
          required: false,
          default: 1,
          description: 'Pagination page number (min 1)',
          validation: 'positive integer',
        },
        {
          name: 'strategies',
          type: 'string',
          required: false,
          description: 'Comma-separated circular strategy filters',
          validation: 'comma-separated values',
        },
        {
          name: 'categories',
          type: 'string',
          required: false,
          description: 'Comma-separated category filters',
          validation: 'comma-separated values',
        },
        {
          name: 'sources',
          type: 'string',
          required: false,
          description: 'Comma-separated source filters',
          validation: 'comma-separated values',
        },
      ],
      behavior: {
        tabSwitching: 'Switching to global tab strips all search-specific params',
        validation: 'Invalid params are validated against actual results and dropped',
        cleanup: 'Orphan params are cleaned up on mount when no searchQuery',
      },
    },
    {
      path: '/assessments',
      name: 'My Assessments',
      description: 'User assessment management with filtering and pagination',
      authRequired: true,
      queryParameters: [
        {
          name: 'industry',
          type: 'string',
          required: false,
          default: 'all',
          description: 'Comma-separated industry filters',
          validation: 'comma-separated industry values or "all"',
        },
        {
          name: 'page',
          type: 'number',
          required: false,
          default: 1,
          description: 'Pagination page number',
          validation: 'positive integer',
        },
        {
          name: 'pageSize',
          type: 'number',
          required: false,
          default: 10,
          description: 'Items per page',
          validation: '5|10|20|50|100',
        },
        {
          name: 'search',
          type: 'string',
          required: false,
          description: 'Search term for filtering assessments',
        },
        {
          name: 'sortBy',
          type: 'string',
          required: false,
          default: 'created_at_desc',
          description: 'Sort field and order',
          validation: 'field_order format (e.g., created_at_desc, title_asc)',
        },
      ],
      behavior: {
        persistence: 'All filter parameters persist in URL for shareable filtered lists',
        validation: 'Invalid pageSize defaults to 10',
        initialization: 'URL parameters are read on component mount',
      },
    },
    {
      path: '/assessments/compare',
      name: 'Compare Assessments',
      description: 'Assessment comparison tool or selection form',
      authRequired: true,
      queryParameters: [
        {
          name: 'id1',
          type: 'string',
          required: false,
          description: 'First assessment public ID for comparison',
          validation: 'UUID format',
        },
        {
          name: 'id2',
          type: 'string',
          required: false,
          description: 'Second assessment public ID for comparison',
          validation: 'UUID format',
        },
      ],
      behavior: {
        conditional:
          'If both id1 and id2 are present, shows comparison; otherwise shows selection form',
      },
    },
    {
      path: '/assessments/:publicId',
      name: 'Assessment Details',
      description: 'View detailed assessment results (owned by user)',
      authRequired: true,
      queryParameters: [],
      pathParameters: ['publicId'],
    },
  ],

  // Route Behavior Patterns
  routePatterns: {
    protectedRoute: {
      redirect: '/auth',
      behavior: 'Unauthenticated users are redirected to auth page',
      loading: 'Shows loading spinner during authentication check',
    },
    urlStateManagement: {
      dashboard: 'URL is single source of truth for all search state',
      assessments: 'Filter parameters persist in URL for shareability',
      validation: 'Invalid parameters are validated and cleaned up',
    },
    navigation: {
      state: 'React Router state can pass result, formData, isRestored',
      legacy: 'Legacy /share/:publicId redirects to /assessments/share',
    },
  },
});
