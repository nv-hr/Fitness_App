## Context

The Fitness App currently allows users to generate meal plans (daily or weekly). When multiple generations are triggered, the backend returns a `409 Conflict` indicating a generation is already in progress. The frontend handles this by entering a "Smart Polling" state (`pollForDailyPlan` or `pollForWeeklyPlan`), fetching the current status until the generation succeeds.
However, while polling, the UI buttons (such as the "Generate" button) may prematurely re-enable. This happens because the initial `generateDailyPlan` or `generateWeeklyPlan` RTK Query mutation resolves or rejects, setting `isLoading` back to `false`, but the background polling loop continues independently. This allows users to trigger multiple parallel generation requests despite the backend locks.

## Goals / Non-Goals

**Goals:**
- Ensure the `isGenerating` or `isBusy` flag in `useMealCalendar.js` accurately reflects both the initial generation API call and the subsequent polling phase if a `409 Conflict` triggers smart polling.
- Disable all relevant "Generate" UI elements until the entire generation process (including polling) fully resolves or errors out.

**Non-Goals:**
- Modifying the backend logic for 409 Conflict handling.
- Changing the smart polling interval or fundamental mechanism.

## Decisions

- **Decision 1: Introduce explicit `isPolling` state in `useMealCalendar.js`.**
  *Rationale*: By explicitly tracking polling with `const [isPolling, setIsPolling] = useState(false)`, we decouple the background polling phase from the specific trigger (e.g. `regeneratingCat` or `generating`). This clearly unifies the UI lock status across different paths (full day vs. single category).
  *Implementation*: 
  1. Add `isPolling` to local state.
  2. Set `setIsPolling(true)` when `pollForDailyPlan` starts (when handling a 409 Conflict).
  3. Set `setIsPolling(false)` when `pollForDailyPlan` resolves (success or timeout).
  4. Update `isBusy` to be `!!(loggingMeal || regeneratingCat || generating || isPolling)`.

## Risks / Trade-offs

- **Risk**: Component unmounts during long polling.
  *Mitigation*: If `useMealCalendar` unmounts, the polling state might be lost for that instance. This is an existing limitation of component-level polling. We will rely on RTK Query's cache and local unmount safety checks, but the primary fix focuses on maintaining the button state while the user is actively viewing the calendar.
