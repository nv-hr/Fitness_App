import { describe, it, expect } from '@jest/globals';
import {
  validatePlanStructure,
  fuzzyMatchActivityName,
  validateAndFixPlan,
  buildSystemPrompt,
  generateFallbackPlan,
} from '../../src/services/llm.service.js';
import {
  calculateCaloriesBurned,
  validateActivityLogInput,
  calculateDailyNetCalories,
} from '../../src/services/activityLog.service.js';
import { ValidationError } from '../../src/utils/errors.js';

describe('validatePlanStructure', () => {
  function makeValidDay(date) {
    return {
      date,
      activities: [
        { activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' },
      ],
    };
  }

  it('valid 7-day plan passes', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(makeValidDay(dateStr));
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('missing days array returns error', () => {
    const result = validatePlanStructure({}, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('days');
  });

  it('wrong number of days (6) returns error', () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push(makeValidDay(d.toISOString().split('T')[0]));
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('7 days'))).toBe(true);
  });

  it('wrong number of days (8) returns error', () => {
    const days = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push(makeValidDay(d.toISOString().split('T')[0]));
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('7 days'))).toBe(true);
  });

  it('day with 0 activities returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({ date: d.toISOString().split('T')[0], activities: [] });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('1-4'))).toBe(true);
  });

  it('day with 5 activities returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: Array(5).fill(null).map((_, j) => ({
          activity_id: j + 1, name: `Act ${j}`, duration_min: 30, intensity: 'moderate',
        })),
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('1-4'))).toBe(true);
  });

  it('invalid date on a day returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(makeValidDay('2026-01-01'));
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('date'))).toBe(true);
  });

  it('detects missing activity_id, name, duration_min, intensity', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: [{}],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
  });

  it('non-numeric activity_id returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: [{ activity_id: 'abc', name: 'Test', duration_min: 30, intensity: 'moderate' }],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('activity_id'))).toBe(true);
  });

  it('duration_min < 10 returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: [{ activity_id: 1, name: 'Test', duration_min: 5, intensity: 'moderate' }],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('10-180'))).toBe(true);
  });

  it('duration_min > 180 returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: [{ activity_id: 1, name: 'Test', duration_min: 200, intensity: 'moderate' }],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('10-180'))).toBe(true);
  });

  it('invalid intensity returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: [{ activity_id: 1, name: 'Test', duration_min: 30, intensity: 'extreme' }],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('light/moderate/vigorous'))).toBe(true);
  });
});

describe('fuzzyMatchActivityName', () => {
  const dbActivities = [
    { id: 1, name: 'Morning Running' },
    { id: 2, name: 'Yoga' },
    { id: 3, name: 'Cycling' },
  ];

  it('exact match returns matched with exact type', () => {
    const result = fuzzyMatchActivityName('Yoga', dbActivities);
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('exact');
    expect(result.activity.name).toBe('Yoga');
  });

  it('contains match returns matched with fuzzy-contains type', () => {
    const result = fuzzyMatchActivityName('running', dbActivities);
    expect(result.matched).toBe(true);
    expect(result.matchType).toBe('fuzzy-contains');
  });

  it('empty name returns no match', () => {
    const result = fuzzyMatchActivityName('', dbActivities);
    expect(result.matched).toBe(false);
    expect(result.activity).toBeNull();
    expect(result.matchType).toBe('none');
  });

  it('non-string name returns no match', () => {
    const result = fuzzyMatchActivityName(123, dbActivities);
    expect(result.matched).toBe(false);
    expect(result.activity).toBeNull();
    expect(result.matchType).toBe('none');
  });

  it('no match at all returns no match', () => {
    const result = fuzzyMatchActivityName('ZZZZNOTEXIST', dbActivities);
    expect(result.matched).toBe(false);
    expect(result.activity).toBeNull();
    expect(result.matchType).toBe('none');
  });
});

describe('validateAndFixPlan', () => {
  const dbActivities = [
    { id: 1, name: 'Running' },
    { id: 2, name: 'Yoga' },
  ];

  it('passes through valid plan with matched activity IDs', () => {
    const plan = {
      days: [
        {
          date: '2026-01-05',
          activities: [
            { activity_id: 1, name: 'Running', duration_min: 30, intensity: 'moderate' },
          ],
        },
      ],
    };
    const result = validateAndFixPlan(plan, dbActivities);
    expect(result.valid).toBe(true);
  });

  it('sets activity_id for exact name matches (case-insensitive)', () => {
    const plan = {
      days: [
        {
          date: '2026-01-05',
          activities: [
            { name: 'running', duration_min: 30, intensity: 'moderate' },
          ],
        },
      ],
    };
    const result = validateAndFixPlan(plan, dbActivities);
    expect(result.valid).toBe(true);
    expect(result.plan.days[0].activities[0].activity_id).toBe(1);
  });

  it('fixes fuzzy-matched activity names and sets IDs', () => {
    const plan = {
      days: [
        {
          date: '2026-01-05',
          activities: [
            { name: 'run', duration_min: 30, intensity: 'moderate' },
          ],
        },
      ],
    };
    const result = validateAndFixPlan(plan, dbActivities);
    expect(result.valid).toBe(true);
    expect(result.plan.days[0].activities[0].name).toBe('Running');
    expect(result.plan.days[0].activities[0].activity_id).toBe(1);
  });

  it('returns errors for unmatched activities', () => {
    const plan = {
      days: [
        {
          date: '2026-01-05',
          activities: [
            { name: 'ZZZZNOTEXIST', duration_min: 30, intensity: 'moderate' },
          ],
        },
      ],
    };
    const result = validateAndFixPlan(plan, dbActivities);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not found'))).toBe(true);
  });
});

