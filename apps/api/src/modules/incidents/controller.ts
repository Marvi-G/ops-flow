import type { Request, Response, NextFunction } from 'express';
import { incidentService } from './service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../infrastructure/response.js';

export class IncidentController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionUser } = req;
      if (!sessionUser) {
        throw new Error('Not authenticated');
      }

      const result = await incidentService.findAll(sessionUser.organizationId, req.query as any);

      sendPaginated(
        res,
        result.data,
        Number(req.query.page) || 1,
        Number(req.query.pageSize) || 20,
        result.total
      );
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionUser } = req;
      if (!sessionUser) {
        throw new Error('Not authenticated');
      }

      const incidentId = req.params.id as string;
      const incident = await incidentService.findById(
        sessionUser.organizationId,
        incidentId
      );

      const related = await incidentService.getRelatedIncidents(
        sessionUser.organizationId,
        incidentId
      );

      sendSuccess(res, { ...incident, related });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionUser } = req;
      if (!sessionUser) {
        throw new Error('Not authenticated');
      }

      const incident = await incidentService.create(
        sessionUser.organizationId,
        sessionUser.user.id,
        req.body
      );

      sendCreated(res, incident);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionUser } = req;
      if (!sessionUser) {
        throw new Error('Not authenticated');
      }

      const incidentId = req.params.id as string;
      const incident = await incidentService.update(
        sessionUser.organizationId,
        incidentId,
        sessionUser.user.id,
        req.body
      );

      sendSuccess(res, incident);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionUser } = req;
      if (!sessionUser) {
        throw new Error('Not authenticated');
      }

      const incidentId = req.params.id as string;
      const comment = await incidentService.addComment(
        sessionUser.organizationId,
        incidentId,
        sessionUser.user.id,
        req.body.body
      );

      sendCreated(res, comment);
    } catch (error) {
      next(error);
    }
  }
}

export const incidentController = new IncidentController();
