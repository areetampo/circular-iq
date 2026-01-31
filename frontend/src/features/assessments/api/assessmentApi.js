import { supabase } from '@/lib/supabase';

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
  return requestJson('/score', {
    method: 'POST',
    body: JSON.stringify({ businessProblem, businessSolution, parameters }),
  });
}

export async function getAssessments(params = {}) {
  // Remove sessionId from params - auth is now handled by token
  const cleanParams = { ...params };
  delete cleanParams.sessionId;

  const query = new URLSearchParams(cleanParams);
  const path = query.toString() ? `/assessments?${query}` : '/assessments';
  return requestJson(path);
}

export async function getAssessmentById(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }
  return requestJson(`/assessments/${id}`);
}

export async function createAssessment(payload) {
  return requestJson('/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAssessment(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }
  await requestJson(`/assessments/${id}`, { method: 'DELETE' });
}

export async function getMarketAnalysis(id) {
  const path = id ? `/market-analysis/${id}` : '/market-analysis';
  return requestJson(path);
}

export async function compareAssessments(id1, id2) {
  if (!id1 || !id2) {
    throw new Error('Both assessment ids are required');
  }
  const query = new URLSearchParams({ id1, id2 });
  return requestJson(`/assessments/compare?${query}`);
}
