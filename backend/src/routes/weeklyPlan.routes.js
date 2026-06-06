import { Router } from 'express';
import weeklyPlanController from '../controllers/weeklyPlan.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { weeklyPlanLimiter, regenerateLimiter, swapLimiter, toggleCompleteLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', weeklyPlanController.get);
router.post('/generate', weeklyPlanLimiter, weeklyPlanController.generate);
router.post('/generate-stream', weeklyPlanLimiter, weeklyPlanController.generateStream);
router.post('/regenerate-day', regenerateLimiter, weeklyPlanController.regenerateDay);
router.post('/regenerate-day-stream', regenerateLimiter, weeklyPlanController.regenerateDayStream);
router.post('/swap', swapLimiter, weeklyPlanController.swap);
router.post('/swap-stream', swapLimiter, weeklyPlanController.swapStream);
router.post('/toggle-complete', toggleCompleteLimiter, weeklyPlanController.toggleComplete);

export default router;
