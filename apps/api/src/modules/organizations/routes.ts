import { Router } from 'express';
import { organizationController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, PERMISSIONS } from '../../middleware/authorize.js';
import { validateBody, validateParams } from '../../middleware/validation.js';
import { updateOrganizationSchema, updateMemberSchema, memberParamsSchema } from './schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current organization
router.get('/current', organizationController.getCurrent);

// List organizations for current user
router.get('/', organizationController.listForUser);

// Update current organization
router.patch(
  '/current',
  authorize(PERMISSIONS.SETTINGS_MANAGE),
  validateBody(updateOrganizationSchema),
  organizationController.update
);

// Get organization members
router.get(
  '/current/members',
  authorize(PERMISSIONS.MEMBERS_READ),
  organizationController.getMembers
);

// Change a member's role
router.patch(
  '/current/members/:userId',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateParams(memberParamsSchema),
  validateBody(updateMemberSchema),
  organizationController.updateMember
);

// Remove a member from the organization
router.delete(
  '/current/members/:userId',
  authorize(PERMISSIONS.MEMBERS_MANAGE),
  validateParams(memberParamsSchema),
  organizationController.removeMember
);

export default router;
