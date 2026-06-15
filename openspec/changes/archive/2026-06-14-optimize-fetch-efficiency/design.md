## Context

The Fitness App currently experiences multiple overlapping and redundant data fetches on both page load and during user interactions. For instance, `useFoodLog` triggers 3 parallel requests on mount and unnecessarily repeats them all on every mutation. Calendar hooks (`useActivityCalendar`, `useMealCalendar`) employ aggressive 3s interval polling without backoff. Furthermore, some backend operations fetch the user profile redundantly within a single page load. This design addresses these inefficiencies by consolidating requests, utilizing intelligent caching, and leveraging SSE or backoff strategies.

## Goals / Non-Goals

**Goals:**
- Eliminate redundant API calls on the frontend during component mount and state updates.
- Replace aggressive blind polling with efficient Server-Sent Events (SSE) or exponential backoff.
- Combine backend responses (e.g., daily logs + summary) to halve round-trips.
- Deduplicate backend queries (e.g., fetching the user profile) using a short-lived in-memory cache.

**Non-Goals:**
- Completely rewriting the frontend state management (e.g., moving to Redux or React Query).
- Refactoring the entire backend API to GraphQL or gRPC.
- Altering the user interface of the food log or activity calendars.

## Decisions

**1. Unifying `useFoodLog` loading logic:**
We will consolidate `loadData` and `refreshData` into a single `useCallback`. Crucially, after a `logFood` or `deleteFoodLog` action, we will only re-fetch the daily logs and summary. `getRecentFoods` will only re-fetch after a successful new log (not on delete), and `getLogHistory(7)` will only fetch on mount.

**2. Calendar Polling Mitigation:**
Instead of 3s interval polling or SSE for the weekly plan, we will implement a robust exponential backoff strategy (e.g., 3s → 5s → 8s → 13s) with a maximum retry limit (e.g., 5 attempts). This polling mechanism will run in a custom hook (e.g., `usePollingWithBackoff`) and must ensure proper `useEffect` cleanup to cancel timeouts if the component unmounts, preventing state updates on unmounted components.

**3. Weekly Plan Frontend Caching:**
We will cache the week's data on the frontend (keyed by `weekStart`). The `getWeeklyPlan` function will only be called when navigating to a new week, not when changing the selected day within the same week.

**4. Contextual Custom Events:**
The `health-system-update` CustomEvent will be enhanced to carry a payload: `{ detail: { type: 'food-log' | 'activity-log' | 'plan-update' } }`. Consumers like `useMealCalendar` and `useActivityCalendar` will selectively listen and only re-fetch if the event type is relevant.

**5. Backend Endpoint Consolidation:**
A new combined endpoint `GET /api/food/daily?date=YYYY-MM-DD` will be introduced to return both the food logs array and the daily summary, reducing page load HTTP overhead.

**6. Backend Profile Caching:**
We will add a lightweight in-memory cache with a short TTL (e.g., 30s) for `profile.repository.findByUserId`. This prevents redundant DB queries when both food and activity controllers request the profile concurrently during page load. Crucially, any profile mutation (e.g., `PUT /api/profile`) must explicitly invalidate this cache to guarantee strict consistency for subsequent operations (e.g., logging a meal immediately after changing a calorie goal).

**7. Targeted History Fetching:**
`getActivityHistory` will drop the `includeEntries=true` parameter by default, fetching only the aggregated totals unless the detail panel is actively viewed.

## Risks / Trade-offs

- **Risk:** The in-memory profile cache might cause stale reads on writes (e.g., updating a calorie goal and immediately logging food).
  - **Mitigation:** Implement strict, explicit cache invalidation upon any profile mutation.
- **Risk:** Exponential backoff could lead to memory leaks or React state errors if a user navigates away while polling is active.
  - **Mitigation:** Ensure robust `clearTimeout` cleanup in the hook's `useEffect` return function.
- **Risk:** Multi-instance environments. An in-memory cache is local to a single Node instance. If scaled horizontally, instances might have divergent cache states.
  - **Mitigation:** We accept this short-term risk for a 30s TTL in our current deployment topology, but will migrate to Redis if strict consistency across distributed instances becomes necessary.
