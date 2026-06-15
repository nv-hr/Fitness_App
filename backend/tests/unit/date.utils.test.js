import { describe, expect, it } from '@jest/globals';
import { isDateWithinTimezoneRange, getHistoryCutoffStr } from '../../src/utils/date.utils.js';

describe('date.utils.js', () => {
  describe('isDateWithinTimezoneRange', () => {
    it('returns true for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isDateWithinTimezoneRange(today)).toBe(true);
    });

    it('returns true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      expect(isDateWithinTimezoneRange(yesterdayStr)).toBe(true);
    });

    it('returns true for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      expect(isDateWithinTimezoneRange(tomorrowStr)).toBe(true);
    });

    it('returns false for a date far in the past', () => {
      expect(isDateWithinTimezoneRange('2000-01-01')).toBe(false);
    });
  });

  describe('getHistoryCutoffStr', () => {
    it('returns correct cutoff string', () => {
      const today = new Date();
      today.setDate(today.getDate() - 7);
      const expected = today.toISOString().split('T')[0];
      
      const result = getHistoryCutoffStr(7);
      expect(result).toBe(expected);
    });
  });
});
