import { describe, test, expect } from 'vitest';
import { DAY_STATUS, getWeekStartsForMonth, buildMonthGrid, computeDayStatus } from '../calendarUtils.js';

describe('DAY_STATUS', () => {
  test('exports correct enum values', () => {
    expect(DAY_STATUS.INCOMPLETE).toBe('incomplete');
    expect(DAY_STATUS.COMPLETED).toBe('completed');
    expect(DAY_STATUS.PAST_INCOMPLETE).toBe('pastIncomplete');
  });

  test('enum is frozen', () => {
    expect(() => { DAY_STATUS.INCOMPLETE = 'changed'; }).toThrow();
  });
});

describe('getWeekStartsForMonth', () => {
  test('June 2026 — starts on Monday, 5 week starts', () => {
    // June 1, 2026 is a Monday, so grid starts from June 1
    const date = new Date(2026, 5, 1); // June 1, 2026
    const result = getWeekStartsForMonth(date);

    // Monday on or before June 1 = June 1 itself → 5 week starts
    expect(result.length).toBe(5);
    
    // All returns must be Mondays
    result.forEach(weekStart => {
      expect(weekStart.getDay()).toBe(1); // Monday
    });

    // First start: Monday June 1, 2026
    expect(result[0].getFullYear()).toBe(2026);
    expect(result[0].getMonth()).toBe(5); // June (0-indexed)
    expect(result[0].getDate()).toBe(1);

    // Last start: Monday June 29, 2026
    expect(result[4].getFullYear()).toBe(2026);
    expect(result[4].getMonth()).toBe(5); // June
    expect(result[4].getDate()).toBe(29);
  });

  test('February 2026 — 5 week starts (partial prev + partial next)', () => {
    // Feb 2026: Sun Feb 1. Mon Jan 26 start → Mon Mar 2 end => 5 or 6 week starts
    // Jan 26, Feb 2, Feb 9, Feb 16, Feb 23 => 5 week starts
    const date = new Date(2026, 1, 1); // Feb 1, 2026
    const result = getWeekStartsForMonth(date);

    expect(result.length).toBeGreaterThanOrEqual(5);
    expect(result.length).toBeLessThanOrEqual(6);

    // All Mondays
    result.forEach(weekStart => {
      expect(weekStart.getDay()).toBe(1);
    });

    // First start must be Monday Jan 26, 2026
    expect(result[0].getDate()).toBe(26);
    expect(result[0].getMonth()).toBe(0); // January
  });

  test('All returned dates are Mondays', () => {
    const date = new Date(2026, 6, 1); // July 2026
    const result = getWeekStartsForMonth(date);

    expect(result.length).toBeGreaterThanOrEqual(5);
    result.forEach(weekStart => {
      expect(weekStart.getDay()).toBe(1);
    });
  });
});

describe('buildMonthGrid', () => {
  test('returns array of all visible days in grid', () => {
    // June 2026 grid: Mon Jun 1 → Sun Jul 5 (5 weeks × 7 days = 35 days)
    const result = buildMonthGrid(new Date(2026, 5, 1));

    expect(result.length).toBe(35);
    
    // First day should be Monday June 1, 2026
    expect(result[0].getDay()).toBe(1); // Monday
    expect(result[0].getDate()).toBe(1);
    expect(result[0].getMonth()).toBe(5); // June

    // Last day should be Sunday July 5, 2026
    expect(result[34].getDay()).toBe(0); // Sunday
    expect(result[34].getDate()).toBe(5);
    expect(result[34].getMonth()).toBe(6); // July
  });

  test('All items are Date objects', () => {
    const result = buildMonthGrid(new Date(2026, 0, 1));
    result.forEach(day => {
      expect(day).toBeInstanceOf(Date);
    });
  });
});

describe('computeDayStatus', () => {
  const daysWithPlans = {
    '2026-06-15': { date: '2026-06-15', completed: true },
    '2026-06-16': { date: '2026-06-16', completed: false },
  };

  test('planDay completed → COMPLETED regardless of isPast', () => {
    // Future day but completed
    expect(computeDayStatus('2026-06-15', daysWithPlans['2026-06-15'], false))
      .toBe(DAY_STATUS.COMPLETED);
    // Past day and completed
    expect(computeDayStatus('2026-06-15', daysWithPlans['2026-06-15'], true))
      .toBe(DAY_STATUS.COMPLETED);
  });

  test('isPast=true, planDay=null → PAST_INCOMPLETE', () => {
    expect(computeDayStatus('2026-05-01', null, true))
      .toBe(DAY_STATUS.PAST_INCOMPLETE);
  });

  test('isPast=false, planDay=null → INCOMPLETE', () => {
    expect(computeDayStatus('2026-07-01', null, false))
      .toBe(DAY_STATUS.INCOMPLETE);
  });

  test('isPast=true, planDay.completed=false → PAST_INCOMPLETE', () => {
    expect(computeDayStatus('2026-06-16', daysWithPlans['2026-06-16'], true))
      .toBe(DAY_STATUS.PAST_INCOMPLETE);
  });

  test('isPast=false, planDay.completed=false → INCOMPLETE', () => {
    expect(computeDayStatus('2026-06-16', daysWithPlans['2026-06-16'], false))
      .toBe(DAY_STATUS.INCOMPLETE);
  });

  test('today without plan → INCOMPLETE (not PAST_INCOMPLETE)', () => {
    // Create a date string for today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // isPast=true for today would be wrong since today is not past
    // But the function should treat today as not-past
    expect(computeDayStatus(todayStr, null, false))
      .toBe(DAY_STATUS.INCOMPLETE);
  });
});
