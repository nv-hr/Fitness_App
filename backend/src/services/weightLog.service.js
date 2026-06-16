import * as weightLogRepo from '../repositories/weightLog.repository.js';
import * as profileRepo from '../repositories/profile.repository.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function logWeight(userId, { weightKg, loggedDate, notes, timezone }) {
  if (weightKg == null || weightKg < 2 || weightKg > 300) {
    throw new ValidationError('Weight must be between 2-300 kg');
  }
  if (!loggedDate) {
    throw new ValidationError('Logged date is required');
  }
  if (!timezone) {
    throw new ValidationError('Timezone is required');
  }

  // Determine "today" in user's timezone
  const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  if (loggedDate !== todayDate) {
    throw new ValidationError('You can only log weight for today in your local timezone');
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

export async function getHistory(userId, limit = 50, timezone = 'UTC') {
  await backfillMissingWeights(userId, timezone);
  return weightLogRepo.getWeightHistory(userId, limit);
}

async function backfillMissingWeights(userId, timezone) {
  try {
    const history = await weightLogRepo.getWeightHistory(userId, 1);
    if (history.length === 0) return;
    
    // DB might return Date object or string for logged_date depending on pg driver
    const lastDateVal = history[0].logged_date;
    const lastDateStr = lastDateVal instanceof Date ? lastDateVal.toISOString().split('T')[0] : lastDateVal;
    
    const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    if (lastDateStr === todayDateStr || lastDateStr > todayDateStr) {
      return; 
    }
    
    const profile = await profileRepo.getProfile(userId);
    if (!profile || !profile.weight_kg) return;
    
    const currentWeight = profile.weight_kg;
    
    const lastDate = new Date(lastDateStr);
    const todayDate = new Date(todayDateStr);
    
    const datesToFill = [];
    let currentDate = new Date(lastDate);
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (currentDate <= todayDate) {
      datesToFill.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const MAX_BACKFILL = 30;
    const limitedDates = datesToFill.slice(-MAX_BACKFILL);
    
    for (const date of limitedDates) {
      await weightLogRepo.upsertWeightLog(userId, {
        weightKg: currentWeight,
        loggedDate: date,
        source: 'auto_sync',
        notes: null
      });
    }
  } catch (err) {
    console.error('Failed to backfill missing weights:', err.message);
  }
}

export async function deleteEntry(logId, userId) {
  const result = await weightLogRepo.deleteWeightLog(logId, userId);
  if (!result) {
    throw new NotFoundError('Weight log entry not found');
  }
  
  try {
    const history = await weightLogRepo.getWeightHistory(userId, 1);
    if (history.length > 0) {
      await profileRepo.updateWeightKg(userId, history[0].weight_kg);
    } else {
      // If no history left, we might leave the current profile weight or set it to null.
      // Usually keeping it as is, or setting to null if it's the last one.
      // We will set to null here if no history is left.
      await profileRepo.updateWeightKg(userId, null);
    }
  } catch (err) {
    console.error('Failed to revert profile weight on delete:', err.message);
  }

  return result;
}
