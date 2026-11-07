import type { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../infrastructure/database/index.js';
import { UnauthorizedError } from '../infrastructure/errors.js';
import type { SessionUser } from './types.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.cookies?.session;

    if (!sessionToken) {
      throw new UnauthorizedError('Authentication required');
    }

    const db = getDatabase();

    // Find valid session
    const session = await db.session.findUnique({
      where: {
        token: sessionToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
        organization: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    // Get user's role in the organization
    let role = 'member';
    if (session.organizationId) {
      const membership = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: session.organizationId,
            userId: session.user.id,
          },
        },
        select: {
          role: true,
        },
      });
      role = membership?.role || 'member';
    }

    req.sessionUser = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.avatar,
      },
      organizationId: session.organizationId!,
      role,
    } as SessionUser;

    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // Don't throw error if not authenticated
  authenticate(req, _res, (err) => {
    if (err) {
      // Clear the error and continue
      next();
    } else {
      next();
    }
  });
}
