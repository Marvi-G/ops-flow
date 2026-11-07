import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { loadConfig } from './config/index.js';
import { createLogger } from './infrastructure/logger/index.js';
import { createDatabase, disconnectDatabase } from './infrastructure/database/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';

// Import routes
import authRoutes from './modules/auth/routes.js';
import organizationRoutes from './modules/organizations/routes.js';
import userRoutes from './modules/users/routes.js';
import teamRoutes from './modules/teams/routes.js';
import projectRoutes from './modules/projects/routes.js';
import serviceRoutes from './modules/services/routes.js';
import incidentRoutes from './modules/incidents/routes.js';

// Load configuration
const config = loadConfig();
const logger = createLogger();

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request ID
app.use(requestIdMiddleware);

// HTTP logging
const httpLogger = (pinoHttp as any)({
  logger,
  autoLogging: {
    ignore: (req: any) => req.url === '/health',
  },
  customSuccessMessage: (req: any, res: any) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req: any, _res: any, err: any) => {
    return `${req.method} ${req.url} - ${err.message}`;
  },
});

app.use(httpLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/incidents', incidentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database
createDatabase();

// Don't start a server under tests or on Netlify (the app runs as a function there)
if (!process.env.VITEST && !process.env.NETLIFY) {
  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Server running on port ${config.PORT}`);
    logger.info(`📝 Environment: ${config.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDatabase();
      logger.info('Database disconnected');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
