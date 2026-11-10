import type { Request, Response, NextFunction } from 'express';
import { teamService } from './service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../infrastructure/response.js';

export class TeamController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const teams = await teamService.findAll(req.sessionUser.organizationId);
      sendSuccess(res, teams);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const team = await teamService.findById(
        req.sessionUser.organizationId,
        req.params.id as string
      );
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const team = await teamService.create(
        req.sessionUser.organizationId,
        req.body
      );
      sendCreated(res, team);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const team = await teamService.update(
        req.sessionUser.organizationId,
        req.params.id as string,
        req.body
      );
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      await teamService.delete(
        req.sessionUser.organizationId,
        req.params.id as string
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const team = await teamService.addMember(
        req.sessionUser.organizationId,
        req.params.id as string,
        req.body
      );
      sendCreated(res, team);
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      const team = await teamService.updateMemberRole(
        req.sessionUser.organizationId,
        req.params.id as string,
        req.params.userId as string,
        req.body
      );
      sendSuccess(res, team);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.sessionUser) {
        throw new Error('Not authenticated');
      }
      await teamService.removeMember(
        req.sessionUser.organizationId,
        req.params.id as string,
        req.params.userId as string
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const teamController = new TeamController();
