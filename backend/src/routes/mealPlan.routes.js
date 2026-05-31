import { Router } from 'express';
import mealPlanController from '../controllers/mealPlan.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import mealPlanLimiter, { regenerateLimiter, logDayLimiter } from '../middlewares/mealPlanRateLimiter.js';

const router = Router();

router.use(authenticateToken);

router.get('/', mealPlanController.get);
router.post('/generate', mealPlanLimiter, mealPlanController.generate);
router.post('/regenerate-day', regenerateLimiter, mealPlanController.regenerateDay);
router.post('/log-day', logDayLimiter, mealPlanController.logDay);

export default router;
