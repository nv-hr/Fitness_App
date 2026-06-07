---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Deduplicate Shared Components

## Objective
Identify strictly duplicated UI components that appear in multiple feature folders, consolidate them into `shared/ui`, and replace their usages to reduce code duplication.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- frontend/src/features/activities/components/DayActivityRow.jsx
- frontend/src/features/weekly-plan/components/DayActivityRow.jsx
- frontend/src/features/weekly-plan/components/Toast.jsx
- frontend/src/shared/ui/Toast.jsx

## Tasks

<task type="auto">
  <name>Consolidate DayActivityRow</name>
  <files>
    frontend/src/shared/ui/DayActivityRow.jsx
    frontend/src/shared/ui/index.js
    frontend/src/features/activities/components/DayActivityRow.jsx
    frontend/src/features/weekly-plan/components/DayActivityRow.jsx
  </files>
  <action>
    - Compare `features/activities/components/DayActivityRow.jsx` and `features/weekly-plan/components/DayActivityRow.jsx`.
    - Create a unified `DayActivityRow.jsx` in `frontend/src/shared/ui/`.
    - Export `DayActivityRow` from `frontend/src/shared/ui/index.js`.
    - Delete the redundant files in `features/activities/components/` and `features/weekly-plan/components/`.
    - Update all import statements (like in `ActivityCalendarSection.jsx` or barrel files) to use the shared `DayActivityRow`.
  </action>
  <verify>npm --prefix frontend run build</verify>
  <done>DayActivityRow is consolidated in shared/ui, old files are deleted, and imports are successfully updated.</done>
</task>

<task type="auto">
  <name>Consolidate Toast Component</name>
  <files>
    frontend/src/shared/ui/Toast.jsx
    frontend/src/features/weekly-plan/components/Toast.jsx
    frontend/src/features/weekly-plan/index.js
  </files>
  <action>
    - Review `features/weekly-plan/components/Toast.jsx` vs `shared/ui/Toast.jsx`.
    - Merge any unique functionality into `shared/ui/Toast.jsx` if necessary, so it supports all existing use cases.
    - Delete `features/weekly-plan/components/Toast.jsx`.
    - Update imports in `weekly-plan` (e.g., in `index.js` or components) to use the `shared/ui/Toast.jsx` via the `shared/ui` barrel file.
  </action>
  <verify>npm --prefix frontend run build</verify>
  <done>A single Toast component exists in shared/ui and is used globally; the build succeeds.</done>
</task>

## Success Criteria
- [ ] `DayActivityRow` exists solely in `shared/ui`.
- [ ] `Toast` exists solely in `shared/ui`.
- [ ] The codebase builds successfully without import errors.
