import {
  ACTIVITY_LEVEL_CALORIE_CEILING,
  filterActivities,
  buildActiveDay,
  generateWeeklyPlanAlgorithm,
} from '../../src/services/activityPlan/weeklyPlanAlgorithm.js';

describe('weeklyPlanAlgorithm', () => {
  describe('filterActivities', () => {
    const mockActivities = [
      { id: 1, name: 'Light Walk', estimated_calories: 50, goal_tags: ['weight_loss', 'maintenance'] },
      { id: 2, name: 'Yoga', estimated_calories: 120, goal_tags: ['maintenance', 'flexibility'] },
      { id: 3, name: 'Jogging', estimated_calories: 300, goal_tags: ['weight_loss', 'cardio'] },
      { id: 4, name: 'HIIT', estimated_calories: 500, goal_tags: ['weight_loss', 'muscle_gain'] },
    ];

    it('matches goal + ceiling', () => {
      // sedentary: ceiling 80. 'weight_loss' goal. Only Light Walk fits.
      const result = filterActivities(mockActivities, 'weight_loss', 'sedentary');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Light Walk');
    });

    it('falls back to ceiling only if no goal matches', () => {
      // sedentary: ceiling 80. 'muscle_gain' goal. No activity has muscle_gain AND <= 80 cal.
      // Should fall back to ceiling match (Light Walk).
      const result = filterActivities(mockActivities, 'muscle_gain', 'sedentary');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Light Walk');
    });

    it('falls back to all activities if even ceiling matches fail', () => {
      // Very weird case: ceiling 10, no activities fit.
      // We will override ACTIVITY_LEVEL_CALORIE_CEILING just for this test via a tricky activityLevel that doesn't exist?
      // Actually, if activityLevel is 'sedentary', ceiling is 80. If all activities are > 80, it falls back to all.
      const heavyActivities = [
        { id: 1, name: 'Jogging', estimated_calories: 300, goal_tags: ['weight_loss'] }
      ];
      const result = filterActivities(heavyActivities, 'weight_loss', 'sedentary');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Jogging');
    });

    it('extra_active level applies no ceiling', () => {
      const result = filterActivities(mockActivities, 'weight_loss', 'extra_active');
      expect(result.length).toBe(3); // Light Walk, Jogging, HIIT
    });
  });

  describe('buildActiveDay', () => {
    const mockPool = [
      { id: 1, name: 'A', duration_min: 20, estimated_calories: 100 },
      { id: 2, name: 'B', duration_min: 20, estimated_calories: 100 },
      { id: 3, name: 'C', duration_min: 20, estimated_calories: 100 },
      { id: 4, name: 'D', duration_min: 20, estimated_calories: 100 },
      { id: 5, name: 'E', duration_min: 20, estimated_calories: 100 },
    ];

    it('selects 3-4 unique activities', () => {
      const day = buildActiveDay('2023-01-01', mockPool, 60);
      expect(day.activities.length).toBeGreaterThanOrEqual(3);
      expect(day.activities.length).toBeLessThanOrEqual(4);
      
      const ids = day.activities.map(a => a.activity_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length); // All unique
    });

    it('handles underflow scaling', () => {
      // Pool only has 3 activities of 10 mins each (total 30).
      // Tier is 60. Should scale up exactly to 60.
      const smallPool = [
        { id: 1, name: 'A', duration_min: 10, estimated_calories: 50 },
        { id: 2, name: 'B', duration_min: 10, estimated_calories: 50 },
        { id: 3, name: 'C', duration_min: 10, estimated_calories: 50 },
      ];
      const day = buildActiveDay('2023-01-01', smallPool, 60);
      const totalDur = day.activities.reduce((sum, a) => sum + a.duration_min, 0);
      expect(totalDur).toBe(60);
    });

    it('handles overflow prorating', () => {
      // Tier is 30. Pool has 3 activities of 20 mins.
      // First activity = 20. Remaining = 10.
      // Second activity should be prorated to 10.
      const largePool = [
        { id: 1, name: 'A', duration_min: 20, estimated_calories: 100 },
        { id: 2, name: 'B', duration_min: 20, estimated_calories: 100 },
        { id: 3, name: 'C', duration_min: 20, estimated_calories: 100 },
      ];
      const day = buildActiveDay('2023-01-01', largePool, 30);
      const totalDur = day.activities.reduce((sum, a) => sum + a.duration_min, 0);
      expect(totalDur).toBe(30);
      expect(day.activities.length).toBe(2);
      expect(day.activities[1].duration_min).toBe(10);
    });
  });

  describe('generateWeeklyPlanAlgorithm', () => {
    const mockProfile = { fitness_goal: 'weight_loss', activity_level: 'moderately_active' };
    const mockActivities = [
      { id: 1, name: 'A', duration_min: 20, estimated_calories: 100, goal_tags: ['weight_loss'] },
      { id: 2, name: 'B', duration_min: 20, estimated_calories: 100, goal_tags: ['weight_loss'] },
      { id: 3, name: 'C', duration_min: 20, estimated_calories: 100, goal_tags: ['weight_loss'] },
      { id: 4, name: 'D', duration_min: 20, estimated_calories: 100, goal_tags: ['weight_loss'] },
    ];

    it('generates 7 days with 2 rest days and 5 active days', () => {
      const plan = generateWeeklyPlanAlgorithm({
        profile: mockProfile,
        activities: mockActivities,
        weekStart: '2023-01-01'
      });

      expect(plan.days.length).toBe(7);
      
      const restDays = plan.days.filter(d => d.rest_day);
      const activeDays = plan.days.filter(d => !d.rest_day);
      
      expect(restDays.length).toBe(2);
      expect(activeDays.length).toBe(5);
      expect(plan.source).toBe('algorithm');
      
      expect(plan.days[0].date).toBe('2023-01-01');
      expect(plan.days[6].date).toBe('2023-01-07');
    });
  });
});
