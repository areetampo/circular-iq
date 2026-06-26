/**
 * Environment-aware console logger: `log`/`info` in dev only, `warn`/`error` always, and `initArt` in production.
 */

import { SITE_NAME, SITE_FULL_NAME } from '@/components/common';
import { FRONTEND_CONFIG } from '@/config/frontend.config';
import { generateAsciiArt } from '@/utils/generateAsciiArt';

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
  /** Production-only ASCII logo in the console; no-op in dev/test. */
  initArt: async () => {
    if (isDev) return;

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
