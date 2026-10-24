import { Router } from 'express';
import { serviceController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, PERMISSIONS } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validation.js';
import { createServiceSchema, updateServiceSchema } from './schemas.js';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List services
router.get('/', authorize(PERMISSIONS.SERVICES_READ), serviceController.findAll);

// Create service
router.post(
  '/',
  authorize(PERMISSIONS.SERVICES_MANAGE),
  validateBody(createServiceSchema),
  serviceController.create
);

// Get service by ID
router.get(
  '/:id',
  authorize(PERMISSIONS.SERVICES_READ),
  validateParams(z.object({ id: z.string().uuid() })),
  serviceController.findById
);

// Update service
router.patch(
  '/:id',
  authorize(PERMISSIONS.SERVICES_MANAGE),
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateServiceSchema),
  serviceController.update
);

export default router;
