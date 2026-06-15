## 1. Frontend API Fix

- [x] 1.1 In `frontend/src/features/profile/api/profileApi.js`, add `calorieRate: data.calorieRate` to the request body in the `createProfile` function
- [x] 1.2 In `frontend/src/features/profile/api/profileApi.js`, add `calorieRate: data.calorieRate` to the request body in the `updateProfile` function

## 2. Backend Validation

- [x] 2.1 In `backend/src/services/profile.service.js`, add enum validation for `activityLevel` inside `validateProfileData` — if provided, it must be one of `['sedentary', 'light', 'moderate', 'very_active', 'extra_active']`, otherwise throw a `ValidationError`

## 3. Repository SQL Type Cast

- [x] 3.1 In `backend/src/repositories/profile.repository.js`, update the `INSERT` query in `create()` to cast the activity_level parameter: change `$7` to `$7::activity_level` for the `activity_level` column
- [x] 3.2 In `backend/src/repositories/profile.repository.js`, update the `UPDATE` query in `updateByUserId()` to cast the activity_level parameter: change `activity_level = $6` to `activity_level = $6::activity_level`

## 4. Verification

- [ ] 4.1 Manually test: create a new profile with `activityLevel = 'very_active'` via the frontend and confirm the DB row has a non-NULL `activity_level`
- [ ] 4.2 Manually test: update an existing profile and confirm `activity_level` is not reset to NULL
- [ ] 4.3 Manually test: send an invalid `activityLevel` value (e.g., `'active'`) and confirm the API returns a `400 VALIDATION_ERROR`
