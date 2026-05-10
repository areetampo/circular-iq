/**
 * Shared controller utilities
 */

/**
 * Log API operation
 * @param {string} operation - Operation name
 * @param {string} path - API endpoint path
 * @param {string} status - Operation status
 * @param {number} duration - Duration in milliseconds
 */
export function logOperation(operation, path, status, duration) {
  logger.logOperation(operation, path, status, duration);
}

/**
 * Standard success response format
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Formatted success response
 */
export function successResponse(data, message = 'Operation successful') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Standard error response format
 * @param {string} message - Error message
 * @param {number} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error response
 */
export function errorResponse(message, code = 500, details = null) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {string[]} requiredFields - Array of required field names
 * @throws {Error} If required fields are missing
 */
export function validateRequiredFields(body, requiredFields) {
  const missing = requiredFields.filter((field) => !body[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Extract user info from request
 * @param {Object} req - Express request object
 * @returns {Object} User information
 */
export function extractUserInfo(req) {
  return {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };
}
