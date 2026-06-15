## Why

Currently, if a user sends multiple requests (e.g. by refreshing or clicking twice) to generate a weekly or daily meal plan, the backend executes multiple expensive LLM calls concurrently. This wastes resources and could cause race conditions. We need a way to lock generations per user and timeframe so only one generation runs at a time.

## What Changes

- Implement an in-memory generation lock using a Map on the backend (`llm.service.js`).
- Intercept duplicate generation requests for the same user and weekStart.
- Return a `409 Conflict` error when a generation is already running.

## Capabilities

### New Capabilities
- `generation-lock`: Prevents concurrent LLM generation requests for the same user and timeframe.

### Modified Capabilities


## Impact

- Backend API: `llm.service.js` will now manage an in-memory map.
- Frontend: Must handle `409 Conflict` gracefully and inform the user to wait.
