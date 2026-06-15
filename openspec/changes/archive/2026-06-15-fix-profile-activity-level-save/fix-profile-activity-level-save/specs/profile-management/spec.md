## MODIFIED Requirements

### Requirement: Save Activity Level
The system SHALL correctly persist the user's `activity_level` to the `profiles` table when a profile is created or updated. The frontend API client SHALL include `activityLevel` and `calorieRate` in every create/update request body. The backend service SHALL validate that `activityLevel` (when provided) is one of: `sedentary`, `light`, `moderate`, `very_active`, `extra_active`. The repository SHALL cast the value to the `activity_level` PostgreSQL enum type explicitly in the SQL query.

#### Scenario: Successful profile save with activity level
- **WHEN** user submits the profile form with `activityLevel = 'very_active'` and `calorieRate = 'medium'`
- **THEN** the backend receives both fields, validates `activityLevel` against the enum, and the `profiles` table row has `activity_level = 'very_active'` (not NULL)

#### Scenario: Profile update preserves activity level
- **WHEN** user updates their profile with a new weight but keeps `activityLevel = 'moderate'`
- **THEN** the `profiles` row is updated and `activity_level` remains `'moderate'` (not reset to NULL)

#### Scenario: Invalid activity level is rejected
- **WHEN** user (or API caller) sends an unrecognized `activityLevel` value (e.g., `'active'`)
- **THEN** the backend returns a `400 VALIDATION_ERROR` with message indicating the valid enum values

#### Scenario: Omitting activity level stores NULL
- **WHEN** user submits the profile form without selecting an activity level
- **THEN** `activity_level` is stored as `NULL` in the database (nullable field, TDEE is not computed)
