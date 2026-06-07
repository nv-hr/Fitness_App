# ROADMAP.md

> **Current Phase**: Phase 3: Fix Sync Issue
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [x] Target goal setting form on onboarding
- [x] Successful Heroku deployment

## Phases

### Phase 1: Onboarding Fix
**Status**: ✅ Complete
**Objective**: Implement the missing target goal setting form for first-time users
**Requirements**: REQ-01, REQ-02

### Phase 2: Polish & Verification
**Status**: ✅ Complete
**Objective**: Verify existing features work smoothly with the new goal form
**Requirements**: REQ-02

---

### Phase 3: Fix Sync Issue
**Status**: ✅ Complete
**Objective**: Fix issue where logging a food/activity manually (e.g. "100g milk") checks the AI plan item (e.g. "250g milk"), but preserve correct check/uncheck plan item sync behavior.
**Depends on**: None

**Tasks**:
- [x] Update Daily Meal Plan Repositories and Controller (Food Syncing)
- [x] Update Weekly Plan Repositories and Controller (Activity Syncing)

**Verification**:
- Run unit tests (`npm run test:unit`) to ensure all tests pass successfully.

