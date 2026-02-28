/**
 * API Communication Layer
 * Handles all backend API calls for assessments
 *
 * Location: src/api/assessment.js
 */

import { FRONTEND_CONFIG } from '@/config';
import { buildApiUrl } from '@/lib/apiClient';

const API_URL = FRONTEND_CONFIG.apiBaseUrl;

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
 * Save assessment to backend (example for future use)
 * @param {Object} assessment - Assessment data to save
 * @returns {Promise<Object>} Saved assessment
 */
export async function saveAssessment(assessment) {
  try {
    const response = await fetch(buildApiUrl('/api/assessments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessment),
    });

    if (!response.ok) {
      throw new Error(`Failed to save assessment: ${response.status}`);
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
