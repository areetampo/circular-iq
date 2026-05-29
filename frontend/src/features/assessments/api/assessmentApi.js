/**
 * HTTP client for assessment CRUD, comparison, global stats, and SSE scoring (Bearer token when session exists).
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
 * Builds JSON headers and adds Authorization when a Supabase session exists.
 * Failures are logged and treated as anonymous requests.
 *
 * @private
 * @returns {Promise<{ 'Content-Type': string, Authorization?: string }>} JSON headers with bearer token when a session is available.
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

/**
 * Makes an API request with auth headers and no-cache semantics.
 *
 * @param {string} path - API endpoint path
 * @param {RequestInit} [options={}] - Fetch options merged after auth headers.
 * @returns {Promise<Response>} Fetch response
 */
async function request(path, options = {}) {
  const headers = await getAuthHeaders();

  const finalOptions = {
    ...options,
    headers: {
      ...headers,
      'Cache-Control': 'no-cache',
      ...options.headers,
    },
  };

  // Use buildApiUrl to route through proxy in production
  const url = buildApiUrl(path);
  const response = await fetch(url, finalOptions);
  return response;
}

/**
 * Makes an authenticated API request and parses the JSON response body.
 * Empty or invalid JSON responses are returned as null on success.
 *
 * @param {string} path - API endpoint path
 * @param {RequestInit} [options={}] - Fetch options merged after auth headers.
 * @returns {Promise<Object|null>} Parsed JSON response data.
 * @throws {Error} If the API responds with a non-2xx status.
 */
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
    const error = new Error(`HTTP ${response.status}: ${message}`);
    error.status = response.status;
    error.response = data;
    throw error;
  }

  return data;
}

/**
 * Fetches authenticated user assessments with filtering and pagination.
 * Removes stale `sessionId` and empty query values before sending.
 *
 * @param {{ industry?: string, sortBy?: string, order?: 'asc'|'desc'|string, page?: number|string, pageSize?: number|string, search?: string, createdFrom?: string, createdTo?: string, minScore?: number, maxScore?: number, sessionId?: string }} [params={}] - Query parameters.
 * @param {string} [params.industry] - Industry slug filter.
 * @param {string} [params.sortBy] - Sort field such as `created_at`, `overall_score`, or `title`.
 * @param {string} [params.order] - Sort direction accepted by the API.
 * @param {number|string} [params.page] - Page number; invalid values are sent as page 1.
 * @param {number|string} [params.pageSize] - Items per page, capped by the API.
 * @param {string} [params.search] - Search term applied to assessment title/industry.
 * @param {string} [params.createdFrom] - Inclusive creation-date lower bound.
 * @param {string} [params.createdTo] - Inclusive creation-date upper bound.
 * @param {number} [params.minScore] - Minimum overall score filter.
 * @param {number} [params.maxScore] - Maximum overall score filter.
 * @returns {Promise<{assessments: Array<Record<string, unknown>>, pagination?: Record<string, unknown>, total?: number}>} Validated list with pagination info.
 * @throws {Error} If the API responds with a non-2xx status.
 */
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

  // Validate page parameter - ensure it's at least 1
  if (cleanParams.page) {
    const pageNum = Number(cleanParams.page);
    if (Number.isNaN(pageNum) || pageNum < 1) {
      cleanParams.page = '1'; // Default to page 1 for invalid page numbers
    }
  }

  const query = new URLSearchParams(cleanParams);
  const path = query.toString() ? `/api/assessments?${query}` : '/api/assessments';
  const data = await requestJson(path);

  // Validate response data
  return safeValidateAssessmentsList(data) || data;
}

/**
 * Fetches assessment statistics for the current authenticated user.
 *
 * @returns {Promise<Record<string, unknown>>} Assessment statistics including totals, averages, and distributions.
 * @throws {Error} If the API responds with a non-2xx status.
 */
