# Capability: manual-plan-generation

## Purpose
TBD: Handle manual plan generation instead of auto-fetching on mount.

## Requirements

### Requirement: Manual Plan Generation Trigger
The system MUST NOT automatically trigger plan generation when a user opens the food-log or activity pages. Instead, the user MUST manually trigger plan generation if needed. When triggered, generation MUST use the deterministic activity-level algorithm instead of an LLM.

#### Scenario: User navigates to food-log
- **WHEN** user opens the food-log page
- **THEN** system does not dispatch a plan fetch request on mount

#### Scenario: User navigates to activity
- **WHEN** user opens the activity page
- **THEN** system does not dispatch a plan fetch request on mount

#### Scenario: User manually requests plan
- **WHEN** user explicitly clicks the generate plan button on the food-log or activity page
- **THEN** system triggers a plan generation request using the deterministic algorithm (not an LLM)

#### Scenario: Plan is generated without LLM call
- **WHEN** `POST /api/weekly-plans/generate` is called
- **THEN** the server SHALL return a plan built by the algorithm service without making any outbound LLM API call

### Requirement: No Automatic Migration on Fetch
The system SHALL NOT automatically migrate or mutate activity plans during read operations. Fetching a weekly plan must be a pure read operation with no side effects.

#### Scenario: Fetching an old-format plan
- **WHEN** the frontend requests a weekly plan via GET `/api/weekly-plans`
- **THEN** the system returns the plan exactly as it is stored in the database without attempting to migrate or update it.
