# ROADMAP.md

> **Current Milestone**: v1.1.1
> **Goal**: Remove PDP consent requirement when changing password from settings page

## Must-Haves
- [ ] Remove PDP consent checkbox and validation from Change Password page
- [ ] Ensure changing password from Settings page succeeds without user checking any consent boxes

## Phases

### Phase 1: Remove PDP Consent from Settings Password Change
**Status**: ⬜ Not Started
**Objective**: Remove pdpConsent validation and checkbox from ChangePasswordPage.jsx while ensuring the API call sends pdpConsent: true under-the-hood to satisfy the backend.

### Phase 2: Verification & Build
**Status**: ⬜ Not Started
**Objective**: Run tests and compile the production build to verify the application remains stable.
