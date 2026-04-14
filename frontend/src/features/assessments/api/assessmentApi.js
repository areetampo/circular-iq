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
  safeValidateAssessmentsList,
  validateAssessment,
} from '@/features/assessments/api/assessmentSchema';
import { buildApiUrl } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';

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
    logger.error('[AUTH_HEADER_ERROR]', error);
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
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (typeof data === 'object' ? JSON.stringify(data) : text) ||
      `Request failed (${response.status})`;
    const err = new Error(`HTTP ${response.status}: ${message}`);
    err.status = response.status;
    err.response = data;
    throw err;
  }

  return data;
}

export async function scoreAssessment(formData) {
  const response = await request('/api/score', {
    method: 'POST',
    body: JSON.stringify({
      businessProblem: formData.businessProblem,
      businessSolution: formData.businessSolution,
      evaluationParameters: formData.evaluationParameters,
      businessContext: formData.businessContext || null,
    }),
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

  logger.log('[DELETE_ASSESSMENT_API]', { id });

  try {
    const response = await requestJson(`/api/assessments/${id}`, { method: 'DELETE' });
    logger.log('[DELETE_ASSESSMENT_RESPONSE]', { id, response });

    if (!response) {
      throw new Error('Failed to delete assessment: No response from server');
    }
    return response;
  } catch (error) {
    logger.error('[DELETE_ASSESSMENT_FAILED]', {
      id,
      errorMessage: error.message,
      errorStatus: error.status,
      fullError: error,
    });
    throw error;
  }
}

/**
 * Compare two assessments by publicId with visibility checking
 * Handles cross-user comparisons with privacy enforcement
 */
export async function getComparisonAssessments(id1, id2) {
  if (!id1 || !id2) {
    throw new Error('Both assessment ids are required');
  }

  const query = new URLSearchParams({ id1, id2 });
  const data = await requestJson(`/api/assessments/compare?${query}`);

  // Validate response data for both assessments
  try {
    const validated1 = validateAssessment(data.assessment1 || {});
    const validated2 = validateAssessment(data.assessment2 || {});
    return {
      ...data,
      assessment1: validated1,
      assessment2: validated2,
    };
  } catch (error) {
    const validationError = new Error(`Validation failed: ${error.message}`);
    validationError.originalError = error;
    validationError.data = data;
    throw validationError;
  }
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

/**
 * Fetch global dashboard statistics.
 * Aggregates from scoring_results_log (all scoring calls, anon + auth)
 * + get_market_data RPC + get_assessment_statistics RPC.
 * No authentication required.
 */
export async function getGlobalStats() {
  return requestJson('/api/analytics/global-stats');
}
