import { Router } from 'express';
import { teamController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, PERMISSIONS } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validation.js';
import { createTeamSchema, updateTeamSchema, addTeamMemberSchema } from './schemas.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List teams
router.get('/', authorize(PERMISSIONS.MEMBERS_READ), teamController.findAll);

// Create team
router.post(
  '/',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateBody(createTeamSchema),
  teamController.create
);

// Get team by ID
router.get(
  '/:id',
  authorize(PERMISSIONS.MEMBERS_READ),
  validateParams(z.object({ id: z.string().uuid() })),
  teamController.findById
);

// Update team
router.patch(
  '/:id',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateTeamSchema),
  teamController.update
);

// Delete team
router.delete(
  '/:id',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateParams(z.object({ id: z.string().uuid() })),
  teamController.delete
);

// Add member to team
router.post(
  '/:id/members',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(addTeamMemberSchema),
  teamController.addMember
);

// Remove member from team
router.delete(
  '/:id/members/:userId',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateParams(z.object({ id: z.string().uuid(), userId: z.string().uuid() })),
  teamController.removeMember
);

export default router;