export async function getAssessmentStats() {
  const data = await requestJson('/api/assessments/stats');
  return data;
}

/**
 * Validates a single assessment public id for sharing.
 *
 * @param {string} publicId - Public assessment id entered by the user.
 * @returns {Promise<{valid: boolean, isOwner: boolean, isPublic: boolean}>} Visibility and ownership flags from the validation endpoint.
 * @throws {Error} If the id is invalid, private, or the API rejects validation.
 */
export async function validateAssessmentId(publicId) {
  // Use optional authentication for validation
  const response = await request(`/api/assessments/validate/${encodeURIComponent(publicId)}`);

  const body = await response.json().catch(() => null);

  // Check if ID is invalid (NOT_FOUND)
  if (response.status === 404) {
    throw new Error('Invalid assessment ID');
  }

  // Check if ID is not public (FORBIDDEN)
  if (response.status === 403) {
    throw new Error('Assessment not publicly available');
  }

  // Check for any other errors
  if (!response.ok) {
    throw new Error(body?.error || 'Failed to validate assessment ID');
  }

  return {
    valid: body?.valid === true,
    isOwner: body?.isOwner === true,
    isPublic: body?.isPublic === true,
  };
}

/**
 * Validates two assessment public ids for comparison.
 *
 * @param {string} id1 - First public assessment id.
 * @param {string} id2 - Second public assessment id.
 * @returns {Promise<{valid1: boolean, valid2: boolean}>} Per-id validity flags from the validation endpoints.
 * @throws {Error} If either id is invalid, private, or validation fails.
 */
export async function validateAssessmentIds(id1, id2) {
  // Use optional authentication for validation
  const [res1, res2] = await Promise.all([
    request(`/api/assessments/validate/${encodeURIComponent(id1)}`),
    request(`/api/assessments/validate/${encodeURIComponent(id2)}`),
  ]);

  const body1 = await res1
    .clone()
    .json()
    .catch(() => null);
  const body2 = await res2
    .clone()
    .json()
    .catch(() => null);

  // Check if either ID is invalid (NOT_FOUND)
  if (res1.status === 404 || res2.status === 404) {
    throw new Error('One or more ids incorrect');
  }

  // Check if either ID is not public (FORBIDDEN)
  if (res1.status === 403 || res2.status === 403) {
    throw new Error('One or more assessments not public');
  }

  // Check for any other errors
  if (!res1.ok || !res2.ok) {
    // Reuse the already parsed body1 and body2 from above
    throw new Error(body1?.error || body2?.error || 'Failed to validate assessment IDs');
  }

  return {
    valid1: body1?.valid === true,
    valid2: body2?.valid === true,
  };
}

/**
 * Fetches a single authenticated assessment by id and validates the returned assessment record.
 *
 * @param {string|number} id - Assessment id accepted by the backend route.
 * @returns {Promise<Object>} API response with `assessment` replaced by the validated assessment record.
 * @throws {Error} If id is missing, the API fails, or response validation fails.
 */
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
 * Fetches a publicly shared assessment by `public_id`.
 * Sends auth header when a session exists so owners can access private assessments.
 *
 * @param {string} publicId - UUID public identifier.
 * @returns {Promise<{assessment: Object, readonly: boolean}>} Public assessment payload and readonly flag from visibility rules.
 * @throws {Error} With `status` 403/404 when access is denied or not found.
 */
