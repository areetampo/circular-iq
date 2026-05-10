/**
 * Frontend Routes Configuration
 *
 * Contains all frontend routes with their metadata, query parameters, and behavior patterns.
 * Used for documentation, validation, and route management.
 */

export default [
  // Core Public Routes
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
    queryParameters: [
      {
        name: 'mode',
        type: 'string',
        required: false,
        default: 'login',
        description: 'Auth mode: "login" or "signup"',
        validation: 'login|signup',
      },
      {
        name: 'from',
        type: 'string',
        required: false,
        description: 'Redirect URL after successful authentication',
      },
    ],
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
  // Solutions & Analytics Routes
  {
    path: '/solutions',
    name: 'Search Solutions',
    description: 'Search circular economy solutions from 6,000+ real-world cases',
    authRequired: false,
    queryParameters: [
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
      validation: 'Invalid params are validated against actual results and dropped',
      cleanup: 'Orphan params are cleaned up on mount when no searchQuery',
    },
  },
  {
    path: '/global-activity',
    name: 'Global Activity',
    description: 'Live insights from all circular economy assessments worldwide',
    authRequired: false,
    queryParameters: [],
  },
  // Assessment Management Routes
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
    path: '/assessments/share',
    name: 'Share Gateway Form',
    description: 'Public assessment share gateway form',
    authRequired: false,
  },
  {
    path: '/assessments/share/:id',
    name: 'Shared Assessment View',
    description: 'Direct shared assessment view (public)',
    authRequired: false,
    pathParameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Assessment public ID for direct share access',
        validation: 'UUID format',
      },
    ],
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
  {
    path: '/uptime-monitor',
    name: 'Uptime Monitor',
    description: 'System uptime monitoring and health check history',
    authRequired: false,
    queryParameters: [],
  },
];
