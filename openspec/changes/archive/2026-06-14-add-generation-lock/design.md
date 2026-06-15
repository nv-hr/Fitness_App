## Context

The backend currently uses the LLM to generate weekly and daily meal plans. This process is expensive and takes time. Without locking, users can double-click or refresh, causing concurrent identical generation tasks for the same user. This can lead to race conditions, overlapping database inserts, and unnecessary API costs.

## Goals / Non-Goals

**Goals:**
- Prevent concurrent generation requests for the exact same entity (e.g., same user and same week or day) across the application.
- Return a `409 Conflict` HTTP status code if a generation is already running.

**Non-Goals:**
- We are not persisting the lock state in a database like Redis. An in-memory Map is sufficient for now since there's presumably only one backend instance or the cost of collisions across instances is low enough.
- We are not queuing the requests; we are failing fast with a 409 error.

## Decisions

- **In-Memory Lock Strategy**: Use a JavaScript `Map` inside `llm.service.js` called `activeGenerations`.
- **Lock Key**: The key will be a combination of `userId` and `weekStart` (or `date` for daily plans), stringified to ensure uniqueness (e.g., `weekly_${userId}_${weekStart}`).
- **Lock Lifecycle**: The lock is acquired at the beginning of the generation function and removed in a `finally` block to ensure it's cleared regardless of success or failure.
- **Immediate Failure**: When a lock conflict is detected, the function immediately throws an error that is caught and mapped to a 409 status code.
- **Frontend Smart Polling**: When the frontend receives a 409 Conflict, it initiates a polling mechanism to fetch the meal plan every few seconds until the backend returns a 200 OK with the generated plan.

## Risks / Trade-offs

- **Memory Leak Risk** → Mitigation: Use a `finally` block to guarantee the lock is removed from the map even if the LLM call throws an exception or times out.
- **Multi-Instance (Scaling)** → Mitigation: Since we use an in-memory lock, it won't work perfectly across multiple load-balanced nodes. However, for the current scope, this trade-off is accepted to avoid adding a Redis dependency.
