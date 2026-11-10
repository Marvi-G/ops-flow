import type { Request, Response, NextFunction } from 'express';
import { serviceService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../infrastructure/response.js';

export class ServiceController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const services = await serviceService.findAll(req.sessionUser.organizationId);
      sendSuccess(res, services);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const service = await serviceService.findById(
        req.sessionUser.organizationId,
        req.params.id as string
      );
      sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const service = await serviceService.create(
        req.sessionUser.organizationId,
        req.body
      );
      sendCreated(res, service);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const service = await serviceService.update(
        req.sessionUser.organizationId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      await serviceService.delete(req.sessionUser.organizationId, req.params.id as string);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const serviceController = new ServiceController();
