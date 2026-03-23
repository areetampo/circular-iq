import pino from 'pino';

import { BACKEND_CONFIG } from '#config/backend.config';

const isDev = BACKEND_CONFIG.nodeEnv === 'development';

const logger = pino({
  level: 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
});

logger.logOperation = (op, stat, dur) => logger.info({ op, stat, dur }, 'API Op');

export default logger;