describe('generateFallbackPlan', () => {
  it('returns 7-day plan when user has history', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => [
        { id: 1, name: 'Running', estimated_calories: 300, duration_min: 30 },
        { id: 2, name: 'Yoga', estimated_calories: 150, duration_min: 45 },
      ],
      userId: 1,
      weekStart: '2026-01-05',
    });
    expect(result.days.length).toBe(7);
    expect(result.days[0].activities.length).toBeGreaterThan(0);
    expect(result.status).toBe('fallback');
  });

  it('returns unavailable status when no history', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => [],
      userId: 1,
      weekStart: '2026-01-05',
    });
    expect(result.status).toBe('unavailable');
    expect(result.message).toBeDefined();
    expect(result.days.length).toBe(0);
  });

  it('fallback activities have valid structure', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => [
        { id: 1, name: 'Running', estimated_calories: 300, duration_min: 30 },
      ],
      userId: 1,
      weekStart: '2026-01-05',
    });
    for (const day of result.days) {
      for (const act of day.activities) {
        expect(act.activity_id).toBeGreaterThan(0);
        expect(typeof act.name).toBe('string');
        expect(act.duration_min).toBeGreaterThan(0);
        expect(['light', 'moderate', 'vigorous']).toContain(act.intensity);
      }
    }
  });
});

describe('calculateCaloriesBurned', () => {
  const activity = { estimated_calories: 200, duration_min: 60 };

  it('moderate intensity: 200 * (30/60) * 1.0 = 100', () => {
    expect(calculateCaloriesBurned(activity, 30, 'moderate')).toBe(100);
  });

  it('light intensity: 200 * (30/60) * 0.7 = 70', () => {
    expect(calculateCaloriesBurned(activity, 30, 'light')).toBe(70);
  });

  it('vigorous intensity: 200 * (30/60) * 1.3 = 130', () => {
    expect(calculateCaloriesBurned(activity, 30, 'vigorous')).toBe(130);
  });

  it('different duration: 200 * (45/60) * 1.0 = 150', () => {
    expect(calculateCaloriesBurned(activity, 45, 'moderate')).toBe(150);
  });

  it('rounds correctly: 165 * (35/30) * 1.0 = round(192.5) = 193', () => {
    const act = { estimated_calories: 165, duration_min: 30 };
    expect(calculateCaloriesBurned(act, 35, 'moderate')).toBe(193);
  });
});

describe('validateActivityLogInput', () => {
  it('valid input does not throw', () => {
    expect(() => {
      validateActivityLogInput({ activityId: 1, durationMin: 30, intensity: 'moderate' });
    }).not.toThrow();
  });

  it('missing activityId throws ValidationError', () => {
    expect(() => {
      validateActivityLogInput({ durationMin: 30, intensity: 'moderate' });
    }).toThrow(ValidationError);
  });

  it('duration < 1 throws ValidationError', () => {
    expect(() => {
      validateActivityLogInput({ activityId: 1, durationMin: 0, intensity: 'moderate' });
    }).toThrow(ValidationError);
  });

  it('invalid intensity throws ValidationError', () => {
    expect(() => {
      validateActivityLogInput({ activityId: 1, durationMin: 30, intensity: 'extreme' });
    }).toThrow(ValidationError);
  });

  it('invalid date format throws ValidationError', () => {
    expect(() => {
      validateActivityLogInput({ activityId: 1, durationMin: 30, intensity: 'moderate', loggedDate: 'not-a-date' });
    }).toThrow(ValidationError);
  });
});

describe('calculateDailyNetCalories', () => {
  it('returns correct netCalories and netVsTarget with all values', () => {
    const result = calculateDailyNetCalories(2000, 300, 1800);
    expect(result.netCalories).toBe(1700);
    expect(result.netVsTarget).toBe(-100);
  });

  it('returns null netVsTarget when calorieTarget is null', () => {
    const result = calculateDailyNetCalories(2000, 300, null);
    expect(result.netCalories).toBe(1700);
    expect(result.netVsTarget).toBeNull();
  });

  it('negative netCalories (more burned than consumed)', () => {
    const result = calculateDailyNetCalories(200, 500, 1500);
    expect(result.netCalories).toBe(-300);
    expect(result.netVsTarget).toBe(-1800);
  });
});

describe('buildSystemPrompt', () => {
  it('returns a string containing the week start date', () => {
    const profile = { weight_kg: 70, height_cm: 175, age: 30, gender: 'male', fitness_goal: 'maintain', activity_level: 'moderate' };
    const history = [];
    const activities = [{ name: 'Running', estimated_calories: 300, duration_min: 30 }];
    const result = buildSystemPrompt(profile, history, activities, '2026-01-05');
    expect(typeof result).toBe('string');
    expect(result).toContain('2026-01-05');
  });

  it('includes activity names from history in the output', () => {
    const profile = { weight_kg: 70, height_cm: 175, age: 30, gender: 'male', fitness_goal: 'maintain', activity_level: 'moderate' };
    const history = [{ activity_name: 'Running', duration_min: 30, intensity: 'moderate', logged_date: '2026-01-03' }];
    const activities = [{ name: 'Running', estimated_calories: 300, duration_min: 30 }];
    const result = buildSystemPrompt(profile, history, activities, '2026-01-05');
    expect(result).toContain('Running');
  });
});
