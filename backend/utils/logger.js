/**
 * Shared Pino logger configured for pretty local output and structured JSON elsewhere.
 * Server bootstrap also exposes this instance on `globalThis.logger` for lifecycle hooks
 * that run before normal module imports are convenient.
 */

import pino from 'pino';

import { BACKEND_CONFIG } from '#config/backend.config.js';

const isDev = BACKEND_CONFIG.nodeEnv === 'development';

/** Pino instance extended with the API operation helper used by route middleware. */
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
 * Logs a normalized API/subsystem operation record through the shared logger.
 *
 * @param {string} op - HTTP verb or short operation label such as `GET` or `poll`.
 * @param {string} path - Route path or subsystem key that identifies where the operation ran.
 * @param {number|string} stat - HTTP status code or stable outcome label for non-HTTP work.
 * @param {number} dur - Elapsed duration in milliseconds measured by the caller.
 * @param {Record<string, unknown>|null} [details=null] - Optional structured context attached under `details`.
 */
logger.logOperation = (op, path, stat, dur, details = null) => {
  const logData = { op, path, stat, dur };
  if (details) {
    logData.details = details;
  }
  return logger.info(logData, 'API Op');
};

/** Makes the configured logger available to startup/shutdown code that runs outside route modules. */
globalThis.logger = logger;
