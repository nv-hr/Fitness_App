import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/auth/register — Register new user
router.post('/register', authController.register);

// POST /api/auth/login — Login with email/password
router.post('/login', authController.login);

// POST /api/auth/logout — Logout (clear session cookie)
router.post('/logout', authController.logout);

// GET /api/auth/me — Get current user (protected)
router.get('/me', authenticateToken, authController.getMe);

export default router;
