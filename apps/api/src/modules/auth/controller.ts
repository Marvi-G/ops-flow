import type { Request, Response, NextFunction } from 'express';
import { authService } from './service.js';
import { sendSuccess, sendNoContent } from '../../infrastructure/response.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      // Set session cookie
      res.cookie('session', result.session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, result.data);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      // Set session cookie
      res.cookie('session', result.session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, result.data, 201);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionToken = (req.session as any)?.token;

      if (sessionToken) {
        await authService.logout(sessionToken);
      }

      // Clear session cookie
      res.clearCookie('session');

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionToken = (req.session as any)?.token;

      if (!sessionToken) {
        res.clearCookie('session');
        sendNoContent(res);
        return;
      }

      const newToken = await authService.refresh(sessionToken);

      // Set new session cookie
      res.cookie('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess(res, { refreshed: true });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }

      const data = await authService.me(
        req.sessionUser.user.id,
        req.sessionUser.organizationId
      );

      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async switchOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }

      const sessionToken = (req.session as any)?.token;
      if (!sessionToken) {
        throw new Error('No session');
      }

      await authService.switchOrganization(
        req.sessionUser.user.id,
        req.body.organizationId,
        sessionToken
      );

      sendSuccess(res, { switched: true });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
