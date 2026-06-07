---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Add Target Goal Form to Onboarding

## Objective
Implement the missing target goal setting form for first-time users by showing the Target Goal Settings subcard in the ProfileForm even when creating a new profile.

## Context
- .gsd/SPEC.md
- frontend/src/features/profile/components/ProfileForm.jsx

## Tasks

<task type="auto">
  <name>Always show Target Goal Settings</name>
  <files>frontend/src/features/profile/components/ProfileForm.jsx</files>
  <action>
    Remove the `{isUpdate && (` condition and its closing `)}` wrapping the "Goal Weight Subcard Panel" in `ProfileForm.jsx` so that the target weight and target date inputs are always rendered, including for first-time users completing their onboarding.
  </action>
  <verify>powershell -Command "if (Select-String -Path 'frontend/src/features/profile/components/ProfileForm.jsx' -Pattern 'isUpdate \&\& \(' -Context 0,2 | Select-String -Pattern 'Goal Weight Subcard Panel') { exit 1 } else { exit 0 }"</verify>
  <done>The Goal Weight Subcard Panel is visible when rendering ProfileForm without an existing profile</done>
</task>

## Success Criteria
- [ ] Target Goal Settings form is visible for new users
- [ ] Submitting the form as a new user correctly saves target weight and date
