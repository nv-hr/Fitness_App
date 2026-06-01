import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  validatePlanStructure,
  fuzzyMatchActivityName,
  validateAndFixPlan,
  buildSystemPrompt,
  generateFallbackPlan,
  validateActivities,
  isOldFormat,
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
        activities: [{ activity_id: 1, name: 'Test', duration_min: 2, intensity: 'moderate' }],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('5-480'))).toBe(true);
  });

  it('duration_min > 480 returns error', () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-01-05T00:00:00Z');
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        activities: [{ activity_id: 1, name: 'Test', duration_min: 500, intensity: 'moderate' }],
      });
    }
    const result = validatePlanStructure({ days }, '2026-01-05');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('5-480'))).toBe(true);
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
  const baseProfile = { weight_kg: 70, height_cm: 175, age: 30, gender: 'male', fitness_goal: 'maintain', activity_level: 'moderate' };

  it('returns a string containing the week start date', () => {
    const result = buildSystemPrompt(baseProfile, [], [{ name: 'Running', estimated_calories: 300, duration_min: 30 }], '2026-01-05');
    expect(typeof result).toBe('string');
    expect(result).toContain('2026-01-05');
  });

  it('includes activity names from history in the output', () => {
    const history = [{ activity_name: 'Running', duration_min: 30, intensity: 'moderate', logged_date: '2026-01-03' }];
    const result = buildSystemPrompt(baseProfile, history, [{ name: 'Running', estimated_calories: 300, duration_min: 30 }], '2026-01-05');
    expect(result).toContain('Running');
  });

  it('includes profile information in the prompt', () => {
    const result = buildSystemPrompt(baseProfile, [], [{ name: 'Running', estimated_calories: 300, duration_min: 30 }], '2026-01-05');
    expect(result).toContain('70');          // weight_kg
    expect(result).toContain('175');         // height_cm
    expect(result).toContain('30');          // age
    expect(result).toContain('male');
    expect(result).toContain('maintain');
  });

  it('contains structured sections with headers', () => {
    const result = buildSystemPrompt(baseProfile, [], [{ name: 'Running', estimated_calories: 300, duration_min: 30 }], '2026-01-05');
    // Verify the prompt has section-like structure (headers, instructions)
    expect(result.length).toBeGreaterThan(200);
    expect(result).toMatch(/profile|Profile/);
    expect(result).toMatch(/activity|Activity/);
    expect(result).toMatch(/week|date/);
  });

  it('includes JSON format requirements for the response', () => {
    const result = buildSystemPrompt(baseProfile, [], [{ name: 'Running', estimated_calories: 300, duration_min: 30 }], '2026-01-05');
    expect(result).toMatch(/json|JSON/);
    expect(result).toMatch(/{|{|"days"/);
  });
});

// ===== NEW TESTS: Variable-day validation, rest_day, format_version =====

describe('validatePlanStructure with availableDays + rest_day', () => {
  function makeRestDay(date) {
    return { date, rest_day: true, activities: [] };
  }

  function makeActivityDay(date, activityCount = 1) {
    const activities = Array.from({ length: activityCount }, (_, i) => ({
      activity_id: i + 1,
      name: `Activity ${i + 1}`,
      duration_min: 30,
      intensity: 'moderate',
    }));
    return { date, rest_day: false, activities };
  }

  function buildWeekDates(startStr) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startStr + 'T00:00:00Z');
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  it('valid 7-day plan with 5 activity days + 2 rest days passes', () => {
    const dates = buildWeekDates('2026-01-05');
    const days = dates.map((d, i) =>
      i < 5 ? makeActivityDay(d) : makeRestDay(d)
    );
    const result = validatePlanStructure({ days }, '2026-01-05', 5);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('wrong activity day count (6 instead of 5) returns error', () => {
    const dates = buildWeekDates('2026-01-05');
    const days = dates.map((d, i) =>
      i < 6 ? makeActivityDay(d) : makeRestDay(d)
    );
    const result = validatePlanStructure({ days }, '2026-01-05', 5);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Expected 5 activity days'))).toBe(true);
  });

  it('rest day with non-empty activities returns error', () => {
    const dates = buildWeekDates('2026-01-05');
    const days = dates.map((d, i) =>
      i < 5
        ? makeActivityDay(d)
        : { date: d, rest_day: true, activities: [{ activity_id: 1, name: 'Test', duration_min: 30, intensity: 'moderate' }] }
    );
    const result = validatePlanStructure({ days }, '2026-01-05', 5);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rest day must have empty activities'))).toBe(true);
  });

  it('missing rest_day field returns error', () => {
    const dates = buildWeekDates('2026-01-05');
    const days = dates.map((d, i) =>
      i < 5
        ? { date: d, activities: [{ activity_id: 1, name: 'Test', duration_min: 30, intensity: 'moderate' }] }
        : { date: d, activities: [] }
    );
    const result = validatePlanStructure({ days }, '2026-01-05', 5);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('rest_day field is required'))).toBe(true);
  });

  it('availableDays not provided (null) skips count check', () => {
    const dates = buildWeekDates('2026-01-05');
    // Without availableDays, all days must have 1-4 activities (backward compat)
    const days = dates.map(d => makeActivityDay(d));
    const result = validatePlanStructure({ days }, '2026-01-05', null);
    expect(result.valid).toBe(true);
  });

  it('plan with format_version: 1 passes validation', () => {
    const dates = buildWeekDates('2026-01-05');
    const days = dates.map((d, i) =>
      i < 5 ? makeActivityDay(d) : makeRestDay(d)
    );
    const result = validatePlanStructure({ format_version: 1, days }, '2026-01-05', 5);
    expect(result.valid).toBe(true);
  });
});

