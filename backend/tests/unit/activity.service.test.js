import { describe, it, expect } from '@jest/globals';
import { mapFitnessGoalToTags } from '../../src/services/activity.service.js';

describe('mapFitnessGoalToTags', () => {
  it('lose_weight -> [lose_weight]', () => {
    expect(mapFitnessGoalToTags('lose_weight')).toEqual(['lose_weight']);
  });

  it('maintain -> [maintain]', () => {
    expect(mapFitnessGoalToTags('maintain')).toEqual(['maintain']);
  });

  it('gain_weight -> [gain_weight]', () => {
    expect(mapFitnessGoalToTags('gain_weight')).toEqual(['gain_weight']);
  });

  it('unknown goal returns all tags as fallback', () => {
    expect(mapFitnessGoalToTags('unknown')).toEqual(['lose_weight', 'maintain', 'gain_weight']);
  });

  it('undefined returns all tags as fallback', () => {
    expect(mapFitnessGoalToTags(undefined)).toEqual(['lose_weight', 'maintain', 'gain_weight']);
  });
});
