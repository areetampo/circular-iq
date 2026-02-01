import { supabase } from '@/lib/supabase';
import {
  validateAssessment,
  validateAssessmentsList,
  safeValidateAssessment,
  safeValidateAssessmentsList,
  AssessmentSchema,
  safeValidateGlobalAnalytics,
} from '@/features/assessments/api/assessmentSchema';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  const response = await fetch(`${API_URL}${path}`, finalOptions);
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
  return requestJson('/api/score', {
    method: 'POST',
    body: JSON.stringify({ businessProblem, businessSolution, parameters }),
  });
}

export async function getAssessments(params = {}) {
  // Remove sessionId from params - auth is now handled by token
  const cleanParams = { ...params };
  delete cleanParams.sessionId;

  const query = new URLSearchParams(cleanParams);
  const path = query.toString() ? `/api/assessments?${query}` : '/api/assessments';
  const data = await requestJson(path);

  // Validate response data
  return safeValidateAssessmentsList(data) || data;
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

export async function createAssessment(payload) {
  return requestJson('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAssessment(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }
  await requestJson(`/api/assessments/${id}`, { method: 'DELETE' });
}

export async function getMarketAnalysis(id) {
  const path = id ? `/api/assessments/market-analysis/${id}` : '/api/assessments/market-analysis';
  const data = await requestJson(path);

  // Validate market analysis data structure
  if (data && typeof data === 'object') {
    return {
      marketData: data.marketData || [],
      stats: data.stats,
      userScore: data.userScore,
    };
  }
  return data;
}

export async function getGlobalAnalytics(filters = {}) {
  const params = new URLSearchParams();
  if (filters?.industry && filters.industry !== 'all') {
    params.set('industry', filters.industry);
  }
  if (filters?.timeRange && filters.timeRange !== 'all') {
    params.set('timeRange', filters.timeRange);
  }
  const path = params.toString() ? `/api/analytics?${params}` : '/api/analytics';
  const data = await requestJson(path);
  return safeValidateGlobalAnalytics(data) || data;
}

export async function compareAssessments(id1, id2) {
  if (!id1 || !id2) {
    throw new Error('Both assessment ids are required');
  }
  const query = new URLSearchParams({ id1, id2 });
  return requestJson(`/api/assessments/compare?${query}`);
}
