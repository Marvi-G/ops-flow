import type { Request, Response, NextFunction } from 'express';
import { userService } from './service.js';
import { sendSuccess, sendNoContent } from '../../infrastructure/response.js';

export class UserController {
  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const user = await userService.findById(req.sessionUser.user.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const user = await userService.update(
        req.sessionUser.user.id,
        req.body
      );
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      await userService.changePassword(
        req.sessionUser.user.id,
        req.body
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async listByOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const users = await userService.findByOrganization(
        req.sessionUser.organizationId
      );
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
