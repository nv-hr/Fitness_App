## Context

The `profiles` table has an `activity_level` column typed as a PostgreSQL custom enum (`USER-DEFINED`, created as `activity_level` type with values `sedentary`, `light`, `moderate`, `very_active`, `extra_active`). The entire backend pipeline (controller → service → repository) correctly forwards the `activityLevel` value, but two separate gaps cause the column to remain `NULL`:

1. **Missing `calorieRate` in frontend API payload**: `profileApi.js`'s `createProfile` and `updateProfile` functions do not include `calorieRate` in the JSON body sent to the backend. Because the backend `INSERT`/`UPDATE` query binds 9-10 positional parameters in fixed order, a missing/undefined parameter shifts all subsequent values, potentially binding `activityLevel` to the wrong positional slot or causing the query to silently fail with a null coercion.

2. **No explicit PostgreSQL enum type cast in repository**: The SQL queries pass the string value without an explicit `::activity_level` cast. PostgreSQL can implicitly cast a text literal to an enum in simple cases, but when the parameter binding results in `undefined` (JavaScript) being passed as `null`, PostgreSQL stores `NULL` without error.

## Goals / Non-Goals

**Goals:**
- Ensure `activity_level` is correctly persisted to the `profiles` table on both `CREATE` and `UPDATE` operations.
- Ensure `calorieRate` is correctly included in API payloads from the frontend.
- Add server-side validation for the `activityLevel` enum value to provide clear error feedback.
- Add explicit PostgreSQL type casts for enum columns to prevent silent null coercions.

**Non-Goals:**
- Changing the `activity_level` enum values or their semantics.
- Migrating existing rows that have `NULL` activity_level (out of scope; no data migration needed for new saves).
- Modifying the TDEE calculation logic itself.
- Changing the `calorie_rate` column type from `character varying` to an enum.

## Decisions

### Decision 1: Fix the frontend payload first, not only the backend

**Chosen**: Fix `profileApi.js` to include `calorieRate` in both `createProfile` and `updateProfile` payloads.

**Rationale**: The missing `calorieRate` is the primary trigger — it creates a payload mismatch. Even if the backend and DB are fixed, a frontend omitting a required field is a correctness bug in its own right.

**Alternative considered**: Add a backend middleware to default `calorieRate` to `null` when absent. Rejected because the frontend form already collects and validates `calorieRate`; the omission is simply a copy-paste oversight in `profileApi.js`.

---

### Decision 2: Add explicit `::activity_level` cast in SQL

**Chosen**: Append `::activity_level` to the positional parameter in the `INSERT` and `UPDATE` SQL queries (e.g., `$6::activity_level`).

**Rationale**: Makes the type expectation explicit in the query itself, preventing PostgreSQL from falling back to text coercion which can silently accept `NULL` or fail cryptically on type mismatch. This is a defensive practice for all custom enum columns.

**Alternative considered**: Cast inside the JavaScript layer (e.g., validate and ensure the value is always a non-null string before binding). Rejected as a standalone fix because it doesn't protect against future callers that bypass the service layer.

---

### Decision 3: Add enum validation in `profile.service.js`'s `validateProfileData`

**Chosen**: Add a check that `activityLevel` (when provided) is one of the five accepted values.

**Rationale**: Surfaces enum mismatches at the service layer with a clear `ValidationError` rather than a cryptic PostgreSQL type error propagated as a 500. Consistent with how `gender` and `fitnessGoal` are already validated.

**Alternative considered**: Rely solely on the Zod schema on the frontend. Rejected because backend validation is mandatory regardless of frontend state.

## Risks / Trade-offs

- **[Risk] Existing NULL rows**: Existing profiles with `activity_level = NULL` are not back-filled by this fix. Consumers that default to `'sedentary'` when `null` will continue to do so correctly.  
  **Mitigation**: No migration needed — the fix only prevents future NULLs.

- **[Risk] `calorieRate` field omission history**: Users who saved profiles before this fix have profiles with `activity_level = NULL`. Their TDEE will correctly compute after they re-save the profile.  
  **Mitigation**: The UI defaults `calorieRate` to `medium` so re-saving is safe.
