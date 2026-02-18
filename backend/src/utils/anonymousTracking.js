import crypto from 'crypto';

// Configuration
export const MAX_FREE_TRIES = Number(process.env.MAX_FREE_TRIES) || 5;

/**
 * Extract real IP address handling proxies
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
 * Extract User Agent
 */
export function extractUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Create unique identifier hash from IP + User Agent
 */
export function createIdentifierHash(ip, userAgent) {
  const identifier = `${ip}|||${userAgent}`;
  return crypto.createHash('sha256').update(identifier).digest('hex');
}

/**
 * Generate identifier from request
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
