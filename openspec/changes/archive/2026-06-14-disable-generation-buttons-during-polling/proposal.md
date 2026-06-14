## Why

Currently, the primary "Generate" buttons in the meal calendar disable correctly on initial click but prematurely re-enable if a 409 Conflict occurs during generation. The frontend falls back to a "Smart Polling" loop, but the generation lock is not consistently maintained across components. This allows users to click the buttons again while background generation is still streaming, leading to duplicate requests and potential state issues.

## What Changes

- Consolidate the "isGenerating" / "isBusy" state management during the polling phase.
- Ensure the meal plan generation lock is maintained globally or across all relevant components while polling for daily or weekly plans.
- Prevent generation buttons from re-enabling until the polling loop completely resolves or fails.

## Capabilities

### New Capabilities

None

### Modified Capabilities

- `generation-lock`: Ensure the requirement for generation locks (isBusy) applies not just during the initial API call, but continuously throughout the polling fallback mechanism when encountering a 409 Conflict.

## Impact

- Frontend state management in `useMealCalendar.js` or related Redux slices (e.g., RTK Query endpoints for food plan).
- UI components relying on the `isGenerating` or `isBusy` flag.
