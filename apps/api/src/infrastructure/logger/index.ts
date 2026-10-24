import pino from 'pino';
import { getConfig } from '../../config/index.js';

let logger: pino.Logger | null = null;

export function createLogger(): pino.Logger {
  if (logger) return logger;

  const config = getConfig();

  logger = pino({
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development'
      ? {
          target: 'pino/file',
          options: { destination: 1 },
        }
      : undefined,
    base: {
      env: config.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  return logger;
}

export function getLogger(): pino.Logger {
  if (!logger) {
    return createLogger();
  }
  return logger;
}
