import { generateFallbackActivityPlan } from '../../src/services/activityPlan/generator.js';

describe('generateFallbackActivityPlan', () => {
  it('returns a default plan if no dbActivities are provided', () => {
    const fallback = generateFallbackActivityPlan([]);
    expect(fallback.activities).toHaveLength(1);
    expect(fallback.activities[0].name).toBe('Walking');
    expect(fallback.llm_model).toBe('template-fallback');
  });

  it('picks up to 3 random activities', () => {
    const dbActivities = [
      { id: 1, name: 'Run', estimated_calories: 300 },
      { id: 2, name: 'Swim', estimated_calories: 400 },
      { id: 3, name: 'Bike', estimated_calories: 200 },
      { id: 4, name: 'Yoga', estimated_calories: 100 },
    ];
    const fallback = generateFallbackActivityPlan(dbActivities);
    expect(fallback.activities.length).toBe(3);
    expect(fallback.llm_model).toBe('template-fallback');
    expect(fallback.activities[0]).toHaveProperty('duration_min');
    expect(fallback.activities[0]).toHaveProperty('intensity');
  });

  it('assigns correct intensities based on duration', () => {
    const dbActivities = [
      { id: 1, name: 'Test', estimated_calories: 600 } // high calories => high duration => vigorous
    ];
    const fallback = generateFallbackActivityPlan(dbActivities);
    expect(fallback.activities[0].duration_min).toBe(60); // Math.max(10, Math.min(60, 60))
    expect(fallback.activities[0].intensity).toBe('vigorous'); // duration >= 60
  });
});
