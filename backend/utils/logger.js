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

logger.log = logger.info.bind(logger);

logger.logOperation = (op, stat, dur) => logger.info({ op, stat, dur }, 'API Op');
