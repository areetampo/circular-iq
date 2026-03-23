import { FRONTEND_CONFIG } from '@/config/frontend.config';

const isDev = !FRONTEND_CONFIG.isProd && FRONTEND_CONFIG.mode !== 'test';

const logger = {
  log: (...args) => {
    if (isDev) {
      console.log('[LOG]:', ...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]:', ...args);
    }
  },
  error: (...args) => {
    // We always want errors in the console for production debugging
    console.error('[ERROR]:', ...args);

    // If you ever add Sentry/LogRocket, you'd trigger it here:
    // if (!isDev) { reportToExternalService(args); }
  },
};

export default logger;
