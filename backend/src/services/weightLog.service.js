import * as weightLogRepo from '../repositories/weightLog.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function logWeight(userId, { weightKg, loggedDate, notes }) {
  if (weightKg == null || weightKg < 2 || weightKg > 300) {
    throw new ValidationError('Weight must be between 2-300 kg');
  }
  if (!loggedDate) {
    throw new ValidationError('Logged date is required');
  }
  return weightLogRepo.upsertWeightLog(userId, {
    weightKg,
    loggedDate,
    source: 'manual',
    notes,
  });
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
