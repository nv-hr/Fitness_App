export function validateActivityPlanStructure(plan, planDate) {
  const errors = [];
  if (!plan || !Array.isArray(plan.activities)) {
    return { valid: false, errors: ['Plan must have an "activities" array'] };
  }
  if (plan.date && plan.date !== planDate) {
    errors.push(`Expected date ${planDate} but got ${plan.date}`);
  }
  if (plan.activities.length < 1 || plan.activities.length > 4) {
    errors.push(`Expected 1-4 activities but got ${plan.activities.length}`);
  }
  const validIntensities = ['light', 'moderate', 'vigorous'];
  plan.activities.forEach((act, i) => {
    if (!act.activity_id || typeof act.activity_id !== 'number' || act.activity_id < 1) {
      errors.push(`Activity ${i + 1}: invalid activity_id`);
    }
    if (!act.name || typeof act.name !== 'string' || act.name.trim().length === 0) {
      errors.push(`Activity ${i + 1}: name is required`);
    }
    if (!act.duration_min || act.duration_min < 10 || act.duration_min > 180) {
      errors.push(`Activity ${i + 1}: duration_min must be 10-180`);
    }
    if (!validIntensities.includes(act.intensity)) {
      errors.push(`Activity ${i + 1}: intensity must be light/moderate/vigorous`);
    }
  });
  // If the plan includes a rest_day field, log it but don't fail validation
  // (system-prompt.md may train the LLM to include it; daily plans can ignore it)
  if (plan.rest_day !== undefined && typeof plan.rest_day !== 'boolean') {
    errors.push('rest_day must be a boolean if present');
  }
  return { valid: errors.length === 0, errors };
}