export async function getPublicAssessment(publicId) {
  if (!publicId) {
    throw new Error('Public assessment ID is required');
  }

  // Use optional authentication - include auth header if available
  const headers = await getAuthHeaders();

  const url = buildApiUrl(`/api/assessments/public/${publicId}`);
  const response = await fetch(url, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
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

/**
 * Creates a new assessment for the authenticated user.
 *
 * @param {Record<string, unknown>} payload - Assessment data to create.
 * @returns {Promise<Record<string, unknown>>} Created assessment data.
 * @throws {Error} If the API responds with a non-2xx status.
 */
export async function createAssessment(payload) {
  return requestJson('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing assessment.
 *
 * @param {string|number} id - Assessment id accepted by the backend route.
 * @param {Record<string, unknown>} updates - Fields to update.
 * @returns {Promise<Record<string, unknown>>} Updated assessment data.
 * @throws {Error} If id is missing or the API responds with a non-2xx status.
 */
export async function updateAssessment(id, updates) {
  if (!id) {
    throw new Error('Assessment id is required');
  }
  return requestJson(`/api/assessments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Deletes an existing assessment and logs failed deletion attempts.
 *
 * @param {string|number} id - Assessment id accepted by the backend route.
 * @returns {Promise<Record<string, unknown>>} Delete response body from the API.
 * @throws {Error} If id is missing, the API fails, or the response body is empty.
 */
export async function deleteAssessment(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }

  try {
    const response = await requestJson(`/api/assessments/${id}`, { method: 'DELETE' });

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
 * Fetches two assessments for side-by-side comparison with visibility enforcement.
 * Includes auth header when available so owners can compare private assessments.
 *
 * @param {string} id1 - First assessment public UUID.
 * @param {string} id2 - Second assessment public UUID.
 * @returns {Promise<{assessment1: Object, assessment2: Object}>} Pair of assessments authorized for comparison.
 * @throws {Error} With `status` 403/404 when either assessment is inaccessible.
 */
export async function getComparisonAssessments(id1, id2) {
  if (!id1 || !id2 || typeof id1 !== 'string' || typeof id2 !== 'string') {
    throw new Error('Both assessment ids are required and must be valid strings');
  }

  // Ensure we don't pass empty strings to URLSearchParams
  const query = new URLSearchParams();
  query.append('id1', id1.trim());
  query.append('id2', id2.trim());

  // Use optional authentication - include auth header if available
  const headers = await getAuthHeaders();

  const url = buildApiUrl(`/api/assessments/compare?${query}`);
  const response = await fetch(url, {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

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
 * Fetches public global activity statistics aggregated from multiple sources:
 * - scoring_results_log (all scoring calls, anonymous + authenticated)
 * - get_market_data RPC for market benchmarks
 * - get_assessment_statistics RPC for global assessment stats
 *
 * @returns {Promise<Object>} Global statistics including market data and assessment stats.
 * @throws {Error} If the API responds with a non-2xx status.
 */
export async function getGlobalStats() {
  // Public endpoint - no auth required, but still use proxy in production
  const url = buildApiUrl('/api/analytics/global-stats');
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

/**
 * Scores an assessment with real-time progress over a streamed SSE-like response.
 * Anonymous-limit failures are delivered to `onError`; malformed 403 bodies are re-thrown.
 *
 * @param {{ businessProblem: string, businessSolution: string, evaluationParameters?: Record<string, number>, businessContext?: Record<string, unknown> }} formData - Form data sent to the streaming score endpoint.
 * @param {(stage: string, message: string, data?: Record<string, unknown>) => void} onStage - Callback for progress updates.
 * @param {(result: Record<string, unknown>) => void} onComplete - Callback for successful completion.
 * @param {(error: unknown) => void} onError - Callback for errors.
 * @throws {Record<string, unknown>} Raw 403 body when the backend sends an unrecognized forbidden response.
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
            logger.warn('[SCORE_STREAM:SSE_PARSE_FAILED]', { parseErr, event: dataMatch[1] });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    logger.warn('[SCORE_STREAM:GENERAL_ERROR]', { error });
    if (error.code === 'ANON_SCORING_LIMIT_REACHED') {
      onError(error); // error is the raw body: { code, limit, message, ... }
      return;
    }
    if (
      error.status === 403 ||
      (typeof error === 'object' &&
        error !== null &&
        !error.message &&
        Object.keys(error).length > 0)
    ) {
      throw error;
    }
    onError(error);
  }
}
