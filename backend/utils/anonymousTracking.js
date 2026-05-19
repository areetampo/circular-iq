/**
 * @module anonymousTracking
 * @description Anonymous user tracking utilities for rate limiting and usage analytics.
 * Extracts and hashes identifying information from HTTP requests without storing
 * personal data. Uses SHA-256 hashing to create anonymous identifiers.
 *
 * Functions:
 * - extractIPAddress: Extract real IP address from request headers
 * - extractUserAgent: Extract User-Agent header from request
 * - createIdentifierHash: Create SHA-256 hash from IP + User-Agent
 * - getIdentifierFromRequest: Generate complete identifier object from request
 */

import crypto from 'crypto';

import { BACKEND_CONFIG } from '#config/backend.config.js';

/**
 * Anonymous scoring limit from configuration
 * @type {number}
 */
export const ANON_SCORING_LIMIT = BACKEND_CONFIG.scoring.anonScoringLimit;

/**
 * Extract real IP address from request, handling proxy headers.
 * Checks multiple headers in order of reliability: x-forwarded-for, x-real-ip,
 * cf-connecting-ip, then falls back to connection/socket remote address.
 *
 * @param {Object} req - Express request object
 * @returns {string} The extracted IP address or 'unknown' if not found
 *
 * @example
 * const ip = extractIPAddress(req);
 * // Returns: '192.168.1.1' or 'unknown'
 */
export function extractIPAddress(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return (
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Extract User-Agent header from request.
 *
 * @param {Object} req - Express request object
 * @returns {string} The User-Agent string or 'unknown' if not found
 *
 * @example
 * const ua = extractUserAgent(req);
 * // Returns: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...' or 'unknown'
 */
export function extractUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Create a unique anonymous identifier hash from IP address and User-Agent.
 * Uses SHA-256 hashing to ensure the same request always produces the same hash,
 * while preventing reverse engineering of the original values.
 *
 * @param {string} ip - IP address
 * @param {string} userAgent - User-Agent string
 * @returns {string} SHA-256 hash of the combined identifier
 *
 * @example
 * const hash = createIdentifierHash('192.168.1.1', 'Mozilla/5.0...');
 * // Returns: 'a1b2c3d4e5f6...' (64-character hex string)
 */
export function createIdentifierHash(ip, userAgent) {
  const identifier = `${ip}|||${userAgent}`;
  return crypto.createHash('sha256').update(identifier).digest('hex');
}

/**
 * Generate complete anonymous identifier object from an Express request.
 * Extracts IP and User-Agent, then creates a hash for anonymous tracking.
 *
 * @param {Object} req - Express request object
 * @returns {Object} Identifier object containing hash, IP, and User-Agent
 * @returns {string} returns.hash - SHA-256 hash of IP + User-Agent
 * @returns {string} returns.ip - Extracted IP address
 * @returns {string} returns.userAgent - Extracted User-Agent string
 *
 * @example
 * const identifier = getIdentifierFromRequest(req);
 * // Returns: { hash: 'a1b2c3...', ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
 */
export function getIdentifierFromRequest(req) {
  const ip = extractIPAddress(req);
  const ua = extractUserAgent(req);
  return {
    hash: createIdentifierHash(ip, ua),
    ip,
    userAgent: ua,
  };
}
