## 1. Food Log Adjustments

- [x] 1.1 Locate the hook responsible for the food log calendar (e.g., `useMealCalendar.js`).
- [x] 1.2 Identify the `useEffect` that automatically generates the plan.
- [x] 1.3 Remove or conditionally disable the automatic plan generation on mount/date change.
- [x] 1.4 Fix the state trailing bug: synchronously clear `dayPlan` and set `planLoading` to `true` when `selectedDay` changes to prevent stale data.
- [x] 1.5 Ensure the UI provides a manual "Generate Plan" button or trigger if the plan is empty.

## 2. Activity Adjustments

- [x] 2.1 Locate the hook/component responsible for the activity calendar (e.g., `useWeeklyPlan` or similar).
- [x] 2.2 Identify the `useEffect` that automatically generates the plan.
- [x] 2.3 Remove or conditionally disable the automatic plan generation.
- [x] 2.4 Fix the state trailing bug: synchronously clear plan state and set loading to `true` when the selected date/week changes.
- [x] 2.5 Ensure the UI provides a manual "Generate Plan" button or trigger if the plan is empty.
