import { validateActivityPlanStructure } from '../../src/services/activityPlan/validator.js';

describe('validateActivityPlanStructure', () => {
  const validDate = '2026-06-08';

  it('passes a valid structure', () => {
    const plan = {
      date: validDate,
      activities: [
        { activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }
      ]
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails if activities is missing', () => {
    const plan = { date: validDate };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Plan must have an "activities" array');
  });

  it('fails if date mismatches', () => {
    const plan = {
      date: '2026-06-09',
      activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }]
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Expected date 2026-06-08 but got 2026-06-09');
  });

  it('fails if activity count is out of bounds', () => {
    const plan = {
      date: validDate,
      activities: []
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Expected 1-4 activities but got 0');
  });

  it('validates activity_id', () => {
    const plan = {
      date: validDate,
      activities: [{ activity_id: '1', name: 'Running', duration_min: 30, intensity: 'moderate' }]
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/invalid activity_id/);
  });

  it('validates duration bounds', () => {
    const plan = {
      date: validDate,
      activities: [{ activity_id: 1, name: 'Running', duration_min: 5, intensity: 'moderate' }]
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/duration_min must be 10-180/);
  });

  it('validates intensity types', () => {
    const plan = {
      date: validDate,
      activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'extreme' }]
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/intensity must be light\/moderate\/vigorous/);
  });

  it('validates rest_day type', () => {
    const plan = {
      date: validDate,
      activities: [{ activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' }],
      rest_day: 'yes'
    };
    const result = validateActivityPlanStructure(plan, validDate);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rest_day must be a boolean if present');
  });
});
