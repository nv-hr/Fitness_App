## Why

The current frontend and backend data fetching strategies for the food log and activity features contain multiple redundancies. These inefficiencies lead to unnecessary network requests, increased latency, higher backend load, and poor user experience, especially during active mutations or day-to-day navigation. This change optimizes the fetch strategy to reduce payload sizes and the total number of round-trips.

## What Changes

- **Food Log Optimization:** Unify `loadData` and `refreshData` in `useFoodLog`. Make history and recent foods re-fetch only when appropriate (not on every log/delete).
- **Activity/Meal Calendar Polling:** Replace blind 3s interval polling with Server-Sent Events (SSE) or exponential backoff in calendar hooks.
- **Weekly Plan Caching:** Cache the weekly plan on the frontend or add a single-day query parameter to avoid fetching the full week for every day navigation.
- **Custom Event Payload:** Enhance `health-system-update` event with detailed context (`{ type: 'food-log' | 'activity-log' | 'plan-update' }`) to prevent unrelated hooks from re-fetching.
- **Endpoint Consolidation:** Combine `getDailyLogs` and `getDailySummary` into a single endpoint (`GET /api/food/daily?date=`) to halve round-trips on page load.
- **Profile Caching:** Add an in-memory profile cache on the backend to avoid fetching it multiple times per page load.
- **Targeted History Fetching:** Remove `includeEntries=true` from `getActivityHistory` by default, only requesting it when the detail panel is actually visible.

## Capabilities

### New Capabilities
- `fetch-efficiency`: Defines performance requirements, caching rules, and targeted refetch strategies for frontend data loading and backend API responses.

### Modified Capabilities
- (None)

## Impact

- **Frontend:** Modifies custom hooks (`useFoodLog`, `useActivityCalendar`, `useMealCalendar`), global event dispatching, and API service functions.
- **Backend:** Modifies food and activity controllers (`food.controller.js`, `activity.controller.js`), potentially introducing new endpoints (`/api/food/daily`) and adding simple in-memory caching for profiles.
- **Performance:** Significant reduction in intra-day data requests and component re-renders.
