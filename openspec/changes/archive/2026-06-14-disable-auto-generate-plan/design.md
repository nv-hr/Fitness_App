## Context

Currently, the `food-log` and `activity` pages automatically trigger API requests to generate plans as soon as they mount. This creates unnecessary backend load, API token consumption, and may block or slow down the immediate rendering for users who don't want a new plan generated right away.

## Goals / Non-Goals

**Goals:**
- Prevent automatic plan generation on mount for `food-log` and `activity` pages.
- Expose manual triggers (buttons or similar UI) for plan generation.
- Fix the React state trailing bug where changing dates causes stale state to trigger unwanted effects.

**Non-Goals:**
- Completely rewriting the plan generation logic.
- Adding new plan features; this is strictly about disabling auto-fetching on mount.

## Decisions

1. **Remove `useEffect` or similar auto-fetch hooks:** We will identify where `fetchPlan` or `generatePlan` is called on mount in the hooks (e.g., `useMealCalendar.js`) and remove them.
2. **Fix State Trailing Bug:** We will synchronously clear the plan state (`dayPlan`) and set loading flags (`planLoading`) immediately when the selected date changes, before any effects run.
3. **Ensure manual UI handles fetch:** If it doesn't already exist, verify or add a button that explicitly calls the generate plan API action when the user requests it.

## Risks / Trade-offs

- **Risk**: Users might be confused if the plan is empty when they open the page.
- **Mitigation**: Add an empty state or a clear call-to-action button prompting the user to "Generate Plan" if no plan exists.
