import { Router } from 'express';
import dailyMealPlanController from '../controllers/dailyMealPlan.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { dailyMealPlanLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', dailyMealPlanController.get);
router.post('/generate', dailyMealPlanLimiter, dailyMealPlanController.generate);
router.post('/log', dailyMealPlanController.logMeals);
router.post('/toggle-item', dailyMealPlanController.toggleItemLogged);
router.post('/regenerate-category', dailyMealPlanLimiter, dailyMealPlanController.regenerateCategory);

export default router;
