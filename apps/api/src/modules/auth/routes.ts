import { Router } from 'express';
import { authController } from './controller.js';
import { validateBody } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginSchema, registerSchema, switchOrganizationSchema } from './schemas.js';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/register', validateBody(registerSchema), authController.register);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);
router.post(
  '/switch-organization',
  authenticate,
  validateBody(switchOrganizationSchema),
  authController.switchOrganization
);

export default router;