describe('validateActivities with allowEmpty flag', () => {
  it('empty activities fails by default (allowEmpty=false)', () => {
    const errors = validateActivities([], '');
    expect(errors.some(e => e.includes('1-4'))).toBe(true);
  });

  it('empty activities passes when allowEmpty=true', () => {
    const errors = validateActivities([], '', true);
    expect(errors.length).toBe(0);
  });

  it('5 activities exceeds max regardless of allowEmpty', () => {
    const activities = Array.from({ length: 5 }, (_, i) => ({
      activity_id: i + 1,
      name: `Act ${i}`,
      duration_min: 30,
      intensity: 'moderate',
    }));
    const errors = validateActivities(activities, '', true);
    expect(errors.some(e => e.includes('1-4'))).toBe(true);
  });
});

describe('generateFallbackPlan with availableDays', () => {
  const topActivities = [
    { id: 1, name: 'Running', estimated_calories: 300, duration_min: 30 },
    { id: 2, name: 'Yoga', estimated_calories: 150, duration_min: 45 },
  ];

  it('5 activity days with 2 rest days', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => topActivities,
      userId: 1,
      weekStart: '2026-01-05',
      availableDays: 5,
    });
    expect(result.days.length).toBe(7);
    const activityDays = result.days.filter(d => d.rest_day === false);
    const restDays = result.days.filter(d => d.rest_day === true);
    expect(activityDays.length).toBe(5);
    expect(restDays.length).toBe(2);
    restDays.forEach(d => expect(d.activities.length).toBe(0));
    activityDays.forEach(d => expect(d.activities.length).toBeGreaterThan(0));
  });

  it('4 activity days with 3 rest days', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => topActivities,
      userId: 1,
      weekStart: '2026-01-05',
      availableDays: 4,
    });
    const activityDays = result.days.filter(d => d.rest_day === false);
    const restDays = result.days.filter(d => d.rest_day === true);
    expect(activityDays.length).toBe(4);
    expect(restDays.length).toBe(3);
  });

  it('6 activity days with 1 rest day', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => topActivities,
      userId: 1,
      weekStart: '2026-01-05',
      availableDays: 6,
    });
    const activityDays = result.days.filter(d => d.rest_day === false);
    const restDays = result.days.filter(d => d.rest_day === true);
    expect(activityDays.length).toBe(6);
    expect(restDays.length).toBe(1);
  });

  it('fallback plan includes format_version: 1', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => topActivities,
      userId: 1,
      weekStart: '2026-01-05',
      availableDays: 4,
    });
    expect(result.format_version).toBe(1);
  });

  it('fallback plan with 0 history still has format_version', async () => {
    const result = await generateFallbackPlan({
      getTopActivities: async () => [],
      userId: 1,
      weekStart: '2026-01-05',
      availableDays: 4,
    });
    expect(result.format_version).toBe(1);
  });
});

describe('isOldFormat', () => {
  it('returns true for plan without format_version', () => {
    const plan = { days: [] };
    expect(isOldFormat(plan)).toBe(true);
  });

  it('returns true for plan with format_version set to undefined', () => {
    const plan = { format_version: undefined, days: [] };
    expect(isOldFormat(plan)).toBe(true);
  });

  it('returns false for plan with format_version: 1', () => {
    const plan = { format_version: 1, days: [] };
    expect(isOldFormat(plan)).toBe(false);
  });

  it('returns false for null plan', () => {
    expect(isOldFormat(null)).toBe(false);
  });

  it('returns false for undefined plan', () => {
    expect(isOldFormat(undefined)).toBe(false);
  });

  it('returns false for plan with format_version: 0 (edge case)', () => {
    const plan = { format_version: 0, days: [] };
    expect(isOldFormat(plan)).toBe(false);
  });

  it('returns true for empty object (no format_version but truthy)', () => {
    const plan = {};
    expect(isOldFormat(plan)).toBe(true);
  });
});
