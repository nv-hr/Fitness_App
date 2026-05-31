import { Router } from 'express';
import dailyMealPlanController from '../controllers/dailyMealPlan.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import dailyMealPlanLimiter from '../middlewares/dailyMealPlanRateLimiter.js';

const router = Router();

router.use(authenticateToken);

router.get('/', dailyMealPlanController.get);
router.post('/generate', dailyMealPlanLimiter, dailyMealPlanController.generate);
router.post('/log', dailyMealPlanController.logMeals);

export default router;
