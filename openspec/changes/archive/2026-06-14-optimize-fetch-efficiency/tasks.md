## 1. Backend Optimizations

- [x] 1.1 Add `GET /api/food/daily` endpoint to the food controller and routes, combining logs and summary into a single response.
- [x] 1.2 Implement an in-memory profile cache with a 30s TTL in `profile.repository.js` to deduplicate profile fetches.
- [x] 1.2b Add explicit cache invalidation logic for any profile mutations (e.g., `PUT /api/profile`, `POST /api/goals`) to ensure strict consistency.
- [x] 1.3 Modify the `getActivityHistory` endpoint to make `includeEntries=true` optional and default to `false`.

## 2. Global Event Refactoring

- [x] 2.1 Update all `health-system-update` event dispatches to include `detail: { type: 'food-log' | 'activity-log' | 'plan-update' }`.
- [x] 2.2 Refactor `useMealCalendar` and `useActivityCalendar` to selectively listen to `health-system-update` and only trigger a refresh for their relevant event type.

## 3. Frontend `useFoodLog` Refactoring

- [x] 3.1 Unify `loadData` and `refreshData` in `useFoodLog.js` into a single `useCallback` to prevent code duplication.
- [x] 3.2 Update `logFood` and `deleteFoodLog` mutations to selectively trigger refetch of only the daily logs and summary.
- [x] 3.3 Ensure `getRecentFoods` only refetches after a successful new log action, not on delete.
- [x] 3.4 Remove `getLogHistory(7)` from the mutation refresh cycle, ensuring it is only fetched on initial mount.

## 4. Frontend Calendar & Weekly Plan Refactoring

- [x] 4.1 Replace blind 3s interval polling in `useActivityCalendar` with a robust exponential backoff strategy (e.g., `usePollingWithBackoff`), ensuring proper timeout cleanup on component unmount.
- [x] 4.2 Apply the same exponential backoff polling mitigation to `useMealCalendar`.
- [x] 4.3 Implement frontend caching of the `getWeeklyPlan` response (keyed by `weekStart`) to prevent redundant fetches when navigating days within the same week.
- [x] 4.4 Modify `ActivityCalendarSection.jsx` (and related api) so that `getActivityHistory` accepts a parameter (e.g. `includeEntries=false`). By default, it will not fetch full activities array on page load, dramatically shrinking payload size. The detailed entries can be fetched on-demand (e.g., when clicking to expand a history day accordion).
