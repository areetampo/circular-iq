/**
 * @module assessmentApi
 * @description HTTP client for assessment CRUD, validation, comparison, global stats, and SSE scoring.
 * All authenticated calls attach the Supabase session Bearer token when available.
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
    // logger.log('[AUTH_DEBUG] Session data:', data);

    if (data?.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
      // logger.log('[AUTH_DEBUG] Auth header set');
    } else {
      // logger.log('[AUTH_DEBUG] No session or token found');
    }
  } catch (error) {
    logger.error('[AUTH_HEADER_ERROR]', error);
  }

  return headers;
}

/**
 * Make an authenticated API request
 * @param {string} path - API endpoint path
 * @param {Object} options - Request options
 * @returns {Promise<Response>} Fetch response
 */
async function request(path, options = {}) {
  const headers = await getAuthHeaders();
  // logger.log('[REQUEST_DEBUG] Headers being sent:', headers);

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

/**
 * Make an authenticated API request and parse JSON response
 * @param {string} path - API endpoint path
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Parsed JSON response data
 * @throws {Error} If request fails with detailed error information
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
    const err = new Error(`HTTP ${response.status}: ${message}`);
    err.status = response.status;
    err.response = data;
    throw err;
  }

  return data;
}

/**
 * Fetch user assessments with filtering and pagination
 * @param {Object} [params={}] - Query parameters
 * @param {string} [params.industry] - Filter by industry
 * @param {string} [params.sortBy] - Sort field (created_at, overall_score, title)
 * @param {string} [params.order] - Sort order (asc, desc)
 * @param {number|string} [params.page] - Page number (defaults to 1)
 * @param {number|string} [params.pageSize] - Items per page (max 100)
 * @param {string} [params.search] - Search term for title/industry
 * @param {string} [params.createdFrom] - Filter by creation date (from)
 * @param {string} [params.createdTo] - Filter by creation date (to)
 * @param {number} [params.minScore] - Filter by minimum score
 * @param {number} [params.maxScore] - Filter by maximum score
 * @returns {Promise<{assessments: Array, pagination: Object}>} Validated list with pagination info
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
 * Fetch assessment statistics for the current user
 * @returns {Promise<Object>} Assessment statistics including totals, averages, and distributions
 */
export async function getAssessmentStats() {
  const data = await requestJson('/api/assessments/stats');
  return data;
}

/**
 * Validate a single assessment ID for sharing
 * @param {string} publicId - Assessment public ID
 * @returns {Promise<{valid: boolean}>} Validation result
 * @throws {Error} If validation fails with detailed error information
 */
export async function validateAssessmentId(publicId) {
  // logger.log('[validateAssessmentId] called with:', { publicId });

  // Use optional authentication for validation
  const response = await request(`/api/assessments/validate/${encodeURIComponent(publicId)}`);

  const body = await response.json().catch(() => null);

  // logger.log('[validateAssessmentId] API response received:', {
  //   response: { status: response.status, ok: response.ok, statusText: response.statusText, body },
  // });

  // Check if ID is invalid (NOT_FOUND)
  if (response.status === 404) {
    // logger.log('[validateAssessmentId] 404 error detected, throwing error');
    throw new Error('Invalid assessment ID');
  }

  // Check if ID is not public (FORBIDDEN)
  if (response.status === 403) {
    // logger.log('[validateAssessmentId] 403 error detected, throwing error');
    throw new Error('Assessment not publicly available');
  }

  // Check for any other errors
  if (!response.ok) {
    // logger.log('[validateAssessmentId] Other error detected, response not OK');

    // logger.log('Error body:', { errorBody: body });
    throw new Error(body?.error || 'Failed to validate assessment ID');
  }

  // logger.log('[validateAssessmentId] Successful response body:', { body });

  return {
    valid: body?.valid === true,
    isOwner: body?.isOwner === true,
    isPublic: body?.isPublic === true,
  };
}

/**
 * Validate assessment IDs for comparison
 * @param {string} id1 - First assessment public ID
 * @param {string} id2 - Second assessment public ID
 * @returns {Promise<{valid1: boolean, valid2: boolean}>} Validation results
 * @throws {Error} If validation fails with detailed error information
 */
export async function validateAssessmentIds(id1, id2) {
  // logger.log('[validateAssessmentIds] called with:', { id1, id2 });

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

  // logger.log('[validateAssessmentIds] API responses received:', {
  //   res1: { status: res1.status, ok: res1.ok, statusText: res1.statusText, body: body1 },
  //   res2: { status: res2.status, ok: res2.ok, statusText: res2.statusText, body: body2 },
  // });

  // Check if either ID is invalid (NOT_FOUND)
  if (res1.status === 404 || res2.status === 404) {
    // logger.log('[validateAssessmentIds] 404 error detected, throwing error');
    throw new Error('One or more ids incorrect');
  }

  // Check if either ID is not public (FORBIDDEN)
  if (res1.status === 403 || res2.status === 403) {
    // logger.log('[validateAssessmentIds] 403 error detected, throwing error');
    throw new Error('One or more assessments not public');
  }

  // Check for any other errors
  if (!res1.ok || !res2.ok) {
    // Reuse the already parsed body1 and body2 from above

    // logger.log('[validateAssessmentIds] Other error detected, responses not OK');
    // logger.log('Error bodies:', { body1, body2 });

    throw new Error(body1?.error || body2?.error || 'Failed to validate assessment IDs');
  }

  // logger.log('[validateAssessmentIds] Successful response data body:', { body1, body2 });

  return {
    valid1: body1?.valid === true,
    valid2: body2?.valid === true,
  };
}

/**
 * Fetch a single assessment by ID
 * @param {string|number} id - Assessment ID
 * @returns {Promise<Object>} Assessment data with validated structure
 * @throws {Error} If ID is missing or validation fails
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
 * @returns {Promise<{assessment: Object, readonly: boolean}>}
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
 * Create a new assessment
 * @param {Object} payload - Assessment data to create
 * @returns {Promise<Object>} Created assessment data
 */
export async function createAssessment(payload) {
  return requestJson('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing assessment
 * @param {string|number} id - Assessment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated assessment data
 * @throws {Error} If ID is missing
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
 * Delete an assessment
 * @param {string|number} id - Assessment ID
 * @returns {Promise<Object>} Deletion response
 * @throws {Error} If ID is missing or deletion fails
 */
export async function deleteAssessment(id) {
  if (!id) {
    throw new Error('Assessment id is required');
  }

  // logger.log('[DELETE_ASSESSMENT_API]', { id });

  try {
    const response = await requestJson(`/api/assessments/${id}`, { method: 'DELETE' });
    // logger.log('[DELETE_ASSESSMENT_RESPONSE]', { id, response });

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
 * @returns {Promise<{assessment1: Object, assessment2: Object}>}
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
 * Fetch global activity statistics
 * Aggregates data from multiple sources:
 * - scoring_results_log (all scoring calls, anonymous + authenticated)
 * - get_market_data RPC for market benchmarks
 * - get_assessment_statistics RPC for global assessment stats
 * No authentication required
 * @returns {Promise<Object>} Global statistics including market data and assessment stats
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
 * Score assessment with real-time progress streaming via Server-Sent Events
 * @param {Object} formData - Form data with businessProblem, businessSolution, evaluationParameters, businessContext
 * @param {Function} onStage - Callback for progress updates (stage, message)
 * @param {Function} onComplete - Callback for successful completion (result)
 * @param {Function} onError - Callback for errors (error)
 * @returns {Promise<void>} Resolves when the SSE stream closes (success or error handled via callbacks)
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
    if (err.code === 'ANON_SCORING_LIMIT_REACHED') {
      onError(err); // err is the raw body: { code, limit, message, ... }
      return;
    }
    if (
      err.status === 403 ||
      (typeof err === 'object' && err !== null && !err.message && Object.keys(err).length > 0)
    ) {
      throw err;
    }
    onError(err);
  }
}
