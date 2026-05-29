import { Router } from 'express';
import weeklyPlanController from '../controllers/weeklyPlan.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import weeklyPlanLimiter from '../middlewares/weeklyPlanRateLimiter.js';

const router = Router();

router.use(authenticateToken);

router.post('/generate', weeklyPlanLimiter, weeklyPlanController.generate);

export default router;
