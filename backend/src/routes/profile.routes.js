import { Router } from 'express';
import profileController from '../controllers/profile.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All profile routes require authentication
router.use(authenticateToken);

// POST /api/profile — Create profile (first-time setup)
router.post('/', profileController.createProfile);

// GET /api/profile — Get existing profile
router.get('/', profileController.getProfile);

// PUT /api/profile — Update profile
router.put('/', profileController.updateProfile);

export default router;
