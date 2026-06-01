import { Router } from 'express';
import activityController from '../controllers/activity.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All activity routes require authentication
router.use(authenticateToken);

// GET /api/activities — Full activity pool filtered by user's goal
router.get('/', activityController.getAllActivities);

// POST /api/activities/log — Log an activity
router.post('/log', activityController.logActivity);

// GET /api/activities/logs?date= — Get logs for a date
router.get('/logs', activityController.getActivityLogs);

// GET /api/activities/history?days=7&includeEntries= — Get grouped history
router.get('/history', activityController.getActivityHistory);

// DELETE /api/activities/log/:id — Delete a log entry
router.delete('/log/:id', activityController.deleteActivityLog);

// GET /api/activities/summary?date= — Daily activity summary with net calories
router.get('/summary', activityController.getActivitySummary);

export default router;
