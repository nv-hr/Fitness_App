const fs = require('fs');

const file = 'c:/Users/LENOVO/Documents/VsCode/GitHub/Fitness_App/backend/src/controllers/weeklyPlan.controller.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { findByUserAndWeek, upsertPlan, syncWeeklyPlanCompletedStates } from '../repositories/weeklyPlan.repository.js';",
  "import { findByUserAndWeek, upsertPlan, syncWeeklyPlanCompletedStates } from '../repositories/weeklyPlan.repository.js';\nimport { isDateWithinTimezoneRange } from '../utils/date.utils.js';\nimport { setupSSE } from '../utils/sse.utils.js';"
);

// Remove isDateWithinTimezoneRange safely
const tzRegex = /function isDateWithinTimezoneRange[\s\S]*?return dateStr === todayStr \|\| dateStr === yesterdayStr \|\| dateStr === tomorrowStr;\s*\}/;
content = content.replace(tzRegex, `function validateWeekAndDay(weekStart, dayIndex, res) {
  if (dayIndex !== undefined) {
    if (typeof dayIndex !== 'number' || dayIndex < 0 || dayIndex > 6) {
      return { error: errorResponse(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR') };
    }
  }
  let targetWeekStart = weekStart;
  if (targetWeekStart && !isValidDateString(targetWeekStart)) {
    return { error: errorResponse(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR') };
  }
  targetWeekStart = getMonday(targetWeekStart ? new Date(targetWeekStart) : new Date());
  return { targetWeekStart };
}`);

// We need to replace the validation blocks. We'll use regex to match them safely.
const getValRegex = /    if \(weekStart && !isValidDateString\(weekStart\)\) \{\s*return errorResponse\(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR'\);\s*\}\s*weekStart = getMonday\(weekStart \? new Date\(weekStart\) : new Date\(\)\);/g;
content = content.replace(getValRegex, `    const validated = validateWeekAndDay(weekStart, undefined, res);
    if (validated.error) return validated.error;
    weekStart = validated.targetWeekStart;`);

const streamValRegex = /  if \(weekStart && !isValidDateString\(weekStart\)\) \{\s*return errorResponse\(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR'\);\s*\}\s*weekStart = getMonday\(weekStart \? new Date\(weekStart\) : new Date\(\)\);/g;
content = content.replace(streamValRegex, `  const validated = validateWeekAndDay(weekStart, undefined, res);
  if (validated.error) return validated.error;
  weekStart = validated.targetWeekStart;`);

const regenValRegex = /    if \(typeof dayIndex !== 'number' \|\| dayIndex < 0 \|\| dayIndex > 6\) \{\s*return errorResponse\(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR'\);\s*\}\s*let targetWeekStart = weekStart;\s*if \(targetWeekStart && !isValidDateString\(targetWeekStart\)\) \{\s*return errorResponse\(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR'\);\s*\}\s*targetWeekStart = getMonday\(targetWeekStart \? new Date\(targetWeekStart\) : new Date\(\)\);/g;
content = content.replace(regenValRegex, `    const validated = validateWeekAndDay(weekStart, dayIndex, res);
    if (validated.error) return validated.error;
    let targetWeekStart = validated.targetWeekStart;`);

const swapValRegex = /    \/\/ Validate dayIndex\s*if \(typeof dayIndex !== 'number' \|\| dayIndex < 0 \|\| dayIndex > 6\) \{\s*return errorResponse\(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR'\);\s*\}\s*\/\/ Validate and normalize weekStart\s*let targetWeekStart = weekStart;\s*if \(targetWeekStart && !isValidDateString\(targetWeekStart\)\) \{\s*return errorResponse\(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR'\);\s*\}\s*targetWeekStart = getMonday\(targetWeekStart \? new Date\(targetWeekStart\) : new Date\(\)\);/g;
content = content.replace(swapValRegex, `    const validated = validateWeekAndDay(weekStart, dayIndex, res);
    if (validated.error) return validated.error;
    let targetWeekStart = validated.targetWeekStart;`);

const toggleValRegex = /    \/\/ Validate weekStart\s*if \(!weekStart \|\| !isValidDateString\(weekStart\)\) \{\s*return errorResponse\(res, 'Invalid or missing weekStart date', 400, 'VALIDATION_ERROR'\);\s*\}\s*\/\/ Validate dayIndex\s*if \(typeof dayIndex !== 'number' \|\| dayIndex < 0 \|\| dayIndex > 6\) \{\s*return errorResponse\(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR'\);\s*\}\s*\/\/ Validate activityId/g;
content = content.replace(toggleValRegex, `    const validated = validateWeekAndDay(weekStart, dayIndex, res);
    if (validated.error) return validated.error;
    const targetWeekStart = validated.targetWeekStart;

    // Validate activityId`);

content = content.replace(
/    \/\/ Normalize weekStart\s*const targetWeekStart = getMonday\(weekStart \? new Date\(weekStart\) : new Date\(\)\);\s*\/\/ Check cache first/g,
`    // Check cache first`
);

const regenStreamValRegex = /  if \(typeof dayIndex !== 'number' \|\| dayIndex < 0 \|\| dayIndex > 6\) \{\s*return errorResponse\(res, 'dayIndex must be a number between 0 and 6', 400, 'VALIDATION_ERROR'\);\s*\}\s*let targetWeekStart = weekStart;\s*if \(targetWeekStart && !isValidDateString\(targetWeekStart\)\) \{\s*return errorResponse\(res, 'Invalid weekStart date format', 400, 'VALIDATION_ERROR'\);\s*\}\s*targetWeekStart = getMonday\(targetWeekStart \? new Date\(targetWeekStart\) : new Date\(\)\);/g;
content = content.replace(regenStreamValRegex, `  const validated = validateWeekAndDay(weekStart, dayIndex, res);
  if (validated.error) return validated.error;
  let targetWeekStart = validated.targetWeekStart;`);

const sseBlockRegex = /  res\.setHeader\('Content-Type', 'text\/event-stream'\);\s*res\.setHeader\('Cache-Control', 'no-cache'\);\s*res\.setHeader\('Connection', 'keep-alive'\);\s*res\.flushHeaders\(\);\s*const onChunk = \(chunk\) => \{\s*res\.write\(`data: \$\{JSON\.stringify\(\{ type: 'chunk', content: chunk \}\)\}\\n\\n`\);\s*\};/g;
content = content.replace(sseBlockRegex, `  const onChunk = setupSSE(res);`);

fs.writeFileSync(file, content, 'utf8');
console.log('done');
