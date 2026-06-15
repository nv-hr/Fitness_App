/**
 * D-01: Activity Level to Calorie Ceiling Mapping
 */
const ACTIVITY_LEVEL_CALORIE_CEILING = {
  sedentary: 80,
  lightly_active: 150,
  moderately_active: 250,
  very_active: 400,
  extra_active: Infinity
};

/**
 * D-02: Daily Duration Tiers per Intensity Level
 */
const ACTIVITY_LEVEL_DURATION_TIER = {
  sedentary: 20,
  lightly_active: 40,
  moderately_active: 60,
  very_active: 80,
  extra_active: 100
};

/**
 * 1.2 Implement filterActivities
 * Goal-tag filter first, then calorie ceiling, with fallback chain
 */
function filterActivities(activities, fitnessGoal, activityLevel) {
  const ceiling = ACTIVITY_LEVEL_CALORIE_CEILING[activityLevel] || ACTIVITY_LEVEL_CALORIE_CEILING.moderately_active;
  
  // 1. Goal match + ceiling
  const goalAndCeilingMatch = activities.filter(a => {
    const hasGoal = Array.isArray(a.goal_tags) && a.goal_tags.includes(fitnessGoal);
    return hasGoal && a.estimated_calories <= ceiling;
  });
  
  if (goalAndCeilingMatch.length > 0) return goalAndCeilingMatch;
  
  // 2. Ceiling only
  const ceilingMatch = activities.filter(a => a.estimated_calories <= ceiling);
  if (ceilingMatch.length > 0) return ceilingMatch;
  
  // 3. Fallback to all activities
  console.warn(`[weeklyPlanAlgorithm] Fallback: No activities match fitness goal or ceiling for level ${activityLevel}. Using all activities.`);
  return activities;
}

/**
 * 1.3 Implement pickRestDays(count = 2)
 */
function pickRestDays(count = 2) {
  const days = new Set();
  while (days.size < count) {
    days.add(Math.floor(Math.random() * 7));
  }
  return days;
}

/**
 * 1.4 Implement buildActiveDay
 */
function buildActiveDay(date, pool, durationTier) {
  // Pick 3-4 activities
  const numActivities = Math.floor(Math.random() * 2) + 3; // 3 or 4
  const dayActivities = [];
  const usedIds = new Set();
  
  let currentDuration = 0;
  
  for (let i = 0; i < numActivities; i++) {
    // filter pool to unused to avoid duplicates
    const available = pool.filter(a => !usedIds.has(a.id));
    if (available.length === 0) break; // small pool
    
    const activity = available[Math.floor(Math.random() * available.length)];
    usedIds.add(activity.id);
    
    // Check overflow
    const timeRemaining = durationTier - currentDuration;
    
    // Default duration of 20 min if duration_min is not available
    let duration = activity.duration_min || 20; 
    
    if (currentDuration + duration > durationTier) {
      // Overflow
      duration = timeRemaining;
      dayActivities.push({
        activity_id: activity.id,
        name: activity.name,
        duration_min: duration,
        intensity: 'moderate',
        calories_burned: Math.round((activity.estimated_calories / (activity.duration_min || 20)) * duration),
        completed: false
      });
      currentDuration += duration;
      break; // Reached exactly the budget
    } else {
      // Normal
      dayActivities.push({
        activity_id: activity.id,
        name: activity.name,
        duration_min: duration,
        intensity: 'moderate',
        calories_burned: Math.round((activity.estimated_calories / (activity.duration_min || 20)) * duration),
        completed: false
      });
      currentDuration += duration;
    }
  }
  
  // Check underflow
  if (currentDuration < durationTier && dayActivities.length > 0) {
    const scale = durationTier / currentDuration;
    dayActivities.forEach(a => {
      a.duration_min = Math.round(a.duration_min * scale);
      a.calories_burned = Math.round(a.calories_burned * scale);
    });
    
    // fix any rounding errors in total duration
    const totalDuration = dayActivities.reduce((sum, a) => sum + a.duration_min, 0);
    if (totalDuration !== durationTier) {
      const diff = durationTier - totalDuration;
      dayActivities[0].duration_min += diff;
    }
  }
  
  return {
    date: date,
    rest_day: false,
    activities: dayActivities
  };
}

/**
 * 1.5 Implement generateWeeklyPlanAlgorithm
 */
function generateWeeklyPlanAlgorithm({ profile, activities, weekStart }) {
  const goal = profile.fitness_goal;
  const level = profile.activity_level;
  
  const pool = filterActivities(activities, goal, level);
  const restDays = pickRestDays(2);
  const durationTier = ACTIVITY_LEVEL_DURATION_TIER[level] || ACTIVITY_LEVEL_DURATION_TIER.moderately_active;
  
  const days = [];
  const startDate = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const dateObj = new Date(startDate);
    dateObj.setDate(startDate.getDate() + i);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    if (restDays.has(i)) {
      days.push({
        date: dateStr,
        rest_day: true,
        activities: []
      });
    } else {
      days.push(buildActiveDay(dateStr, pool, durationTier));
    }
  }
  
  return {
    days,
    generated_at: new Date().toISOString(),
    source: 'algorithm'
  };
}

export {
  ACTIVITY_LEVEL_CALORIE_CEILING,
  ACTIVITY_LEVEL_DURATION_TIER,
  filterActivities,
  pickRestDays,
  buildActiveDay,
  generateWeeklyPlanAlgorithm
};
