---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Extract ProfileForm Business Logic

## Objective
Decouple state management, API fetching, and form handling from `ProfileForm.jsx` by extracting them into a custom hook `useProfileForm.js`. This will improve readability and testability.

## Context
- .gsd/SPEC.md
- .gsd/phases/3/RESEARCH.md
- frontend/src/features/profile/components/ProfileForm.jsx
- frontend/src/features/profile/hooks/useProfileForm.js (to be created)

## Tasks

<task type="auto">
  <name>Create useProfileForm hook</name>
  <files>frontend/src/features/profile/hooks/useProfileForm.js</files>
  <action>
    - Extract state (`existingProfile`, `bmiResult`, `tdeeResult`, `loading`, `error`, `success`) and `react-hook-form` initialization to a new file.
    - Extract `useEffect` for loading profile data.
    - Extract `onSubmit` logic.
    - Return form methods, state values, and `onSubmit` from the hook.
  </action>
  <verify>Get-Content frontend/src/features/profile/hooks/useProfileForm.js -TotalCount 5</verify>
  <done>Hook exists and exports necessary functions and state.</done>
</task>

<task type="auto">
  <name>Refactor ProfileForm.jsx</name>
  <files>frontend/src/features/profile/components/ProfileForm.jsx</files>
  <action>
    - Import and consume `useProfileForm` hook.
    - Remove all local state, `useEffect`, and API calls from the component.
    - Connect the hook returns directly to the JSX form fields and UI conditionally rendered panels.
    - Ensure `onSaveSuccess` and `isOverlay` props are passed properly into the hook or handled correctly.
  </action>
  <verify>npm run build --workspace=frontend</verify>
  <done>Component builds cleanly without TypeScript or React errors.</done>
</task>

## Success Criteria
- [ ] ProfileForm.jsx is purely a presentation component with minimal logic.
- [ ] useProfileForm.js contains all business logic.
- [ ] The app builds successfully.
