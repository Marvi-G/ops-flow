import { Router } from 'express';
import { incidentController } from './controller.js';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, PERMISSIONS } from '../../middleware/authorize.js';
import {
  createIncidentSchema,
  updateIncidentSchema,
  incidentQuerySchema,
  incidentIdSchema,
  createCommentSchema,
} from './schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List incidents
router.get(
  '/',
  validateQuery(incidentQuerySchema),
  authorize(PERMISSIONS.INCIDENTS_READ),
  incidentController.findAll
);

// Create incident
router.post(
  '/',
  validateBody(createIncidentSchema),
  authorize(PERMISSIONS.INCIDENTS_CREATE),
  incidentController.create
);

// Get incident by ID
router.get(
  '/:id',
  validateParams(incidentIdSchema),
  authorize(PERMISSIONS.INCIDENTS_READ),
  incidentController.findById
);

// Update incident
router.patch(
  '/:id',
  validateParams(incidentIdSchema),
  validateBody(updateIncidentSchema),
  authorize(PERMISSIONS.INCIDENTS_UPDATE),
  incidentController.update
);

// Add comment to incident
router.post(
  '/:id/comments',
  validateParams(incidentIdSchema),
  validateBody(createCommentSchema),
  authorize(PERMISSIONS.INCIDENTS_UPDATE),
  incidentController.addComment
);

export default router;
