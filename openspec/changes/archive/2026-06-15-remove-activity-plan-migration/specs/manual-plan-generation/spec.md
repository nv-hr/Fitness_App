## ADDED Requirements

### Requirement: No Automatic Migration on Fetch
The system SHALL NOT automatically migrate or mutate activity plans during read operations. Fetching a weekly plan must be a pure read operation with no side effects.

#### Scenario: Fetching an old-format plan
- **WHEN** the frontend requests a weekly plan via GET `/api/weekly-plans`
- **THEN** the system returns the plan exactly as it is stored in the database without attempting to migrate or update it.
