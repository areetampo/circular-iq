/**
 * @module logger
 * @description Centralized logging utility using Pino logger.
 * Provides structured logging with pretty-printing in development and
 * JSON output in production. Includes a custom logOperation method
 * for consistent API operation logging.
 *
 * Features:
 * - Development mode: Pretty-printed colored logs with timestamps
 * - Production mode: JSON logs for log aggregation services
 * - Custom logOperation method for standardized API operation tracking
 */

import pino from 'pino';

import { BACKEND_CONFIG } from '#config/backend.config.js';

const isDev = BACKEND_CONFIG.nodeEnv === 'development';

/**
 * Pino logger instance configured for the current environment.
 * In development, uses pino-pretty for human-readable output.
 * In production, outputs JSON for log aggregation.
 *
 * @type {import('pino').Logger}
 */
export const logger = pino({
  level: 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
});

/**
 * Log an API operation with standardized format.
 * Used throughout the codebase for consistent operation tracking.
 *
 * @param {string} op - Operation name (e.g., 'POST', 'GET', 'database_query')
 * @param {string} path - API path or operation location
 * @param {number|string} stat - HTTP status code or operation status
 * @param {number} dur - Duration in milliseconds
 * @param {Object|null} details - Additional details to include in log (optional)
 *
 * @example
 * logger.logOperation('POST', '/api/score', 200, 150, { userId: '123' });
 * // Logs: { op: 'POST', path: '/api/score', stat: 200, dur: 150, details: { userId: '123' } }
 */
logger.logOperation = (op, path, stat, dur, details = null) => {
  const logData = { op, path, stat, dur };
  if (details) {
    logData.details = details;
  }
  return logger.info(logData, 'API Op');
};

/** Available as bare `logger` in server lifecycle modules (no import). */
globalThis.logger = logger;
