import { Router } from 'express';
import activityPlanController from '../controllers/activityPlan.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', activityPlanController.get);
router.post('/generate', activityPlanController.generate);

export default router;
