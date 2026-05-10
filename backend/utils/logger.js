import pino from 'pino';

import { BACKEND_CONFIG } from '#config/backend.config.js';

const isDev = BACKEND_CONFIG.nodeEnv === 'development';

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

logger.logOperation = (op, path, stat, dur) => logger.info({ op, path, stat, dur }, 'API Op');
