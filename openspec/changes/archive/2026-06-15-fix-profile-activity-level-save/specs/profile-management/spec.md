## MODIFIED Requirements

### Requirement: Save Activity Level
The system SHALL correctly map and persist the user's `activity_level` to the database when a profile is created or updated.

#### Scenario: Successful profile save with activity level
- **WHEN** user submits the profile form with an activity level (e.g., `very_active`)
- **THEN** the system correctly handles mapping between the frontend enum and the database enum (e.g., `active`), persisting the value in the `profiles` table.
