/**
 * Environment-aware console logger: `log`/`info` in dev only, `warn`/`error` always, and `initArt` in production.
 */

import { SITE_NAME, SITE_FULL_NAME } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';

const isDev = !FRONTEND_CONFIG.isProduction && FRONTEND_CONFIG.mode !== 'test';

/** @type {{ log: Function, info: Function, warn: Function, error: Function, initArt: Function }} */
export const logger = {
  /** Dev only — prefixed `[LOG]`. */
  log: (...args) => {
    if (isDev) console.log('[LOG]:', ...args);
  },

  /** Dev only — prefixed `[INFO]`. */
  info: (...args) => {
    if (isDev) console.info('[INFO]:', ...args);
  },

  /** Always logged (including production) — prefixed `[WARN]`. */
  warn: (...args) => {
    console.warn('[WARN]:', ...args);
  },

  /** Always logged (including production) — hook external error reporting here if added. */
  error: (...args) => {
    // We always want errors in the console for production debugging
    console.error('[ERROR]:', ...args);

    // If Sentry/LogRocket is added, trigger it here:
    // if (!isDev) { reportToExternalService(args); }
  },

  /** Production-only console banner; no-op in dev/test. */
  initArt: () => {
    if (isDev) return;

    console.log(
      `%c${SITE_NAME}\n%c${SITE_FULL_NAME}`,
      'font-family: monospace; font-size: 36px; font-weight: bold; color: #C8A46A; text-shadow: 0 0 20px rgba(200,164,106,0.4);',
      'font-family: monospace; font-size: 16px; color: #C8A46A; letter-spacing: 6px; opacity: 0.7;',
    );
  },
};
