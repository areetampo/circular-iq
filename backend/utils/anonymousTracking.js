/**
 * Anonymous scoring limit helpers that derive stable request identifiers from IP and User-Agent.
 * The raw values are retained for diagnostics, while the hash is used for limit accounting.
 */

import crypto from 'crypto';

import { BACKEND_CONFIG } from '#config/backend.config.js';

/** Maximum number of anonymous scoring submissions allowed per retained identifier window. */
export const ANON_SCORING_LIMIT = BACKEND_CONFIG.scoring.anonScoringLimit;

/** Retention window, in days, after which anonymous usage rows no longer count toward the limit. */
export const ANON_SCORING_USAGE_RETENTION_DAYS =
  BACKEND_CONFIG.scoring.anonScoringUsageRetentionDays;

/**
 * Resolves a best-effort client IP using proxy headers before socket fallbacks.
 * The first `x-forwarded-for` hop is used because it represents the original client in
 * the deployment proxy chain.
 *
 * @param {import('express').Request} req - Incoming request whose proxy headers may identify the client.
 * @returns {string} Best-effort client IP string, or `'unknown'` when no header/socket address is available.
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
 * Raw User-Agent header for anonymous rate-limit hashing; `'unknown'` when absent.
 *
 * @param {import('express').Request} req - Incoming request carrying the browser User-Agent header.
 * @returns {string} Raw User-Agent header value, or `'unknown'` when absent.
 */
export function extractUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Creates the stable anonymous identifier stored for scoring rate-limit checks.
 *
 * @param {string} ip - Client IP value after proxy header fallback resolution.
 * @param {string} userAgent - Raw User-Agent value paired with the IP before hashing.
 * @returns {string} SHA-256 hex digest for the `ip|||userAgent` tuple.
 */
export function createIdentifierHash(ip, userAgent) {
  const identifier = `${ip}|||${userAgent}`;
  return crypto.createHash('sha256').update(identifier).digest('hex');
}

/**
 * Builds the anonymous tracking tuple used by scoring controllers and persistence.
 *
 * @param {import('express').Request} req - Incoming request used to derive anonymous rate-limit identity fields.
 * @returns {{ hash: string, ip: string, userAgent: string }} Hashed identifier plus raw components retained for storage/debug context.
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
