## Why

When saving a user profile, the `activity_level` field is not properly persisted to the database. This leads to missing data that is critical for accurately calculating the Total Daily Energy Expenditure (TDEE) and setting appropriate daily calorie targets for the user.

## What Changes

- Identify and fix the root cause preventing `activity_level` from being saved during profile creation and updates.
- Verify that the profile service and repository pass and persist the `activity_level` successfully to the database.

## Capabilities

### New Capabilities

### Modified Capabilities

## Impact

- Affected Code: Profile management logic (e.g., `profile.controller.js`, validation schemas, or database queries).
- Affected Data: The `activity_level` field in the `profiles` table.
