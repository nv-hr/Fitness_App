---
phase: 1
plan: 1
wave: 1
gap_closure: false
---

# Plan 1.1: Remove PDP Consent from Settings Password Change

## Objective
Remove the pdpConsent validation and checkbox from ChangePasswordPage.jsx while ensuring the API call sends pdpConsent: true under-the-hood to satisfy the backend.

## Context
Load these files for context:
- .gsd/SPEC.md
- .gsd/ROADMAP.md
- frontend/src/features/settings/components/ChangePasswordPage.jsx

## Tasks

<task type="auto">
  <name>Bypass PDP Consent in ChangePasswordPage</name>
  <files>
    frontend/src/features/settings/components/ChangePasswordPage.jsx
  </files>
  <action>
    1. Remove the pdpConsent field from the schema in ChangePasswordPage.jsx (the z.literal validation check).
    2. Update defaultValues inside useForm to remove pdpConsent initialization.
    3. In onSubmit, call setPassword with pdpConsent: true passed under-the-hood.
    4. Remove the PDP Consent checkbox element and its validation error display from the JSX markup of the page.
    
    AVOID: Modifying SetupPassword.jsx or RegisterForm.jsx since those require onboarding/registration consent.
    USE: A standard object destructuring / hardcoded pdpConsent: true property in onSubmit.
  </action>
  <verify>
    git diff frontend/src/features/settings/components/ChangePasswordPage.jsx
  </verify>
  <done>
    ChangePasswordPage.jsx schema does not require pdpConsent and the checkbox is removed from the markup.
  </done>
</task>

<task type="auto">
  <name>Verify Production Build</name>
  <files>
    frontend/package.json
  </files>
  <action>
    Run `npm run build --workspace=frontend` to verify that the frontend builds without any typescript or syntax issues.
  </action>
  <verify>
    npm run build --workspace=frontend
  </verify>
  <done>
    Frontend builds successfully and output contains no compilation errors.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] PDP consent checkbox is completely removed from Settings Change Password page
- [ ] Changing password from settings page works (API call sends pdpConsent: true)
- [ ] Other flows (onboarding setup password, registration) still require PDP consent check

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] No regressions in frontend builds
