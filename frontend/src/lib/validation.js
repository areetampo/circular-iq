/**
 * Validation Utilities
 * Input validation and character counting
 *
 * Location: src/lib/validation.js
 */

/**
 * Count meaningful characters (excluding leading/trailing whitespace)
 * Matches the validation logic in App.jsx
 * @param {string} text - Text to count
 * @returns {number} Character count
 */
export function getCharacterCount(text) {
  if (!text) return 0;
  return text.trim().length;
}

/**
 * Validate input before submission
 * @param {string} problem - Problem description
 * @param {string} solution - Solution description
 * @param {number} minLength - Minimum length (default 50)
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateInput(problem, solution, minLength = 50) {
  if (!problem || !solution) {
    return {
      valid: false,
      error: 'Both problem and solution are required',
    };
  }

  const problemLength = getCharacterCount(problem);
  const solutionLength = getCharacterCount(solution);

  if (problemLength < minLength) {
    return {
      valid: false,
      error: `Problem must be at least ${minLength} characters (currently ${problemLength})`,
    };
  }

  if (solutionLength < minLength) {
    return {
      valid: false,
      error: `Solution must be at least ${minLength} characters (currently ${solutionLength})`,
    };
  }

  return { valid: true };
}

/**
 * Validate assessment name
 * @param {string} name - Assessment name
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateAssessmentName(name) {
  if (!name) {
    return {
      valid: false,
      error: 'Assessment name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Assessment name cannot be empty',
    };
  }

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'Assessment name must be at least 3 characters',
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Assessment name must be less than 100 characters',
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateEmail(email) {
  if (!email) {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }

  return { valid: true };
}

/**
 * Validate parameter values
 * @param {Object} parameters - Parameter object
 * @returns {Object} Validation result {valid: boolean, errors?: Object}
 */
export function validateParameters(parameters) {
  const errors = {};
  const validKeys = [
    'public_participation',
    'infrastructure',
    'market_price',
    'maintenance',
    'uniqueness',
    'size_efficiency',
    'chemical_safety',
    'tech_readiness',
  ];

  for (const key of validKeys) {
    const value = parameters[key];

    if (value === undefined || value === null) {
      errors[key] = 'Parameter value is required';
      continue;
    }

    if (typeof value !== 'number') {
      errors[key] = 'Parameter must be a number';
      continue;
    }

    if (value < 0 || value > 100) {
      errors[key] = 'Parameter must be between 0 and 100';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validateUrl(url) {
  if (!url) {
    return {
      valid: false,
      error: 'URL is required',
    };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL',
    };
  }
}

/**
 * Validate phone number (basic US format)
 * @param {string} phone - Phone number
 * @returns {Object} Validation result {valid: boolean, error?: string}
 */
export function validatePhone(phone) {
  if (!phone) {
    return {
      valid: false,
      error: 'Phone number is required',
    };
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10) {
    return {
      valid: false,
      error: 'Phone number must be 10 digits',
    };
  }

  return { valid: true };
}

/**
 * Check if text meets minimum word count
 * @param {string} text - Text to check
 * @param {number} minWords - Minimum word count
 * @returns {boolean} True if meets requirement
 */
export function meetsMinWordCount(text, minWords) {
  if (!text) return false;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length >= minWords;
}

/**
 * Get word count from text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function getWordCount(text) {
  if (!text) return 0;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length;
}
