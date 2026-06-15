## Why

When a user saves their profile, the `activity_level` column in the `profiles` table remains `NULL` because the frontend API client omits `calorieRate` from the request body. The backend's `activityLevel` value is correctly forwarded through the entire stack (controller → service → repository), but because the PostgreSQL `activity_level` enum column type requires a valid cast and the companion `calorieRate` field is missing entirely from the API payload, the insert/update may silently fail or return unexpected results. TDEE and calorie calculations that depend on `activity_level` therefore always fall back to `null` or the hardcoded `sedentary` default.

## What Changes

- **Fix frontend `profileApi.js`**: Add the missing `calorieRate` field to both `createProfile` and `updateProfile` API payloads so the backend receives all required fields.
- **Add `activityLevel` input validation in `profile.service.js`**: Validate that the incoming `activityLevel` value is one of the accepted enum members (`sedentary`, `light`, `moderate`, `very_active`, `extra_active`) before passing it to the repository, to surface enum mismatches early with a clear error message.
- **Add explicit PostgreSQL type cast in `profile.repository.js`**: Cast the `activity_level` parameter to the `activity_level` enum type (e.g., `$6::activity_level`) in both `INSERT` and `UPDATE` queries so that PostgreSQL never rejects the value due to an implicit cast failure.

## Capabilities

### New Capabilities
- None — this is a bug fix with no new user-facing features.

### Modified Capabilities
- `profile-management`: The requirements for correctly persisting `activity_level` are already documented. This change brings the implementation into conformance with **Requirement: Save Activity Level** (`openspec/specs/profile-management/spec.md`).

## Impact

- **`frontend/src/features/profile/api/profileApi.js`**: `createProfile` and `updateProfile` functions — add `calorieRate` to the request body.
- **`backend/src/services/profile.service.js`**: `validateProfileData` — add enum validation for `activityLevel`.
- **`backend/src/repositories/profile.repository.js`**: `create` and `updateByUserId` — add `::activity_level` explicit type cast in SQL queries.
- No schema changes, no API contract changes, no new dependencies.
