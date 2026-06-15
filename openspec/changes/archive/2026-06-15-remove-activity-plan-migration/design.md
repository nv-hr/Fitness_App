## Context

Currently, the backend API for fetching weekly activity plans (`GET /api/weekly-plans`) performs an automatic migration if it encounters a plan in an old format. This inline migration during a read operation causes unpredictable latency, mutates the database unexpectedly during a GET request, and complicates the fetch logic.

## Goals / Non-Goals

**Goals:**
- Remove the inline migration of activity plans during the `GET /api/weekly-plans` request.
- Ensure that fetching plans only reads data and does not write to the database.

**Non-Goals:**
- Removing or altering the core data models for activity plans.
- Offline migration of the database.

## Decisions

- **Remove the migration logic in the fetch route**: The `GET /api/weekly-plans` route will simply retrieve the data from the database and return it. We will remove the `migratePlan` utility invocation.
  - *Rationale*: A GET request should be idempotent and not cause side effects like database updates. This improves performance and predictability.

## Risks / Trade-offs

- [Risk] Old plans may not be fully compatible with the current frontend if the frontend assumes the migrated format.
  - *Mitigation*: The migration was primarily technical debt cleanup. If issues arise, a separate offline migration script can be created, but GET requests must remain pure reads.
