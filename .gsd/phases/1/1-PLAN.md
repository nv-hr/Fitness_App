---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Reorganize Non-Component Files and Consolidate Structure

## Objective
Standardize the directory structure within features by moving utility files out of the `components` folders, establishing a standard internal feature structure, and enforcing barrel file usage.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- frontend/src/features/activities/components/previewCalories.js
- frontend/src/features/food-log/components/previewCalories.js

## Tasks

<task type="auto">
  <name>Move utility files to utils directories</name>
  <files>
    frontend/src/features/activities/utils/previewCalories.js
    frontend/src/features/food-log/utils/previewCalories.js
  </files>
  <action>
    - Create `utils/` directories within `features/activities/` and `features/food-log/`.
    - Move `previewCalories.js` from the `components/` directory to the new `utils/` directory in both features.
    - Update all import statements referencing these files in tests and components.
    - Do NOT change the core logic of these files.
  </action>
  <verify>npm --prefix frontend run test -- --passWithNoTests</verify>
  <done>Files are moved to utils directories and all import references are correctly updated.</done>
</task>

<task type="auto">
  <name>Enforce Barrel File Exports</name>
  <files>
    frontend/src/features/activities/index.js
    frontend/src/features/food-log/index.js
    frontend/src/features/weekly-plan/index.js
  </files>
  <action>
    - Ensure all features export their public APIs (Page components, major sections) via `index.js`.
    - Refactor cross-feature imports to use these barrel files instead of deep-linking into another feature's `components/` directory.
  </action>
  <verify>npm --prefix frontend run build</verify>
  <done>Cross-feature imports exclusively use feature barrel files and the project builds successfully.</done>
</task>

## Success Criteria
- [ ] Utility files like `previewCalories.js` are organized into `utils` folders.
- [ ] Cross-feature imports strictly utilize the exporting feature's `index.js`.
- [ ] Project builds without unresolved import errors.
