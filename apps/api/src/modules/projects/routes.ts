import { Router } from 'express';
import { projectController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, PERMISSIONS } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validation.js';
import { createProjectSchema, updateProjectSchema } from './schemas.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List projects
router.get('/', authorize(PERMISSIONS.PROJECTS_READ), projectController.findAll);

// Create project
router.post(
  '/',
  authorize(PERMISSIONS.PROJECTS_CREATE),
  validateBody(createProjectSchema),
  projectController.create
);

// Get project by ID
router.get(
  '/:id',
  authorize(PERMISSIONS.PROJECTS_READ),
  validateParams(z.object({ id: z.string().uuid() })),
  projectController.findById
);

// Update project
router.patch(
  '/:id',
  authorize(PERMISSIONS.PROJECTS_UPDATE),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateProjectSchema),
  projectController.update
);

// Delete project (refused while it still has services)
router.delete(
  '/:id',
  authorize(PERMISSIONS.PROJECTS_DELETE),
  validateParams(z.object({ id: z.string().uuid() })),
  projectController.delete
);

export default router;
