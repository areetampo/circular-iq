import { supabase } from '@/lib/supabase';

/**
 * @typedef {Object} DocumentSearchResult
 * @property {string} id
 * @property {string} title
 * @property {string|null} industry
 * @property {string|null} category
 * @property {string|null} source
 * @property {number} similarity
 * @property {number|null} rrf_score
 */
import {
  validateAssessment,
  validateAssessmentsList,
  safeValidateAssessment,
  safeValidateAssessmentsList,
  AssessmentSchema,
  safeValidateGlobalAnalytics,
} from '@/features/assessments/api/assessmentSchema';
import { FRONTEND_CONFIG } from '@/config';
import { buildApiUrl } from '@/lib/apiClient';

const API_URL = FRONTEND_CONFIG.apiBaseUrl;

/**
 * Add Authorization header with bearer token if session exists
 * @private
 */
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };

  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch (error) {
    console.error('[AUTH_HEADER_ERROR]', error);
  }

  return headers;
}

async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  const finalOptions = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  // Use buildApiUrl to route through proxy in production
  const url = buildApiUrl(path);
  const response = await fetch(url, finalOptions);
  return response;
}

async function requestJson(path, options = {}) {
  const response = await request(path, options);
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export async function scoreAssessment({ businessProblem, businessSolution, parameters }) {
  const response = await request('/api/score', {
    method: 'POST',
    body: JSON.stringify({ businessProblem, businessSolution, parameters }),
  });

  const data = await response.json().catch(() => null);

  if (response.status === 403) {
    throw data;
  }

  if (!response.ok) {
    throw data || { message: `Request failed (${response.status})` };
  }

  return data;
}

export async function getAssessments(params = {}) {
  // Remove sessionId from params - auth is now handled by token
  const cleanParams = { ...params };
  delete cleanParams.sessionId;

  // Remove undefined values from params
  Object.keys(cleanParams).forEach((key) => {
    if (cleanParams[key] === undefined || cleanParams[key] === null || cleanParams[key] === '') {
      delete cleanParams[key];
    }
  });

  const query = new URLSearchParams(cleanParams);
  const path = query.toString() ? `/api/assessments?${query}` : '/api/assessments';
  const data = await requestJson(path);

  // Validate response data
  return safeValidateAssessmentsList(data) || data;
}

export async function getAssessmentStats() {
  const data = await requestJson('/api/assessments/stats');
  return data;
}

export async function getAssessmentById(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }
  const data = await requestJson(`/api/assessments/${id}`);

  // Validate response data using strict parse
  try {
    // Try to validate the entire response
    const validated = validateAssessment(data.assessment || data);
    return { ...data, assessment: validated };
  } catch (error) {
    // If validation fails, include error details for consumer to handle
    const validationError = new Error(`Validation failed: ${error.message}`);
    validationError.originalError = error;
    validationError.data = data;
    throw validationError;
  }
}

/**
 * Fetch a publicly shared assessment by its public_id (no authentication required)
 */
export async function getPublicAssessment(publicId) {
  if (!publicId) {
    throw new Error('Public assessment ID is required');
  }

  // Public endpoint - no auth required, but still use proxy in production
  const url = buildApiUrl(`/api/assessments/public/${publicId}`);
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  // Validate response data
  try {
    const validated = validateAssessment(data.assessment || data);
    return { ...data, assessment: validated };
  } catch (error) {
    const validationError = new Error(`Validation failed: ${error.message}`);
    validationError.originalError = error;
    validationError.data = data;
    throw validationError;
  }
}

export async function createAssessment(payload) {
  return requestJson('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAssessment(id, updates) {
  if (!id) {
    throw new Error('Assessment id is required');
  }
  return requestJson(`/api/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteAssessment(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }

  console.log('[DELETE_ASSESSMENT_API]', { id });

  try {
    const response = await requestJson(`/api/assessments/${id}`, { method: 'DELETE' });
    console.log('[DELETE_ASSESSMENT_RESPONSE]', { id, response });

    if (!response) {
      throw new Error('Failed to delete assessment: No response from server');
    }
    return response;
  } catch (error) {
    console.error('[DELETE_ASSESSMENT_FAILED]', {
      id,
      errorMessage: error.message,
      errorStatus: error.status,
      fullError: error,
    });
    throw error;
  }
}

export async function getMarketAnalysis(id) {
  const path = id ? `/api/assessments/market-analysis/${id}` : '/api/assessments/market-analysis';
  const data = await requestJson(path);

  // Normalize keys and validate market analysis data structure
  if (data && typeof data === 'object') {
    return {
      marketData: data.market_data || data.marketData || [],
      stats: data.stats || null,
      userScore: data.userScore ?? data.user_score ?? null,
      userPercentile: data.user_percentile ?? data.userPercentile ?? null,
      userIndustry: data.userIndustry || data.user_industry || null,
      industryBenchmark: data.industry_benchmark || null,
      strategyBreakdown: data.strategy_breakdown || data.strategyBreakdown || [],
    };
  }
  return data;
}

/**
 * Fetch market analysis for a publicly shared assessment by publicId
 */
export async function getMarketAnalysisPublic(publicId) {
  if (!publicId) throw new Error('Public id is required');
  const path = `/api/assessments/market-analysis/public/${publicId}`;
  const data = await requestJson(path);
  return data;
}

export async function getGlobalAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.industry) params.set('industry', filters.industry);
  if (filters?.timeRange && filters.timeRange !== 'all') {
    params.set('timeRange', filters.timeRange);
  }
  const path = params.toString() ? `/api/analytics?${params}` : '/api/analytics';
  const data = await requestJson(path);
  return safeValidateGlobalAnalytics(data) || data;
}

export async function getEnhancedAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.industry) params.set('industry', filters.industry);
  if (filters?.timeRange && filters.timeRange !== 'all') {
    params.set('timeRange', filters.timeRange);
  }
  if (filters?.granularity) {
    params.set('granularity', filters.granularity);
  }
  const path = params.toString() ? `/api/analytics/enhanced?${params}` : '/api/analytics/enhanced';
  const data = await requestJson(path);
  return data;
}

/**
 * Fetch a small set of featured solutions (uses the `documents` table on the server)
 * Useful for surfacing curated problem→solution examples on the dashboard.
 */
export async function getFeaturedSolutions({ limit = 3, industry, q } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (industry != null) params.set('industry', industry);
  if (q) params.set('q', q);
  const path = params.toString()
    ? `/api/analytics/featured-solutions?${params}`
    : '/api/analytics/featured-solutions';
  const data = await requestJson(path);
  return {
    count: data?.count || 0,
    solutions: Array.isArray(data?.solutions) ? data.solutions : [],
  };
}

export async function compareAssessments(id1, id2) {
  if (!id1 || !id2) {
    throw new Error('Both assessment ids are required');
  }
  const query = new URLSearchParams({ id1, id2 });
  return requestJson(`/api/assessments/compare?${query}`);
}
