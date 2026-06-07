---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Implement First-Time User Onboarding Modal

## Objective
Fulfill the `SPEC.md` goal to show a target goal setting form for first-time users by adding an onboarding pop-up to the dashboard.

## Context
- .gsd/SPEC.md
- frontend/src/features/dashboard/components/DashboardPage.jsx
- frontend/src/features/profile/components/ProfileForm.jsx

## Tasks

<task type="auto">
  <name>Create OnboardingModal</name>
  <files>
    - frontend/src/features/dashboard/components/OnboardingModal.jsx
  </files>
  <action>
    Create `OnboardingModal.jsx` exporting a default function.
    It should take `onSaveSuccess` as a prop.
    It should render a full-screen modal overlay (e.g. `fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto`).
    Inside the modal, render a card wrapper containing `ProfileForm` passing `isOverlay={true}` and `onSaveSuccess={onSaveSuccess}`.
    Add a header like "Welcome! Let's set your goals."
  </action>
  <verify>Get-Content frontend/src/features/dashboard/components/OnboardingModal.jsx | Select-String "ProfileForm"</verify>
  <done>OnboardingModal component is created and imports ProfileForm.</done>
</task>

<task type="auto">
  <name>Integrate Modal into Dashboard</name>
  <files>
    - frontend/src/features/dashboard/components/DashboardPage.jsx
  </files>
  <action>
    Import `OnboardingModal` into `DashboardPage.jsx`.
    Update the render logic: if `!loading` and `!profile`, render `OnboardingModal` along with the Dashboard content, OR block the dashboard entirely with the modal.
    Pass `(newProfile) => setProfile(newProfile)` to `onSaveSuccess` of `OnboardingModal`.
  </action>
  <verify>Get-Content frontend/src/features/dashboard/components/DashboardPage.jsx | Select-String "OnboardingModal"</verify>
  <done>DashboardPage conditionally renders OnboardingModal.</done>
</task>

## Success Criteria
- [ ] `OnboardingModal.jsx` exists.
- [ ] `DashboardPage` shows the modal for new users.
