# Phase 4 Research: Final Polish & Verification

## Objective
Identify any remaining unfulfilled requirements from `SPEC.md` and pinpoint areas of the frontend that need final code polish or duplicate removal.

## Findings

1. **Missing Onboarding Pop-up**
   - **Requirement**: `SPEC.md` mandates adding "the missing target goal setting form to the first-time user onboarding pop-up."
   - **Current State**: `DashboardPage.jsx` fetches `getProfile()`. If it fails (profile doesn't exist for a first-time user), it catches the error and leaves `profile` as `null`. It then renders the dashboard but hides the quick stats. No onboarding pop-up is shown.
   - **Solution**: Create an `OnboardingModal` component that wraps the `ProfileForm` component. When `DashboardPage` detects `!loading && !profile`, it should render the `OnboardingModal` over the dashboard. The `ProfileForm` already supports an `isOverlay` prop.

2. **Unused Variables & Polish**
   - **Current State**: During Phase 3, an unused alias `isUpdateFlag` was created in `ProfileForm.jsx` but never used. 
   - **Solution**: Remove `isUpdateFlag` and ensure the codebase has no obvious unused variables. We'll run a quick cleanup across the refactored files.

## Conclusion
Phase 4 will execute in two steps:
1. **Feature Completion**: Implement the `OnboardingModal` in `DashboardPage`.
2. **Final Polish**: Remove unused variables like `isUpdateFlag` in `ProfileForm.jsx` and verify the build.
