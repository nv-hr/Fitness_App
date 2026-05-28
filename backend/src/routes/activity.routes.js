import { Router } from 'express';
import activityController from '../controllers/activity.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All activity routes require authentication
router.use(authenticateToken);

// GET /api/activities/recommendations — Randomized goal-based recommendations
router.get('/recommendations', activityController.getRecommendations);

// GET /api/activities — Full activity pool filtered by user's goal
router.get('/', activityController.getAllActivities);

export default router;
