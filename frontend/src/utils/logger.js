/**
 * @module logger
 * @description Centralized logging utility for the application.
 * Provides environment-aware logging with different levels (log, info, warn, error).
 * In production, only errors are logged to console. In development, all levels are logged.
 *
 * Methods:
 * - log: Development-only general logging
 * - info: Development-only informational logging
 * - warn: Development-only warning logging
 * - error: Always logged (production and development)
 * - initArt: Displays ASCII art banner in production
 */

import { SITE_NAME, SITE_FULL_NAME } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { generateAsciiArt } from '@/utils/generateAsciiArt';

const isDev = !FRONTEND_CONFIG.isProd && FRONTEND_CONFIG.mode !== 'test';

export const logger = {
  log: (...args) => {
    if (isDev) console.log('[LOG]:', ...args);
  },
  info: (...args) => {
    if (isDev) console.info('[INFO]:', ...args);
  },
  warn: (...args) => {
    if (isDev) console.warn('[WARN]:', ...args);
  },
  error: (...args) => {
    // We always want errors in the console for production debugging
    console.error('[ERROR]:', ...args);

    // If you ever add Sentry/LogRocket, you'd trigger it here:
    // if (!isDev) { reportToExternalService(args); }
  },
  initArt: async () => {
    if (!isDev) return;

    try {
      const art = await generateAsciiArt({
        src: '/site-logo.png',
        resolution: 65,
      });

      console.log(
        '%c' + art,
        `
        font-family: monospace;
        font-size: 12px;
        line-height: 1;
        color: #C8A46A;
        `,
        `\n\n${SITE_NAME} - ${SITE_FULL_NAME}`,
      );
    } catch {
      // ignore
    }
  },
};
