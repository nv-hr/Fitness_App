# Plan 1.1 Summary

- **Task 1: Move utility files to utils directories**
  - Moved `previewCalories.js` in `activities` and `food-log` from `components/` to `utils/`.
  - Updated corresponding imports in `ActivityLogForm.jsx`, `FoodLogForm.jsx`, and `previewCalories.test.js`.

- **Task 2: Enforce Barrel File Exports**
  - Updated `Router.jsx` and `AppShell.jsx` to import components from their feature `index.js` barrel files instead of reaching directly into `components/`.
  - Added an `index.js` for `weekly-plan` feature to enforce the barrel file standard.
  - Verified the project builds successfully.
