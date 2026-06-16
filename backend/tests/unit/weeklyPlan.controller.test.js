import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockGenerateWeeklyPlanAlgorithm = jest.fn();
const mockFindByUserId = jest.fn();
const mockGetAllActivities = jest.fn();
const mockFindByUserAndWeek = jest.fn();
const mockUpsertPlan = jest.fn();
const mockSyncWeeklyPlanCompletedStates = jest.fn();

// Mock dependencies BEFORE importing the controller
jest.unstable_mockModule('../../src/services/activityPlan/index.js', () => ({
  generateWeeklyPlanAlgorithm: mockGenerateWeeklyPlanAlgorithm
}));
jest.unstable_mockModule('../../src/repositories/profile.repository.js', () => ({
  findByUserId: mockFindByUserId
}));
jest.unstable_mockModule('../../src/repositories/activity.repository.js', () => ({
  getAllActivities: mockGetAllActivities,
  getActivityHistoryWithEntries: jest.fn(),
  getTopActivities: jest.fn(),
  getRandomActivities: jest.fn(),
  upsertActivityLogFromPlan: jest.fn(),
  deleteActivityLogByPlan: jest.fn(),
}));
jest.unstable_mockModule('../../src/repositories/weeklyPlan.repository.js', () => ({
  findByUserAndWeek: mockFindByUserAndWeek,
  upsertPlan: mockUpsertPlan,
  syncWeeklyPlanCompletedStates: mockSyncWeeklyPlanCompletedStates
}));
jest.unstable_mockModule('../../src/services/llm.service.js', () => ({
  getCachedPlan: jest.fn(),
  setCachedPlan: jest.fn(),
  clearCachedPlan: jest.fn(),
  acquireLock: jest.fn(),
  swapActivity: jest.fn(),
  regenerateDay: jest.fn(),
  activeGenerations: new Map()
}));

describe('weeklyPlan.controller', () => {
  let app;
  let weeklyPlanController;

  beforeAll(async () => {
    // Dynamic import to ensure mocks apply
    const mod = await import('../../src/controllers/weeklyPlan.controller.js');
    weeklyPlanController = mod.default;

    app = express();
    app.use(express.json());

    // Fake auth middleware
    app.use((req, res, next) => {
      req.user = { userId: 1 };
      next();
    });

    app.post('/api/weekly-plans/generate', weeklyPlanController.generate);
    app.post('/api/weekly-plans/generate-stream', weeklyPlanController.generateStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate a plan using the algorithm', async () => {
      mockFindByUserId.mockResolvedValue({ id: 1, fitness_goal: 'maintain', activity_level: 'moderate' });
      mockGetAllActivities.mockResolvedValue([{ id: 1, name: 'Walking' }]);
      mockGenerateWeeklyPlanAlgorithm.mockReturnValue({
        days: [{ date: '2023-01-01', rest_day: false, activities: [] }]
      });

      const response = await request(app)
        .post('/api/weekly-plans/generate')
        .send({ weekStart: '2023-01-01', force: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plan.days.length).toBe(1);

      expect(mockFindByUserId).toHaveBeenCalledWith(1);
      expect(mockGetAllActivities).toHaveBeenCalled();
      expect(mockGenerateWeeklyPlanAlgorithm).toHaveBeenCalled();
      expect(mockUpsertPlan).toHaveBeenCalled();
    });

    it('should return 400 if user profile does not exist', async () => {
      mockFindByUserId.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/weekly-plans/generate')
        .send({ weekStart: '2023-01-01', force: true });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_PROFILE');
    });

    it('should return 409 if plan generation is already in progress', async () => {
      mockFindByUserId.mockResolvedValue({ id: 1, fitness_goal: 'maintain', activity_level: 'moderate' });
      const { activeGenerations } = await import('../../src/services/llm.service.js');
      
      // Simulate lock being held by setting the lock key
      activeGenerations.set('weekly_1_2022-12-26', true);

      try {
        const response = await request(app)
          .post('/api/weekly-plans/generate')
          .send({ weekStart: '2022-12-26', force: true });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('GenerationConflict');
      } finally {
        activeGenerations.delete('weekly_1_2022-12-26');
      }
    });
  });

  describe('generateStream', () => {
    it('should generate a plan using the algorithm and stream the result', async () => {
      mockFindByUserId.mockResolvedValue({ id: 1, fitness_goal: 'maintain', activity_level: 'moderate' });
      mockGetAllActivities.mockResolvedValue([{ id: 1, name: 'Walking' }]);
      mockGenerateWeeklyPlanAlgorithm.mockReturnValue({
        days: [{ date: '2023-01-01', rest_day: false, activities: [] }]
      });

      const response = await request(app)
        .post('/api/weekly-plans/generate-stream')
        .send({ weekStart: '2023-01-01', force: true });

      expect(response.status).toBe(200);
      // Since it's SSE, the response text should contain the "done" payload
      expect(response.text).toContain('"type":"done"');
      expect(mockGenerateWeeklyPlanAlgorithm).toHaveBeenCalled();
    });
  });
});
