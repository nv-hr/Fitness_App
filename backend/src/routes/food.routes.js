import { Router } from 'express';
import foodController from '../controllers/food.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All food routes require authentication
router.use(authenticateToken);

// GET /api/food/search?q= — Search foods by name
router.get('/search', foodController.searchFoods);

// POST /api/food — Create custom food
router.post('/', foodController.createCustomFood);

// POST /api/food/log — Log a food entry
router.post('/log', foodController.logFood);

// GET /api/food/summary?date= — Daily calorie summary
router.get('/summary', foodController.getDailySummary);

// GET /api/food/logs?date= — Individual log entries for a date
router.get('/logs', foodController.getDailyLogs);

// GET /api/food/history?days= — Calorie history
router.get('/history', foodController.getLogHistory);

// GET /api/food/recent — Recently logged foods
router.get('/recent', foodController.getRecentFoods);

export default router;
