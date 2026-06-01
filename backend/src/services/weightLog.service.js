import * as weightLogRepo from '../repositories/weightLog.repository.js';
import * as profileRepo from '../repositories/profile.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function logWeight(userId, { weightKg, loggedDate, notes }) {
  if (weightKg == null || weightKg < 2 || weightKg > 300) {
    throw new ValidationError('Weight must be between 2-300 kg');
  }
  if (!loggedDate) {
    throw new ValidationError('Logged date is required');
  }

  const result = await weightLogRepo.upsertWeightLog(userId, {
    weightKg,
    loggedDate,
    source: 'manual',
    notes,
  });

  try {
    await profileRepo.updateWeightKg(userId, weightKg);
  } catch (err) {
    console.error('Failed to sync weight to profile:', err.message);
  }

  return result;
}

export async function getHistory(userId, limit = 50) {
  return weightLogRepo.getWeightHistory(userId, limit);
}

export async function deleteEntry(logId, userId) {
  const result = await weightLogRepo.deleteWeightLog(logId, userId);
  if (!result) {
    throw new NotFoundError('Weight log entry not found');
  }
  return result;
}
