# Capability: manual-plan-generation

## Purpose
TBD: Handle manual plan generation instead of auto-fetching on mount.

## Requirements

### Requirement: Manual Plan Generation Trigger
The system MUST NOT automatically trigger plan generation when a user opens the food-log or activity pages. Instead, the user MUST manually trigger plan generation if needed.

#### Scenario: User navigates to food-log
- **WHEN** user opens the food-log page
- **THEN** system does not dispatch a plan fetch request on mount

#### Scenario: User navigates to activity
- **WHEN** user opens the activity page
- **THEN** system does not dispatch a plan fetch request on mount

#### Scenario: User manually requests plan
- **WHEN** user explicitly clicks the generate plan button on the food-log or activity page
- **THEN** system triggers a plan fetch request
