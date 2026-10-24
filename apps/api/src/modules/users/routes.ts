import { Router } from 'express';
import { userController } from './controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize, PERMISSIONS } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validation.js';
import { updateUserSchema, changePasswordSchema } from './schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user
router.get('/current', userController.getCurrent);

// Update current user
router.patch(
  '/current',
  validateBody(updateUserSchema),
  userController.updateCurrent
);

// Change password
router.post(
  '/current/password',
  validateBody(changePasswordSchema),
  userController.changePassword
);

// List users in organization
router.get(
  '/',
  authorize(PERMISSIONS.MEMBERS_READ),
  userController.listByOrganization
);

export default router;
