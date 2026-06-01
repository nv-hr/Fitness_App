import { Router } from 'express';
import { postWeight, getWeightHistory, deleteWeight } from '../controllers/weightLog.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.post('/weight', postWeight);
router.get('/weight', getWeightHistory);
router.delete('/weight/:id', deleteWeight);

export default router;
