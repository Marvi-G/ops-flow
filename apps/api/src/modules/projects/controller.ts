import type { Request, Response, NextFunction } from 'express';
import { projectService } from './service.js';
import { sendSuccess, sendCreated } from '../../infrastructure/response.js';

export class ProjectController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const projects = await projectService.findAll(req.sessionUser.organizationId);
      sendSuccess(res, projects);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const project = await projectService.findById(
        req.sessionUser.organizationId,
        req.params.id as string
      );
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const project = await projectService.create(
        req.sessionUser.organizationId,
        req.body
      );
      sendCreated(res, project);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const project = await projectService.update(
        req.sessionUser.organizationId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
