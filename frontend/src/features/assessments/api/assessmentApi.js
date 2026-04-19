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
} from '@/features/assessments/schemas/assessmentSchema';
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

/**
 * Score assessment with real-time progress streaming via Server-Sent Events
 * @param {Object} formData - Form data with businessProblem, businessSolution, evaluationParameters, businessContext
 * @param {Function} onStage - Callback for progress updates (stage, message)
 * @param {Function} onComplete - Callback for successful completion (result)
 * @param {Function} onError - Callback for errors (error)
 */
export async function scoreAssessmentStream(formData, onStage, onComplete, onError) {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(buildApiUrl('/api/score/stream'), {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessProblem: formData.businessProblem,
        businessSolution: formData.businessSolution,
        evaluationParameters: formData.evaluationParameters,
        businessContext: formData.businessContext || null,
      }),
    });

    // Handle HTTP 403 the same way as scoreAssessment
    if (response.status === 403) {
      const data = await response.json().catch(() => null);
      throw data || { message: `Request failed (${response.status})` };
    }

    if (!response.ok) {
      throw { message: `Request failed (${response.status})` };
    }

    // Read the response as a ReadableStream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete events (separated by double newlines)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue;

          // Parse SSE event - look for "data: " prefix
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) continue;

          try {
            const eventData = JSON.parse(dataMatch[1]);

            if (eventData.stage === 'error') {
              onError(eventData);
              return;
            }

            if (eventData.stage === 'done') {
              onComplete(eventData.result);
              return;
            }

            // Call progress callback for all other stages
            onStage(eventData.stage, eventData.message);
          } catch (parseErr) {
            logger.warn('Failed to parse SSE event:', parseErr, 'Event:', dataMatch[1]);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (err) {
    // Handle network/stream errors
    // Check for 403 errors - can be either Error instance with status or plain object from 403 JSON response
    if (
      err.status === 403 ||
      (typeof err === 'object' && err !== null && !err.message && Object.keys(err).length > 0)
    ) {
      // Re-throw LIMIT_REACHED errors for the caller to handle
      throw err;
    }
    onError(err);
  }
}
