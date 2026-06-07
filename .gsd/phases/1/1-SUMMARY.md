# Plan 1.1 Summary: Add Target Goal Form to Onboarding

## Work Completed
Removed the conditional rendering wrapper `{isUpdate && (...)}` around the **Goal Weight Subcard Panel** (Target Goal Settings) in `ProfileForm.jsx`.

## Impact
First-time users during onboarding will now see and be able to fill out their **Target Weight** and **Target Date** immediately upon creating their profile.

## Verification
Verified using the PowerShell check that the `isUpdate &&` condition has been removed from the Target Goal Settings subcard panel in `ProfileForm.jsx`.
