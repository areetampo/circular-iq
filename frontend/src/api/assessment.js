/**
 * API Communication Layer
 * Handles all backend API calls for assessments
 *
 * Location: src/api/assessment.js
 */

import { buildApiUrl } from '@/lib/apiClient';

/**
 * Call backend API to score a business idea
 * @param {string} businessProblem - Problem description
 * @param {string} businessSolution - Solution description
 * @param {Object} parameters - Scoring parameters
 * @returns {Promise<Object>} API response with scores and audit
 */
export async function submitForScoring(businessProblem, businessSolution, parameters) {
  try {
    const response = await fetch(buildApiUrl('/api/score'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessProblem,
        businessSolution,
        parameters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Scoring API error:', error);
    throw error;
  }
}

/**
 * Fetch saved assessments from backend (example for future use)
 * @returns {Promise<Array>} List of assessments
 */
export async function fetchAssessments() {
  try {
    const response = await fetch(buildApiUrl('/api/assessments'));
    if (!response.ok) {
      throw new Error(`Failed to fetch assessments: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch assessments error:', error);
    throw error;
  }
}

/**
 * Save a completed assessment to the backend
 * @param {Object} params
 * @param {Object} params.scoringResult  - Full scoring API response object
 * @param {string} params.name           - User-provided assessment name
 * @param {string} [params.industry]     - Industry override (falls back to metadata)
 * @param {boolean} [params.isPublic]    - Whether assessment is public (default true)
 * @param {boolean} [params.contributeToGlobal] - Contribute to benchmarks (default true)
 * @param {string} [params.token]        - Auth token for Authorization header
 * @returns {Promise<Object>} Saved assessment response
 */
export async function saveAssessment({
  scoringResult,
  name,
  industry,
  isPublic,
  contributeToGlobal,
  token,
}) {
  try {
    const response = await fetch(buildApiUrl('/api/assessments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name,
        industry: industry ?? scoringResult?.metadata?.industry ?? null,
        is_public: isPublic ?? true,
        contribute_to_global_benchmarks: contributeToGlobal ?? true,
        // Full scoring API response — backend stores every column from this
        result_json: scoringResult,
        // Top-level fields for backward compatibility with validation middleware
        businessProblem: scoringResult?.businessProblem,
        businessSolution: scoringResult?.businessSolution,
        parameters: scoringResult?.input_parameters || scoringResult?.parameters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to save assessment: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save assessment error:', error);
    throw error;
  }
}

/**
 * Delete assessment from backend (example for future use)
 * @param {string} assessmentId - ID of assessment to delete
 * @returns {Promise<void>}
 */
export async function deleteAssessment(assessmentId) {
  try {
    const response = await fetch(buildApiUrl(`/api/assessments/${assessmentId}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete assessment: ${response.status}`);
    }
  } catch (error) {
    console.error('Delete assessment error:', error);
    throw error;
  }
}
