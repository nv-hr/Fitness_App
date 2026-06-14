## Why

The automatic activity plan migration on fetch is no longer needed or desired. We are removing it to simplify the plan fetching logic, improve fetch performance, and avoid unexpected mutations during read operations.

## What Changes

- Remove the automatic migration logic from the activity plan fetching route/service.
- Clean up any unused migration utilities for activity plans.

## Capabilities

### New Capabilities

### Modified Capabilities
- `manual-plan-generation`: Removing the automatic migration of old-format plans during read operations.

## Impact

- Backend weekly plan fetch API route.
- Any backend services dealing with weekly plan fetching and migration.
