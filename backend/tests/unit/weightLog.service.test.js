import { jest } from '@jest/globals';
import { logWeight, deleteEntry, getHistory } from '../../src/services/weightLog.service.js';
import * as weightLogRepo from '../../src/repositories/weightLog.repository.js';
import * as profileRepo from '../../src/repositories/profile.repository.js';
import { ValidationError } from '../../src/utils/errors.js';

// Removed jest.mock for ESM compatibility

describe('weightLog.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logWeight', () => {
    it('should throw if loggedDate is not today in timezone', async () => {
      await expect(logWeight(1, { weightKg: 70, loggedDate: '2020-01-01', timezone: 'UTC' }))
        .rejects.toThrow(ValidationError);
    });

    it('should upsert and update profile weight concurrently', async () => {
      jest.spyOn(weightLogRepo, 'upsertWeightLog').mockResolvedValue({ id: 1 });
      jest.spyOn(profileRepo, 'updateWeightKg').mockResolvedValue();
      
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'UTC' });
      
      const result = await logWeight(1, { weightKg: 75, loggedDate: today, timezone: 'UTC' });
      
      expect(result).toEqual({ id: 1 });
      expect(profileRepo.updateWeightKg).toHaveBeenCalledWith(1, 75);
    });
  });

  describe('deleteEntry', () => {
    it('should revert profile weight to last log', async () => {
      jest.spyOn(weightLogRepo, 'deleteWeightLog').mockResolvedValue(true);
      jest.spyOn(weightLogRepo, 'getWeightHistory').mockResolvedValue([{ weight_kg: 80 }]);
      jest.spyOn(profileRepo, 'updateWeightKg').mockResolvedValue();
      
      await deleteEntry(1, 1);
      
      expect(profileRepo.updateWeightKg).toHaveBeenCalledWith(1, 80);
    });

    it('should set profile weight to null if no history left', async () => {
      jest.spyOn(weightLogRepo, 'deleteWeightLog').mockResolvedValue(true);
      jest.spyOn(weightLogRepo, 'getWeightHistory').mockResolvedValue([]);
      jest.spyOn(profileRepo, 'updateWeightKg').mockResolvedValue();
      
      await deleteEntry(1, 1);
      
      expect(profileRepo.updateWeightKg).toHaveBeenCalledWith(1, null);
    });
  });

  describe('backfillMissingWeights', () => {
    it('should backfill gaps up to today', async () => {
      const historySpy = jest.spyOn(weightLogRepo, 'getWeightHistory');
      historySpy.mockResolvedValueOnce([{ logged_date: '2020-01-01' }]); // For backfill
      historySpy.mockResolvedValueOnce([]); // Actual result of getHistory
      
      jest.spyOn(profileRepo, 'getProfile').mockResolvedValue({ weight_kg: 80 });
      jest.spyOn(weightLogRepo, 'upsertWeightLog').mockResolvedValue();
      
      await getHistory(1, 50, 'UTC');
      
      expect(weightLogRepo.upsertWeightLog).toHaveBeenCalled();
    });
  });
});
