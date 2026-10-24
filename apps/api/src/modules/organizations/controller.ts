import type { Request, Response, NextFunction } from 'express';
import { organizationService } from './service.js';
import { sendSuccess } from '../../infrastructure/response.js';

export class OrganizationController {
  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const org = await organizationService.findById(req.sessionUser.organizationId);
      sendSuccess(res, org);
    } catch (error) {
      next(error);
    }
  }

  async listForUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const orgs = await organizationService.findByUserId(req.sessionUser.user.id);
      sendSuccess(res, orgs);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const org = await organizationService.update(
        req.sessionUser.organizationId,
        req.body
      );
      sendSuccess(res, org);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const members = await organizationService.getMembers(
        req.sessionUser.organizationId
      );
      sendSuccess(res, members);
    } catch (error) {
      next(error);
    }
  }
}

export const organizationController = new OrganizationController();
