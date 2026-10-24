import { PrismaClient } from '@prisma/client';
import { getConfig } from '../../config/index.js';
import { getLogger } from '../logger/index.js';

let prisma: PrismaClient | null = null;

export function createDatabase(): PrismaClient {
  if (prisma) return prisma;

  const config = getConfig();
  const logger = getLogger();

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
    log: config.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });

  if (config.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: any) => {
      logger.debug({ query: e.query, duration: e.duration }, 'Query executed');
    });
  }

  prisma.$on('error' as never, (e: any) => {
    logger.error({ error: e }, 'Database error');
  });

  return prisma;
}

export function getDatabase(): PrismaClient {
  if (!prisma) {
    return createDatabase();
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
