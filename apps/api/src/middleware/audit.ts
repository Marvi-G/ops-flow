import type { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../infrastructure/database/index.js';
import { getLogger } from '../infrastructure/logger/index.js';

interface AuditOptions {
  action: string;
  resourceType: string;
  getResourceId?: (req: Request, res: Response) => string | undefined;
  getResourceLabel?: (req: Request, res: Response) => string | undefined;
  getDetails?: (req: Request, res: Response) => string | undefined;
}

export function audit(options: AuditOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response
    res.end = function (this: Response, chunk?: any, encoding?: any): any {
      // Only audit successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Log audit asynchronously
        setImmediate(async () => {
          try {
            const db = getDatabase();

            const resourceId = options.getResourceId?.(req, res);
            const resourceLabel = options.getResourceLabel?.(req, res);
            const details = options.getDetails?.(req, res);

            if (req.sessionUser && resourceId) {
              await db.auditLog.create({
                data: {
                  organizationId: req.sessionUser.organizationId,
                  userId: req.sessionUser.user.id,
                  action: options.action,
                  resourceType: options.resourceType,
                  resourceId,
                  resourceLabel,
                  details,
                  ipAddress: req.ip,
                  userAgent: req.headers['user-agent'],
                },
              });
            }
          } catch (error) {
            const logger = getLogger();
            logger.error({ error }, 'Failed to create audit log');
          }
        });
      }

      // Call original end
      return originalEnd.call(this, chunk, encoding);
    } as any;

    next();
  };
}
